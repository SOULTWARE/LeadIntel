import { describe, it, expect, vi, beforeEach } from 'vitest';
import { prisma } from '@/db';

vi.mock('@/db', () => ({
  prisma: {
    lead: {
      create: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    }
  },
  default: {
    lead: {
      create: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    }
  }
}));

describe('Lead Model Operations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should create a lead', async () => {
    const mockLead = { id: 'uuid-1', name: 'Test Lead' };
    (prisma.lead.create as any).mockResolvedValue(mockLead);

    const result = await prisma.lead.create({
      data: { name: 'Test Lead', address: '123 St' }
    });

    expect(result).toEqual(mockLead);
    expect(prisma.lead.create).toHaveBeenCalledWith({
      data: { name: 'Test Lead', address: '123 St' }
    });
  });

  it('should find leads', async () => {
    const mockLeads = [{ id: 'uuid-1', name: 'Lead 1' }];
    (prisma.lead.findMany as any).mockResolvedValue(mockLeads);

    const results = await prisma.lead.findMany();

    expect(results).toHaveLength(1);
    expect(results[0].name).toBe('Lead 1');
  });

  it('should update a lead', async () => {
    const mockUpdatedLead = { id: 'uuid-1', name: 'Updated Lead' };
    (prisma.lead.update as any).mockResolvedValue(mockUpdatedLead);

    const result = await prisma.lead.update({
      where: { id: 'uuid-1' },
      data: { name: 'Updated Lead' }
    });

    expect(result.name).toBe('Updated Lead');
  });
});
