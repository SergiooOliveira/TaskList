import { useId, useState } from 'react'
import { typeColor } from '../lib/typeColor'

type Option = { label: string; value: string }

// A text field that opens a searchable list of existing types; an unknown name offers "Create".
export default function TypePicker({ value, onChange, types, label = 'Type' }: {
  label?: string
  value: string
  onChange: (v: string) => void
  types: string[]
}) {
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)
  const listId = useId()

  const q = value.trim()
  const lower = q.toLowerCase()
  const options: Option[] = types.filter((t) => t.toLowerCase().includes(lower)).map((t) => ({ label: t, value: t }))
  if (q && !types.some((t) => t.toLowerCase() === lower)) options.push({ label: `Create “${q}”`, value: q })
  const shown = open && options.length > 0
  const pick = (o: Option) => { onChange(o.value); setOpen(false) }

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault()
      if (!open) return setOpen(true)
      const step = e.key === 'ArrowDown' ? 1 : -1
      setActive((a) => (a + step + options.length) % options.length)
    } else if (e.key === 'Enter' && shown) {
      e.preventDefault() // pick the option instead of submitting the form
      pick(options[Math.min(active, options.length - 1)])
    } else if (e.key === 'Escape' && shown) {
      e.preventDefault() // close the list, not the whole modal
      setOpen(false)
    }
  }

  return (
    <div className="picker">
      <label>
        {label}
        <input value={value} role="combobox" aria-expanded={shown} aria-controls={listId} aria-autocomplete="list"
          aria-activedescendant={shown ? `${listId}-${Math.min(active, options.length - 1)}` : undefined}
          placeholder="Search or create…" autoComplete="off"
          onChange={(e) => { onChange(e.target.value); setOpen(true); setActive(0) }}
          onFocus={() => { setOpen(true); setActive(0) }} onBlur={() => setOpen(false)} onKeyDown={onKeyDown} />
      </label>
      {shown && (
        <ul id={listId} role="listbox" aria-label="Types">
          {options.map((o, i) => (
            // mousedown keeps focus in the input, so blur doesn't close the list before the click lands
            <li key={o.label} id={`${listId}-${i}`} role="option" aria-selected={i === Math.min(active, options.length - 1)}
              className={o.label === o.value ? undefined : 'create'}
              onMouseDown={(e) => e.preventDefault()} onClick={() => pick(o)} onMouseEnter={() => setActive(i)}>
              <span className="dot" aria-hidden="true" style={{ '--c': typeColor(o.value) } as React.CSSProperties} />
              {o.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
