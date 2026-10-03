const API_URL = 'https://api.artic.edu/api/v1/artworks/search'
const RESULT_LIMIT = 12
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

export async function searchArtworks(query: string): Promise<Artwork[]> {
  const params = new URLSearchParams({
    q: query,
    limit: String(RESULT_LIMIT),
    fields: ARTWORK_FIELDS.join(','),
  })
  const response = await fetch(`${API_URL}?${params}`)

  if (!response.ok) {
    throw new Error(`Art Institute API request failed (${response.status})`)
  }

  const result: ArtworkResponse = await response.json()
  return result.data.map((artwork) => ({
    ...artwork,
    iiifUrl: result.config.iiif_url,
  }))
}
