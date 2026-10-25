import { Injectable } from '@nestjs/common';
import { mkdir, rm, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';

// TODO tuần 3: thay bằng MinIO / S3 (Kickoff 13)
@Injectable()
export class StorageService {
  private readonly root = resolve(process.cwd(), 'storage');

  async put(key: string, body: Buffer): Promise<void> {
    const path = this.pathOf(key);
    await mkdir(dirname(path), { recursive: true });
    await writeFile(path, body);
  }

  async remove(key: string): Promise<void> {
    await rm(this.pathOf(key), { force: true });
  }

  private pathOf(key: string): string {
    const path = resolve(join(this.root, key));
    if (!path.startsWith(this.root)) throw new Error(`Invalid storage key: ${key}`);
    return path;
  }
}
