/**
 * Cria (ou atualiza a senha de) um operador do backoffice da plataforma.
 *
 * Uso:
 *   PLATFORM_ADMIN_PASSWORD=... npm run platform:create-admin -- --email=ops@empresa.com --name="Operação"
 *
 * A senha vem somente da variável de ambiente, para não ficar no histórico do terminal.
 */
import { parseArgs } from 'node:util';
import { z } from 'zod';
import { prisma } from '../src/config/database.js';
import { newPasswordSchema } from '../src/shared/utils/common-schemas.js';
import { hashPassword } from '../src/shared/utils/password.js';

const inputSchema = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email('Informe --email com um e-mail válido.')),
  name: z.string().trim().min(1, 'Informe --name.').max(120),
  password: newPasswordSchema,
});

const { values } = parseArgs({
  options: { email: { type: 'string' }, name: { type: 'string' } },
});

const parsed = inputSchema.safeParse({
  email: values.email ?? process.env.PLATFORM_ADMIN_EMAIL ?? '',
  name: values.name ?? process.env.PLATFORM_ADMIN_NAME ?? 'Operador da plataforma',
  password: process.env.PLATFORM_ADMIN_PASSWORD ?? '',
});

if (!parsed.success) {
  for (const issue of parsed.error.issues)
    console.error(`- ${issue.path.join('.')}: ${issue.message}`);
  console.error('Defina PLATFORM_ADMIN_PASSWORD (mín. 8 caracteres) e informe --email.');
  process.exit(1);
}

try {
  const { email, name, password } = parsed.data;
  const passwordHash = await hashPassword(password);
  await prisma.platformAdmin.upsert({
    where: { email },
    update: { name, passwordHash },
    create: { email, name, passwordHash },
  });
  console.log(`Operador ${email} criado/atualizado. Acesse /backoffice.`);
} catch (error) {
  console.error('Falha ao criar operador:', error);
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
