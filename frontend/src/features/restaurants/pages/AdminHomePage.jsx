import { Link } from 'react-router';
import { Alert } from '../../../components/admin/Alert.jsx';
import { LinkButton } from '../../../components/admin/Button.jsx';
import { CopyButton } from '../../../components/admin/CopyButton.jsx';
import {
  ChevronRightIcon,
  ExternalLinkIcon,
  LayersIcon,
  PackageIcon,
  PaletteIcon,
  PlusIcon,
  QrCodeIcon,
  StoreIcon,
} from '../../../components/admin/icons.jsx';
import { PageHeader } from '../../../components/admin/PageHeader.jsx';
import { Panel } from '../../../components/admin/Panel.jsx';
import { Stat } from '../../../components/admin/Stat.jsx';
import { ErrorState, LoadingState } from '../../../components/admin/States.jsx';
import { useResource } from '../../../hooks/useResource.js';
import { useSession } from '../../auth/hooks/useSession.js';
import { listCategories } from '../../categories/services/categories.service.js';
import { getEstablishment } from '../../establishment/services/establishment.service.js';
import { listProducts } from '../../products/services/products.service.js';
import { publicationStatus } from '../../products/utils/publication.js';
import { plural } from '../../../utils/plural.js';

async function loadSummary({ signal }) {
  const [categories, products, establishment] = await Promise.all([
    listCategories({ signal }),
    listProducts({ signal }),
    getEstablishment({ signal }),
  ]);
  return { categories, products, establishment };
}

/** Contagens do cardápio pelo mesmo critério de publicação da API. */
function summarize({ categories, products }) {
  const byStatus = { published: 0, photo: 0, unavailable: 0, inactive: 0, category: 0 };
  for (const product of products) byStatus[publicationStatus(product).key] += 1;
  const visibleCategories = categories.filter((category) => category.isActive).length;
  const emptyCategories = categories.filter(
    (category) => category.isActive && category.publishableCount === 0,
  );
  return { byStatus, visibleCategories, emptyCategories };
}

const SHORTCUTS = [
  {
    to: '/admin/produtos',
    title: 'Produtos',
    text: 'Preços, fotos, ordem e disponibilidade.',
    icon: PackageIcon,
  },
  {
    to: '/admin/categorias',
    title: 'Categorias',
    text: 'Seções do cardápio e a ordem delas.',
    icon: LayersIcon,
  },
  {
    to: '/admin/estabelecimento',
    title: 'Dados do estabelecimento',
    text: 'Nome exibido e contato.',
    icon: StoreIcon,
  },
  {
    to: '/admin/personalizacao',
    title: 'Identidade visual',
    text: 'Logotipo e cores.',
    icon: PaletteIcon,
    feature: 'customization',
  },
  {
    to: '/admin/qrcode',
    title: 'QR Code',
    text: 'Baixe ou imprima o QR Code das mesas.',
    icon: QrCodeIcon,
    feature: 'qrcode',
  },
];

function PendingItem({ to, children }) {
  return (
    <li>
      <Link
        to={to}
        className="group flex items-center justify-between gap-3 rounded-admin-control px-3 py-2.5 text-sm text-admin-text hover:bg-admin-subtle focus-visible:outline-2 focus-visible:outline-admin-accent"
      >
        <span>{children}</span>
        <ChevronRightIcon
          size={16}
          className="shrink-0 text-admin-faint group-hover:text-admin-text"
        />
      </Link>
    </li>
  );
}

