import { useEffect, useRef, type PointerEvent, type ReactNode } from 'react'

const CLOSE_PX = 80, FLICK_PX = 20, FLICK_PX_PER_MS = 0.6

// Bottom-sheet modal: Esc (native cancel), the backdrop, ✕, a link inside, a route change and dragging the grip/header down all close it.
export default function Sheet({ label, onClose, children }: { label: string; onClose: () => void; children: ReactNode }) {
  const dialog = useRef<HTMLDialogElement>(null)
  const drag = useRef<{ y: number; t: number; dy: number } | null>(null)
  const dragged = useRef(false) // the click that ends a drag lands on the dialog; it is not a backdrop tap
  const close = useRef(onClose)
  close.current = onClose
  useEffect(() => dialog.current?.showModal(), [])
  useEffect(() => {
    const onHash = () => close.current()
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  const move = (dy: number, dragging: boolean) => {
    const d = dialog.current!
    d.classList.toggle('dragging', dragging)
    d.style.transform = dy > 0 ? `translateY(${dy}px)` : ''
  }
  const down = (e: PointerEvent) => {
    dragged.current = false // a touch drag may end without a click; don't swallow the next real tap
    const t = e.target as Element
    if (!t.closest('.grip, .sheet-head') || t.closest('button')) return
    drag.current = { y: e.clientY, t: performance.now(), dy: 0 }
    ;(e.currentTarget as Element).setPointerCapture?.(e.pointerId)
  }
  const moving = (e: PointerEvent) => {
    if (!drag.current) return
    drag.current.dy = Math.max(0, e.clientY - drag.current.y)
    move(drag.current.dy, true)
  }
  const up = () => {
    const d = drag.current
    if (!d) return
    drag.current = null
    dragged.current = d.dy > 0
    const fast = d.dy > FLICK_PX && d.dy / Math.max(1, performance.now() - d.t) > FLICK_PX_PER_MS
    if (d.dy > CLOSE_PX || fast) onClose()
    else move(0, false) // springs back via the CSS transition (none under reduced motion)
  }

  return (
    <dialog ref={dialog} className="sheet" aria-label={label} onClose={onClose}
      onClick={(e) => {
        if (dragged.current) { dragged.current = false; return }
        if (e.target === e.currentTarget || (e.target as Element).closest('a[href]')) onClose()
      }}
      onPointerDown={down} onPointerMove={moving} onPointerUp={up} onPointerCancel={up}>
      <div className="grip" aria-hidden="true" />
      {children}
    </dialog>
  )
}

export const SheetHead = ({ title, sub, onClose }: { title: string; sub: string; onClose: () => void }) => (
  <div className="sheet-head">
    <div><div className="sheet-title">{title}</div><div className="sheet-sub">{sub}</div></div>
    <button type="button" className="sheet-x" aria-label="Close" onClick={onClose}>✕</button>
  </div>
)
