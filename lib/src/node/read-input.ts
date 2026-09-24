import { open } from 'node:fs/promises';
import { constants } from 'node:fs';

/** Reads a regular file within maxBytes. Nonblocking open prevents a FIFO from hanging the command. */
export async function readInput(filePath: string, maxBytes: number): Promise<Buffer> {
  await using file = await open(filePath, constants.O_RDONLY | constants.O_NONBLOCK);
  if (!(await file.stat()).isFile()) throw new Error('Supply a regular input file.');
  const buffer = Buffer.alloc(maxBytes + 1);
  let length = 0;
  while (length < buffer.length) {
    const { bytesRead } = await file.read(buffer, length, buffer.length - length, length);
    if (bytesRead === 0) break;
    length += bytesRead;
  }
  if (length > maxBytes) throw new Error('Input exceeds the byte limit.');
  return buffer.subarray(0, length);
}
