export default function Tabs({ tabs, active, onChange }) {
  return (
    <div className="border-b border-border">
      <nav className="flex" role="tablist">
        {tabs.map(tab => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={active === tab.id}
            onClick={() => onChange(tab.id)}
            className={[
              'px-4 py-2.5 text-sm font-medium border-b-2 transition-all duration-150 whitespace-nowrap',
              active === tab.id
                ? 'border-brand text-brand'
                : 'border-transparent text-ink-2 hover:text-ink hover:border-border-strong',
            ].join(' ')}
          >
            {tab.label}
          </button>
        ))}
      </nav>
    </div>
  )
}
