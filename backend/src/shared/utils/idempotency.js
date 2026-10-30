import { Prisma } from '@prisma/client';
import { prisma } from '../../config/database.js';
import { ConflictError, ValidationError } from '../errors/app-error.js';

const KEY_PATTERN = /^[A-Za-z0-9_-]{8,100}$/;
const RETENTION_MS = 24 * 60 * 60 * 1000;

/** Lê o cabeçalho Idempotency-Key (opcional) e valida o formato. */
export function readIdempotencyKey(req) {
  const key = req.get('idempotency-key');
  if (key === undefined) return null;
  if (!KEY_PATTERN.test(key)) {
    throw new ValidationError([
      { source: 'headers', path: 'Idempotency-Key', message: 'Chave de idempotência inválida.' },
    ]);
  }
  return key;
}

function isKeyConflict(error) {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === 'P2002' &&
    error.meta?.modelName === 'IdempotencyKey'
  );
}

/**
 * Executa um cadastro uma única vez por chave (envio repetido, clique duplo, nova tentativa
 * após falha de rede). A primeira requisição cria; as seguintes, com a mesma chave, recebem o
 * registro já criado (`replayed: true`). Sem chave, apenas cria.
 *
 * `create(tx)` roda na transação e devolve um objeto com `id`; `load(id)` lê o registro.
 * Requisições simultâneas com a mesma chave esperam a primeira (índice único da chave).
 */
export async function createOnce({ key, scope, ownerId }, { create, load }) {
  if (!key) {
    const created = await prisma.$transaction((tx) => create(tx));
    return { result: await load(created.id), replayed: false };
  }

  const where = { scope_ownerId_key: { scope, ownerId, key } };
  let created;
  try {
    created = await prisma.$transaction(async (tx) => {
      await tx.idempotencyKey.create({ data: { scope, ownerId, key } });
      const resource = await create(tx);
      await tx.idempotencyKey.update({ where, data: { resourceId: resource.id } });
      return resource;
    });
  } catch (error) {
    if (!isKeyConflict(error)) throw error;
    const existing = await prisma.idempotencyKey.findUnique({
      where,
      select: { resourceId: true },
    });
    if (!existing?.resourceId) {
      throw new ConflictError(
        'Este cadastro ainda está sendo processado. Aguarde um instante.',
        'REQUEST_IN_PROGRESS',
      );
    }
    return { result: await load(existing.resourceId), replayed: true };
  }

  // Limpeza oportunista das chaves antigas (não afeta a resposta).
  prisma.idempotencyKey
    .deleteMany({ where: { createdAt: { lt: new Date(Date.now() - RETENTION_MS) } } })
    .catch((error) => console.error('[idempotency] Falha na limpeza:', error));
  return { result: await load(created.id), replayed: false };
}
