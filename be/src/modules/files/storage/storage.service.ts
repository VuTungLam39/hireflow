export interface SignedUrlOptions {
  expiresIn: number;
  fileName: string;
  contentType: string;
}

export abstract class StorageService {
  abstract readonly driver: string;
  abstract put(key: string, body: Buffer, contentType?: string): Promise<void>;
  abstract get(key: string): Promise<Buffer>;
  abstract remove(key: string): Promise<void>;
  abstract ping(): Promise<void>;
  abstract signedUrl(key: string, options: SignedUrlOptions): Promise<string | null>;
}

export class StorageKeyError extends Error {}

export class StorageNotFoundError extends Error {
  constructor(readonly key: string) {
    super(`Storage object not found: ${key}`);
  }
}

export const contentDisposition = (fileName: string) =>
  `inline; filename*=UTF-8''${encodeURIComponent(fileName)}`;
