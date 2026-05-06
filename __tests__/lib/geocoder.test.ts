import { geocodePlace } from '@/lib/geocoder'

const mockFetch = jest.fn()
global.fetch = mockFetch

beforeEach(() => {
  mockFetch.mockReset()
  process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY = 'fake-api-key'
})

function makePlacesResponse(overrides: object = {}) {
  return {
    places: [{
      id: 'ChIJmock',
      displayName: { text: 'Mock Place' },
      location: { latitude: 37.5665, longitude: 126.9780 },
      formattedAddress: 'Mock Address',
      addressComponents: [],
      ...overrides,
    }],
  }
}

describe('geocodePlace', () => {
  it('returns coordinates and googlePlaceId for a known place', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => makePlacesResponse(),
    })

    const result = await geocodePlace('명동, 서울')
    expect(result).not.toBeNull()
    expect(result!.lat).toBeCloseTo(37.5665)
    expect(result!.lng).toBeCloseTo(126.9780)
    expect(result!.googlePlaceId).toBe('ChIJmock')
  })

  it('returns null on failure (empty places array)', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ places: [] }),
    })
    expect(await geocodePlace('non-existent-place')).toBeNull()
  })

  it('returns null when API key is missing', async () => {
    delete process.env.GOOGLE_MAPS_API_KEY
    expect(await geocodePlace('any')).toBeNull()
  })

  it('parses city, country, countryCode from addressComponents', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => makePlacesResponse({
        location: { latitude: 35.6762, longitude: 139.6503 },
        formattedAddress: '東京都, 日本',
        addressComponents: [
          { longText: '東京都', shortText: '東京都', types: ['locality'] },
          { longText: 'Japan', shortText: 'JP', types: ['country'] },
        ],
      }),
    })

    const result = await geocodePlace('Tokyo')
    expect(result!.city).toBe('東京都')
    expect(result!.country).toBe('Japan')
    expect(result!.countryCode).toBe('JP')
    expect(result!.address).toBe('東京都, 日本')
  })

  it('uses administrative_area_level_1 when locality is absent', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => makePlacesResponse({
        location: { latitude: 51.5, longitude: -0.1 },
        formattedAddress: 'London, UK',
        addressComponents: [
          { longText: 'England', shortText: 'ENG', types: ['administrative_area_level_1'] },
          { longText: 'United Kingdom', shortText: 'GB', types: ['country'] },
        ],
      }),
    })

    const result = await geocodePlace('London')
    expect(result!.city).toBe('England')
    expect(result!.countryCode).toBe('GB')
  })

  it('returns null on network error', async () => {
    mockFetch.mockRejectedValueOnce(new Error('network fail'))
    expect(await geocodePlace('Tokyo')).toBeNull()
  })

  it('returns null on non-ok response', async () => {
    mockFetch.mockResolvedValueOnce({ ok: false })
    expect(await geocodePlace('test')).toBeNull()
  })

  describe('category mapping', () => {
    it('maps restaurant type to restaurant category', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => makePlacesResponse({
          types: ['restaurant', 'food', 'point_of_interest']
        }),
      })

      const result = await geocodePlace('test')
      expect(result!.category).toBe('restaurant')
    })

    it('maps korean_restaurant to restaurant category', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => makePlacesResponse({
          types: ['korean_restaurant', 'establishment']
        }),
      })

      const result = await geocodePlace('test')
      expect(result!.category).toBe('restaurant')
    })

    it('maps museum type to attraction category', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => makePlacesResponse({
          types: ['museum', 'point_of_interest']
        }),
      })

      const result = await geocodePlace('test')
      expect(result!.category).toBe('attraction')
    })

    it('returns undefined category for unmapped types', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => makePlacesResponse({
          types: ['establishment']
        }),
      })

      const result = await geocodePlace('test')
      expect(result!.category).toBeUndefined()
    })

    it('infers attraction category for street_address with administrative components', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => makePlacesResponse({
          types: ['street_address'],
          addressComponents: [
            { longText: 'Seoul', types: ['locality'] },
            { longText: 'South Korea', types: ['country'] }
          ]
        }),
      })

      const result = await geocodePlace('Specific Street Address')
      expect(result!.category).toBe('attraction')
    })

    it('infers attraction category for route with administrative components', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => makePlacesResponse({
          types: ['route'],
          addressComponents: [
            { longText: 'Gangnam-gu', types: ['sublocality_level_1'] }
          ]
        }),
      })

      const result = await geocodePlace('Some Route')
      expect(result!.category).toBe('attraction')
    })
  })
})
