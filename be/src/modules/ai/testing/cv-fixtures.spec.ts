import { createHash } from 'node:crypto';
import { makeDocx, SAMPLE_CV } from './cv-fixtures.js';

const sha = (b: Buffer) => createHash('sha256').update(b).digest('hex');

describe('makeDocx', () => {
  it('BR-FILE-02: same content gives the same file across calls', async () => {
    const first = await makeDocx(SAMPLE_CV);
    await new Promise((r) => setTimeout(r, 2100));
    expect(sha(await makeDocx(SAMPLE_CV))).toBe(sha(first));
  });
});
