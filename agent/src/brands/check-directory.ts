import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { buildBrandDirectory } from './brand-directory.ts';

const args = process.argv.slice(2);
if (args.length > 1) {
  console.error('Usage: npm run brands:check -- [snapshot-directory]');
  process.exitCode = 1;
} else {
  let base = new URL('../../reference-data/2fa-directory/', import.meta.url);
  if (args[0]) base = pathToFileURL(`${resolve(args[0])}/`);
  try {
    await buildBrandDirectory(await readFile(new URL('v3.json', base), 'utf8'),
      JSON.parse(await readFile(new URL('source.json', base), 'utf8')));
    console.log('Brand directory checksum and schema are valid. No model call was made.');
  } catch (error) {
    if (error instanceof Error) console.error(error.message);
    else console.error('Brand directory validation failed.');
    process.exitCode = 1;
  }
}
