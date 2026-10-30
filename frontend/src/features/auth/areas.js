import { platformAccountService } from '../platform/auth/services/platform-auth.service.js';
import { adminAccountService } from './services/auth.service.js';

/**
 * Configuração de cada área autenticada: textos, endereços e serviços de conta.
 * As duas áreas compartilham as telas de login, recuperação de senha e "Minha conta".
 */
export const RESTAURANT_AREA = Object.freeze({
  devArea: 'admin',
  environment: 'Restaurante',
  environmentLong: 'Painel do restaurante',
  homePath: '/admin',
  loginPath: '/admin/login',
  forgotPath: '/admin/recuperar-senha',
  accountPath: '/admin/conta',
  loginTitle: 'Entrar no painel',
  loginDescription: 'Gerencie o cardápio do seu restaurante.',
  headline: 'Seu cardápio, sempre em dia.',
  subline:
    'Produtos, preços, fotos e QR Code em um só lugar. As alterações aparecem no cardápio dos clientes sem trocar o QR Code.',
  supportHint: 'Para redefinir a senha, fale com o suporte da plataforma.',
  account: adminAccountService,
});

export const PLATFORM_AREA = Object.freeze({
  devArea: 'platform',
  environment: 'Plataforma',
  environmentLong: 'Backoffice da plataforma',
  homePath: '/backoffice',
  loginPath: '/backoffice/login',
  forgotPath: '/backoffice/recuperar-senha',
  accountPath: '/backoffice/conta',
  loginTitle: 'Entrar no backoffice',
  loginDescription: 'Acesso restrito aos operadores da plataforma.',
  headline: 'Administração da plataforma.',
  subline: 'Restaurantes, assinaturas, mensalidades e acessos, com o histórico de cada ação.',
  supportHint: 'Para redefinir a senha, fale com outro operador da plataforma.',
  account: platformAccountService,
});
