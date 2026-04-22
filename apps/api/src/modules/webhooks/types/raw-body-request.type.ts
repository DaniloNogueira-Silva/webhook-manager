import { Request } from 'express';

export type RawBodyRequest = Request & {
  rawBody?: string;
};
