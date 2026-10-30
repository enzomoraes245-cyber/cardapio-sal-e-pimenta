import { Alert } from '../../../components/admin/Alert.jsx';

const WARNINGS = {
  local: {
    title: 'Endereço de teste: não distribua este QR Code',
    text: (host) =>
      `Ele aponta para ${host}, que só abre neste computador. Os celulares dos clientes não conseguirão acessar o cardápio.`,
  },
  'private-network': {
    title: 'Endereço da rede local: use só para testes',
    text: (host) =>
      `Ele aponta para ${host}, que só abre em aparelhos conectados à mesma rede deste computador.`,
  },
};

/** Aviso para QR Codes que apontam para endereços que os clientes não alcançam. */
export function AddressWarning({ kind, url, className }) {
  const warning = WARNINGS[kind];
  if (!warning) return null;
  return (
    <Alert tone="warning" title={warning.title} className={className}>
      {warning.text(new URL(url).host)} O endereço definitivo é configurado pela plataforma.
    </Alert>
  );
}
