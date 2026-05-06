export interface GeocodeInfo {
  googlePlaceId: string
  lat: number
  lng: number
  city: string
  country: string
  countryCode: string
  address: string
  category?: string
}

const CATEGORY_MAPPING: Record<string, string> = {
  // Restaurant / Food
  restaurant: 'restaurant',
  food: 'restaurant',
  american_restaurant: 'restaurant',
  brazilian_restaurant: 'restaurant',
  chinese_restaurant: 'restaurant',
  fast_food_restaurant: 'restaurant',
  french_restaurant: 'restaurant',
  greek_restaurant: 'restaurant',
  indian_restaurant: 'restaurant',
  indonesian_restaurant: 'restaurant',
  italian_restaurant: 'restaurant',
  japanese_restaurant: 'restaurant',
  korean_restaurant: 'restaurant',
  lebanese_restaurant: 'restaurant',
  mexican_restaurant: 'restaurant',
  middle_eastern_restaurant: 'restaurant',
  pizza_restaurant: 'restaurant',
  ramen_restaurant: 'restaurant',
  seafood_restaurant: 'restaurant',
  spanish_restaurant: 'restaurant',
  steak_house: 'restaurant',
  sushi_restaurant: 'restaurant',
  thai_restaurant: 'restaurant',
  turkish_restaurant: 'restaurant',
  vietnamese_restaurant: 'restaurant',
  vegan_restaurant: 'restaurant',
  vegetarian_restaurant: 'restaurant',
  bar: 'restaurant',
  pub: 'restaurant',
  ice_cream_shop: 'restaurant',
  meal_delivery: 'restaurant',
  meal_takeaway: 'restaurant',

  // Cafe
  cafe: 'cafe',
  coffee_shop: 'cafe',
  bakery: 'cafe',

  // Attraction / Entertainment
  tourist_attraction: 'attraction',
  museum: 'attraction',
  park: 'attraction',
  zoo: 'attraction',
  aquarium: 'attraction',
  amusement_park: 'attraction',
  art_gallery: 'attraction',
  historical_landmark: 'attraction',
  national_park: 'attraction',
  visitor_center: 'attraction',
  amusement_center: 'attraction',
  stadium: 'attraction',
  movie_theater: 'attraction',
  performing_arts_theater: 'attraction',
  library: 'attraction',

  // Shopping
  shopping_mall: 'shopping',
  store: 'shopping',
  department_store: 'shopping',
  clothing_store: 'shopping',
  electronics_store: 'shopping',
  book_store: 'shopping',
  furniture_store: 'shopping',
  gift_shop: 'shopping',
  grocery_store: 'shopping',
  home_goods_store: 'shopping',
  jewelry_store: 'shopping',
  market: 'shopping',
  shoe_store: 'shopping',
  supermarket: 'shopping',
  convenience_store: 'shopping',

  // Accommodation
  lodging: 'accommodation',
  hotel: 'accommodation',
  resort_hotel: 'accommodation',
  motel: 'accommodation',
  bed_and_breakfast: 'accommodation',
  guest_house: 'accommodation',
  campground: 'accommodation',
}

interface AddressComponent {
  longText: string
  shortText: string
  types: string[]
}

function mapGoogleTypesToCategory(types: string[], addressComponents?: AddressComponent[]): string | undefined {
  if (!types) return undefined
  
  // 1. Direct mapping from types
  for (const type of types) {
    if (CATEGORY_MAPPING[type]) {
      return CATEGORY_MAPPING[type]
    }
  }

  // 2. Inference for street_address or lack of specific place types
  if (types.includes('street_address') || types.includes('route')) {
    // If it's a specific address but doesn't have a business/place category,
    // check if it's within a known administrative area that we might want to group
    const hasAdministrativeType = addressComponents?.some(c => 
      c.types.some((t: string) => 
        t === 'locality' || 
        t.startsWith('sublocality') || 
        t.startsWith('administrative_area_level')
      )
    )
    if (hasAdministrativeType) {
      return 'attraction' // Default to attraction for general area/address results
    }
  }

  return undefined
}

export async function geocodePlace(query: string): Promise<GeocodeInfo | null> {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
  if (!apiKey) return null

  try {
    const res = await fetch('https://places.googleapis.com/v1/places:searchText', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': 'places.id,places.location,places.formattedAddress,places.addressComponents,places.types',
      },
      body: JSON.stringify({ textQuery: query }),
    })

    if (!res.ok) return null

    const data = await res.json()
    const place = data.places?.[0]
    if (!place) {
      console.log(`[Geocoder] No place found for query: ${query}`)
      return null
    }

    console.log(`[Geocoder] Google API Response for "${query}":`, JSON.stringify(place, null, 2))

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

    const category = mapGoogleTypesToCategory(place.types, place.addressComponents)
    console.log(`[Geocoder] Mapped category for "${query}":`, category, "from types:", place.types)

    const result = {
      googlePlaceId: place.id,
      lat: place.location.latitude,
      lng: place.location.longitude,
      address: place.formattedAddress ?? query,
      city,
      country,
      countryCode,
      category,
    }

    return result
  } catch {
    return null
  }
}
