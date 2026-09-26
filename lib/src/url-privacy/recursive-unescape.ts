// Copyright 2016 Google Inc. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * TypeScript adaptation of Google Safe Browsing's unescape and recursiveUnescape.
 * Each pass replaces valid percent escapes and preserves all other bytes.
 * Keeping bytes until stability handles UTF-8 split across encoding depths, such as %C3%25A9.
 * https://github.com/google/safebrowsing/blob/bbf0d20d26b32d99fd21664677fe31ee9f0f66e3/urls.go#L176-L204
 *
 * Changes from upstream:
 * - Uint8Array and a write offset replace Go's bytes.Buffer.
 * - Decode UTF-8 after all passes, for recipient matching rather than URL canonicalization.
 * - The frozen policy requires stability instead of Google's 1024-pass error limit.
 *   Every changing pass consumes three bytes per escape and emits one, so it terminates.
 * - hexValue combines upstream's isHex and unhex so invalid digits cannot be decoded as zero.
 */
export function recursiveUnescape(value: string): string {
  let bytes = new TextEncoder().encode(value);
  for (;;) {
    const decoded = new Uint8Array(bytes.length);
    let length = 0;
    for (let index = 0; index < bytes.length; index++) {
      if (bytes[index] === 0x25 && index + 2 < bytes.length) {
        const high = hexValue(bytes[index + 1]);
        const low = hexValue(bytes[index + 2]);
        if (high !== null && low !== null) {
          decoded[length++] = high * 16 + low;
          index += 2;
          continue;
        }
      }
      decoded[length++] = bytes[index];
    }
    if (length === bytes.length) return new TextDecoder('utf-8', { ignoreBOM: true }).decode(bytes);
    bytes = decoded.subarray(0, length);
  }
}

function hexValue(byte: number): number | null {
  if (byte >= 0x30 && byte <= 0x39) return byte - 0x30;
  if (byte >= 0x41 && byte <= 0x46) return byte - 0x41 + 10;
  if (byte >= 0x61 && byte <= 0x66) return byte - 0x61 + 10;
  return null;
}
