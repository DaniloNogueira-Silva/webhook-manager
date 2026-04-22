import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import {
  PartnerAuthType,
  PartnerSignatureAlgorithm,
} from 'generated/prisma/enums';
import { createHmac, timingSafeEqual } from 'node:crypto';

type ValidateSignatureInput = {
  partner: {
    authType: PartnerAuthType;
    signatureAlgorithm: PartnerSignatureAlgorithm | null;
    secret: string | null;
    signatureHeaderName: string | null;
    signaturePrefix: string | null;
    timestampHeaderName: string | null;
    timestampToleranceSeconds: number | null;
    signedPayloadTemplate: string | null;
    authHeaderName?: string | null;
    apiKeyHeaderName?: string | null;
    apiKeyValue?: string | null;
    bearerToken?: string | null;
    basicUsername?: string | null;
    basicPassword?: string | null;
  };
  rawBody?: string;
  headers: Record<string, unknown>;
};

@Injectable()
export class WebhookSignatureValidatorService {
  validate(input: ValidateSignatureInput): void {
    switch (input.partner.authType) {
      case PartnerAuthType.NONE:
        return;

      case PartnerAuthType.HMAC:
        this.validateHmac(input);
        return;

      case PartnerAuthType.BEARER_TOKEN:
        this.validateBearerToken(input);
        return;

      case PartnerAuthType.BASIC:
        this.validateBasicAuth(input);
        return;

      case PartnerAuthType.API_KEY:
        this.validateApiKey(input);
        return;

      default:
        throw new BadRequestException(
          `Unsupported auth type: ${input.partner.authType}`,
        );
    }
  }

  private validateHmac(input: ValidateSignatureInput): void {
    if (!input.rawBody) {
      throw new BadRequestException('Raw body is required for HMAC validation');
    }

    if (!input.partner.secret) {
      throw new BadRequestException('Partner secret is not configured');
    }

    if (!input.partner.signatureHeaderName) {
      throw new BadRequestException(
        'Partner signature header is not configured',
      );
    }

    if (!input.partner.signatureAlgorithm) {
      throw new BadRequestException(
        'Partner signature algorithm is not configured',
      );
    }

    const receivedSignature = this.getHeader(
      input.headers,
      input.partner.signatureHeaderName,
    );

    if (!receivedSignature) {
      throw new UnauthorizedException(
        `Missing ${input.partner.signatureHeaderName} header`,
      );
    }

    let timestamp: string | null = null;

    if (input.partner.timestampHeaderName) {
      timestamp = this.getHeader(
        input.headers,
        input.partner.timestampHeaderName,
      );

      if (!timestamp) {
        throw new UnauthorizedException(
          `Missing ${input.partner.timestampHeaderName} header`,
        );
      }

      this.validateTimestamp(
        timestamp,
        input.partner.timestampToleranceSeconds,
      );
    }

    const signedPayload = this.buildSignedPayload(
      input.partner.signedPayloadTemplate,
      input.rawBody,
      timestamp,
    );

    const expectedSignature = this.buildHmacSignature(
      input.partner.signatureAlgorithm,
      input.partner.secret,
      signedPayload,
      input.partner.signaturePrefix,
    );

    if (!this.safeCompare(expectedSignature, receivedSignature)) {
      throw new UnauthorizedException('Invalid webhook signature');
    }
  }

  private validateBearerToken(input: ValidateSignatureInput): void {
    const expectedToken = input.partner.bearerToken;
    const headerName = input.partner.authHeaderName ?? 'authorization';

    if (!expectedToken) {
      throw new BadRequestException('Partner bearer token is not configured');
    }

    const receivedValue = this.getHeader(input.headers, headerName);

    if (!receivedValue) {
      throw new UnauthorizedException(`Missing ${headerName} header`);
    }

    const expectedValue = `Bearer ${expectedToken}`;

    if (!this.safeCompare(expectedValue, receivedValue)) {
      throw new UnauthorizedException('Invalid bearer token');
    }
  }

