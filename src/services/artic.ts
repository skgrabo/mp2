const API_BASE_URL = 'https://api.artic.edu/api/v1'
const API_URL = `${API_BASE_URL}/artworks/search`
const RESULT_LIMIT = 12
const DEPARTMENT_PAGE_LIMIT = 24
const ARTWORK_FIELDS = [
  'id',
  'title',
  'artist_title',
  'date_display',
  'image_id',
  'thumbnail',
  'api_link',
]

interface ArtworkResponse {
  data: Array<Omit<Artwork, 'iiifUrl'>>
  config: {
    iiif_url: string
  }
}

interface DepartmentArtworksResponse extends ArtworkResponse {
  pagination: {
    total_pages: number
  }
}

interface DepartmentsResponse {
  data: Department[]
}

export interface Department {
  id: string
  title: string
}

export interface Artwork {
  id: number
  title: string
  artist_title: string | null
  date_display: string | null
  image_id: string | null
  thumbnail: {
    alt_text: string
  } | null
  api_link: string
  iiifUrl: string
}

export async function getDepartments(signal?: AbortSignal): Promise<Department[]> {
  const params = new URLSearchParams({
    limit: '100',
    fields: 'id,title',
  })
  const response = await fetch(`${API_BASE_URL}/departments?${params}`, { signal })

  if (!response.ok) {
    throw new Error(`Art Institute API request failed (${response.status})`)
  }

  const result: DepartmentsResponse = await response.json()
  return result.data.sort((left, right) => left.title.localeCompare(right.title))
}

export async function searchArtworks(query: string, signal?: AbortSignal): Promise<Artwork[]> {
  const params = new URLSearchParams({
    q: query,
    limit: String(RESULT_LIMIT),
    fields: ARTWORK_FIELDS.join(','),
  })
  const response = await fetch(`${API_URL}?${params}`, { signal })

  if (!response.ok) {
    throw new Error(`Art Institute API request failed (${response.status})`)
  }

  const result: ArtworkResponse = await response.json()
  return result.data.map((artwork) => ({ ...artwork, iiifUrl: result.config.iiif_url }))
}

export async function getDepartmentArtworks(
  departmentTitle: string,
  page: number,
  signal?: AbortSignal,
): Promise<{ artworks: Artwork[]; hasMore: boolean }> {
  const params = new URLSearchParams({
    'query[term][department_title.keyword]': departmentTitle,
    page: String(page),
    limit: String(DEPARTMENT_PAGE_LIMIT),
    fields: ARTWORK_FIELDS.join(','),
  })
  const response = await fetch(`${API_URL}?${params}`, { signal })

  if (!response.ok) {
    throw new Error(`Art Institute API request failed (${response.status})`)
  }

  const result: DepartmentArtworksResponse = await response.json()
  return {
    artworks: result.data.map((artwork) => ({ ...artwork, iiifUrl: result.config.iiif_url })),
    hasMore: page < result.pagination.total_pages,
  }
}
