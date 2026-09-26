/** Validates the brand snapshot checksum and schema for the brands:check command. */
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { loadBrandDirectory } from './load-brand-directory.ts';

const args = process.argv.slice(2);

if (args.length > 1) {
  console.error('Usage: npm run brands:check -- [snapshot-directory]');
  process.exitCode = 1;
} else {
  let base: URL | undefined;
  if (args[0]) base = pathToFileURL(`${resolve(args[0])}/`);

  try {
    await loadBrandDirectory(base);
    console.log('Brand directory checksum and schema are valid. No model call was made.');
  } catch (error) {
    if (error instanceof Error) console.error(error.message);
    else console.error('Brand directory validation failed.');
    process.exitCode = 1;
  }
}
