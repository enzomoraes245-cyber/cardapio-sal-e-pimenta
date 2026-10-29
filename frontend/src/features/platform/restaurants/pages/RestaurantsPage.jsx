import { Link } from 'react-router';
import { Spinner } from '../../../../components/ui/Spinner.jsx';
import { StatusMessage } from '../../../../components/ui/StatusMessage.jsx';
import { useResource } from '../../../../hooks/useResource.js';
import { formatPrice } from '../../../../utils/format-currency.js';
import { RestaurantStatusBadge } from '../components/RestaurantStatusBadge.jsx';
import { listRestaurants } from '../services/platform-restaurants.service.js';

export function RestaurantsPage() {
  const { status, data, error, reload } = useResource(listRestaurants);

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Restaurantes</h1>
          <p className="mt-1 text-slate-600">Clientes da plataforma, assinaturas e situação.</p>
        </div>
        <Link
          to="/backoffice/restaurantes/novo"
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
        >
          Novo restaurante
        </Link>
      </div>

      {status === 'loading' && <Spinner label="Carregando restaurantes..." />}
      {status === 'error' && (
        <StatusMessage
          tone="error"
          title="Não foi possível carregar os restaurantes"
          description={error.message}
          action={{ label: 'Tentar novamente', onClick: reload }}
        />
      )}
      {status === 'success' && data.length === 0 && (
        <StatusMessage title="Nenhum restaurante cadastrado" />
      )}
      {status === 'success' && data.length > 0 && (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="w-full min-w-[40rem] text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-slate-600">
              <tr>
                <th className="px-3 py-2 font-medium">Restaurante</th>
                <th className="px-3 py-2 font-medium">Situação</th>
                <th className="px-3 py-2 font-medium">Mensalidade</th>
                <th className="px-3 py-2 font-medium">Faturas vencidas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.map((restaurant) => (
                <tr key={restaurant.id}>
                  <td className="px-3 py-2">
                    <Link
                      to={`/backoffice/restaurantes/${restaurant.id}`}
                      className="font-medium text-slate-900 hover:underline"
                    >
                      {restaurant.name}
                    </Link>
                    <p className="text-xs text-slate-500">/cardapio/{restaurant.slug}</p>
                  </td>
                  <td className="px-3 py-2">
                    <RestaurantStatusBadge status={restaurant.status} />
                  </td>
                  <td className="px-3 py-2">
                    {restaurant.subscription
                      ? `${formatPrice(restaurant.subscription.monthlyAmount)} · dia ${restaurant.subscription.dueDay}`
                      : 'Sem assinatura'}
                  </td>
                  <td
                    className={`px-3 py-2 ${restaurant.overdueInvoices > 0 ? 'font-semibold text-red-700' : 'text-slate-600'}`}
                  >
                    {restaurant.overdueInvoices}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
