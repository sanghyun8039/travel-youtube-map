import { searchPlace } from '@/lib/places'

const mockFetch = jest.fn()
global.fetch = mockFetch

beforeEach(() => {
  mockFetch.mockReset()
  process.env.GOOGLE_MAPS_API_KEY = 'test-key'
})

describe('searchPlace', () => {
  it('returns PlaceResult with googlePlaceId on success', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        places: [{
          id: 'ChIJtest123',
          displayName: { text: 'Largo do Senado', languageCode: 'pt' },
          location: { latitude: 22.193, longitude: 113.54 },
          formattedAddress: 'Largo do Senado, Macau',
          addressComponents: [
            { longText: 'Macau', shortText: 'MO', types: ['country'] },
            { longText: 'Macau', shortText: 'Macau', types: ['locality'] },
          ],
        }],
      }),
    })

    const result = await searchPlace('세나도 광장 Macau')

    expect(result).toEqual({
      googlePlaceId: 'ChIJtest123',
      name: 'Largo do Senado',
      lat: 22.193,
      lng: 113.54,
      formattedAddress: 'Largo do Senado, Macau',
      city: 'Macau',
      country: 'Macau',
      countryCode: 'MO',
    })
  })

  it('returns null when API returns no places', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ places: [] }),
    })
    expect(await searchPlace('존재하지않는장소')).toBeNull()
  })

  it('returns null when API key is missing', async () => {
    delete process.env.GOOGLE_MAPS_API_KEY
    expect(await searchPlace('세나도 광장')).toBeNull()
  })

  it('sends correct FieldMask including addressComponents', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ places: [] }),
    })

    await searchPlace('세나도 광장')

    expect(mockFetch).toHaveBeenCalledWith(
      'https://places.googleapis.com/v1/places:searchText',
      expect.objectContaining({
        headers: expect.objectContaining({
          'X-Goog-FieldMask': expect.stringContaining('places.addressComponents'),
        }),
      })
    )
  })

  it('returns null on non-ok response', async () => {
    mockFetch.mockResolvedValueOnce({ ok: false })
    expect(await searchPlace('test')).toBeNull()
  })
})
