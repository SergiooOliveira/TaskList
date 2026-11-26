import { useState } from 'react'
import { boughtPatch, formatEuro, updateItem, type Item } from '../../lib/items'
import { todayISO } from '../../lib/reads'
import type { MangaSeries } from '../../lib/library'
import { sumCents } from './MangaRow'
import Sheet, { SheetHead } from './Sheet'

type Props = { series: MangaSeries; onClose: () => void; onMoved: (moved: Item[]) => void; onError?: (e: unknown) => void }

export default function VolumePanel({ series, onClose, onMoved, onError }: Props) {
  const [ticked, setTicked] = useState<Set<string>>(new Set())
  const [busy, setBusy] = useState(false)
  const wanted = series.wanted
  const picked = wanted.filter((i) => ticked.has(i.id)) // ids that already moved drop out
  const toggle = (id: string) => setTicked((t) => { const n = new Set(t); n.has(id) ? n.delete(id) : n.add(id); return n })

  const move = async () => {
    setBusy(true)
    const moved: Item[] = []
    try {
      for (const i of picked) moved.push(await updateItem(i.id, boughtPatch(true, todayISO())))
    } catch (e) {
      onError?.(e)
    }
    if (moved.length) onMoved(moved)
    setBusy(false)
    if (moved.length === picked.length) onClose()
  }

  const n = wanted.length
  return (
    <Sheet label={`${series.name} · choose bought volumes`} onClose={onClose}>
      <SheetHead title={series.name} sub={`${n} wanted volume${n === 1 ? '' : 's'} · tick the ones you bought`} onClose={onClose} />
      <div className="sheet-sel">
        <span>Volume</span>
        <button type="button" className="linkish" onClick={() => setTicked(new Set(wanted.map((i) => i.id)))}>Select all</button>
      </div>
      <div className="sheet-list">
        {wanted.map((i) => (
          <label key={i.id} className="vol">
            <span className="num">{i.series_number ?? '–'}</span>
            <span className="vt">{i.title}</span>
            <span className="vp">{i.price_cents !== null ? formatEuro(i.price_cents) : ''}</span>
            <input type="checkbox" checked={ticked.has(i.id)} onChange={() => toggle(i.id)} />
          </label>
        ))}
      </div>
      <div className="sheet-foot">
        <button type="button" className="primary" disabled={busy || picked.length === 0} onClick={move}>
          Move {picked.length} to shelf · {formatEuro(sumCents(picked))}
        </button>
      </div>
    </Sheet>
  )
}
