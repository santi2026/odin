import { writeFile } from 'node:fs/promises';

const size = 32;
const xor = Buffer.alloc(size * size * 4);
const andMask = Buffer.alloc(Math.ceil(size / 32) * 4 * size);

const background = [8, 13, 24, 255];
const gold = [242, 198, 101, 255];
const paleGold = [255, 230, 166, 255];

for (let y = 0; y < size; y += 1) {
  for (let x = 0; x < size; x += 1) {
    const dx = x - 15.5;
    const dy = y - 15.5;
    const radius = Math.hypot(dx, dy);
    let color = radius <= 14.5 ? background : [0, 0, 0, 0];

    const vertical = Math.abs(dx) / 4.2 + Math.abs(dy) / 10.5 <= 1;
    const horizontal = Math.abs(dx) / 10.5 + Math.abs(dy) / 4.2 <= 1;
    if (vertical || horizontal) color = radius < 3.2 ? paleGold : gold;

    const row = size - 1 - y;
    const offset = (row * size + x) * 4;
    xor[offset] = color[2];
    xor[offset + 1] = color[1];
    xor[offset + 2] = color[0];
    xor[offset + 3] = color[3];

    if (color[3] === 0) {
      const maskRowBytes = Math.ceil(size / 32) * 4;
      andMask[row * maskRowBytes + Math.floor(x / 8)] |= 0x80 >> (x % 8);
    }
  }
}

const dib = Buffer.alloc(40);
dib.writeUInt32LE(40, 0);
dib.writeInt32LE(size, 4);
dib.writeInt32LE(size * 2, 8);
dib.writeUInt16LE(1, 12);
dib.writeUInt16LE(32, 14);
dib.writeUInt32LE(xor.length + andMask.length, 20);

const image = Buffer.concat([dib, xor, andMask]);
const header = Buffer.alloc(6);
header.writeUInt16LE(1, 2);
header.writeUInt16LE(1, 4);
const entry = Buffer.alloc(16);
entry[0] = size;
entry[1] = size;
entry.writeUInt16LE(1, 4);
entry.writeUInt16LE(32, 6);
entry.writeUInt32LE(image.length, 8);
entry.writeUInt32LE(22, 12);

await writeFile(new URL('./logo.ico', import.meta.url), Buffer.concat([header, entry, image]));
console.log('FAVICON=logo.ico');
