import { Link } from 'react-router';
import { Badge } from '../../../components/admin/Badge.jsx';
import { ImageIcon, PencilIcon } from '../../../components/admin/icons.jsx';
import { ReorderButtons } from '../../../components/admin/ReorderButtons.jsx';
import { formatPrice } from '../../../utils/format-currency.js';
import { ProductStatusToggles } from '../../availability/components/ProductStatusToggles.jsx';
import { publicationStatus } from '../utils/publication.js';

/**
 * Linha da lista de produtos: foto, nome, preço e situação no cardápio, com os interruptores de
 * situação, edição e (sem filtros ativos) a ordem dentro da categoria.
 */
export function ProductListItem({ product, saving, onToggle, reorder }) {
  const status = publicationStatus(product);
  return (
    // Em linha só a partir de 1280 px: abaixo disso os interruptores descem e o nome tem espaço.
    <li className="flex flex-col gap-4 px-5 py-4 sm:px-6 xl:flex-row xl:items-center">
      <div className="flex min-w-0 flex-1 items-center gap-4">
        <div className="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-admin-control border border-admin-line bg-admin-subtle text-admin-faint">
          {product.imageUrl ? (
            <img src={product.imageUrl} alt="" loading="lazy" className="size-full object-cover" />
          ) : (
            <ImageIcon size={20} />
          )}
        </div>
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <Link
              to={`/admin/produtos/${product.id}`}
              className="line-clamp-2 font-medium break-words text-admin-text hover:text-admin-accent focus-visible:outline-2 focus-visible:outline-admin-accent"
            >
              {product.name}
            </Link>
            <Badge tone={status.tone}>{status.label}</Badge>
          </div>
          {product.shortDescription && (
            <p className="truncate text-[13px] text-admin-muted">{product.shortDescription}</p>
          )}
        </div>
        <p className="shrink-0 text-sm font-semibold text-admin-text tabular-nums">
          {formatPrice(product.price)}
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 xl:justify-end">
        <ProductStatusToggles
          product={product}
          disabled={saving}
          onChange={(field, value) => onToggle(product, field, value)}
        />
        <div className="flex items-center gap-1">
          <Link
            to={`/admin/produtos/${product.id}`}
            aria-label={`Editar ${product.name}`}
            title="Editar"
            className="inline-flex size-8 items-center justify-center rounded-admin-control text-admin-muted transition-colors hover:bg-admin-neutral-soft hover:text-admin-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-admin-accent"
          >
            <PencilIcon size={16} />
          </Link>
          {reorder && (
            <ReorderButtons
              label={product.name}
              isFirst={reorder.isFirst}
              isLast={reorder.isLast}
              disabled={reorder.disabled}
              onMove={reorder.onMove}
            />
          )}
        </div>
      </div>
    </li>
  );
}
