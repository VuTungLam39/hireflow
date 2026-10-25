import { NoSuchKey, S3Client, S3ServiceException } from '@aws-sdk/client-s3';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { LocalStorageService } from './local.storage.js';
import { S3StorageService } from './s3.storage.js';
import { StorageKeyError, StorageNotFoundError } from './storage.service.js';

describe('LocalStorageService', () => {
  let root: string;
  let storage: LocalStorageService;

  beforeAll(async () => {
    root = await mkdtemp(join(tmpdir(), 'hireflow-storage-'));
    storage = new LocalStorageService(root);
  });

  afterAll(() => rm(root, { recursive: true, force: true }));

  it('puts, gets and removes an object under nested keys', async () => {
    await storage.put('cv/2026/10/a.pdf', Buffer.from('%PDF-1.7'));
    expect((await storage.get('cv/2026/10/a.pdf')).toString()).toBe('%PDF-1.7');
    await storage.remove('cv/2026/10/a.pdf');
    await expect(storage.get('cv/2026/10/a.pdf')).rejects.toBeInstanceOf(StorageNotFoundError);
  });

  it('ignores removing a missing object', async () => {
    await expect(storage.remove('cv/none.pdf')).resolves.toBeUndefined();
  });

  it.each(['../escape.pdf', 'cv/../../escape.pdf', '.'])('rejects key %j', async (key) => {
    await expect(storage.put(key, Buffer.from('x'))).rejects.toBeInstanceOf(StorageKeyError);
  });

  it('has no presigned URL (served by the API instead)', async () => {
    await expect(
      storage.signedUrl('cv/a.pdf', { expiresIn: 300, fileName: 'a.pdf', contentType: 'x' }),
    ).resolves.toBeNull();
  });
});

describe('S3StorageService', () => {
  const config = {
    endpoint: 'http://s3.test',
    publicEndpoint: 'http://cdn.test',
    region: 'us-east-1',
    bucket: 'hireflow-cv',
    accessKeyId: 'k',
    secretAccessKey: 's',
    forcePathStyle: true,
  };
  let send: ReturnType<typeof vi.fn>;
  let storage: S3StorageService;
  const notFound = () =>
    new S3ServiceException({
      name: 'NotFound',
      $fault: 'client',
      $metadata: { httpStatusCode: 404 },
    });

  const fail = (error: Error) =>
    send.mockImplementation(async () => {
      throw error;
    });

  beforeEach(() => {
    send = vi.fn();
    storage = new S3StorageService(config, { send } as unknown as S3Client);
  });

  const command = (call = 0) => {
    const cmd = send.mock.calls[call][0];
    return { name: cmd.constructor.name as string, input: cmd.input as Record<string, unknown> };
  };

  it('uploads with bucket, key and content type', async () => {
    send.mockResolvedValue({});
    await storage.put('cv/a.pdf', Buffer.from('x'), 'application/pdf');
    expect(command()).toMatchObject({
      name: 'PutObjectCommand',
      input: { Bucket: 'hireflow-cv', Key: 'cv/a.pdf', ContentType: 'application/pdf' },
    });
  });

  it('reads the body into a buffer', async () => {
    send.mockResolvedValue({
      Body: { transformToByteArray: async () => new TextEncoder().encode('%PDF') },
    });
    expect((await storage.get('cv/a.pdf')).toString()).toBe('%PDF');
    expect(command().name).toBe('GetObjectCommand');
  });

  it('maps a missing object to StorageNotFoundError', async () => {
    fail(new NoSuchKey({ message: 'missing', $metadata: { httpStatusCode: 404 } }));
    await expect(storage.get('cv/none.pdf')).rejects.toBeInstanceOf(StorageNotFoundError);
  });

  it('deletes by key', async () => {
    send.mockResolvedValue({});
    await storage.remove('cv/a.pdf');
    expect(command()).toMatchObject({
      name: 'DeleteObjectCommand',
      input: { Bucket: 'hireflow-cv', Key: 'cv/a.pdf' },
    });
  });

  it('creates the bucket only when it does not exist', async () => {
    send.mockRejectedValueOnce(notFound()).mockResolvedValueOnce({});
    await storage.ensureBucket();
    expect(command(1)).toMatchObject({
      name: 'CreateBucketCommand',
      input: { Bucket: 'hireflow-cv' },
    });

    send.mockClear();
    send.mockResolvedValue({});
    await storage.ensureBucket();
    expect(send).toHaveBeenCalledTimes(1);
    expect(command().name).toBe('HeadBucketCommand');
  });

  it('BR-FILE-03: signs a 5-minute URL on the public endpoint without calling S3', async () => {
    const url = new URL(
      await storage.signedUrl('cv/2026/10/a.docx', {
        expiresIn: 300,
        fileName: 'CV Nguyễn An.docx',
        contentType: 'application/pdf',
      }),
    );
    expect(url.origin).toBe('http://cdn.test');
    expect(url.pathname).toBe('/hireflow-cv/cv/2026/10/a.docx');
    expect(url.searchParams.get('X-Amz-Expires')).toBe('300');
    expect(url.searchParams.get('response-content-disposition')).toBe(
      `inline; filename*=UTF-8''${encodeURIComponent('CV Nguyễn An.docx')}`,
    );
    expect(send).not.toHaveBeenCalled();
  });

  it('does not crash startup when storage is down', async () => {
    fail(new Error('ECONNREFUSED'));
    await expect(storage.onModuleInit()).resolves.toBeUndefined();
  });
});
