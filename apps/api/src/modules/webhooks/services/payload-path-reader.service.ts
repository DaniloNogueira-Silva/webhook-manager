import { Injectable } from '@nestjs/common';

@Injectable()
export class PayloadPathReaderService {
  getValue(payload: unknown, path?: string | null): unknown {
    if (!path) {
      return null;
    }

    const segments = path.split('.').filter(Boolean);

    let current: any = payload;

    for (const segment of segments) {
      if (current == null || typeof current !== 'object') {
        return null;
      }

      current = current[segment];
    }

    return current ?? null;
  }

  getString(payload: unknown, path?: string | null): string | null {
    const value = this.getValue(payload, path);

    return typeof value === 'string' && value.length > 0 ? value : null;
  }
}
