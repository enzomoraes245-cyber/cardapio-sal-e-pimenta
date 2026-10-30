import { useCallback, useState } from 'react';
import { useParams, useSearchParams } from 'react-router';
import { Alert } from '../../../../components/admin/Alert.jsx';
import { Button, LinkButton } from '../../../../components/admin/Button.jsx';
import { CopyButton } from '../../../../components/admin/CopyButton.jsx';
import { DescriptionList } from '../../../../components/admin/DescriptionList.jsx';
import { ConfirmDialog } from '../../../../components/admin/Dialog.jsx';
import {
  ExternalLinkIcon,
  PauseCircleIcon,
  PlayCircleIcon,
} from '../../../../components/admin/icons.jsx';
import { PageHeader } from '../../../../components/admin/PageHeader.jsx';
import { Panel } from '../../../../components/admin/Panel.jsx';
import { ErrorState, LoadingState } from '../../../../components/admin/States.jsx';
import { TabPanel, Tabs } from '../../../../components/admin/Tabs.jsx';
import { useToast } from '../../../../components/admin/Toast.jsx';
import { useResource } from '../../../../hooks/useResource.js';
import { formatPrice } from '../../../../utils/format-currency.js';
import { formatDate, formatDateTime } from '../../../../utils/format-date.js';
import { HistoryTimeline } from '../../audit/components/HistoryTimeline.jsx';
import { RestaurantInvoicesCard } from '../../billing/components/RestaurantInvoicesCard.jsx';
import { AdminsPanel } from '../components/AdminsPanel.jsx';
import { FeaturesPanel } from '../components/FeaturesPanel.jsx';
import { RegistrationPanel } from '../components/RegistrationPanel.jsx';
import { RestaurantStatusBadge } from '../components/RestaurantStatusBadge.jsx';
import { SubscriptionCard } from '../components/SubscriptionCard.jsx';
import {
  getRestaurant,
  reactivateRestaurant,
  suspendRestaurant,
} from '../services/platform-restaurants.service.js';

const TAB_IDS = ['resumo', 'financeiro', 'acessos', 'modulos', 'historico'];

function SummaryColumn({ restaurant }) {
  const publicUrl = `${window.location.origin}/cardapio/${restaurant.slug}`;
  const suspended = restaurant.status === 'SUSPENDED';
  return (
    <div className="space-y-6">
      <Panel title="Situação do serviço">
        <DescriptionList
          columns={1}
          items={[
            { label: 'Situação', value: <RestaurantStatusBadge status={restaurant.status} /> },
            ...(suspended
              ? [
                  { label: 'Suspenso desde', value: formatDateTime(restaurant.suspendedAt) },
                  { label: 'Motivo', value: restaurant.suspensionReason },
                ]
              : []),
            {
              label: 'Mensalidades vencidas',
              value:
                restaurant.overdueInvoices > 0
                  ? `${restaurant.overdueInvoices} · ${formatPrice(restaurant.overdueAmount)}`
                  : 'Nenhuma',
            },
          ]}
        />
      </Panel>
      <Panel title="Assinatura">
        {restaurant.subscription ? (
          <DescriptionList
            columns={1}
            items={[
              {
                label: 'Mensalidade',
                value: formatPrice(restaurant.subscription.monthlyAmount),
              },
              { label: 'Vencimento', value: `Todo dia ${restaurant.subscription.dueDay}` },
              { label: 'Início da cobrança', value: formatDate(restaurant.subscription.startedAt) },
            ]}
          />
        ) : (
          <p className="text-sm text-admin-muted">Sem assinatura cadastrada.</p>
        )}
      </Panel>
      <Panel title="Endereço público" description="Usado no cardápio e no QR Code; nunca muda.">
        <p className="mb-3 text-sm break-all text-admin-text">{publicUrl}</p>
        <div className="flex flex-wrap gap-2">
          <CopyButton text={publicUrl} label="Copiar endereço" size="sm" />
          <LinkButton href={publicUrl} external size="sm" icon={ExternalLinkIcon}>
            Abrir cardápio
          </LinkButton>
        </div>
      </Panel>
    </div>
  );
}

/**
 * Detalhe do restaurante no backoffice: dados cadastrais, situação, assinatura e mensalidades,
 * responsáveis, módulos e histórico de ações. A aba ativa fica na URL (?aba=).
 */
