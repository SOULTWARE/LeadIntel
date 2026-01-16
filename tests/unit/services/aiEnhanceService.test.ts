import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AIEnhanceService } from '@/services/aiEnhanceService';

// Mock the environment variables
process.env.OPENAI_API_KEY = 'test-key';
process.env.AI_MODEL = 'test-model';

describe('AIEnhanceService', () => {
  let service: AIEnhanceService;
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    service = new AIEnhanceService();
    fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
  });

  it('should successfully enhance a lead', async () => {
    const mockResponse = {
      choices: [
        {
          message: {
            content: JSON.stringify({
              compatibilityScore: 85,
              compatibilityHooks: ['Hook 1', 'Hook 2'],
              identifiedProblems: ['Problem 1'],
              recommendation: 'Highly Recommended',
              reasoning: 'Test reasoning'
            })
          }
        }
      ]
    };

    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    const result = await service.enhanceLead({
      placeData: { name: 'Test Business', address: '123 Test St', reviews: 10, rating: 4.5 },
      leadPurpose: 'Test Purpose'
    });

    expect(result.compatibilityScore).toBe(85);
    expect(result.recommendation).toBe('Highly Recommended');
    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.openai.com/v1/chat/completions',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer test-key',
        }),
      })
    );
  });

  it('should return default values when OpenAI call fails', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 500,
    });

    const result = await service.enhanceLead({
      placeData: { name: 'Test Business' },
      leadPurpose: 'Test Purpose'
    });

    expect(result.compatibilityScore).toBe(0);
    expect(result.recommendation).toBe('Neutral');
  });

  it('should enhance a batch of leads', async () => {
    const mockResponse = {
      choices: [{ message: { content: JSON.stringify({ compatibilityScore: 50 }) } }]
    };

    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => mockResponse,
    });

    const leads = [{ name: 'Lead 1' }, { name: 'Lead 2' }];
    const results = await service.enhanceBatch(leads, 'Test Purpose');

    expect(results).toHaveLength(2);
    expect(results[0].compatibilityScore).toBe(50);
    expect(results[1].compatibilityScore).toBe(50);
  });
});
