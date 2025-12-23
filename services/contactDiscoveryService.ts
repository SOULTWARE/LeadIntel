import { chromium } from 'playwright';

export class ContactDiscoveryService {
  private userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36';

  async findEmails(url: string | null, context?: { name: string; address?: string }): Promise<string[]> {
    const emails = new Set<string>();

    if (url) {
      // Normalize URL
      if (!url.startsWith('http')) {
        url = `https://${url}`;
      }

      console.log(`[ContactDiscovery] Scouting website: ${url}`);

      const browser = await chromium.launch({ headless: true });
      const browserContext = await browser.newContext({ userAgent: this.userAgent });
      const page = await browserContext.newPage();

      try {
        // Go to homepage
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });

        // Basic extraction from homepage
        const homepageEmails = await this.extractEmailsFromPage(page);
        homepageEmails.forEach(e => emails.add(e));

        // If no emails found, look for contact pages
        if (emails.size === 0) {
          const contactLinks = await page.$$eval('a', (anchors) =>
            anchors
              .map(a => ({ text: a.innerText.toLowerCase(), href: a.href }))
              .filter(a => a.text.includes('contact') || a.text.includes('about') || a.text.includes('impressum'))
              .map(a => a.href)
          );

          const uniqueLinks = Array.from(new Set(contactLinks)).slice(0, 3);

          for (const link of uniqueLinks) {
            try {
              console.log(`[ContactDiscovery] Checking sub-page: ${link}`);
              await page.goto(link, { waitUntil: 'domcontentloaded', timeout: 15000 });
              const subPageEmails = await this.extractEmailsFromPage(page);
              subPageEmails.forEach(e => emails.add(e));
              if (emails.size > 0) break;
            } catch (e) {
              console.error(`[ContactDiscovery] Failed to check sub-page: ${link}`, e);
            }
          }
        }
      } catch (error) {
        console.error(`[ContactDiscovery] Error scouting website ${url}:`, error);
      } finally {
        await browser.close();
      }
    }

    // Fallback to search if no website or no emails found
    if (emails.size === 0 && context) {
      console.log(`[ContactDiscovery] Falling back to search for: ${context.name}`);
      const searchEmails = await this.findEmailsViaSearch(context.name, context.address);
      searchEmails.forEach(e => emails.add(e));
    }

    const result = Array.from(emails);
    console.log(`[ContactDiscovery] Found ${result.length} emails total.`);
    return result;
  }

  async findEmailsViaSearch(businessName: string, address?: string): Promise<string[]> {
    const query = `${businessName} ${address || ''} email address`.trim();
    console.log(`[ContactDiscovery] Searching Google for: "${query}"`);

    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({ userAgent: this.userAgent });
    const page = await context.newPage();
    const emails = new Set<string>();

    try {
      // Use a search engine (Google)
      const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
      await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });

      // 1. Extract from search snippets
      const bodyText = await page.evaluate(() => document.body.innerText);
      const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
      const textEmails = bodyText.match(emailRegex) || [];
      textEmails.forEach(e => emails.add(e.toLowerCase().trim()));

      // 2. Try to find social pages or yellow pages in results
      const candidateLinks = await page.$$eval('a', (anchors) =>
        anchors
          .map(a => a.href)
          .filter(href =>
            href.includes('facebook.com') ||
            href.includes('linkedin.com') ||
            href.includes('yelp.com') ||
            href.includes('yellowpages.com')
          )
          .slice(0, 2)
      );

      for (const link of candidateLinks) {
        try {
          console.log(`[ContactDiscovery] Checking candidate link: ${link}`);
          await page.goto(link, { waitUntil: 'domcontentloaded', timeout: 15000 });
          const pageText = await page.evaluate(() => document.body.innerText);
          const found = pageText.match(emailRegex) || [];
          found.forEach(e => emails.add(e.toLowerCase().trim()));
          if (emails.size >= 2) break;
        } catch (e) {
          console.error(`[ContactDiscovery] Error visiting candidate ${link}:`, e);
        }
      }

    } catch (error) {
      console.error(`[ContactDiscovery] Search fallback error:`, error);
    } finally {
      await browser.close();
    }

    return Array.from(emails).filter(e => !['example@email.com', 'sentry.io'].some(fp => e.includes(fp)));
  }

  private async extractEmailsFromPage(page: any): Promise<string[]> {
    // Regex for emails
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;

    // 1. Check mailto: links
    const mailtoEmails = await page.$$eval('a[href^="mailto:"]', (anchors: any[]) =>
      anchors.map(a => a.href.replace('mailto:', '').split('?')[0])
    );

    // 2. Check text content
    const bodyContent = await page.evaluate(() => document.body.innerText);
    const textEmails = bodyContent.match(emailRegex) || [];

    // Combine and sanitize
    const allFound = [...mailtoEmails, ...textEmails]
      .map(e => e.toLowerCase().trim())
      .filter(e => {
        // Basic common false positives filter
        const commonFalsePositives = ['example@email.com', 'sentry.io', 'google.com'];
        return !commonFalsePositives.some(fp => e.includes(fp)) && e.includes('.');
      });

    return Array.from(new Set(allFound));
  }
}

export const contactDiscoveryService = new ContactDiscoveryService();