export function RestaurantDetailPage() {
  const { id } = useParams();
  const toast = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = TAB_IDS.includes(searchParams.get('aba')) ? searchParams.get('aba') : 'resumo';
  const loader = useCallback(({ signal }) => getRestaurant(id, { signal }), [id]);
  const { status, data: restaurant, error, reload, setData } = useResource(loader);
  const [historyKey, setHistoryKey] = useState(0);
  const [dialog, setDialog] = useState(null);

  const applyUpdate = useCallback(
    (next) => {
      setData(next);
      setHistoryKey((key) => key + 1);
    },
    [setData],
  );

  function selectTab(next) {
    setSearchParams(next === 'resumo' ? {} : { aba: next }, { replace: true });
  }

  const suspended = restaurant?.status === 'SUSPENDED';
  const tabs = [
    { id: 'resumo', label: 'Resumo' },
    { id: 'financeiro', label: 'Financeiro' },
    { id: 'acessos', label: 'Acessos', count: restaurant?.admins.length },
    { id: 'modulos', label: 'Módulos' },
    { id: 'historico', label: 'Histórico' },
  ];

  return (
    <div className="space-y-8">
      <PageHeader
        back={{ to: '/backoffice/restaurantes', label: 'Restaurantes' }}
        title={restaurant?.name ?? 'Restaurante'}
        meta={
          restaurant && (
            <>
              <RestaurantStatusBadge status={restaurant.status} />
              <span className="text-[13px] text-admin-faint">/cardapio/{restaurant.slug}</span>
            </>
          )
        }
        actions={
          restaurant &&
          (suspended ? (
            <Button icon={PlayCircleIcon} onClick={() => setDialog('reactivate')}>
              Reativar restaurante
            </Button>
          ) : (
            <Button
              variant="danger-outline"
              icon={PauseCircleIcon}
              onClick={() => setDialog('suspend')}
            >
              Suspender restaurante
            </Button>
          ))
        }
      />

      {status === 'loading' && <LoadingState label="Carregando restaurante..." rows={4} />}
      {status === 'error' && (
        <ErrorState
          title={error.status === 404 ? 'Restaurante não encontrado' : 'Não foi possível carregar'}
          error={error}
          onRetry={error.status === 404 ? undefined : reload}
        />
      )}

      {restaurant && (
        <>
          {suspended && (
            <Alert tone="danger" title="Restaurante suspenso">
              Desde {formatDateTime(restaurant.suspendedAt)}. Motivo: {restaurant.suspensionReason}.
              O painel do restaurante e o cardápio público estão bloqueados; o endereço, o QR Code e
              os dados continuam preservados.
            </Alert>
          )}

          <div>
            <Tabs
              label="Seções do restaurante"
              idPrefix="restaurante"
              tabs={tabs}
              value={tab}
              onChange={selectTab}
            />
            <TabPanel idPrefix="restaurante" tabId={tab}>
              {tab === 'resumo' && (
                <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] lg:items-start">
                  <RegistrationPanel
                    key={restaurant.name}
                    restaurant={restaurant}
                    onUpdated={applyUpdate}
                  />
                  <SummaryColumn restaurant={restaurant} />
                </div>
              )}
              {tab === 'financeiro' && (
                <div className="space-y-6">
                  <SubscriptionCard restaurant={restaurant} onUpdated={applyUpdate} />
                  <RestaurantInvoicesCard restaurantId={restaurant.id} onInvoiceChanged={reload} />
                </div>
              )}
              {tab === 'acessos' && (
                <AdminsPanel
                  restaurant={restaurant}
                  onAdminsChanged={(admins) => applyUpdate({ ...restaurant, admins })}
                />
              )}
              {tab === 'modulos' && (
                <FeaturesPanel
                  key={JSON.stringify(restaurant.features)}
                  restaurant={restaurant}
                  onUpdated={applyUpdate}
                />
              )}
              {tab === 'historico' && (
                <Panel
                  title="Histórico de ações"
                  description="Quem fez, quando e por quê. O histórico não pode ser alterado."
                >
                  <HistoryTimeline key={historyKey} restaurantId={restaurant.id} />
                </Panel>
              )}
            </TabPanel>
          </div>
        </>
      )}

      {dialog === 'suspend' && (
        <ConfirmDialog
          title="Suspender restaurante?"
          description="O painel do restaurante e o cardápio público ficam bloqueados até a reativação. O endereço, o QR Code e os dados não mudam e nada é apagado."
          confirmLabel="Suspender restaurante"
          reason={{
            label: 'Motivo da suspensão',
            required: true,
            requiredMessage: 'Informe o motivo da suspensão.',
            placeholder: 'Ex.: mensalidades em atraso',
          }}
          onClose={() => setDialog(null)}
          onConfirm={async (reason) => {
            applyUpdate(await suspendRestaurant(restaurant.id, reason));
            toast.success('Restaurante suspenso.');
          }}
        />
      )}
      {dialog === 'reactivate' && (
        <ConfirmDialog
          title="Reativar restaurante?"
          description="O painel e o cardápio voltam a funcionar na hora, inclusive para quem estiver com o cardápio aberto."
          confirmLabel="Reativar restaurante"
          tone="primary"
          reason={{
            label: 'Motivo da reativação',
            required: true,
            requiredMessage: 'Informe o motivo da reativação.',
            placeholder: 'Ex.: pagamento regularizado',
          }}
          onClose={() => setDialog(null)}
          onConfirm={async (reason) => {
            applyUpdate(await reactivateRestaurant(restaurant.id, reason));
            toast.success('Restaurante reativado.');
          }}
        />
      )}
    </div>
  );
}
