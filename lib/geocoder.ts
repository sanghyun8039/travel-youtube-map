export interface GeocodeInfo {
  googlePlaceId: string
  lat: number
  lng: number
  city: string
  country: string
  countryCode: string
  address: string
}

export async function geocodePlace(query: string): Promise<GeocodeInfo | null> {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
  try {
    const res = await fetch(`${baseUrl}/api/geocode?query=${encodeURIComponent(query)}`)
    if (!res.ok) return null
    return await res.json()
  } catch {
    return null
  }
}
