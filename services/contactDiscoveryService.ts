import { hunterService } from './hunterService';

export class ContactDiscoveryService {
  async findEmails(url: string | null, context?: { name: string; address?: string }): Promise<string[]> {
    if (!url) return [];

    let hostname: string;
    try {
      const normalized = url.startsWith('http') ? url : `https://${url}`;
      hostname = new URL(normalized).hostname.toLowerCase();
    } catch {
      return [];
    }

    hostname = hostname.replace(/^www\./, '');

    const results = await hunterService.domainSearch(hostname);
    const emails = results
      .map((r) => r.value)
      .filter((v) => typeof v === 'string' && v.includes('@'))
      .map((v) => v.toLowerCase().trim());

    const unique = Array.from(new Set(emails));
    return unique;
  }
}

export const contactDiscoveryService = new ContactDiscoveryService();
