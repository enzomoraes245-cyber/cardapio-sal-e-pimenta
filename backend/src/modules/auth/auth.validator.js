import { z } from 'zod';

export const loginBodySchema = z.object({
  email: z.string().trim().toLowerCase().max(254).pipe(z.email('Informe um e-mail válido.')),
  password: z.string().min(1, 'Informe a senha.').max(200),
});
