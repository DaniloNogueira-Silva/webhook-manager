import { Injectable } from '@nestjs/common';
import { PayloadPathReaderService } from '../../services/payload-path-reader.service';
import type { PayloadReaderPort } from '../ports/payload-reader.port';

@Injectable()
export class PayloadReaderAdapter implements PayloadReaderPort {
  constructor(
    private readonly payloadPathReaderService: PayloadPathReaderService,
  ) {}

  getString(payload: unknown, pathExpression?: string | null): string | null {
    return this.payloadPathReaderService.getString(payload, pathExpression);
  }
}
