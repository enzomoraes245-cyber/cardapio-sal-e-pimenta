import { useEffect, useState } from 'react';
import { useParams } from 'react-router';
import { Spinner } from '../../../components/ui/Spinner.jsx';
import { StatusMessage } from '../../../components/ui/StatusMessage.jsx';
import { getBrandStyle } from '../../customization/utils/brand-style.js';
import { CategoryTabs } from '../components/CategoryTabs.jsx';
import { MenuHeader } from '../components/MenuHeader.jsx';
import { ProductDetailsModal } from '../components/ProductDetailsModal.jsx';
import { ProductList } from '../components/ProductList.jsx';
import { ProductSearch } from '../components/ProductSearch.jsx';
import { useMenuEvents } from '../hooks/useMenuEvents.js';
import { usePublicMenu } from '../hooks/usePublicMenu.js';
import { filterMenuCategories } from '../utils/filter-menu.js';

/** Mensagem exibida quando o cardápio não pode ser carregado. */
function errorMessage(error) {
  if (error.code === 'RESTAURANT_SUSPENDED') {
    return {
      title: 'Cardápio temporariamente indisponível',
      description: 'Tente novamente mais tarde.',
      retry: true,
    };
  }
  if (error.status === 404 || error.status === 400) {
    return {
      title: 'Cardápio não encontrado',
      description: 'Confira o QR Code ou o endereço acessado.',
    };
  }
  return {
    title: 'Não foi possível carregar o cardápio',
    description: 'Verifique sua conexão e tente novamente.',
    retry: true,
  };
}

export function PublicMenuPage() {
  const { slug } = useParams();
  const { status, menu, error, reload } = usePublicMenu(slug);
  // Módulos ausentes na resposta são tratados como liberados.
  const realtimeEnabled = menu?.features?.realtime !== false;
  const modalEnabled = menu?.features?.productModal !== false;
  // Mantém a conexão também quando o restaurante foi suspenso: a reativação chega pelo mesmo canal.
  useMenuEvents(slug, reload, {
    enabled: (status === 'success' && realtimeEnabled) || error?.code === 'RESTAURANT_SUSPENDED',
  });

  // Busca, categoria e produto aberto ficam fora dos dados do cardápio e sobrevivem às
  // atualizações em tempo real.
  const [search, setSearch] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState(null);
  const [openProductId, setOpenProductId] = useState(null);

  const restaurantName = menu?.restaurant.name;
  useEffect(() => {
    if (restaurantName) document.title = `${restaurantName} · Cardápio`;
  }, [restaurantName]);

  if (status === 'loading') return <Spinner label="Carregando cardápio..." />;

  if (status === 'error') {
    const message = errorMessage(error);
    return (
      <StatusMessage
        tone="error"
        title={message.title}
        description={message.description}
        action={message.retry ? { label: 'Tentar novamente', onClick: reload } : undefined}
      />
    );
  }

  const { categories } = menu;
  // Se a categoria selecionada deixar de existir após uma atualização, volta para "Todas".
  const activeCategoryId = categories.some((category) => category.id === selectedCategoryId)
    ? selectedCategoryId
    : null;
  const visibleCategories = filterMenuCategories(categories, {
    search,
    categoryId: activeCategoryId,
  });
  // Se o produto aberto ficar indisponível durante a consulta, o modal fecha sozinho.
  const openProduct = modalEnabled
    ? categories.flatMap((category) => category.products).find((p) => p.id === openProductId)
    : undefined;

  return (
    <div style={getBrandStyle(menu.restaurant)} className="min-h-dvh bg-brand-soft">
      <MenuHeader restaurant={menu.restaurant} />

      <div className="sticky top-0 z-10 space-y-3 border-b border-stone-200 bg-brand-soft/95 px-4 py-3 backdrop-blur">
        <ProductSearch value={search} onChange={setSearch} />
        {categories.length > 1 && (
          <CategoryTabs
            categories={categories}
            selectedId={activeCategoryId}
            onSelect={setSelectedCategoryId}
          />
        )}
      </div>

      <main className="px-4 py-6">
        {categories.length === 0 && (
          <StatusMessage
            title="Cardápio vazio"
            description="Nenhum produto disponível no momento."
          />
        )}
        {categories.length > 0 && visibleCategories.length === 0 && (
          <StatusMessage
            title="Nenhum produto encontrado"
            description="Tente outro termo de busca ou outra categoria."
          />
        )}
        {visibleCategories.length > 0 && (
          <ProductList
            categories={visibleCategories}
            onSelectProduct={modalEnabled ? setOpenProductId : undefined}
          />
        )}
      </main>

      {openProduct && (
        <ProductDetailsModal
          key={openProduct.id}
          product={openProduct}
          onClose={() => setOpenProductId(null)}
        />
      )}
    </div>
  );
}
