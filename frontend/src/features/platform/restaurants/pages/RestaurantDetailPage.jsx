import { useCallback } from 'react';
import { Link, useParams } from 'react-router';
import { Spinner } from '../../../../components/ui/Spinner.jsx';
import { StatusMessage } from '../../../../components/ui/StatusMessage.jsx';
import { useResource } from '../../../../hooks/useResource.js';
import { RestaurantInvoicesCard } from '../../billing/components/RestaurantInvoicesCard.jsx';
import { AdminsCard } from '../components/AdminsCard.jsx';
import { FeaturesCard } from '../components/FeaturesCard.jsx';
import { RestaurantNameCard } from '../components/RestaurantNameCard.jsx';
import { RestaurantStatusBadge } from '../components/RestaurantStatusBadge.jsx';
import { SubscriptionCard } from '../components/SubscriptionCard.jsx';
import { SuspensionCard } from '../components/SuspensionCard.jsx';
import { getRestaurant } from '../services/platform-restaurants.service.js';

export function RestaurantDetailPage() {
  const { id } = useParams();
  const loader = useCallback(({ signal }) => getRestaurant(id, { signal }), [id]);
  const { status, data: restaurant, error, reload, setData } = useResource(loader);

  return (
    <section className="space-y-6">
      <Link to="/backoffice" className="text-sm text-slate-600 hover:underline">
        ← Restaurantes
      </Link>

      {status === 'loading' && <Spinner />}
      {status === 'error' && (
        <StatusMessage
          tone="error"
          title={error.status === 404 ? 'Restaurante não encontrado' : 'Não foi possível carregar'}
          description={error.message}
          action={error.status === 404 ? undefined : { label: 'Tentar novamente', onClick: reload }}
        />
      )}
      {status === 'success' && (
        <>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-semibold">{restaurant.name}</h1>
            <RestaurantStatusBadge status={restaurant.status} />
            <a
              href={`/cardapio/${restaurant.slug}`}
              target="_blank"
              rel="noreferrer"
              className="text-sm text-slate-700 underline"
            >
              Abrir cardápio
            </a>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <SuspensionCard key={restaurant.status} restaurant={restaurant} onUpdated={setData} />
            <FeaturesCard restaurant={restaurant} onUpdated={setData} />
            <SubscriptionCard restaurant={restaurant} onUpdated={setData} />
            <RestaurantNameCard restaurant={restaurant} onUpdated={setData} />
          </div>
          <AdminsCard restaurant={restaurant} onUpdated={setData} />
          <RestaurantInvoicesCard restaurantId={restaurant.id} />
        </>
      )}
    </section>
  );
}
