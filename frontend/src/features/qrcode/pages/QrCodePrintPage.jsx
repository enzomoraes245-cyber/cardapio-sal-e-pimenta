import { useEffect, useState } from 'react';
import { Alert } from '../../../components/admin/Alert.jsx';
import { Button, LinkButton } from '../../../components/admin/Button.jsx';
import { cx } from '../../../components/admin/cx.js';
import { ChevronLeftIcon, PrinterIcon, RefreshIcon } from '../../../components/admin/icons.jsx';
import { ErrorState, LoadingState } from '../../../components/admin/States.jsx';
import { useResource } from '../../../hooks/useResource.js';
import { AddressWarning } from '../components/AddressWarning.jsx';
import { getQrCodeImageUrl, getQrCodeInfo } from '../services/qrcode.service.js';

// A folha já tem as próprias margens: sem margem de página, o navegador também não imprime
// cabeçalho e rodapé (data, endereço da página). O estilo só existe enquanto a página está aberta.
const PRINT_STYLE = '@page { size: A4 portrait; margin: 0; }';

/** Título da aba (e nome sugerido ao salvar em PDF) enquanto a página estiver aberta. */
function useDocumentTitle(title) {
  useEffect(() => {
    if (!title) return undefined;
    const previous = document.title;
    document.title = title;
    return () => {
      document.title = previous;
    };
  }, [title]);
}

/**
 * Folha A4: logotipo, nome, QR Code em SVG, instrução e endereço em texto. As medidas usam cqw
 * (1% da largura da folha), então a prévia na tela e a impressão têm a mesma composição.
 */
function PrintSheet({
  info,
  showLogo,
  qrState,
  qrAttempt,
  onQrLoad,
  onQrError,
  onLogoLoad,
  onLogoError,
}) {
  return (
    <article
      aria-label="Folha A4 para impressão"
      className="@container mx-auto flex aspect-[210/297] w-full max-w-[680px] flex-col overflow-hidden bg-white text-admin-text shadow-admin-float ring-1 ring-admin-line print:aspect-auto print:h-[296mm] print:w-[210mm] print:max-w-none print:shadow-none print:ring-0"
    >
      <div className="flex flex-1 flex-col items-center justify-between px-[10cqw] py-[11cqw] text-center">
        <header className="flex flex-col items-center gap-[2.5cqw]">
          {showLogo && (
            <img
              src={info.logoUrl}
              alt={`Logotipo de ${info.restaurantName}`}
              onLoad={onLogoLoad}
              onError={onLogoError}
              className="mb-[1.5cqw] max-h-[16cqw] max-w-[48cqw] object-contain"
            />
          )}
          <h2 className="font-admin-display text-[6.4cqw] leading-[1.12] font-semibold tracking-[-0.01em] text-balance">
            {info.restaurantName}
          </h2>
          <span aria-hidden="true" className="h-px w-[12cqw] bg-admin-line-strong" />
          <p className="text-[2.3cqw] font-medium tracking-[0.3em] text-admin-muted uppercase">
            Cardápio digital
          </p>
        </header>

        <figure className="flex flex-col items-center gap-[3.5cqw]">
          <img
            key={qrAttempt}
            src={getQrCodeImageUrl({ format: 'svg' })}
            alt={`QR Code do cardápio: ${info.url}`}
            onLoad={onQrLoad}
            onError={onQrError}
            className={cx('size-[54cqw]', qrState !== 'ready' && 'invisible')}
          />
          <figcaption className="max-w-[64cqw] text-[3.4cqw] leading-snug font-medium text-balance">
            Aponte a câmera do celular para o QR Code e veja o cardápio.
          </figcaption>
        </figure>

        <p className="max-w-full text-[2.5cqw] leading-snug break-all text-admin-muted">
          {info.url}
        </p>
      </div>
    </article>
  );
}

/**
 * Folha de impressão do QR Code (fora do layout do painel). O botão "Imprimir" só é liberado
 * depois que o QR Code (e o logotipo, se houver) terminam de carregar.
 */
export function QrCodePrintPage() {
  const { status, data, error, reload } = useResource(getQrCodeInfo);
  const [qrState, setQrState] = useState('loading');
  const [qrAttempt, setQrAttempt] = useState(0);
  const [logoState, setLogoState] = useState('loading');
  useDocumentTitle(data ? `QR Code · ${data.restaurantName}` : null);

  const waitingLogo = Boolean(data?.logoUrl) && logoState === 'loading';
  const ready = status === 'success' && qrState === 'ready' && !waitingLogo;

  function retryQr() {
    setQrState('loading');
    setQrAttempt((value) => value + 1);
  }

  return (
    <div className="min-h-dvh bg-admin-canvas font-admin text-admin-text antialiased print:min-h-0 print:bg-white">
      <style>{PRINT_STYLE}</style>

      <header className="sticky top-0 z-10 border-b border-admin-line bg-admin-surface/95 backdrop-blur-sm print:hidden">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="flex min-w-0 items-center gap-2 sm:gap-4">
            <LinkButton to="/admin/qrcode" variant="ghost" size="sm" icon={ChevronLeftIcon}>
              Voltar
            </LinkButton>
            <div className="min-w-0 border-l border-admin-line pl-3 sm:pl-4">
              <h1 className="truncate text-[15px] font-semibold">Folha para impressão</h1>
              <p className="truncate text-xs text-admin-muted">QR Code · A4 retrato</p>
            </div>
          </div>
          <Button
            icon={PrinterIcon}
            onClick={() => window.print()}
            disabled={!ready}
            loading={status === 'success' && !ready && qrState !== 'error'}
          >
            Imprimir
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-5 px-4 py-6 sm:px-6 sm:py-10 print:max-w-none print:space-y-0 print:p-0">
        {status === 'loading' && <LoadingState label="Carregando folha..." rows={2} />}
        {status === 'error' && (
          <ErrorState title="Não foi possível carregar a folha" error={error} onRetry={reload} />
        )}

        {status === 'success' && (
          <>
            <div className="mx-auto max-w-[680px] space-y-3 print:hidden">
              <AddressWarning kind={data.addressKind} url={data.url} />
              {qrState === 'error' && (
                <Alert
                  tone="danger"
                  title="Não foi possível carregar o QR Code"
                  action={
                    <Button variant="secondary" size="sm" icon={RefreshIcon} onClick={retryQr}>
                      Tentar novamente
                    </Button>
                  }
                >
                  A impressão fica disponível quando a imagem carregar.
                </Alert>
              )}
              <p className="text-[13px] leading-relaxed text-admin-muted">
                Na janela de impressão, escolha papel A4, orientação retrato e escala padrão (100%).
              </p>
            </div>

            <PrintSheet
              info={data}
              showLogo={Boolean(data.logoUrl) && logoState !== 'error'}
              qrState={qrState}
              qrAttempt={qrAttempt}
              onQrLoad={() => setQrState('ready')}
              onQrError={() => setQrState('error')}
              onLogoLoad={() => setLogoState('ready')}
              onLogoError={() => setLogoState('error')}
            />
          </>
        )}
      </main>
    </div>
  );
}
