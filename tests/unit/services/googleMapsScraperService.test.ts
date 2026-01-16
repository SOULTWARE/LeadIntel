import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GoogleMapsScraperService } from '@/services/googleMapsScraperService';

// Mock the environment variables
process.env.SEARCH_API_KEY = 'test-api-key';

describe('GoogleMapsScraperService', () => {
  let service: GoogleMapsScraperService;
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    service = new GoogleMapsScraperService();
    fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
  });

  it('should successfully scrape leads', async () => {
    const mockResponse = {
      local_results: [
        {
          title: 'Business 1',
          address: 'Address 1',
          phone: '123-456',
          website: 'business1.com',
          rating: 4.0,
          reviews: 50,
          type: 'Restaurant',
          place_id: 'place1'
        }
      ]
    };

    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    const results = await service.scrape({
      categories: 'Restaurants',
      location: 'New York'
    });

    expect(results).toHaveLength(1);
    expect(results[0].name).toBe('Business 1');
    expect(results[0].placeId).toBe('place1');

    // Verify URL construction
    const fetchCall = fetchMock.mock.calls[0]?.[0];
    const url = new URL(String(fetchCall));
    expect(url.origin).toBe('https://serpapi.com');
    expect(url.pathname).toBe('/search');
    expect(url.searchParams.get('q')).toContain('Restaurants');
    expect(url.searchParams.get('q')).toContain('New York');
    expect(url.searchParams.get('api_key')).toBe('test-api-key');
    expect(url.searchParams.get('engine')).toBe('google_maps');
  });

  it('should handle empty results', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ local_results: [] }),
    });

    const results = await service.scrape({ plainQueries: 'Nothing' });
    expect(results).toHaveLength(0);
  });

  it('should throw error on API failure', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 403,
      text: async () => 'Forbidden',
    });

    await expect(service.scrape({ categories: 'Test' })).resolves.toEqual([]);
  });
});
