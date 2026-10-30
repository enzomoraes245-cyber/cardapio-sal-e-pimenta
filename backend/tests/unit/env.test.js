import { describe, expect, it } from 'vitest';
import { loadEnv } from '../../src/config/env.js';

const base = { DATABASE_URL: 'postgresql://usuario:senha@localhost:5432/banco' };
const production = { ...base, NODE_ENV: 'production' };

describe('loadEnv', () => {
  it('em produção exige o endereço público definitivo', () => {
    // Sem APP_PUBLIC_URL vale o padrão local, que não serve para QR Code impresso.
    expect(() => loadEnv(production)).toThrow(/APP_PUBLIC_URL/);
    expect(() => loadEnv({ ...production, APP_PUBLIC_URL: 'http://192.168.0.10:5173' })).toThrow(
      /APP_PUBLIC_URL/,
    );

    const env = loadEnv({ ...production, APP_PUBLIC_URL: 'https://cardapio.exemplo.com.br/' });
    expect(env).toMatchObject({
      APP_PUBLIC_URL: 'https://cardapio.exemplo.com.br',
      MAIL_DRIVER: 'disabled',
      COOKIE_SECURE: true,
      isProduction: true,
    });
  });

  it('em produção recusa o envio de e-mail pelo console', () => {
    expect(() =>
      loadEnv({
        ...production,
        APP_PUBLIC_URL: 'https://cardapio.exemplo.com.br',
        MAIL_DRIVER: 'log',
      }),
    ).toThrow(/MAIL_DRIVER/);
  });

  it('fora de produção aceita endereço local; cookie seguro só com HTTPS', () => {
    expect(loadEnv(base)).toMatchObject({
      APP_PUBLIC_URL: 'http://localhost:5173',
      MAIL_DRIVER: 'log',
      COOKIE_SECURE: false,
      TRUST_PROXY: false,
    });
    expect(
      loadEnv({ ...base, APP_PUBLIC_URL: 'https://homologacao.exemplo.com.br' }).COOKIE_SECURE,
    ).toBe(true);
    expect(() => loadEnv({ ...base, APP_PUBLIC_URL: 'ftp://exemplo.com.br' })).toThrow(
      /APP_PUBLIC_URL/,
    );
  });

  it.each([
    ['', false],
    ['false', false],
    ['true', true],
    ['1', 1],
    ['loopback, 10.0.0.0/8', 'loopback, 10.0.0.0/8'],
  ])('interpreta TRUST_PROXY=%j', (value, expected) => {
    expect(loadEnv({ ...base, TRUST_PROXY: value }).TRUST_PROXY).toEqual(expected);
  });

  it('recusa fuso horário inválido', () => {
    expect(() => loadEnv({ ...base, APP_TIMEZONE: 'Brasil/Lugar-Nenhum' })).toThrow(/APP_TIMEZONE/);
  });
});
