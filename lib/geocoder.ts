export interface GeocodeInfo {
  lat: number
  lng: number
  city: string
  country: string
  countryCode: string
  address: string
}

export async function geocodePlace(query: string): Promise<GeocodeInfo | null> {
  // 클라이언트 환경에서도 동작할 수 있도록 NEXT_PUBLIC 접두사가 붙은 키를 우선 사용
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || process.env.GOOGLE_MAPS_API_KEY
  if (!apiKey) return null

  try {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(query)}&key=${apiKey}&language=ko`
    const res = await fetch(url)
    if (!res.ok) return null

    const data = await res.json()
    if (data.status !== 'OK' || !data.results?.[0]) return null

    const result = data.results[0]
    const { lat, lng } = result.geometry.location
    
    let city = ''
    let country = ''
    let countryCode = ''

    // 주소 구성 요소 분석 - locality 우선, 없으면 administrative_area_level_1 사용
    let cityFromAdmin = ''
    result.address_components?.forEach((c: any) => {
      if (c.types.includes('country')) {
        country = c.long_name
        countryCode = c.short_name
      }
      if (c.types.includes('locality')) {
        city = c.long_name
      } else if (c.types.includes('administrative_area_level_1') && !city) {
        cityFromAdmin = c.long_name
      }
    })
    if (!city) city = cityFromAdmin

    return {
      lat,
      lng,
      city,
      country,
      countryCode,
      address: result.formatted_address
    }
  } catch (error) {
    console.error('Geocoding error:', error)
    return null
  }
}
