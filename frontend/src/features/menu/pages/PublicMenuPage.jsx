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
import { useFavorites } from '../hooks/useFavorites.js';
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
  const [showingFavorites, setShowingFavorites] = useState(false);
  const [openProductId, setOpenProductId] = useState(null);
  const { favorites, toggleFavorite } = useFavorites(slug);

  const restaurantName = menu?.restaurant.name;
  useEffect(() => {
    if (restaurantName) document.title = `${restaurantName} · Cardápio`;
  }, [restaurantName]);

  // Carregamento e erro usam a mesma tipografia e cores neutras do cardápio.
  if (status === 'loading') {
    return (
      <div className="min-h-dvh font-menu text-ink-muted">
        <Spinner label="Carregando cardápio..." />
      </div>
    );
  }

  if (status === 'error') {
    const message = errorMessage(error);
    return (
      <div className="min-h-dvh pt-10 font-menu text-ink">
        <StatusMessage
          tone="error"
          title={message.title}
          description={message.description}
          action={message.retry ? { label: 'Tentar novamente', onClick: reload } : undefined}
        />
      </div>
    );
  }

  const { categories } = menu;
  // Uma categoria por vez; se a escolhida deixar de existir após uma atualização, volta à primeira.
  const activeCategoryId = categories.some((category) => category.id === selectedCategoryId)
    ? selectedCategoryId
    : (categories[0]?.id ?? null);
  const searching = search.trim().length > 0;

  let sections;
  if (searching) {
    sections = filterMenuCategories(categories, { search });
  } else if (showingFavorites) {
    const favoriteProducts = categories
      .flatMap((category) => category.products)
      .filter((product) => favorites.has(product.id));
    sections = favoriteProducts.length
      ? [{ id: 'favoritos', name: 'Favoritos', products: favoriteProducts }]
      : [];
  } else {
    sections = filterMenuCategories(categories, { categoryId: activeCategoryId });
  }

  function selectCategory(categoryId) {
    setSelectedCategoryId(categoryId);
    setShowingFavorites(false);
    setSearch('');
    window.scrollTo({ top: 0 });
  }

  // Se o produto aberto ficar indisponível durante a consulta, o modal fecha sozinho.
  const openCategory = modalEnabled
    ? categories.find((category) => category.products.some((p) => p.id === openProductId))
    : undefined;
  const openProduct = openCategory?.products.find((p) => p.id === openProductId);

  let emptyMessage = null;
  if (categories.length === 0) {
    emptyMessage = {
      title: 'Cardápio vazio',
      description: 'Nenhum produto disponível no momento.',
    };
  } else if (sections.length === 0 && searching) {
    emptyMessage = {
      title: 'Nenhum produto encontrado',
      description: 'Tente outro termo de busca ou outra categoria.',
    };
  } else if (sections.length === 0 && showingFavorites) {
    emptyMessage = {
      title: 'Nenhum favorito ainda',
      description: 'Toque no coração de um prato para guardá-lo aqui.',
    };
  }

  return (
    <div
      style={getBrandStyle(menu.restaurant)}
      className="min-h-dvh bg-brand-soft font-menu text-ink"
    >
      <div className="sticky top-0 z-20 bg-brand-soft/95 pb-1 backdrop-blur">
        <MenuHeader
          restaurant={menu.restaurant}
          categories={categories}
          onSelectCategory={selectCategory}
          showingFavorites={showingFavorites}
          onToggleFavorites={() => {
            setShowingFavorites((value) => !value);
            setSearch('');
            window.scrollTo({ top: 0 });
          }}
        />
        <div className="space-y-4 px-5 pt-3 pb-1">
          <ProductSearch value={search} onChange={setSearch} />
          {categories.length > 0 && (
            <CategoryTabs
              categories={categories}
              selectedId={searching || showingFavorites ? null : activeCategoryId}
              onSelect={selectCategory}
            />
          )}
        </div>
      </div>

      <main className="px-5 pt-5 pb-8">
        {emptyMessage && (
          <StatusMessage title={emptyMessage.title} description={emptyMessage.description} />
        )}
        {sections.length > 0 && (
          <ProductList
            categories={sections}
            onSelectProduct={modalEnabled ? setOpenProductId : undefined}
            favorites={favorites}
            onToggleFavorite={toggleFavorite}
          />
        )}
      </main>

      {openProduct && (
        <ProductDetailsModal
          key={openProduct.id}
          product={openProduct}
          categoryName={openCategory.name}
          isFavorite={favorites.has(openProduct.id)}
          onToggleFavorite={toggleFavorite}
          onClose={() => setOpenProductId(null)}
        />
      )}
    </div>
  );
}
