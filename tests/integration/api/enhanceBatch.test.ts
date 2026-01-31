import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '@/app/api/enhance/batch/route';
import { aiEnhanceService } from '@/services/aiEnhanceService';
import { NextRequest } from 'next/server';

vi.mock('@/db', () => ({
  prisma: {
    lead: {
      findMany: vi.fn(),
      update: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

vi.mock('@/lib/supabase/server', () => ({
  createClient: async () => ({
    auth: {
      getUser: async () => ({
        data: {
          user: { id: 'test-user' }
        }
      })
    }
  })
}));

vi.mock('@/services/creditsService', () => ({
  creditsService: {
    createHold: vi.fn(),
    captureHold: vi.fn(),
    releaseHold: vi.fn(),
  },
  InsufficientCreditsError: class InsufficientCreditsError extends Error {},
}));

vi.mock('@/services/aiEnhanceService', () => ({
  aiEnhanceService: {
    enhanceBatch: vi.fn()
  }
}));

describe('/api/enhance/batch', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 400 if leads or leadPurpose are missing', async () => {
    const req = new NextRequest('http://localhost:3000/api/enhance/batch', {
      method: 'POST',
      headers: { 'Idempotency-Key': 'test-key' },
      body: JSON.stringify({})
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toContain('required');
  });

  it('should successfully process leads', async () => {
    const mockResults = [{ compatibilityScore: 90 }];
    vi.mocked(aiEnhanceService.enhanceBatch).mockResolvedValue(
      mockResults as unknown as Awaited<ReturnType<typeof aiEnhanceService.enhanceBatch>>
    );

    const body = {
      leads: [{ name: 'Lead 1' }],
      leadPurpose: 'Test'
    };

    const req = new NextRequest('http://localhost:3000/api/enhance/batch', {
      method: 'POST',
      headers: { 'Idempotency-Key': 'test-key' },
      body: JSON.stringify(body)
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.results[0].aiAnalysis).toEqual(mockResults[0]);
    expect(aiEnhanceService.enhanceBatch).toHaveBeenCalledWith(
      expect.arrayContaining([expect.objectContaining({ name: 'Lead 1' })]),
      'Test'
    );
  });

  it('should return 500 on service error', async () => {
    vi.mocked(aiEnhanceService.enhanceBatch).mockRejectedValue(new Error('Test Error'));

    const body = {
      leads: [{ name: 'Lead 1' }],
      leadPurpose: 'Test'
    };

    const req = new NextRequest('http://localhost:3000/api/enhance/batch', {
      method: 'POST',
      headers: { 'Idempotency-Key': 'test-key' },
      body: JSON.stringify(body)
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(500);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Test Error');
  });
});
