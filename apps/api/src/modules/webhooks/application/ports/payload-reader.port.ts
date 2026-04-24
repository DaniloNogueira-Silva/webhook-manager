export const PAYLOAD_READER_PORT = Symbol('PAYLOAD_READER_PORT');

export interface PayloadReaderPort {
  getString(payload: unknown, pathExpression?: string | null): string | null;
}
