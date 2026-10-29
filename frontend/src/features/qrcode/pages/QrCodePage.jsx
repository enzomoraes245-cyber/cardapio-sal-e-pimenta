import { useState } from 'react';
import { Button } from '../../../components/ui/Button.jsx';
import { Spinner } from '../../../components/ui/Spinner.jsx';
import { StatusMessage } from '../../../components/ui/StatusMessage.jsx';
import { useResource } from '../../../hooks/useResource.js';
import { getQrCodeImageUrl, getQrCodeInfo } from '../services/qrcode.service.js';

export function QrCodePage() {
  const { status, data, error, reload } = useResource(getQrCodeInfo);
  const [copied, setCopied] = useState(false);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(data.url);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">QR Code</h1>
        <p className="mt-1 text-slate-600">
          O QR Code leva ao cardápio do seu restaurante e continua válido após qualquer alteração de
          produtos, categorias ou personalização.
        </p>
      </div>

      {status === 'loading' && <Spinner />}
      {status === 'error' && (
        <StatusMessage
          tone="error"
          title="Não foi possível carregar o QR Code"
          description={error.message}
          action={{ label: 'Tentar novamente', onClick: reload }}
        />
      )}
      {status === 'success' && (
        <div className="flex flex-col gap-6 rounded-xl border border-slate-200 bg-white p-4 sm:flex-row sm:p-6">
          <img
            src={getQrCodeImageUrl()}
            alt={`QR Code do cardápio: ${data.url}`}
            width={256}
            height={256}
            className="size-64 self-center rounded-lg border border-slate-100"
          />
          <div className="min-w-0 space-y-4">
            <div>
              <p className="text-sm font-medium text-slate-800">Endereço do cardápio</p>
              <a
                href={data.url}
                target="_blank"
                rel="noreferrer"
                className="break-all text-slate-900 underline"
              >
                {data.url}
              </a>
            </div>
            <div className="flex flex-wrap gap-2">
              <a
                href={getQrCodeImageUrl({ download: true })}
                download={`qrcode-cardapio-${data.slug}.png`}
                className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
              >
                Baixar imagem (PNG)
              </a>
              <Button variant="secondary" onClick={copyLink}>
                {copied ? 'Link copiado' : 'Copiar link'}
              </Button>
            </div>
            <p className="text-xs text-slate-500">
              Imagem de 1024 × 1024 px, adequada para impressão em mesas e cardápios físicos.
            </p>
          </div>
        </div>
      )}
    </section>
  );
}
