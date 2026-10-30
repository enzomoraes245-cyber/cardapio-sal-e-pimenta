import { env } from '../../config/env.js';
import { AppError } from '../errors/app-error.js';

/**
 * Envio de e-mails transacionais (hoje: só a recuperação de senha).
 *
 * O provedor ainda não foi definido (DEC-010). Drivers disponíveis:
 * - "log": guarda a mensagem em memória e a escreve no console. Só desenvolvimento e testes
 *   (a validação do ambiente impede o uso em produção, porque expõe os links).
 * - "disabled": nenhum envio; quem depende de e-mail deve consultar `isMailEnabled()`.
 *
 * Um provedor real (SMTP ou API) entra como novo driver aqui, sem mudar quem envia.
 */

const outbox = [];
const OUTBOX_LIMIT = 50;

export function isMailEnabled() {
  return env.MAIL_DRIVER !== 'disabled';
}

export function getMailDriver() {
  return env.MAIL_DRIVER;
}

export async function sendMail({ to, subject, text }) {
  if (env.MAIL_DRIVER === 'log') {
    outbox.push({ to, subject, text, from: env.MAIL_FROM, sentAt: new Date() });
    if (outbox.length > OUTBOX_LIMIT) outbox.shift();
    if (env.NODE_ENV !== 'test') {
      console.info(`[mail:log] Para: ${to}\n[mail:log] Assunto: ${subject}\n${text}\n`);
    }
    return;
  }
  throw new AppError('O envio de e-mails não está configurado.', {
    statusCode: 503,
    code: 'MAIL_DISABLED',
  });
}

/** Mensagens enviadas pelo driver "log" (usado pelos testes). Esvazia a caixa de saída. */
export function takeLoggedMails() {
  return outbox.splice(0);
}
