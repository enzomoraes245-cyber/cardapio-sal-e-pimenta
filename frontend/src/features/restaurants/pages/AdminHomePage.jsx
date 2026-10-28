import { Link } from 'react-router';
import { ApiStatus } from '../../../components/shared/ApiStatus.jsx';

/** Página inicial provisória da retaguarda: valida a comunicação com a API. */
export function AdminHomePage() {
  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Retaguarda</h1>
        <p className="mt-1 text-slate-600">
          Fundação do projeto. Login e cadastros serão implementados nas próximas etapas.
        </p>
      </div>

      <ApiStatus />

      <p className="text-sm text-slate-600">
        Após executar o seed, o cardápio de demonstração fica disponível em{' '}
        <Link to="/cardapio/demo" className="font-medium text-orange-800 underline">
          /cardapio/demo
        </Link>
        .
      </p>
    </section>
  );
}
