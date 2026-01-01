import { test, expect } from '@playwright/test';

test.describe('Scraper Flow', () => {
  test('should scrape and enhance leads', async ({ page }) => {
    // Mock the scraper API
    await page.route('/api/scraper', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            results: [
              { name: 'Dr. Smith', address: 'Berlin, Germany', type: 'Doctor', website: 'drsmith.de' }
            ]
          }
        })
      });
    });

    // Mock the enhance API
    await page.route('/api/enhance/batch', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            results: [
              {
                name: 'Dr. Smith',
                address: 'Berlin, Germany',
                type: 'Doctor',
                website: 'drsmith.de',
                aiAnalysis: {
                  compatibilityScore: 95,
                  recommendation: 'Highly Recommended',
                  reasoning: 'Great fit for SEO services.'
                }
              }
            ],
            totalProcessed: 1,
          }
        })
      });
    });

    // 1. Navigate to scraper page
    await page.goto('/scraper');
    await expect(page).toHaveTitle(/LeadIntel/);

    // 2. Fill the form
    await page.fill('input[name="categories"]', 'Doctor');
    await page.fill('input[name="location"]', 'Berlin');

    // 3. Submit the form
    await page.click('button:has-text("Get Data →")');

    // 4. Verify results tab is active and shows results
    await expect(page.locator('button:has-text("Results (1)")')).toBeVisible();
    await expect(page.locator('text=Dr. Smith')).toBeVisible();

    // 5. Go back to input to add purpose
    await page.click('button:has-text("Input")');
    await page.fill('textarea[name="leadPurpose"]', 'I want to offer SEO services');

    // 6. Go back to results and enhance
    await page.click('button:has-text("Results (1)")');
    await page.click('button:has-text("✨ AI Enhance")');

    // 7. Verify enhanced status
    await expect(page.locator('text=ENHANCED')).toBeVisible();
    await expect(page.locator('text=95%')).toBeVisible();
    await expect(page.locator('text=Highly Recommended')).toBeVisible();
  });
});
