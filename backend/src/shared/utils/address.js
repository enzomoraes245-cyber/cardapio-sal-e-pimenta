const LOCAL_HOSTS = [/^localhost$/, /\.localhost$/, /^127\./, /^0\.0\.0\.0$/, /^::1?$/];
const PRIVATE_NETWORK_HOSTS = [
  /^10\./,
  /^192\.168\./,
  /^172\.(1[6-9]|2\d|3[01])\./,
  /^169\.254\./,
  /^f[cd][0-9a-f]{2}:/, // IPv6 de rede local (fc00::/7)
  /^fe[89ab][0-9a-f]:/, // IPv6 de enlace local (fe80::/10)
  /\.local$/, // nomes mDNS da rede local
  /^[^.:]+$/, // nome sem domínio (ex.: "meu-pc")
];

/**
 * Tipo de um endereço: "local" (só funciona no próprio computador), "private-network" (só na
 * mesma rede, ex.: `npm run dev:celular`) ou "public". Usado no aviso do QR Code e na validação
 * do APP_PUBLIC_URL em produção.
 */
export function classifyAddress(url) {
  const host = new URL(url).hostname.replace(/^\[|\]$/g, '').toLowerCase();
  if (LOCAL_HOSTS.some((pattern) => pattern.test(host))) return 'local';
  if (PRIVATE_NETWORK_HOSTS.some((pattern) => pattern.test(host))) return 'private-network';
  return 'public';
}
