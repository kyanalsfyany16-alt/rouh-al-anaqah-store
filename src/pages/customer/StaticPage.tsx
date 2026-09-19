import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useSettings } from '../../hooks'
import { cn } from '../../lib/utils'

const pageConfigs: Record<string, { title: string; field: keyof any }> = {
  privacy: { title: 'سياسة الخصوصية', field: 'privacy_policy' },
  terms: { title: 'الشروط والأحكام', field: 'terms' },
  shipping: { title: 'سياسة الشحن', field: 'shipping_policy' },
  returns: { title: 'سياسة الإرجاع', field: 'return_policy' },
  about: { title: 'من نحن', field: 'about_us' },
}

export function StaticPage() {
  const { slug } = useParams<{ slug: string }>()
  const { settings } = useSettings()
  const [content, setContent] = useState<string>('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (slug && settings) {
      const config = pageConfigs[slug]
      if (config) setContent(settings[config.field] || '')
      setLoading(false)
    }
  }, [slug, settings])

  if (loading) {
    return <div className="animate-pulse space-y-4"><div className="h-8 w-48 skeleton rounded" /><div className="h-4 w-full skeleton rounded" /><div className="h-4 w-full skeleton rounded" /></div>
  }

  const config = pageConfigs[slug] || { title: slug, field: '' }

  return (
    <div className="max-w-3xl">
      <h1 className="page-title mb-8">{config.title}</h1>
      <div className="bg-white rounded-2xl border border-primary-200 p-8 prose prose-ar max-w-none text-primary-700 leading-relaxed">
        {content ? (
          <div dangerouslySetInnerHTML={{ __html: content }} />
        ) : (
          <p className="text-primary-500 text-center py-8">المحتوى غير متاح حالياً.</p>
        )}
      </div>
    </div>
  )
}