import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'

export default function FormInput({
  label,
  type = 'text',
  value,
  onChange,
  required,
  autoComplete,
  error,
}) {
  const [showPwd, setShowPwd] = useState(false)
  const [focused, setFocused] = useState(false)
  const isPwd = type === 'password'
  const inputType = isPwd ? (showPwd ? 'text' : 'password') : type
  const floated = focused || value

  return (
    <div className="relative">
      <label
        className={[
          'absolute left-3 transition-all duration-150 pointer-events-none z-10',
          floated
            ? 'top-1.5 text-[11px] text-ink-3 font-medium'
            : 'top-1/2 -translate-y-1/2 text-sm text-ink-3',
        ].join(' ')}
      >
        {label}
        {required && <span className="text-danger ml-0.5">*</span>}
      </label>
      <input
        type={inputType}
        value={value}
        onChange={e => onChange(e.target.value)}
        required={required}
        autoComplete={autoComplete}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        className={[
          'w-full pt-5 pb-2 px-3 bg-surface border rounded-md text-sm text-ink outline-none transition-all duration-150',
          isPwd ? 'pr-10' : '',
          error
            ? 'border-danger-border focus:ring-2 focus:ring-danger/20 focus:border-danger'
            : 'border-border focus:ring-2 focus:ring-brand/20 focus:border-brand',
        ].join(' ')}
      />
      {isPwd && (
        <button
          type="button"
          onClick={() => setShowPwd(s => !s)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-3 hover:text-ink-2 transition-colors"
        >
          {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      )}
      {error && <p className="mt-1 text-xs text-danger">{error}</p>}
    </div>
  )
}
