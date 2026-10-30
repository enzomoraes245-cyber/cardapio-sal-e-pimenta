import { env } from '../../config/env.js';
import { AppError } from '../../shared/errors/app-error.js';
import { getMailDriver, isMailEnabled, sendMail } from '../../shared/mail/mailer.js';
import { hashPassword } from '../../shared/utils/password.js';
import {
  generateSessionToken,
  hashSessionToken,
  isPlausibleToken,
} from '../../shared/utils/session-token.js';
import { AUDIT_ACTIONS } from '../audit/audit.actions.js';
import * as passwordResetRepository from './password-reset.repository.js';

/**
 * Recuperação de senha por e-mail (DEC-010), para a retaguarda ("restaurant") e para o
 * backoffice ("platform"). O link leva o token no fragmento (#token=...), que o navegador
 * não envia ao servidor nem a logs de acesso.
 */

const AREAS = {
  restaurant: {
    resetPath: '/admin/redefinir-senha',
    label: 'painel do restaurante',
    actorType: 'RESTAURANT_ADMIN',
    entityType: 'ADMIN_USER',
    owner: (record) => record?.adminUser,
  },
  platform: {
    resetPath: '/backoffice/redefinir-senha',
    label: 'backoffice da plataforma',
    actorType: 'PLATFORM_ADMIN',
    entityType: 'PLATFORM_ADMIN',
    owner: (record) => record?.platformAdmin,
  },
};

function invalidTokenError() {
  return new AppError('Este link de redefinição é inválido ou expirou. Peça um novo link.', {
    statusCode: 400,
    code: 'INVALID_RESET_TOKEN',
  });
}

/** Informa ao frontend se a recuperação por e-mail está disponível. */
export function getRecoveryOptions() {
  return {
    emailRecovery: isMailEnabled(),
    developmentMailLog: getMailDriver() === 'log',
    linkTtlMinutes: env.PASSWORD_RESET_TTL_MINUTES,
  };
}

function buildMessage({ name, areaLabel, link, minutes }) {
  return [
    `Olá, ${name}.`,
    '',
    `Recebemos um pedido para redefinir a senha de acesso ao ${areaLabel} do Cardápio Digital.`,
    `Para criar uma nova senha, abra o link abaixo em até ${minutes} minutos:`,
    '',
    link,
    '',
    'Se você não fez este pedido, ignore este e-mail: a sua senha atual continua valendo.',
  ].join('\n');
}

/**
 * Gera o link e envia por e-mail. A resposta é a mesma exista ou não o e-mail (e para
 * usuários bloqueados), para não revelar quais contas existem.
 */
export async function requestPasswordReset(audience, email) {
  if (!isMailEnabled()) {
    throw new AppError(
      'A recuperação de senha por e-mail ainda não está disponível. Fale com o suporte da plataforma.',
      { statusCode: 503, code: 'MAIL_DISABLED' },
    );
  }

  const area = AREAS[audience];
  const account = await passwordResetRepository.findAccountByEmail(audience, email);
  if (!account || account.disabledAt) return;

  const token = generateSessionToken();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + env.PASSWORD_RESET_TTL_MINUTES * 60 * 1000);
  await passwordResetRepository.createResetToken(audience, {
    ownerId: account.id,
    tokenHash: hashSessionToken(token),
    expiresAt,
    now,
  });

  const link = `${env.APP_PUBLIC_URL}${area.resetPath}#token=${token}`;
  // Envio sem aguardar: o tempo de resposta não depende do provedor de e-mail.
  sendMail({
    to: account.email,
    subject: 'Redefinição de senha — Cardápio Digital',
    text: buildMessage({
      name: account.name,
      areaLabel: area.label,
      link,
      minutes: env.PASSWORD_RESET_TTL_MINUTES,
    }),
  }).catch((error) => console.error('[password-reset] Falha ao enviar o e-mail:', error));
}

/** Define a nova senha a partir do link recebido; encerra todas as sessões do usuário. */
export async function resetPassword(audience, { token, password }) {
  if (!isPlausibleToken(token)) throw invalidTokenError();

  const area = AREAS[audience];
  const record = await passwordResetRepository.findResetToken(hashSessionToken(token));
  const owner = area.owner(record);
  const now = new Date();
  if (!record || !owner || record.usedAt || record.expiresAt <= now || owner.disabledAt) {
    throw invalidTokenError();
  }

  const applied = await passwordResetRepository.consumeResetToken({
    audience,
    tokenId: record.id,
    ownerId: owner.id,
    passwordHash: await hashPassword(password),
    now,
    audit: {
      actor: { type: area.actorType, id: owner.id, name: owner.name },
      restaurantId: owner.restaurantId ?? null,
      action: AUDIT_ACTIONS.PASSWORD_RESET_BY_EMAIL,
      entityType: area.entityType,
      entityId: owner.id,
    },
  });
  if (!applied) throw invalidTokenError();
}
