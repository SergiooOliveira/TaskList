import { useEffect, useRef, type ReactNode } from 'react'

// Bottom-sheet modal: Esc (native cancel), the backdrop and ✕ all close it without saving.
export default function Sheet({ label, onClose, children }: { label: string; onClose: () => void; children: ReactNode }) {
  const dialog = useRef<HTMLDialogElement>(null)
  useEffect(() => dialog.current?.showModal(), [])
  return (
    <dialog ref={dialog} className="sheet" aria-label={label} onClose={onClose}
      onClick={(e) => e.target === e.currentTarget && onClose()}>
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
