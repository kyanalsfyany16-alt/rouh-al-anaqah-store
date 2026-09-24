// Generate sitemap.xml and robots.txt from Supabase public data
// Uses VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
// Run: node scripts/generate-sitemap.mjs

import { writeFile, mkdir } from 'node:fs/promises'
import { existsSync } from 'node:fs'

const SITE_URL =
  (process.env.VITE_SITE_URL || process.env.SITE_URL || '').replace(/\/$/, '') ||
  'https://rouh-al-anaqah-store.vercel.app'

const SUPABASE_URL =
  process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || ''

const SUPABASE_ANON_KEY =
  process.env.VITE_SUPABASE_ANON_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  ''

function isValidHeaderValue(value) {
  return !/[^\x00-\xFF]/.test(value)
}

async function fetchSupabase(path, params = '') {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return null
  }

  // Prevent Node fetch from crashing with a ByteString error.
  if (!isValidHeaderValue(SUPABASE_ANON_KEY)) {
    console.warn(
      'Invalid Supabase anon key: the environment variable contains non-ASCII characters.'
    )
    console.warn(
      'Sitemap will be generated without fetching Supabase data.'
    )
    return null
  }

  const url = `${SUPABASE_URL}/rest/v1/${path}?${params}`

  const res = await fetch(url, {
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    },
  })

  if (!res.ok) {
    console.warn(`Supabase fetch failed ${path}: ${res.status}`)
    return null
  }

  return res.json()
}

function xmlEscape(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function isValidSlug(slug) {
  if (!slug || typeof slug !== 'string') return false
  const s = slug.trim()
  if (!s) return false
  if (s === '.' || s === '..') return false
  if (s.length < 2) return false
  if (/^[.\-_]+$/.test(s)) return false
  if (s.includes(' ') || s.includes('?') || s.includes('&') || s.includes('=')) return false
  return true
}

async function main() {
  const staticRoutes = [
    {
      loc: `${SITE_URL}/`,
      changefreq: 'daily',
      priority: '1.0',
    },
    {
      loc: `${SITE_URL}/shop`,
      changefreq: 'daily',
      priority: '0.9',
    },
    {
      loc: `${SITE_URL}/contact`,
      changefreq: 'monthly',
      priority: '0.5',
    },
  ]

  let products = []
  let categories = []

  if (SUPABASE_URL && SUPABASE_ANON_KEY) {
    const prodData = await fetchSupabase(
      'products',
      'select=slug,updated_at&is_published=eq.true&order=updated_at.desc&limit=1000'
    )

    if (prodData) {
      products = prodData
    }

    const catData = await fetchSupabase(
      'categories',
      'select=slug,created_at&is_active=eq.true&order=created_at.desc&limit=1000'
    )

    if (catData) {
      categories = catData
    }

    console.log(
      `Fetched ${products.length} products, ${categories.length} categories`
    )
    if (categories.length) console.log('Category slugs:', categories.map((c) => JSON.stringify(c.slug)).join(', '))
    if (products.length) console.log('Product slugs:', products.map((p) => JSON.stringify(p.slug)).join(', '))
  } else {
    console.log('No Supabase env, generating static sitemap only')
  }

  const urls = [...staticRoutes]

  for (const p of products) {
    if (!isValidSlug(p.slug)) {
      console.warn(`Skipping invalid product slug: ${JSON.stringify(p.slug)}`)
      continue
    }

    urls.push({
      loc: `${SITE_URL}/product/${encodeURIComponent(p.slug.trim())}`,
      lastmod: p.updated_at
        ? new Date(p.updated_at).toISOString().split('T')[0]
        : undefined,
      changefreq: 'weekly',
      priority: '0.8',
    })
  }

  for (const c of categories) {
    if (!isValidSlug(c.slug)) {
      console.warn(`Skipping invalid category slug: ${JSON.stringify(c.slug)}`)
      continue
    }

    urls.push({
      loc: `${SITE_URL}/shop?category=${encodeURIComponent(c.slug.trim())}`,
      lastmod: c.created_at
        ? new Date(c.created_at).toISOString().split('T')[0]
        : undefined,
      changefreq: 'weekly',
      priority: '0.6',
    })
  }

  const seen = new Set()

  const uniqueUrls = urls.filter((u) => {
    if (seen.has(u.loc)) return false

    seen.add(u.loc)
    return true
  })

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${uniqueUrls
  .map(
    (u) => `  <url>
    <loc>${xmlEscape(u.loc)}</loc>
${u.lastmod ? `    <lastmod>${u.lastmod}</lastmod>\n` : ''}    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`
  )
  .join('\n')}
</urlset>
`

  const robots = `User-agent: *
Allow: /
Disallow: /admin/
Disallow: /account
Disallow: /orders
Disallow: /cart
Disallow: /checkout
Disallow: /wishlist
Disallow: /notifications
Disallow: /login
Disallow: /register
Disallow: /forgot-password

Sitemap: ${SITE_URL}/sitemap.xml
`

  if (!existsSync('public')) {
    await mkdir('public', { recursive: true })
  }

  await writeFile('public/sitemap.xml', sitemap, 'utf-8')
  await writeFile('public/robots.txt', robots, 'utf-8')

  console.log(
    `Generated public/sitemap.xml with ${uniqueUrls.length} URLs`
  )

  console.log(
    `Generated public/robots.txt with Sitemap: ${SITE_URL}/sitemap.xml`
  )
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})