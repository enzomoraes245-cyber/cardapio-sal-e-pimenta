import { useEffect, useState } from 'react';
import { useParams } from 'react-router';
import { Spinner } from '../../../components/ui/Spinner.jsx';
import { StatusMessage } from '../../../components/ui/StatusMessage.jsx';
import { getBrandStyle } from '../../customization/utils/brand-style.js';
import { CategoryTabs } from '../components/CategoryTabs.jsx';
import { MenuHeader } from '../components/MenuHeader.jsx';
import { ProductList } from '../components/ProductList.jsx';
import { ProductSearch } from '../components/ProductSearch.jsx';
import { useMenuEvents } from '../hooks/useMenuEvents.js';
import { usePublicMenu } from '../hooks/usePublicMenu.js';
import { filterMenuCategories } from '../utils/filter-menu.js';

export function PublicMenuPage() {
  const { slug } = useParams();
  const { status, menu, error, reload } = usePublicMenu(slug);
  useMenuEvents(slug, reload, { enabled: status === 'success' });

  // Busca e categoria ficam fora dos dados do cardápio e sobrevivem às atualizações em tempo real.
  const [search, setSearch] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState(null);

  const restaurantName = menu?.restaurant.name;
  useEffect(() => {
    if (restaurantName) document.title = `${restaurantName} · Cardápio`;
  }, [restaurantName]);

  if (status === 'loading') return <Spinner label="Carregando cardápio..." />;

  if (status === 'error') {
    const notFound = error.status === 404 || error.status === 400;
    return (
      <StatusMessage
        tone="error"
        title={notFound ? 'Cardápio não encontrado' : 'Não foi possível carregar o cardápio'}
        description={
          notFound
            ? 'Confira o QR Code ou o endereço acessado.'
            : 'Verifique sua conexão e tente novamente.'
        }
        action={notFound ? undefined : { label: 'Tentar novamente', onClick: reload }}
      />
    );
  }

  const categories = menu.categories.filter((category) => category.products.length > 0);
  // Se a categoria selecionada deixar de existir após uma atualização, volta para "Todas".
  const activeCategoryId = categories.some((category) => category.id === selectedCategoryId)
    ? selectedCategoryId
    : null;
  const visibleCategories = filterMenuCategories(categories, {
    search,
    categoryId: activeCategoryId,
  });

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
        {visibleCategories.length > 0 && <ProductList categories={visibleCategories} />}
      </main>
    </div>
  );
}
