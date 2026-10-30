import multer from 'multer';
import { env } from '../../config/env.js';
import { AppError, ValidationError } from '../errors/app-error.js';

/** Formatos aceitos, identificados pela assinatura binária (não pela extensão ou pelo navegador). */
const IMAGE_SIGNATURES = [
  {
    extension: 'jpg',
    matches: (b) => b.length > 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff,
  },
  {
    extension: 'png',
    matches: (b) =>
      b.length > 8 &&
      b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])),
  },
  {
    extension: 'webp',
    matches: (b) =>
      b.length > 12 &&
      b.subarray(0, 4).toString('ascii') === 'RIFF' &&
      b.subarray(8, 12).toString('ascii') === 'WEBP',
  },
];

const MAX_MEGABYTES = Math.round((env.UPLOAD_MAX_BYTES / (1024 * 1024)) * 10) / 10;
const INVALID_IMAGE_MESSAGE = 'Envie uma imagem JPEG, PNG ou WebP.';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: env.UPLOAD_MAX_BYTES, files: 1, fields: 20 },
});

/** Mensagem de cada limite do Multer, no campo da imagem. */
function multerMessage(code, fieldName) {
  switch (code) {
    case 'LIMIT_FILE_COUNT':
      return 'Envie apenas uma imagem.';
    case 'LIMIT_UNEXPECTED_FILE':
      return `Envie a imagem no campo "${fieldName}".`;
    default:
      // LIMIT_FIELD_COUNT, LIMIT_FIELD_KEY, LIMIT_FIELD_VALUE, LIMIT_PART_COUNT...
      return 'O formulário enviado tem campos demais ou grandes demais.';
  }
}

/**
 * Middleware que recebe um único arquivo de imagem em multipart/form-data. Erros de envio viram
 * respostas claras: 413 para imagem grande demais e 400 para limites do formulário ou corpo
 * multipart malformado (antes, este último respondia 500).
 */
export function imageUpload(fieldName) {
  const handler = upload.single(fieldName);
  return function receiveImage(req, res, next) {
    handler(req, res, (error) => {
      if (!error) return next();
      if (error instanceof multer.MulterError && error.code === 'LIMIT_FILE_SIZE') {
        return next(
          new AppError(`A imagem deve ter no máximo ${MAX_MEGABYTES} MB.`, {
            statusCode: 413,
            code: 'PAYLOAD_TOO_LARGE',
          }),
        );
      }
      if (error instanceof multer.MulterError) {
        return next(
          new ValidationError([
            { source: 'body', path: fieldName, message: multerMessage(error.code, fieldName) },
          ]),
        );
      }
      // Com armazenamento em memória, os demais erros vêm da leitura do corpo (multipart
      // incompleto, sem boundary, cabeçalho de parte inválido).
      return next(
        new AppError('Não foi possível ler o arquivo enviado. Tente enviar novamente.', {
          statusCode: 400,
          code: 'MALFORMED_MULTIPART',
        }),
      );
    });
  };
}

export function detectImageExtension(buffer) {
  return IMAGE_SIGNATURES.find((signature) => signature.matches(buffer))?.extension ?? null;
}

/**
 * Valida o arquivo recebido e devolve { buffer, extension }.
 * Lança ValidationError se o arquivo faltar (quando obrigatório) ou não for uma imagem aceita.
 */
export function readImageFile(file, { field, required, missingMessage }) {
  if (!file) {
    if (!required) return null;
    throw new ValidationError([{ source: 'body', path: field, message: missingMessage }]);
  }
  const extension = detectImageExtension(file.buffer);
  if (!extension) {
    const error = new ValidationError([
      { source: 'body', path: field, message: INVALID_IMAGE_MESSAGE },
    ]);
    error.code = 'INVALID_IMAGE';
    throw error;
  }
  return { buffer: file.buffer, extension };
}
