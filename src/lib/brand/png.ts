/**
 * A PNG from raw pixels: 8-bit RGBA, no filtering, deflated. Enough for the
 * dithered gradients the brand's pictures embed; on the server only.
 */

import { crc32, deflateSync } from 'node:zlib';

const SIGNATURE = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

function chunk(type: string, data: Buffer): Buffer {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body) >>> 0);
  return Buffer.concat([length, body, crc]);
}

/** `rgba` holds `width × height` pixels, four bytes each, row by row from the top left. */
export function encodePng(
  width: number,
  height: number,
  rgba: Uint8Array,
): Buffer {
  if (rgba.length !== width * height * 4) {
    throw new Error(
      `Expected ${width * height * 4} bytes of pixels, got ${rgba.length}`,
    );
  }
  const header = Buffer.alloc(13);
  header.writeUInt32BE(width, 0);
  header.writeUInt32BE(height, 4);
  header.writeUInt8(8, 8); // 8 bits a channel
  header.writeUInt8(6, 9); // RGBA
  // Each row starts with its filter type: 0, none.
  const raw = Buffer.alloc((width * 4 + 1) * height);
  for (let row = 0; row < height; row += 1) {
    const start = row * (width * 4 + 1);
    raw[start] = 0;
    raw.set(rgba.subarray(row * width * 4, (row + 1) * width * 4), start + 1);
  }
  return Buffer.concat([
    SIGNATURE,
    chunk('IHDR', header),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}
