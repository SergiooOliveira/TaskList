import type { Candidate, LookupError } from '../../lib/googleBooks'

// Google Books results under the title: a reason on failure, a hint when empty, else tappable matches with thumbnails.
export default function BookMatches({ found, onPick }: { found: Candidate[] | LookupError; onPick: (c: Candidate) => void }) {
  if ('ok' in found) return <p>Couldn't reach Google Books ({found.reason}). Fill in the details yourself.</p>
  if (found.length === 0) return <p>No matches. Fill in the details yourself.</p>
  return (
    <ul className="candidates" aria-label="Matches">
      {found.map((c, i) => (
        <li key={i}><button type="button" onClick={() => onPick(c)}>
          {c.cover ? <img src={c.cover} alt="" /> : <span className="nocover">No cover</span>}
          <span>{c.title}{c.authors.length > 0 && ` · ${c.authors.join(', ')}`}{c.year && ` · ${c.year}`}</span>
        </button></li>
      ))}
    </ul>
  )
}
