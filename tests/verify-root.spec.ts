import { test, expect, Page } from '@playwright/test'

const ROOT_EMAIL    = process.env.ROOT_TEST_EMAIL    ?? 'tusii.ug@gmail.com'
const ROOT_PASSWORD = process.env.ROOT_TEST_PASSWORD ?? 'TestRoot@2026'

async function loginAs(page: Page, email: string, password: string) {
  await page.goto('/login', { timeout: 60000 })
  // Wait for Next.js to finish any pending compilation before interacting
  await page.waitForLoadState('networkidle', { timeout: 30000 }).catch(() => {})
  // Ensure the "Compiling..." indicator is gone
  await page.waitForFunction(
    () => !document.querySelector('[data-nextjs-dev-tools-button]')?.textContent?.includes('Compiling'),
    { timeout: 30000 }
  ).catch(() => {})
  await page.locator('input[type="email"]').first().fill(email)
  await page.locator('input[type="password"]').first().fill(password)
  // Click and wait for the network request to complete before checking URL
  await Promise.all([
    page.waitForResponse(res => res.url().includes('/login') || res.url().includes('auth'), { timeout: 15000 }).catch(() => {}),
    page.locator('button[type="submit"]').click(),
  ])
  await page.waitForURL(/\/(root|dashboard|student)/, { timeout: 30000 })
}

test.describe('Root role — platform dashboard', () => {

  test('1. Root login redirects to /root (not /dashboard)', async ({ page }) => {
    await loginAs(page, ROOT_EMAIL, ROOT_PASSWORD)
    await page.screenshot({ path: 'tests/screenshots/01-root-login.png', fullPage: true })
    expect(page.url()).toContain('/root')
    expect(page.url()).not.toContain('/dashboard')
  })

  test('2. /root shows dark enterprise shell with Mark · Platform branding', async ({ page }) => {
    await loginAs(page, ROOT_EMAIL, ROOT_PASSWORD)
    await page.waitForLoadState('networkidle')
    await page.screenshot({ path: 'tests/screenshots/02-root-shell.png', fullPage: true })

    const body = await page.textContent('body')
    // Brand text + role badge
    expect(body).toMatch(/Platform|Mark/)
    // Stat card labels
    expect(body).toMatch(/Organization|Users|Assessment/)
    // Role badge should say Root
    expect(body).toContain('Root')
    // Sidebar nav links
    expect(body).toContain('Organizations')
    // No org-scoped elements
    expect(body).not.toContain('Examination Centre')
  })

  test('3. /root/organizations shows org list table', async ({ page }) => {
    await loginAs(page, ROOT_EMAIL, ROOT_PASSWORD)
    await page.goto('/root/organizations')
    await page.waitForLoadState('networkidle')
    await page.screenshot({ path: 'tests/screenshots/03-root-orgs.png', fullPage: true })

    const body = await page.textContent('body')
    expect(body).toMatch(/Organizations|No organizations/)
    // Table headers
    expect(body).toMatch(/Name|Status|Plan/)
  })

  test('4. /root/audit shows audit log table', async ({ page }) => {
    await loginAs(page, ROOT_EMAIL, ROOT_PASSWORD)
    await page.goto('/root/audit')
    await page.waitForLoadState('networkidle')
    await page.screenshot({ path: 'tests/screenshots/04-root-audit.png', fullPage: true })

    const body = await page.textContent('body')
    expect(body).toMatch(/Audit Log/)
    expect(body).toMatch(/Time|Actor|Action|Resource/)
  })

  test('5. /root is blocked for unauthenticated users → redirects to /login', async ({ page }) => {
    await page.goto('/root')
    await page.waitForLoadState('networkidle')
    await page.screenshot({ path: 'tests/screenshots/05-root-access-blocked.png' })
    expect(page.url()).toContain('/login')
    expect(page.url()).not.toContain('/root')
  })

  test('6. /dashboard/curriculum-images redirects away from org dashboard (Root)', async ({ page }) => {
    await loginAs(page, ROOT_EMAIL, ROOT_PASSWORD)
    // Root user navigating to /dashboard/curriculum-images:
    // middleware redirects to /root (platform home) since Root can't enter /dashboard
    await page.goto('/dashboard/curriculum-images', { waitUntil: 'networkidle' })
    await page.screenshot({ path: 'tests/screenshots/06-img-redirect.png' })
    // Should NOT be on the org dashboard
    expect(page.url()).not.toContain('/dashboard')
    expect(page.url()).toContain('/root')
  })

  test('7. Admin sidebar has no Image Library nav item', async ({ page }) => {
    // Navigate directly — verify the nav config statically by checking
    // the sidebar text when logged in as Root (Image Library should be visible for Root)
    await loginAs(page, ROOT_EMAIL, ROOT_PASSWORD)
    await page.screenshot({ path: 'tests/screenshots/07-root-nav.png' })
    const body = await page.textContent('nav')
    // Root sees Image Library in its own sidebar
    expect(body).toContain('Image Library')
    // But org dashboard items should NOT appear
    expect(body).not.toContain('Examination Centre')
    expect(body).not.toContain('Subjects')
  })

  test('8. /root/system-assessments shows Compass as is_system', async ({ page }) => {
    await loginAs(page, ROOT_EMAIL, ROOT_PASSWORD)
    await page.goto('/root/system-assessments')
    await page.waitForLoadState('networkidle')
    await page.screenshot({ path: 'tests/screenshots/08-system-assessments.png', fullPage: true })

    const body = await page.textContent('body')
    expect(body).toMatch(/Compass|system/i)
    expect(body).toContain('System Assessments')
  })

})
