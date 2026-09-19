import { Search as SearchIcon, X } from 'lucide-react'
import { useState, useEffect, useRef } from 'react'
import { supabase } from '../../lib/supabase'
import { useDebounce } from '../../hooks/useMediaQuery'
import type { Product } from '../../lib/types'
import { Link } from 'react-router-dom'
import { cn } from '../../lib/utils'

export function Search() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Product[]>([])
  const [showResults, setShowResults] = useState(false)
  const [loading, setLoading] = useState(false)
  const debouncedQuery = useDebounce(query, 250)
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!debouncedQuery || debouncedQuery.length < 2) {
      setResults([])
      return
    }
    setLoading(true)
    const q = `%${debouncedQuery}%`
    supabase
      .from('products')
      .select('id, name, slug, images, price, discount_price, brand:brands(name)')
      .or(`name.ilike.${q},slug.ilike.${q},sku.ilike.${q}`)
      .eq('is_published', true)
      .limit(5)
      .then(({ data }) => {
        setResults((data as Product[]) ?? [])
        setLoading(false)
      })
  }, [debouncedQuery])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowResults(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const clearSearch = () => {
    setQuery('')
    setResults([])
    setShowResults(false)
    inputRef.current?.focus()
  }

  const handleFocus = () => {
    if (query.length >= 2) setShowResults(true)
  }

  return (
    <div className="relative" ref={containerRef}>
      <div className="relative">
        <SearchIcon className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-primary-400" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={e => { setQuery(e.target.value); setShowResults(true) }}
          onFocus={handleFocus}
          placeholder="ابحث عن منتجات، علامات تجارية..."
          className="w-full sm:w-64 pl-10 pr-10 py-2.5 bg-primary-50 border border-primary-200 rounded-xl text-primary-900 placeholder:text-primary-400 focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold transition-all"
        />
        {query && (
          <button onClick={clearSearch} className="absolute left-3 top-1/2 -translate-y-1/2 text-primary-400 hover:text-primary-600">
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {showResults && (results.length > 0 || loading) && (
        <div className="absolute top-full right-0 left-0 mt-2 bg-white rounded-2xl shadow-card border border-primary-200 overflow-hidden z-50 animate-scale-in">
          {loading ? (
            <div className="p-4 flex items-center justify-center gap-2 text-primary-500">
              <span className="animate-spin">⟳</span> جاري البحث...
            </div>
          ) : results.length > 0 ? (
            <ul className="divide-y divide-primary-100">
              {results.map(product => (
                <li key={product.id}>
                  <Link
                    to={`/product/${product.slug}`}
                    className="flex items-center gap-3 p-3 hover:bg-primary-50 transition-colors"
                    onClick={() => setShowResults(false)}
                  >
                    <div className="w-12 h-12 rounded-xl overflow-hidden bg-primary-100 flex-shrink-0">
                      {product.images[0] ? (
                        <img src={product.images[0]} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-primary-300">📦</div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0 text-right">
                      <p className="font-medium text-primary-900 truncate">{product.name}</p>
                      {product.brand && <p className="text-sm text-primary-500">{product.brand.name}</p>}
                    </div>
                    <span className="text-gold font-semibold">
                      {product.discount_price ? `${product.discount_price} ر.س` : `${product.price} ر.س`}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <div className="p-6 text-center text-primary-500">لا توجد نتائج لـ "{query}"</div>
          )}
        </div>
      )}
    </div>
  )
}