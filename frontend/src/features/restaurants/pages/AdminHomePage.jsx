import { Link } from 'react-router';
import { useSession } from '../../auth/hooks/useSession.js';

const SHORTCUTS = [
  {
    to: '/admin/categorias',
    title: 'Categorias',
    text: 'Cadastre e ordene as seções do cardápio.',
  },
  { to: '/admin/produtos', title: 'Produtos', text: 'Preços, fotos, ordem e disponibilidade.' },
  {
    to: '/admin/personalizacao',
    title: 'Personalização',
    text: 'Nome, logotipo e cores.',
    feature: 'customization',
  },
  {
    to: '/admin/qrcode',
    title: 'QR Code',
    text: 'Baixe o QR Code do cardápio.',
    feature: 'qrcode',
  },
];

export function AdminHomePage() {
  const { admin, restaurant, features } = useSession();
  const shortcuts = SHORTCUTS.filter((item) => !item.feature || features?.[item.feature] !== false);

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Olá, {admin.name}</h1>
        <p className="mt-1 text-slate-600">
          Cardápio público:{' '}
          <a
            href={`/cardapio/${restaurant.slug}`}
            target="_blank"
            rel="noreferrer"
            className="font-medium text-slate-900 underline"
          >
            /cardapio/{restaurant.slug}
          </a>
        </p>
      </div>

      <ul className="grid gap-3 sm:grid-cols-2">
        {shortcuts.map((item) => (
          <li key={item.to}>
            <Link
              to={item.to}
              className="block rounded-xl border border-slate-200 bg-white p-4 hover:border-slate-400"
            >
              <span className="font-medium text-slate-900">{item.title}</span>
              <span className="mt-1 block text-sm text-slate-600">{item.text}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
