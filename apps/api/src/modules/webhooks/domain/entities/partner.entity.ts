export class Partner {
  constructor(
    readonly slug: string,
    readonly eventTypePath: string | null,
    readonly externalEventIdPath: string | null,
    readonly signatureHeaderName: string | null,
    readonly authType: string,
    readonly signatureAlgorithm: string | null,
    readonly secret: string | null,
    readonly signaturePrefix: string | null,
    readonly timestampHeaderName: string | null,
    readonly timestampToleranceSeconds: number | null,
    readonly signedPayloadTemplate: string | null,
    readonly authHeaderName?: string | null,
    readonly apiKeyHeaderName?: string | null,
    readonly apiKeyValue?: string | null,
    readonly bearerToken?: string | null,
    readonly basicUsername?: string | null,
    readonly basicPassword?: string | null,
  ) {}
}
