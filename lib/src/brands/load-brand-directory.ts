import { readFile } from 'node:fs/promises';
import { buildBrandDirectory, type BrandDirectory } from './brand-directory.ts';

/** Loads public snapshot files in Node. Call from trusted setup, never from a model tool. */
export async function loadBrandDirectory(
  directory: URL = new URL('../../reference-data/2fa-directory/', import.meta.url),
): Promise<BrandDirectory> {
  return buildBrandDirectory(
    await readFile(new URL('v3.json', directory), 'utf8'),
    JSON.parse(await readFile(new URL('source.json', directory), 'utf8')),
  );
}
