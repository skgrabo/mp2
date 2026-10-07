import { useEffect, useState, type FormEvent } from 'react'
import {
  getDepartmentArtworks,
  getDepartments,
  searchArtworks,
  type Artwork,
  type Department,
} from './services/artic'
import './App.css'

type SortMode = 'relevance' | 'alphabetical'
type SortDirection = 'ascending' | 'descending'
type ViewMode = 'search' | 'departments'

function App() {
  const [query, setQuery] = useState('')
  const [artworks, setArtworks] = useState<Artwork[]>([])
  const [departmentArtworks, setDepartmentArtworks] = useState<Artwork[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null)
  const [activeView, setActiveView] = useState<ViewMode>('search')
  const [sortMode, setSortMode] = useState<SortMode>('relevance')
  const [sortDirection, setSortDirection] = useState<SortDirection>('descending')
  const [departmentPage, setDepartmentPage] = useState(1)
  const [departmentHasMore, setDepartmentHasMore] = useState(false)
  const [searchImmediately, setSearchImmediately] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [isLoadingDepartments, setIsLoadingDepartments] = useState(false)
  const [isLoadingDepartmentArtworks, setIsLoadingDepartmentArtworks] = useState(false)
  const [departmentError, setDepartmentError] = useState('')
  const [selectedArtwork, setSelectedArtwork] = useState<Artwork | null>(null)

  useEffect(() => {
    if (!selectedArtwork) return

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setSelectedArtwork(null)
    }

    document.addEventListener('keydown', handleKeyDown)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [selectedArtwork])

  const displayedArtworks = activeView === 'search' ? artworks : departmentArtworks
  const sortedArtworks = [...displayedArtworks]
  if (sortMode === 'alphabetical') {
    sortedArtworks.sort((left, right) =>
      left.title.localeCompare(right.title, undefined, { sensitivity: 'base' }),
    )
  }
  if (sortDirection === 'ascending') sortedArtworks.reverse()

  const selectedArtworkIndex = selectedArtwork
    ? sortedArtworks.findIndex((artwork) => artwork.id === selectedArtwork.id)
    : -1

  useEffect(() => {
    if (activeView !== 'search') {
      setIsLoading(false)
      return
    }

    const searchTerm = query.trim()
    if (!searchTerm) {
      setArtworks([])
      setHasSearched(false)
      setIsLoading(false)
      setError('')
      return
    }

    const controller = new AbortController()
    const timeoutId = window.setTimeout(async () => {
      setIsLoading(true)
      setError('')
      setHasSearched(true)

      try {
        setArtworks(await searchArtworks(searchTerm, controller.signal))
      } catch {
        if (!controller.signal.aborted) {
          setArtworks([])
          setError('We could not load artworks. Please try again.')
        }
      } finally {
        if (!controller.signal.aborted) setIsLoading(false)
      }
    }, searchImmediately ? 0 : 300)

    return () => {
      window.clearTimeout(timeoutId)
      controller.abort()
    }
  }, [activeView, query, searchImmediately])

  useEffect(() => {
    if (activeView !== 'departments' || departments.length > 0) return

    const controller = new AbortController()
    setIsLoadingDepartments(true)
    getDepartments(controller.signal)
      .then(setDepartments)
      .catch(() => {
        if (!controller.signal.aborted) {
          setDepartmentError('We could not load departments. Please try again.')
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoadingDepartments(false)
      })

    return () => controller.abort()
  }, [activeView, departments.length])

  useEffect(() => {
    if (activeView !== 'departments' || !selectedDepartment) {
      setIsLoadingDepartmentArtworks(false)
      return
    }

    const controller = new AbortController()
    setIsLoadingDepartmentArtworks(true)
    setDepartmentError('')
    getDepartmentArtworks(selectedDepartment.title, departmentPage, controller.signal)
      .then(({ artworks: pageArtworks, hasMore }) => {
        setDepartmentArtworks((current) =>
          departmentPage === 1 ? pageArtworks : [...current, ...pageArtworks],
        )
        setDepartmentHasMore(hasMore)
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          setDepartmentError('We could not load these artworks. Please try again.')
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoadingDepartmentArtworks(false)
      })

    return () => controller.abort()
  }, [activeView, departmentPage, selectedDepartment])

  async function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (query.trim()) setSearchImmediately(true)
  }

  function selectDepartment(department: Department) {
    setSelectedDepartment(department)
    setDepartmentArtworks([])
    setDepartmentPage(1)
    setDepartmentHasMore(false)
    setDepartmentError('')
  }

  function switchView(view: ViewMode) {
    setActiveView(view)
    if (view === 'search') setDepartmentPage(1)
  }

  return (
    <main className="gallery">
      <header className="site-header">
        <h3>Sara's Art Institute Exploration Website</h3>
      </header>

      <section className="intro" aria-labelledby="page-title">
        <h1 id="page-title">Welcome to the Virtual Art Institute</h1>
        <p className="intro-copy">
          Discover artwork from the Art Institute of Chicago.
        </p>
        <div className="view-switch" role="tablist" aria-label="Collection views">
          <button
            id="search-tab"
            type="button"
            role="tab"
            aria-selected={activeView === 'search'}
            aria-controls="collection-panel"
            onClick={() => switchView('search')}
          >
            Search Artworks
          </button>
          <button
            id="departments-tab"
            type="button"
            role="tab"
            aria-selected={activeView === 'departments'}
            aria-controls="collection-panel"
            onClick={() => switchView('departments')}
          >
            Department Gallery
          </button>
        </div>
        {activeView === 'search' && (
          <>
            <form className="search-form" onSubmit={handleSearch}>
              <label className="visually-hidden" htmlFor="artwork-search">Search artworks</label>
              <input
                id="artwork-search"
                type="search"
                value={query}
                onChange={(event) => {
                  setSearchImmediately(false)
                  setQuery(event.target.value)
                }}
                placeholder="Try my favorite piece: 'Nighthawks'"
                required
              />
              <button type="submit" disabled={isLoading}>
                {isLoading ? 'Searching…' : 'Search'}
              </button>
            </form>
          </>
        )}
      </section>

      <section id="collection-panel" className="collection-panel" role="tabpanel" aria-labelledby={`${activeView}-tab`}>
        {activeView === 'departments' && (
          <nav className="department-browser" aria-labelledby="departments-title">
            <h2 id="departments-title">Departments</h2>
            {isLoadingDepartments && <p className="status-message">Loading departments…</p>}
            {!isLoadingDepartments && departmentError && (
              <p className="status-message error" role="alert">{departmentError}</p>
            )}
            <div className="department-list">
              {departments.map((department) => (
                <button
                  className="department-button"
                  type="button"
                  key={department.id}
                  aria-pressed={selectedDepartment?.id === department.id}
                  onClick={() => selectDepartment(department)}
                >
                  {department.title}
                </button>
              ))}
            </div>
          </nav>
        )}

        <section className="results-section" aria-labelledby="results-title" aria-live="polite">
        <div className="section-heading">
          <div>
            <h2 id="results-title">
              {activeView === 'search'
                ? hasSearched ? 'Search results' : ' '
                : selectedDepartment?.title || ' '}
            </h2>
          </div>
          {displayedArtworks.length > 0 && (
            <div className="results-tools">
              <span className="result-count">{displayedArtworks.length} artworks</span>
              <label className="visually-hidden" htmlFor="sort-mode">Sort results</label>
              <select
                id="sort-mode"
                className="sort-select"
                value={sortMode}
                onChange={(event) => setSortMode(event.target.value as SortMode)}
              >
                <option value="relevance">Relevance</option>
                <option value="alphabetical">Alphabetical</option>
              </select>
              <button
                className="sort-direction"
                type="button"
                aria-label={`Switch to ${sortDirection === 'ascending' ? 'descending' : 'ascending'} order`}
                onClick={() => setSortDirection(sortDirection === 'ascending' ? 'descending' : 'ascending')}
              >
                {sortDirection === 'ascending' ? '↑ Ascending' : '↓ Descending'}
              </button>
            </div>
          )}
        </div>

        {activeView === 'search' && isLoading && (
          <p className="status-message">Looking through the collection…</p>
        )}
        {activeView === 'search' && !isLoading && error && (
          <p className="status-message error" role="alert">{error}</p>
        )}
        {activeView === 'search' && !isLoading && !error && hasSearched && artworks.length === 0 && (
          <p className="status-message">No artworks found. Try another search.</p>
        )}
        {activeView === 'search' && !hasSearched && (
          <p className="status-message">Search above to find art in the collection or view the department gallery.</p>
        )}
        {activeView === 'departments' && isLoadingDepartmentArtworks && departmentArtworks.length === 0 && (
          <p className="status-message">Loading department artworks…</p>
        )}
        {activeView === 'departments' && !isLoadingDepartmentArtworks && departmentError && (
          <p className="status-message error" role="alert">{departmentError}</p>
        )}
        {activeView === 'departments' && !selectedDepartment && !isLoadingDepartments && (
          <p className="status-message">Choose a department to browse its artworks.</p>
        )}
        {activeView === 'departments' && selectedDepartment && !isLoadingDepartmentArtworks &&
          !departmentError && departmentArtworks.length === 0 && (
            <p className="status-message">No artworks found in this department.</p>
          )}

        {displayedArtworks.length > 0 && (
          <div className="artwork-grid">
            {sortedArtworks.map((artwork) => (
              <article className="artwork-card" key={artwork.id}>
                <button
                  className="artwork-image-link"
                  type="button"
                  aria-label={`Enlarge ${artwork.title}`}
                  onClick={() => setSelectedArtwork(artwork)}
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
                </button>
                <div className="artwork-details">
                  <h3>{artwork.title}</h3>
                  <p>{artwork.artist_title || 'Artist unknown'}</p>
                  {artwork.date_display && <span>{artwork.date_display}</span>}
                </div>
              </article>
            ))}
          </div>
        )}
        {activeView === 'departments' && departmentHasMore && (
          <button
            className="load-more-button"
            type="button"
            disabled={isLoadingDepartmentArtworks}
            onClick={() => setDepartmentPage((page) => page + 1)}
          >
            {isLoadingDepartmentArtworks ? 'Loading…' : 'Load more artworks'}
          </button>
        )}
        </section>
      </section>

      {selectedArtwork?.image_id && (
        <div
          className="artwork-modal-backdrop"
          role="presentation"
          onClick={(event) => {
            if (event.target === event.currentTarget) setSelectedArtwork(null)
          }}
        >
          <section
            className="artwork-modal"
            role="dialog"
            aria-modal="true"
            aria-label={`${selectedArtwork.title} image`}
          >
            <button
              className="artwork-modal-close"
              type="button"
              aria-label="Close image"
              onClick={() => setSelectedArtwork(null)}
            >
              ×
            </button>
            <img
              src={`${selectedArtwork.iiifUrl}/${selectedArtwork.image_id}/full/!1600,1600/0/default.jpg`}
              alt={selectedArtwork.thumbnail?.alt_text || selectedArtwork.title}
            />
            <div className="artwork-modal-details">
              <div>
                <h2>{selectedArtwork.title}</h2>
                <p>{selectedArtwork.artist_title || 'Artist unknown'}</p>
                {selectedArtwork.date_display && <span>{selectedArtwork.date_display}</span>}
                {selectedArtwork.description ? (
                  <div dangerouslySetInnerHTML={{ __html: selectedArtwork.description }} />
                ) : (
                  <span>No description available</span>
                )}
                <div className="artwork-modal-nav">
                  <button
                    type="button"
                    className="artwork-modal-nav-button"
                    disabled={selectedArtworkIndex <= 0}
                    onClick={() => {
                      const previousArtwork = sortedArtworks[selectedArtworkIndex - 1]
                      if (previousArtwork) setSelectedArtwork(previousArtwork)
                    }}
                  >
                    Prev
                  </button>
                  <button
                    type="button"
                    className="artwork-modal-nav-button"
                    disabled={selectedArtworkIndex === -1 || selectedArtworkIndex >= sortedArtworks.length - 1}
                    onClick={() => {
                      const nextArtwork = sortedArtworks[selectedArtworkIndex + 1]
                      if (nextArtwork) setSelectedArtwork(nextArtwork)
                    }}
                  >
                    Next
                  </button>
                </div>
              </div>
              <a href={selectedArtwork.api_link} target="_blank" rel="noreferrer">
                View in collection
              </a>
            </div>
          </section>
        </div>
      )}

      <footer className="site-footer">
        <span>Artwork data courtesy of the Art Institute of Chicago.</span>
        <a href="https://api.artic.edu/docs/" target="_blank" rel="noreferrer">API documentation</a>
      </footer>
    </main>
  )
}
export default App