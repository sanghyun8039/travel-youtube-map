export interface PlaceResult {
  googlePlaceId: string
  name: string
  lat: number
  lng: number
  formattedAddress?: string
  city?: string
  country?: string
  countryCode?: string
}

export async function searchPlace(query: string): Promise<PlaceResult | null> {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY
  if (!apiKey) return null

  const res = await fetch('https://places.googleapis.com/v1/places:searchText', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': apiKey,
      'X-Goog-FieldMask': 'places.id,places.displayName,places.location,places.formattedAddress,places.addressComponents',
    },
    body: JSON.stringify({ textQuery: query }),
  })

  if (!res.ok) return null

  const data = await res.json()
  const place = data.places?.[0]
  if (!place) return null

  let city = ''
  let country = ''
  let countryCode = ''
  let cityFromAdmin = ''

  place.addressComponents?.forEach((c: { longText: string; shortText: string; types: string[] }) => {
    if (c.types.includes('country')) {
      country = c.longText
      countryCode = c.shortText
    }
    if (c.types.includes('locality')) {
      city = c.longText
    } else if (c.types.includes('administrative_area_level_1') && !city) {
      cityFromAdmin = c.longText
    }
  })
  if (!city) city = cityFromAdmin

  return {
    googlePlaceId: place.id as string,
    name: (place.displayName?.text ?? query) as string,
    lat: place.location.latitude as number,
    lng: place.location.longitude as number,
    formattedAddress: place.formattedAddress as string | undefined,
    city: city || undefined,
    country: country || undefined,
    countryCode: countryCode || undefined,
  }
}
