import { Search, X } from 'lucide-react'

export default function SearchInput({
  value, onChange, placeholder = 'Buscar...', onClear, className = ''
}) {
  return (
    <div className={`relative flex items-center ${className}`}>
      <Search size={14} className="absolute left-3 text-ink-3 pointer-events-none" />
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-8 pr-8 py-2 bg-surface border border-border rounded-md text-sm text-ink placeholder:text-ink-3 outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all duration-150"
      />
      {value && (
        <button
          type="button"
          onClick={onClear}
          className="absolute right-2.5 p-0.5 text-ink-3 hover:text-ink-2 transition-colors"
        >
          <X size={13} />
        </button>
      )}
    </div>
  )
}
