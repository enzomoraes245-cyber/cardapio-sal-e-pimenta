import { Link } from 'react-router';
import { ReorderButtons } from '../../../components/ui/ReorderButtons.jsx';
import { formatPrice } from '../../../utils/format-currency.js';

/** Linha de produto na retaguarda. `statusControls` é renderizado ao lado (MOD-04). */
export function ProductListItem({ product, isFirst, isLast, reordering, onMove, statusControls }) {
  return (
    <li className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-white p-3">
      <img
        src={product.imageUrl}
        alt=""
        className="size-14 shrink-0 rounded-lg border border-slate-100 object-cover"
      />
      <div className="min-w-0 flex-1">
        <Link
          to={`/admin/produtos/${product.id}`}
          className="font-medium text-slate-900 hover:underline"
        >
          {product.name}
        </Link>
        <p className="text-sm text-slate-600">{formatPrice(product.price)}</p>
      </div>
      {statusControls}
      <ReorderButtons
        label={product.name}
        isFirst={isFirst}
        isLast={isLast}
        disabled={reordering}
        onMove={onMove}
      />
    </li>
  );
}
