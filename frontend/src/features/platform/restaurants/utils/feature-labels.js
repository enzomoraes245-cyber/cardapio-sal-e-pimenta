/** Módulos liberáveis por restaurante (DEC-006), na ordem de exibição. */
export const FEATURE_LABELS = [
  { key: 'customization', label: 'Personalização visual', hint: 'Logotipo e cores próprios.' },
  { key: 'qrcode', label: 'QR Code', hint: 'Geração e download na retaguarda.' },
  {
    key: 'realtime',
    label: 'Atualização automática',
    hint: 'Cardápio aberto se atualiza sozinho.',
  },
  {
    key: 'productModal',
    label: 'Modal de detalhes',
    hint: 'Janela com foto ampliada e descrição.',
  },
];

export const ALL_FEATURES_ENABLED = Object.freeze({
  customization: true,
  qrcode: true,
  realtime: true,
  productModal: true,
});
