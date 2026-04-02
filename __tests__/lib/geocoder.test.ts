import { geocodePlace } from '@/lib/geocoder'

global.fetch = jest.fn()
const mockFetch = fetch as jest.MockedFunction<typeof fetch>

describe('geocodePlace', () => {
  it('returns coordinates for a known place', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        status: 'OK',
        results: [{
          geometry: {
            location: { lat: 37.5665, lng: 126.9780 }
          }
        }]
      })
    } as Response)

    const result = await geocodePlace('명동, 서울')
    expect(result).not.toBeNull()
    expect(result!.lat).toBeCloseTo(37.5665)
    expect(result!.lng).toBeCloseTo(126.9780)
  })

  it('returns null for unknown place', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ status: 'ZERO_RESULTS', results: [] })
    } as Response)

    const result = await geocodePlace('nonexistent place xyz')
    expect(result).toBeNull()
  })

  it('returns null on network error', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'))
    const result = await geocodePlace('some place')
    expect(result).toBeNull()
  })
})
