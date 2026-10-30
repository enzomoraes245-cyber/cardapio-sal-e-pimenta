import { Component } from 'react';
import { ErrorState } from './States.jsx';

/**
 * Falha inesperada ao desenhar uma página administrativa: mostra a mensagem dentro da estrutura
 * (menu continua disponível) em vez de derrubar a área inteira.
 */
export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error) {
    console.error(error);
  }

  render() {
    if (this.state.error) {
      return (
        <ErrorState
          title="Algo deu errado nesta página"
          error={{ message: 'Recarregue a página para tentar novamente.' }}
          onRetry={() => window.location.reload()}
        />
      );
    }
    return this.props.children;
  }
}
