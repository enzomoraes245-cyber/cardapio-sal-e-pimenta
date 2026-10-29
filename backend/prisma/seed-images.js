import { crc32, deflateSync } from 'node:zlib';

/**
 * Gera um PNG de cor sólida, usado como foto ilustrativa dos produtos de demonstração.
 * Evita versionar imagens de terceiros no repositório.
 */
export function createSolidPng(width, height, [red, green, blue]) {
  const row = Buffer.alloc(1 + width * 3);
  for (let x = 0; x < width; x += 1) {
    row.set([red, green, blue], 1 + x * 3);
  }
  const pixels = Buffer.concat(Array.from({ length: height }, () => row));

  const header = Buffer.alloc(13);
  header.writeUInt32BE(width, 0);
  header.writeUInt32BE(height, 4);
  header.set([8, 2, 0, 0, 0], 8); // 8 bits, RGB, compressão/filtro/entrelaçamento padrão

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', header),
    chunk('IDAT', deflateSync(pixels)),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

function chunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const typeAndData = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const checksum = Buffer.alloc(4);
  checksum.writeUInt32BE(crc32(typeAndData));
  return Buffer.concat([length, typeAndData, checksum]);
}
