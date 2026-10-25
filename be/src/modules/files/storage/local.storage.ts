import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { dirname, join, resolve, sep } from 'node:path';
import { StorageKeyError, StorageNotFoundError, StorageService } from './storage.service.js';

export class LocalStorageService extends StorageService {
  readonly driver = 'local';
  private readonly root: string;

  constructor(root: string) {
    super();
    this.root = resolve(process.cwd(), root);
  }

  async put(key: string, body: Buffer): Promise<void> {
    const path = this.pathOf(key);
    await mkdir(dirname(path), { recursive: true });
    await writeFile(path, body);
  }

  async get(key: string): Promise<Buffer> {
    try {
      return await readFile(this.pathOf(key));
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') throw new StorageNotFoundError(key);
      throw error;
    }
  }

  async remove(key: string): Promise<void> {
    await rm(this.pathOf(key), { force: true });
  }

  private pathOf(key: string): string {
    const path = resolve(join(this.root, key));
    if (!path.startsWith(this.root + sep)) throw new StorageKeyError(`Invalid storage key: ${key}`);
    return path;
  }
}
