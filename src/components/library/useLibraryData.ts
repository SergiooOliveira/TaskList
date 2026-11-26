import { useCallback, useEffect, useState } from 'react'
import { listItems, type Item } from '../../lib/items'
import { listReads, type Read } from '../../lib/reads'

// Items + reads for the library screens, with local patching after a write and a short-lived error line.
export function useLibraryData() {
  const [data, setData] = useState<{ items: Item[]; reads: Read[] } | null>(null)
  const [failed, setFailed] = useState(false)
  const [error, setError] = useState('')

  const load = useCallback(() => {
    setFailed(false)
    Promise.all([listItems(), listReads()]).then(([items, reads]) => setData({ items, reads }), () => setFailed(true))
  }, [])
  useEffect(load, [load])

  const fail = (e: unknown) => {
    setError(e instanceof Error ? e.message : 'Something went wrong.')
    setTimeout(() => setError(''), 4000)
  }
  const saveRead = (r: Read) => setData((d) => d && { ...d, reads: [...d.reads.filter((x) => x.id !== r.id), r] })
  const saveItems = (us: Item[]) => setData((d) => d && { ...d, items: d.items.map((x) => us.find((u) => u.id === x.id) ?? x) })
  return { data, failed, error, load, fail, saveRead, saveItems }
}
