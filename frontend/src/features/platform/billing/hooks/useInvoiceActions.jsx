import { useCallback, useState } from 'react';
import { ConfirmDialog } from '../../../../components/admin/Dialog.jsx';
import { useToast } from '../../../../components/admin/Toast.jsx';
import { formatPrice } from '../../../../utils/format-currency.js';
import { formatDate, formatMonth } from '../../../../utils/format-date.js';
import { RecordPaymentDialog } from '../components/RecordPaymentDialog.jsx';
import {
  cancelInvoice,
  recordPayment,
  reopenInvoice,
  voidPayment,
} from '../services/billing.service.js';
import { paymentMethodLabel } from '../utils/billing-labels.js';

const reasonField = (label, requiredMessage) => ({
  label,
  required: true,
  requiredMessage,
  hint: 'Fica registrado no histórico, com o seu nome e a data.',
});

/**
 * Ações de cobrança manual com as janelas de confirmação: registrar pagamento, estornar,
 * cancelar e reabrir. `open(tipo, alvo)` abre a janela; `dialogs` deve ser renderizado pela tela.
 * O alvo é uma mensalidade ou, para estorno, também um pagamento da lista de pagamentos.
 * `onChanged()` é chamado depois de cada alteração e quando a situação mudou por outra pessoa
 * (409), para a tela recarregar a lista.
 */
export function useInvoiceActions({ onChanged }) {
  const toast = useToast();
  const [dialog, setDialog] = useState(null);

  const open = useCallback((type, target) => setDialog({ type, target }), []);
  const close = useCallback(() => setDialog(null), []);

  async function run(action, successMessage) {
    try {
      await action();
    } catch (error) {
      if (error.status === 409) onChanged();
      throw error;
    }
    toast.success(successMessage);
    onChanged();
  }

  let dialogs = null;
  if (dialog) {
    const { type, target } = dialog;
    const invoice = target.invoice ?? target;
    const context = `${formatMonth(invoice.referenceMonth)} · ${target.restaurant.name}`;

    if (type === 'pay') {
      dialogs = (
        <RecordPaymentDialog
          invoice={target}
          onClose={close}
          onSubmit={(data, options) =>
            run(() => recordPayment(target.id, data, options), 'Pagamento registrado.')
          }
        />
      );
    } else if (type === 'void') {
      const payment = target.payment ?? target;
      dialogs = (
        <ConfirmDialog
          title="Estornar pagamento?"
          description={`${context}: ${formatPrice(payment.amount)} pago em ${formatDate(payment.paidOn)} (${paymentMethodLabel(payment.method)}). O registro continua no histórico como estornado e a mensalidade volta a ficar em aberto.`}
          confirmLabel="Estornar pagamento"
          cancelLabel="Voltar"
          reason={reasonField('Motivo do estorno', 'Informe o motivo do estorno.')}
          onConfirm={(reason) => run(() => voidPayment(payment.id, reason), 'Pagamento estornado.')}
          onClose={close}
        />
      );
    } else if (type === 'cancel') {
      dialogs = (
        <ConfirmDialog
          title="Cancelar mensalidade?"
          description={`${context}: ${formatPrice(target.amount)}. A mensalidade deixa de ser cobrada; ela pode ser reaberta depois.`}
          confirmLabel="Cancelar mensalidade"
          cancelLabel="Voltar"
          reason={reasonField('Motivo do cancelamento', 'Informe o motivo do cancelamento.')}
          onConfirm={(reason) =>
            run(() => cancelInvoice(target.id, reason), 'Mensalidade cancelada.')
          }
          onClose={close}
        />
      );
    } else if (type === 'reopen') {
      dialogs = (
        <ConfirmDialog
          title="Reabrir mensalidade?"
          description={`${context}: ${formatPrice(target.amount)}. A mensalidade volta a ficar em aberto para cobrança; o cancelamento anterior continua no histórico.`}
          confirmLabel="Reabrir mensalidade"
          cancelLabel="Voltar"
          tone="primary"
          reason={reasonField('Motivo da reabertura', 'Informe o motivo da reabertura.')}
          onConfirm={(reason) =>
            run(() => reopenInvoice(target.id, reason), 'Mensalidade reaberta.')
          }
          onClose={close}
        />
      );
    }
  }

  return { open, dialogs };
}
