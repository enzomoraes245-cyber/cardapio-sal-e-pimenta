/** Módulos liberáveis por restaurante (DEC-006), na ordem de exibição. */
export const FEATURE_LABELS = [
  {
    key: 'customization',
    label: 'Personalização visual',
    hint: 'O restaurante define logotipo e cores do cardápio.',
  },
  {
    key: 'qrcode',
    label: 'QR Code',
    hint: 'Visualização, download e impressão do QR Code no painel.',
  },
  {
    key: 'realtime',
    label: 'Atualização automática',
    hint: 'O cardápio aberto pelos clientes se atualiza sozinho.',
  },
  {
    key: 'productModal',
    label: 'Modal de detalhes',
    hint: 'Janela com foto ampliada e descrição completa do produto.',
  },
];

export const ALL_FEATURES_ENABLED = Object.freeze({
  customization: true,
  qrcode: true,
  realtime: true,
  productModal: true,
});
