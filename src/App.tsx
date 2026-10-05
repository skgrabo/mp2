import { useState, type FormEvent } from 'react'
import { searchArtworks, type Artwork } from './services/artic'
import './App.css'

function App() {
  const [query, setQuery] = useState('')
  const [artworks, setArtworks] = useState<Artwork[]>([])
  const [hasSearched, setHasSearched] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const searchTerm = query.trim()
    if (!searchTerm) return

    setIsLoading(true)
    setError('')
    setHasSearched(true)

    try {
      setArtworks(await searchArtworks(searchTerm))
    } catch {
      setArtworks([])
      setError('We could not load artworks. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="gallery">
      <header className="site-header">
        <a className="wordmark" href="https://www.artic.edu/" target="_blank" rel="noreferrer">
          <span className="wordmark-mark" aria-hidden="true">: )</span>
          <span>Sara's Art Institute<br />Exploration Website</span>
        </a>
      </header>

      <section className="intro" aria-labelledby="page-title">
        <p className="eyebrow">Explore the collection</p>
        <h1 id="page-title">Welcome to the virtual Art Institute</h1>
        <p className="intro-copy">
          Discover artwork from the Art Institute of Chicago.
        </p>
        <form className="search-form" onSubmit={handleSearch}>
          <label className="visually-hidden" htmlFor="artwork-search">Search artworks</label>
          <input
            id="artwork-search"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Try my favorite piece: 'Nighthawks'"
            required
          />
          <button type="submit" disabled={isLoading}>
            {isLoading ? 'Searching…' : 'Search'}
          </button>
        </form>
        <p className="search-note">Powered by the Art Institute of Chicago public API</p>
      </section>

      <section className="results-section" aria-labelledby="results-title" aria-live="polite">
        <div className="section-heading">
          <div>
            {/* <p className="eyebrow">Header for the next section</p> */}
            <h2 id="results-title">{hasSearched ? 'Search results' : 'Start exploring'}</h2>
          </div>
          {artworks.length > 0 && <span className="result-count">{artworks.length} artworks</span>}
        </div>

        {isLoading && <p className="status-message">Looking through the collection…</p>}
        {!isLoading && error && <p className="status-message error" role="alert">{error}</p>}
        {!isLoading && !error && hasSearched && artworks.length === 0 && (
          <p className="status-message">No artworks found. Try another search.</p>
        )}
        {!hasSearched && (
          <p className="status-message">Search above to find art in the collection.</p>
        )}

        {artworks.length > 0 && (
          <div className="artwork-grid">
            {artworks.map((artwork) => (
              <article className="artwork-card" key={artwork.id}>
                <a
                  className="artwork-image-link"
                  href={artwork.api_link}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={`View ${artwork.title} in the Art Institute collection`}
                >
                  {artwork.image_id ? (
                    <img
                      src={`${artwork.iiifUrl}/${artwork.image_id}/full/843,/0/default.jpg`}
                      alt={artwork.thumbnail?.alt_text || artwork.title}
                      loading="lazy"
                    />
                  ) : (
                    <span className="image-placeholder">Image not available</span>
                  )}
                </a>
                <div className="artwork-details">
                  <h3>{artwork.title}</h3>
                  <p>{artwork.artist_title || 'Artist unknown'}</p>
                  {artwork.date_display && <span>{artwork.date_display}</span>}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <footer className="site-footer">
        <span>Artwork data courtesy of the Art Institute of Chicago.</span>
        <a href="https://api.artic.edu/docs/" target="_blank" rel="noreferrer">API documentation</a>
      </footer>
    </main>
  )
}

export default App
