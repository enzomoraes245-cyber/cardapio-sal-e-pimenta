import { describe, expect, it } from 'vitest';
import { hashPassword, verifyPassword } from '../../src/shared/utils/password.js';

describe('password', () => {
  it('gera hash com salt aleatório e valida a senha correta', async () => {
    const hashA = await hashPassword('senha-de-teste-123');
    const hashB = await hashPassword('senha-de-teste-123');

    expect(hashA).not.toBe(hashB);
    expect(hashA).not.toContain('senha-de-teste-123');
    expect(await verifyPassword('senha-de-teste-123', hashA)).toBe(true);
  });

  it('rejeita senha incorreta e hash malformado', async () => {
    const hash = await hashPassword('senha-de-teste-123');

    expect(await verifyPassword('outra-senha', hash)).toBe(false);
    expect(await verifyPassword('senha-de-teste-123', 'hash-invalido')).toBe(false);
  });
});
