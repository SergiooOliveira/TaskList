import { useState } from 'react'
import type { Candidate, LookupError } from '../../lib/googleBooks'

// Search results under the title: a reason on failure, a hint when empty, else tappable matches with thumbnails.
export default function BookMatches({ found, onPick }: { found: Candidate[] | LookupError; onPick: (c: Candidate) => void }) {
  const [broken, setBroken] = useState<Set<string>>(new Set()) // cover URLs that failed to load: shown as "No cover", never picked
  if ('ok' in found) return <p>Couldn't reach the book search ({found.reason}). Fill in the details yourself.</p>
  if (found.length === 0) return <p>No matches. Fill in the details yourself.</p>
  const cover = (c: Candidate) => c.cover && !broken.has(c.cover) ? c.cover : null
  return (
    <ul className="candidates" aria-label="Matches">
      {found.map((c, i) => (
        <li key={i}><button type="button" onClick={() => onPick({ ...c, cover: cover(c) })}>
          {cover(c) ? <img src={cover(c)!} alt="" onError={() => setBroken((b) => new Set(b).add(c.cover!))} /> : <span className="nocover">No cover</span>}
          <span>{c.title || '(no title)'}{c.authors.length > 0 && ` · ${c.authors.join(', ')}`}{c.year && ` · ${c.year}`}</span>
        </button></li>
      ))}
    </ul>
  )
}