  private validateBasicAuth(input: ValidateSignatureInput): void {
    const username = input.partner.basicUsername;
    const password = input.partner.basicPassword;
    const headerName = input.partner.authHeaderName ?? 'authorization';

    if (!username || !password) {
      throw new BadRequestException(
        'Partner basic auth credentials are not configured',
      );
    }

    const receivedValue = this.getHeader(input.headers, headerName);

    if (!receivedValue) {
      throw new UnauthorizedException(`Missing ${headerName} header`);
    }

    const encoded = Buffer.from(`${username}:${password}`, 'utf8').toString(
      'base64',
    );
    const expectedValue = `Basic ${encoded}`;

    if (!this.safeCompare(expectedValue, receivedValue)) {
      throw new UnauthorizedException('Invalid basic authorization');
    }
  }

  private validateApiKey(input: ValidateSignatureInput): void {
    const headerName = input.partner.apiKeyHeaderName;
    const apiKeyValue = input.partner.apiKeyValue;

    if (!headerName || !apiKeyValue) {
      throw new BadRequestException('Partner API key config is incomplete');
    }

    const receivedValue = this.getHeader(input.headers, headerName);

    if (!receivedValue) {
      throw new UnauthorizedException(`Missing ${headerName} header`);
    }

    if (!this.safeCompare(apiKeyValue, receivedValue)) {
      throw new UnauthorizedException('Invalid API key');
    }
  }

  private buildSignedPayload(
    template: string | null,
    rawBody: string,
    timestamp: string | null,
  ): string {
    const baseTemplate = template ?? '{{rawBody}}';

    return baseTemplate
      .replaceAll('{{rawBody}}', rawBody)
      .replaceAll('{{timestamp}}', timestamp ?? '');
  }

  private buildHmacSignature(
    algorithm: PartnerSignatureAlgorithm,
    secret: string,
    signedPayload: string,
    prefix: string | null,
  ): string {
    let nodeAlgorithm: string;

    switch (algorithm) {
      case PartnerSignatureAlgorithm.HMAC_SHA1:
        nodeAlgorithm = 'sha1';
        break;
      case PartnerSignatureAlgorithm.HMAC_SHA256:
        nodeAlgorithm = 'sha256';
        break;
      case PartnerSignatureAlgorithm.HMAC_SHA384:
        nodeAlgorithm = 'sha384';
        break;
      case PartnerSignatureAlgorithm.HMAC_SHA512:
        nodeAlgorithm = 'sha512';
        break;
      default:
        throw new BadRequestException(
          `Unsupported HMAC algorithm: ${algorithm}`,
        );
    }

    const digest = createHmac(nodeAlgorithm, secret)
      .update(signedPayload, 'utf8')
      .digest('hex');

    return `${prefix ?? ''}${digest}`;
  }

  private validateTimestamp(
    timestamp: string,
    toleranceSeconds: number | null,
  ) {
    const parsedTimestamp = Number(timestamp);

    if (!Number.isFinite(parsedTimestamp)) {
      throw new UnauthorizedException('Invalid timestamp header');
    }

    const nowInSeconds = Math.floor(Date.now() / 1000);
    const allowedSkew = toleranceSeconds ?? 300;
    const diff = Math.abs(nowInSeconds - parsedTimestamp);

    if (diff > allowedSkew) {
      throw new UnauthorizedException(
        'Webhook timestamp expired or too far from server clock',
      );
    }
  }

  private getHeader(
    headers: Record<string, unknown>,
    headerName: string,
  ): string | null {
    const normalizedHeaderName = headerName.toLowerCase();
    const value = headers[normalizedHeaderName];

    if (typeof value === 'string' && value.length > 0) {
      return value;
    }

    if (Array.isArray(value) && typeof value[0] === 'string') {
      return value[0];
    }

    return null;
  }

  private safeCompare(expected: string, received: string): boolean {
    const expectedBuffer = Buffer.from(expected, 'utf8');
    const receivedBuffer = Buffer.from(received, 'utf8');

    if (expectedBuffer.length !== receivedBuffer.length) {
      return false;
    }

    return timingSafeEqual(expectedBuffer, receivedBuffer);
  }
}
