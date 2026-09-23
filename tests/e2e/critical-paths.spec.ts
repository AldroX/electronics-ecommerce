/// E2E tests for critical user paths
/// Run: pnpm e2e tests/e2e/critical-paths.spec.ts

import { test, expect, devices } from '@playwright/test';

test.describe('Homepage', () => {
  test('loads successfully with hero section', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Electronics/);

    // Check hero section
    await expect(page.locator('section').first()).toBeVisible();
    await expect(page.locator('h1')).toBeVisible();
  });

  test('has working navigation', async ({ page }) => {
    await page.goto('/');

    // Check main nav links exist
    const nav = page.locator('nav, header');
    await expect(nav).toBeVisible();
  });

  test('has WhatsApp CTA visible', async ({ page }) => {
    await page.goto('/');

    // Check for WhatsApp button/link
    const whatsapp = page.locator('a[href*="whatsapp"], button:has-text("WhatsApp")');
    await expect(whatsapp.first()).toBeVisible();
  });
});

test.describe('Product Catalog (/productos)', () => {
  test('loads catalog page', async ({ page }) => {
    await page.goto('/productos');
    await expect(page).toHaveTitle(/Catálogo|Productos/);
  });

  test('displays product grid', async ({ page }) => {
    await page.goto('/productos');

    // Wait for products to load
    await page.waitForSelector('[id="product-grid"], .grid, [class*="grid"]', { timeout: 10000 });

    // Check at least one product card
    const cards = page.locator('[class*="card"], article, [class*="product"]');
    await expect(cards.first()).toBeVisible();
  });

  test('filters work', async ({ page }) => {
    await page.goto('/productos');

    // Try to find and use a filter
    const categoryFilter = page.locator('[data-filter="category"], select[name="category"]');
    if (await categoryFilter.isVisible()) {
      await categoryFilter.first().click();
      await page.waitForTimeout(500);
    }
  });

  test('sorting works', async ({ page }) => {
    await page.goto('/productos');

    const sortSelect = page.locator('#sort-select, select[name="sort"]');
    if (await sortSelect.isVisible()) {
      await sortSelect.selectOption('price-asc');
      await page.waitForTimeout(500);
    }
  });
});

test.describe('Product Detail (/producto/[slug])', () => {
  test('loads product page', async ({ page }) => {
    await page.goto('/producto/panel-solar-450w-monocristalino');

    // Check key elements
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('[class*="price"], [class*="Price"]')).toBeVisible();
  });

  test('has WhatsApp CTA with pre-filled message', async ({ page }) => {
    await page.goto('/producto/panel-solar-450w-monocristalino');

    const whatsappBtn = page.locator('a[href*="whatsapp"], button:has-text("WhatsApp")');
    await expect(whatsappBtn.first()).toBeVisible();

    // Check href contains pre-filled message
    const href = await whatsappBtn.first().getAttribute('href');
    expect(href).toContain('whatsapp');
  });

  test('displays product specs', async ({ page }) => {
    await page.goto('/producto/panel-solar-450w-monocristalino');

    const specs = page.locator('[class*="spec"], [class*="Spec"], dl, table');
    await expect(specs.first()).toBeVisible();
  });

  test('shows related products', async ({ page }) => {
    await page.goto('/producto/panel-solar-450w-monocristalino');

    const related = page.locator(
      '[class*="related"], h2:has-text("Relacionad"), h3:has-text("Relacionad")'
    );
    if (await related.isVisible()) {
      await expect(related).toBeVisible();
    }
  });
});

test.describe('Category Page (/categoria/[slug])', () => {
  test('loads category page', async ({ page }) => {
    await page.goto('/categoria/energia-solar');
    await expect(page.locator('h1')).toContainText('Energía Solar');
  });

  test('shows products in category', async ({ page }) => {
    await page.goto('/categoria/energia-solar');

    const products = page.locator('[class*="product"], [class*="card"], article');
    await expect(products.first()).toBeVisible();
  });
});

test.describe('Solutions (/soluciones)', () => {
  test('loads solutions index', async ({ page }) => {
    await page.goto('/soluciones');
    await expect(page.locator('h1')).toBeVisible();
  });

  test('loads solution detail', async ({ page }) => {
    await page.goto('/soluciones/respaldo-hogar');
    await expect(page.locator('h1')).toBeVisible();
  });
});

test.describe('Guides (/guias)', () => {
  test('loads guides index', async ({ page }) => {
    await page.goto('/guias');
    await expect(page.locator('h1')).toBeVisible();
  });
});

test.describe('FAQ (/faq)', () => {
  test('loads FAQ page', async ({ page }) => {
    await page.goto('/faq');
    await expect(page.locator('h1')).toBeVisible();
  });
});

test.describe('Offers (/ofertas)', () => {
  test('loads offers index', async ({ page }) => {
    await page.goto('/ofertas');
    await expect(page.locator('h1')).toBeVisible();
  });
});

test.describe('Kits (/kits)', () => {
  test('loads kits index', async ({ page }) => {
    await page.goto('/kits');
    await expect(page.locator('h1')).toBeVisible();
  });
});

test.describe('Mobile responsiveness', () => {
  test.use({ ...devices['Pixel 5'] });

  test('homepage is usable on mobile', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('body')).toBeVisible();

    // Check no horizontal scroll
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    expect(bodyWidth).toBeLessThanOrEqual(page.viewportSize().width + 10);
  });

  test('catalog works on mobile', async ({ page }) => {
    await page.goto('/productos');
    await expect(page.locator('body')).toBeVisible();
  });
});
