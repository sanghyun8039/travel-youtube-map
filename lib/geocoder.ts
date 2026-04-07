'use server'

import { searchPlace } from '@/lib/places'

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
  try {
    const result = await searchPlace(query)
    if (!result) return null

    return {
      googlePlaceId: result.googlePlaceId,
      lat: result.lat,
      lng: result.lng,
      city: result.city ?? '',
      country: result.country ?? '',
      countryCode: result.countryCode ?? '',
      address: result.formattedAddress ?? '',
    }
  } catch {
    return null
  }
}
