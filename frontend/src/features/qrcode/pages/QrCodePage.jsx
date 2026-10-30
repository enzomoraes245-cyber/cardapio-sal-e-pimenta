import { useState } from 'react';
import { Button, LinkButton } from '../../../components/admin/Button.jsx';
import { CopyButton } from '../../../components/admin/CopyButton.jsx';
import {
  AlertCircleIcon,
  DownloadIcon,
  ExternalLinkIcon,
  ImageIcon,
  LayersIcon,
  PrinterIcon,
  RefreshIcon,
} from '../../../components/admin/icons.jsx';
import { PageHeader } from '../../../components/admin/PageHeader.jsx';
import { Panel } from '../../../components/admin/Panel.jsx';
import { ErrorState, LoadingState, Skeleton } from '../../../components/admin/States.jsx';
import { useResource } from '../../../hooks/useResource.js';
import { AddressWarning } from '../components/AddressWarning.jsx';
import { getQrCodeImageUrl, getQrCodeInfo } from '../services/qrcode.service.js';

const FILES = [
  {
    format: 'png',
    title: 'Imagem PNG',
    text: '1024 × 1024 px. Para mensagens, redes sociais e arquivos digitais.',
    action: 'Baixar PNG',
    icon: ImageIcon,
  },
  {
    format: 'svg',
    title: 'Vetor SVG',
    text: 'Nítido em qualquer tamanho. Ideal para gráficas e materiais grandes.',
    action: 'Baixar SVG',
    icon: LayersIcon,
  },
];

const TIPS = [
  'Teste a leitura com a câmera de um celular antes de imprimir em quantidade.',
  'Mantenha o QR Code com pelo menos 3 cm de lado e sem cortar a borda branca.',
  'Alterar produtos, preços, categorias, nome ou cores não muda o QR Code: os já impressos continuam valendo.',
];

/** Imagem do QR Code com estados de carregamento e erro (e nova tentativa). */
function QrPreview({ info }) {
  const [state, setState] = useState('loading');
  const [attempt, setAttempt] = useState(0);

  function retry() {
    setState('loading');
    setAttempt((value) => value + 1);
  }

  return (
    <div className="relative mx-auto aspect-square w-full max-w-72 rounded-admin-control border border-admin-line bg-white p-2">
      {state === 'loading' && (
        <>
          <Skeleton className="absolute inset-2 rounded-md" />
          <span role="status" className="sr-only">
            Carregando QR Code...
          </span>
        </>
      )}
      {state === 'error' ? (
        <div
          role="alert"
          className="flex h-full flex-col items-center justify-center gap-3 p-4 text-center"
        >
          <AlertCircleIcon size={24} className="text-admin-danger" />
          <p className="text-sm text-admin-muted">Não foi possível carregar a imagem.</p>
          <Button variant="secondary" size="sm" icon={RefreshIcon} onClick={retry}>
            Tentar novamente
          </Button>
        </div>
      ) : (
        <img
          key={attempt}
          src={getQrCodeImageUrl()}
          alt={`QR Code do cardápio de ${info.restaurantName}: ${info.url}`}
          width={1024}
          height={1024}
          onLoad={() => setState('ready')}
          onError={() => setState('error')}
          className={state === 'ready' ? 'size-full' : 'size-full opacity-0'}
        />
      )}
    </div>
  );
}

/** QR Code do cardápio: prévia, endereço, arquivos para download e folha de impressão. */
export function QrCodePage() {
  const { status, data, error, reload } = useResource(getQrCodeInfo);

  return (
    <div className="space-y-8">
      <PageHeader
        title="QR Code"
        description="Leva os clientes direto ao cardápio do restaurante. O endereço é fixo: QR Codes já impressos continuam funcionando."
        actions={
          status === 'success' && (
            <LinkButton to="/admin/qrcode/impressao" variant="primary" icon={PrinterIcon}>
              Imprimir folha A4
            </LinkButton>
          )
        }
      />

      {status === 'loading' && <LoadingState label="Carregando QR Code..." rows={2} />}
      {status === 'error' && (
        <ErrorState title="Não foi possível carregar o QR Code" error={error} onRetry={reload} />
      )}

      {status === 'success' && (
        <>
          <AddressWarning kind={data.addressKind} url={data.url} />

          <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] lg:items-start">
            <Panel title="Pré-visualização" description="Aponte a câmera do celular para testar.">
              <QrPreview info={data} />
              <p className="mt-4 text-center text-[13px] text-admin-muted">
                Preto sobre branco, com margem de segurança para a leitura.
              </p>
            </Panel>

            <div className="space-y-6">
              <Panel
                title="Endereço do cardápio"
                description="É o endereço gravado no QR Code. Não muda."
              >
                <p className="mb-4 rounded-admin-control border border-admin-line bg-admin-subtle px-3 py-2.5 font-mono text-[13px] break-all text-admin-text">
                  {data.url}
                </p>
                <div className="flex flex-wrap gap-2">
                  <CopyButton
                    text={data.url}
                    label="Copiar endereço"
                    successMessage="Endereço do cardápio copiado."
                  />
                  <LinkButton href={data.url} external icon={ExternalLinkIcon}>
                    Abrir cardápio
                  </LinkButton>
                </div>
              </Panel>

              <Panel title="Arquivos para download" flush>
                <ul className="divide-y divide-admin-line">
                  {FILES.map(({ format, title, text, action, icon: Icon }) => (
                    <li
                      key={format}
                      className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6"
                    >
                      <div className="flex min-w-0 items-start gap-3">
                        <span className="flex size-9 shrink-0 items-center justify-center rounded-admin-control bg-admin-accent-soft text-admin-accent">
                          <Icon size={18} />
                        </span>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-admin-text">{title}</p>
                          <p className="text-[13px] text-admin-muted">{text}</p>
                        </div>
                      </div>
                      <LinkButton
                        href={getQrCodeImageUrl({ format, download: true })}
                        download={`qrcode-cardapio-${data.slug}.${format}`}
                        size="sm"
                        icon={DownloadIcon}
                        className="self-start sm:self-center"
                      >
                        {action}
                      </LinkButton>
                    </li>
                  ))}
                </ul>
              </Panel>

              <Panel title="Antes de distribuir">
                <ul className="list-disc space-y-1.5 pl-5 text-sm text-admin-muted marker:text-admin-faint">
                  {TIPS.map((tip) => (
                    <li key={tip}>{tip}</li>
                  ))}
                </ul>
              </Panel>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
