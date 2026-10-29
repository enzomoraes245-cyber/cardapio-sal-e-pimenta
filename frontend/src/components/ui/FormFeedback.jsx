/** Mensagem de sucesso (role=status) ou erro (role=alert) após enviar um formulário. */
export function FormFeedback({ feedback }) {
  if (!feedback) return null;
  const isError = feedback.tone === 'error';
  return (
    <p
      role={isError ? 'alert' : 'status'}
      className={`rounded-lg px-3 py-2 text-sm ${
        isError ? 'bg-red-50 text-red-800' : 'bg-emerald-50 text-emerald-800'
      }`}
    >
      {feedback.message}
    </p>
  );
}
