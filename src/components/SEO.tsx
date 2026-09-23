import { useEffect } from 'react'

interface SEOProps {
  title?: string
  description?: string
  canonical?: string
  image?: string
  robots?: string
  type?: 'website' | 'product' | 'article'
  structuredData?: Record<string, unknown> | Record<string, unknown>[]
  noindex?: boolean
}

const SITE_URL = (import.meta.env.VITE_SITE_URL as string | undefined)?.replace(/\/$/, '') || 'https://rouh-al-anaqah-store.vercel.app'
const SITE_NAME = 'روح الأناقة'
const DEFAULT_TITLE = 'روح الأناقة | متجر إلكتروني رجالي فاخر'
const DEFAULT_DESC = 'روح الأناقة - متجر إلكتروني رجالي فاخر للملابس والساعات والعطور والشنط والإكسسوارات بأعلى جودة'

function upsertMeta(attr: 'name' | 'property', key: string, content: string) {
  const selector = `meta[${attr}="${key}"]`
  let el = document.querySelector(selector) as HTMLMetaElement | null
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, key)
    document.head.appendChild(el)
  }
  el.setAttribute('content', content)
}

function upsertLink(rel: string, href: string) {
  let el = document.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement | null
  if (!el) {
    el = document.createElement('link')
    el.setAttribute('rel', rel)
    document.head.appendChild(el)
  }
  el.setAttribute('href', href)
}

function removeJsonLd() {
  document.querySelectorAll('script[type="application/ld+json"][data-seo]').forEach((el) => el.remove())
}

export function SEO({ title, description, canonical, image, robots, type = 'website', structuredData, noindex }: SEOProps) {
  const finalTitle = title ? `${title} | ${SITE_NAME}` : DEFAULT_TITLE
  const finalDesc = description || DEFAULT_DESC
  const finalRobots = noindex ? 'noindex, nofollow' : robots || 'index, follow'
  const canonicalUrl = canonical ? (canonical.startsWith('http') ? canonical : `${SITE_URL}${canonical}`) : undefined
  const ogUrl = canonicalUrl || (typeof window !== 'undefined' ? window.location.href : undefined)
  const ogImage = image || undefined
  const verification = import.meta.env.VITE_GOOGLE_VERIFICATION as string | undefined

  useEffect(() => {
    document.title = finalTitle
    document.documentElement.lang = 'ar'
    document.documentElement.dir = 'rtl'

    upsertMeta('name', 'description', finalDesc)
    upsertMeta('name', 'robots', finalRobots)
    if (verification) upsertMeta('name', 'google-site-verification', verification)

    if (canonicalUrl) upsertLink('canonical', canonicalUrl)

    // Open Graph
    upsertMeta('property', 'og:title', title || SITE_NAME)
    upsertMeta('property', 'og:description', finalDesc)
    upsertMeta('property', 'og:type', type)
    if (ogUrl) upsertMeta('property', 'og:url', ogUrl)
    if (ogImage) upsertMeta('property', 'og:image', ogImage)
    upsertMeta('property', 'og:site_name', SITE_NAME)
    upsertMeta('property', 'og:locale', 'ar_SA')

    // Twitter
    upsertMeta('name', 'twitter:card', ogImage ? 'summary_large_image' : 'summary')
    upsertMeta('name', 'twitter:title', title || SITE_NAME)
    upsertMeta('name', 'twitter:description', finalDesc)
    if (ogImage) upsertMeta('name', 'twitter:image', ogImage)

    // JSON-LD
    removeJsonLd()
    if (structuredData) {
      const arr = Array.isArray(structuredData) ? structuredData : [structuredData]
      for (const data of arr) {
        const script = document.createElement('script')
        script.type = 'application/ld+json'
        script.setAttribute('data-seo', 'true')
        script.textContent = JSON.stringify(data)
        document.head.appendChild(script)
      }
    }

    return () => {
      // keep title/meta for SPA navigation, json-ld will be replaced on next render
    }
  }, [finalTitle, finalDesc, finalRobots, canonicalUrl, ogUrl, ogImage, type, structuredData, verification, title])

  return null
}

// Helpers for structured data
export function buildProductJsonLd(product: { name: string; description?: string | null; images: string[]; sku?: string | null; brand?: { name: string } | null; price: number; discount_price?: number | null; currency_code?: string; stock: number; is_published: boolean; rating?: number; review_count?: number }, url: string) {
  const price = product.discount_price != null && product.discount_price < product.price ? product.discount_price : product.price
  const availability = product.stock > 0 && product.is_published ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock'
  const data: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description || undefined,
    image: product.images?.length ? product.images : undefined,
    sku: product.sku || undefined,
    brand: product.brand ? { '@type': 'Brand', name: product.brand.name } : undefined,
    offers: {
      '@type': 'Offer',
      price: String(price),
      priceCurrency: product.currency_code || 'SAR',
      availability,
      url,
    },
  }
  if (product.rating && product.review_count) {
    data.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: String(product.rating),
      reviewCount: String(product.review_count),
    }
  }
  return data
}

export function buildBreadcrumbJsonLd(items: { name: string; url: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((it, idx) => ({
      '@type': 'ListItem',
      position: idx + 1,
      name: it.name,
      item: it.url,
    })),
  }
}

export function buildOrganizationJsonLd(settings: { store_name?: string | null; logo_url?: string | null; email?: string | null; phone?: string | null; address?: string | null } | null, siteUrl: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'OnlineStore',
    name: settings?.store_name || SITE_NAME,
    url: siteUrl || SITE_URL,
    logo: settings?.logo_url || undefined,
    email: settings?.email || undefined,
    telephone: settings?.phone || undefined,
    address: settings?.address ? { '@type': 'PostalAddress', streetAddress: settings.address } : undefined,
  }
}

export function buildWebsiteJsonLd(siteUrl: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    url: siteUrl || SITE_URL,
    potentialAction: {
      '@type': 'SearchAction',
      target: `${siteUrl || SITE_URL}/shop?q={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  }
}

export const getSiteUrl = () => SITE_URL
