export default function Spinner({ message = 'Cargando...' }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-4">
      <div
        className="w-8 h-8 rounded-full border-2 border-border border-t-brand"
        style={{ animation: 'spin 0.7s linear infinite' }}
      />
      <p className="text-sm text-ink-3">{message}</p>
    </div>
  )
}