/** Início do painel: situação real do cardápio, pendências e atalhos para o dia a dia. */
export function AdminHomePage() {
  const { restaurant, features } = useSession();
  const { status, data, error, reload } = useResource(loadSummary);
  const shortcuts = SHORTCUTS.filter((item) => !item.feature || features?.[item.feature] !== false);

  const summary = data && summarize(data);
  const hidden = summary
    ? summary.byStatus.photo +
      summary.byStatus.unavailable +
      summary.byStatus.inactive +
      summary.byStatus.category
    : 0;
  const pending =
    summary &&
    [
      summary.byStatus.photo > 0 && {
        to: '/admin/produtos?situacao=sem-foto',
        text:
          summary.byStatus.photo === 1
            ? '1 produto sem foto ainda não aparece no cardápio'
            : `${summary.byStatus.photo} produtos sem foto ainda não aparecem no cardápio`,
      },
      summary.byStatus.unavailable > 0 && {
        to: '/admin/produtos?situacao=indisponiveis',
        text:
          summary.byStatus.unavailable === 1
            ? '1 produto marcado como indisponível'
            : `${summary.byStatus.unavailable} produtos marcados como indisponíveis`,
      },
      summary.byStatus.category > 0 && {
        to: '/admin/produtos?situacao=categoria-oculta',
        text:
          summary.byStatus.category === 1
            ? '1 produto em categoria oculta'
            : `${summary.byStatus.category} produtos em categorias ocultas`,
      },
      summary.emptyCategories.length > 0 && {
        to: '/admin/categorias',
        text: `${plural(summary.emptyCategories.length, 'categoria visível', 'categorias visíveis')} sem nenhum produto no cardápio`,
      },
    ].filter(Boolean);

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Painel do restaurante"
        title={restaurant.name}
        description="Resumo do cardápio e atalhos para as tarefas do dia a dia."
        actions={
          <>
            <LinkButton
              href={`/cardapio/${restaurant.slug}`}
              external
              icon={ExternalLinkIcon}
              variant="secondary"
            >
              Ver cardápio
            </LinkButton>
            <LinkButton to="/admin/produtos/novo" variant="primary" icon={PlusIcon}>
              Novo produto
            </LinkButton>
          </>
        }
      />

      {status === 'loading' && <LoadingState label="Carregando resumo..." rows={3} />}
      {status === 'error' && (
        <ErrorState title="Não foi possível carregar o resumo" error={error} onRetry={reload} />
      )}

      {status === 'success' && (
        <>
          <div className="grid gap-4 md:grid-cols-3">
            <Stat
              label="Produtos no cardápio"
              value={summary.byStatus.published}
              detail={`de ${plural(data.products.length, 'cadastrado')}`}
              definition="Ativos, disponíveis, com foto e em categoria visível."
              icon={PackageIcon}
              tone="success"
              to="/admin/produtos?situacao=no-cardapio"
              linkLabel="Ver produtos"
            />
            <Stat
              label="Fora do cardápio"
              value={hidden}
              detail={
                hidden > 0
                  ? `${summary.byStatus.photo} sem foto · ${plural(summary.byStatus.unavailable, 'indisponível', 'indisponíveis')} · ${plural(summary.byStatus.inactive, 'inativo')}`
                  : 'Nenhum produto escondido'
              }
              definition="Cadastrados, mas sem aparecer para os clientes agora."
              icon={PackageIcon}
              tone={hidden > 0 ? 'warning' : 'neutral'}
              to="/admin/produtos?situacao=fora"
              linkLabel="Revisar"
            />
            <Stat
              label="Categorias visíveis"
              value={summary.visibleCategories}
              detail={`de ${plural(data.categories.length, 'categoria')}`}
              definition="Categorias ocultas e seus produtos não aparecem no cardápio."
              icon={LayersIcon}
              tone="accent"
              to="/admin/categorias"
              linkLabel="Ver categorias"
            />
          </div>

          <div className="grid gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] lg:items-start">
            <Panel title="Pendências" description="O que impede itens de aparecer no cardápio.">
              {pending.length > 0 ? (
                <ul className="-mx-3 -my-1 space-y-0.5">
                  {pending.map((item) => (
                    <PendingItem key={item.to + item.text} to={item.to}>
                      {item.text}
                    </PendingItem>
                  ))}
                </ul>
              ) : (
                <Alert tone="success">
                  Tudo em dia: todos os produtos ativos estão aparecendo no cardápio.
                </Alert>
              )}
            </Panel>

            <Panel title="Endereço do cardápio" description="O mesmo do QR Code; não muda.">
              <p className="mb-3 text-sm break-all text-admin-text">
                {data.establishment.publicUrl}
              </p>
              <div className="flex flex-wrap gap-2">
                <CopyButton text={data.establishment.publicUrl} label="Copiar" size="sm" />
                {features?.qrcode !== false && (
                  <LinkButton to="/admin/qrcode" size="sm" icon={QrCodeIcon}>
                    QR Code
                  </LinkButton>
                )}
              </div>
            </Panel>
          </div>
        </>
      )}

      <section aria-labelledby="atalhos" className="space-y-3">
        <h2 id="atalhos" className="text-[15px] font-semibold text-admin-text">
          Atalhos
        </h2>
        <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {shortcuts.map(({ to, title, text, icon: Icon }) => (
            <li key={to}>
              <Link
                to={to}
                className="group flex h-full items-start gap-4 rounded-admin-panel border border-admin-line bg-admin-surface p-4 transition-colors hover:border-admin-accent/40 hover:bg-admin-accent-soft/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-admin-accent"
              >
                <span className="flex size-10 shrink-0 items-center justify-center rounded-admin-control bg-admin-accent-soft text-admin-accent">
                  <Icon size={20} />
                </span>
                <span className="min-w-0">
                  <span className="block font-medium text-admin-text">{title}</span>
                  <span className="mt-0.5 block text-[13px] text-admin-muted">{text}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
