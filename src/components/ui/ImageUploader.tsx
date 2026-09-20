import { useState, useRef, useCallback, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks'
import { Upload, X, Image as ImageIcon, Loader2, AlertCircle } from 'lucide-react'
import { cn } from '../../lib/utils'
import { isValidImageFile, getStoragePath } from '../../lib/utils'

type Bucket = 'product-images' | 'category-images' | 'brand-images' | 'banner-images' | 'store-assets' | 'payment-receipts'

interface SingleProps {
  bucket: Bucket
  path?: string
  value?: string | null
  onChange: (url: string | null) => void
  label?: string
  multiple?: false
}

interface MultipleProps {
  bucket: Bucket
  path?: string
  value?: string[]
  onChange: (urls: string[]) => void
  label?: string
  multiple: true
}

type ImageUploaderProps = SingleProps | MultipleProps

export function ImageUploader(props: ImageUploaderProps) {
  const { bucket, path = '', label = 'اختيار صورة' } = props
  const multiple = (props as MultipleProps).multiple === true
  const { user } = useAuth()

  const singleValue = !multiple ? (props as SingleProps).value ?? null : null
  const multiValue = multiple ? (props as MultipleProps).value ?? [] : []

  const [preview, setPreview] = useState<string | null>(singleValue)
  const [multiPreviews, setMultiPreviews] = useState<string[]>(multiValue)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!multiple) setPreview(singleValue)
    else setMultiPreviews(multiValue)
  }, [singleValue, multiValue, multiple])

  const getPrefix = () => {
    if (path) return path
    // Structured path: bucket/userId/
    if (user?.id) return `${user.id}`
    return ''
  }

  const uploadFile = async (file: File): Promise<string> => {
    const validation = isValidImageFile(file)
    if (!validation.valid) throw new Error(validation.error)

    const prefix = getPrefix()
    const storagePath = prefix ? `${prefix}/${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${file.name.split('.').pop()}` : getStoragePath(bucket, file.name)
    // If prefix provided, storagePath already includes it; otherwise getStoragePath gives bucket/timestamp
    // Ensure storagePath doesn't include bucket twice
    const finalPath = prefix ? storagePath : storagePath.replace(`${bucket}/`, '')

    const { error: uploadError } = await supabase.storage.from(bucket).upload(finalPath, file, {
      cacheControl: '3600',
      upsert: false,
    })
    if (uploadError) throw uploadError
    const { data } = supabase.storage.from(bucket).getPublicUrl(finalPath)
    return data.publicUrl
  }

  const handleFiles = async (files: FileList | File[]) => {
    setError(null)
    const fileArray = Array.from(files)
    if (!multiple && fileArray.length > 1) {
      setError('يمكن رفع صورة واحدة فقط')
      return
    }
    // Validate all files first (MIME + size)
    for (const f of fileArray) {
      const v = isValidImageFile(f)
      if (!v.valid) {
        setError(v.error ?? 'ملف غير صالح')
        return
      }
    }
    setUploading(true)
    try {
      if (multiple) {
        const urls: string[] = []
        let hasError = false
        for (const f of fileArray) {
          try {
            const url = await uploadFile(f)
            urls.push(url)
          } catch (e) {
            hasError = true
            setError(e instanceof Error ? e.message : 'فشل رفع إحدى الصور')
          }
        }
        if (urls.length) {
          const newUrls = [...multiPreviews, ...urls]
          setMultiPreviews(newUrls)
          ;(props as MultipleProps).onChange(newUrls)
        }
        if (hasError && urls.length === 0) throw new Error('فشل رفع الصور')
      } else {
        const file = fileArray[0]
        // Delete old file if replacing (avoid orphan)
        if (preview) {
          const oldPath = extractPath(preview)
          if (oldPath) await supabase.storage.from(bucket).remove([oldPath])
        }
        const reader = new FileReader()
        reader.onload = (e) => setPreview(e.target?.result as string)
        reader.readAsDataURL(file)
        const url = await uploadFile(file)
        setPreview(url)
        ;(props as SingleProps).onChange(url)
      }
    } catch (err) {
      if (!error) setError(err instanceof Error ? err.message : 'فشل رفع الصورة')
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      if (e.dataTransfer.files.length) handleFiles(e.dataTransfer.files)
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  )

  const extractPath = (publicUrl: string): string | null => {
    try {
      const marker = `/object/public/${bucket}/`
      const idx = publicUrl.indexOf(marker)
      if (idx === -1) return null
      return publicUrl.substring(idx + marker.length)
    } catch {
      return null
    }
  }

  const removeSingle = async () => {
    if (preview) {
      const p = extractPath(preview)
      if (p) await supabase.storage.from(bucket).remove([p])
    }
    setPreview(null)
    ;(props as SingleProps).onChange(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const removeMulti = async (idx: number) => {
    const url = multiPreviews[idx]
    const p = url ? extractPath(url) : null
    if (p) await supabase.storage.from(bucket).remove([p])
    const newUrls = multiPreviews.filter((_, i) => i !== idx)
    setMultiPreviews(newUrls)
    ;(props as MultipleProps).onChange(newUrls)
  }

  const setAsMain = (idx: number) => {
    if (idx === 0) return
    const newUrls = [multiPreviews[idx], ...multiPreviews.filter((_, i) => i !== idx)]
    setMultiPreviews(newUrls)
    ;(props as MultipleProps).onChange(newUrls)
  }

  const trigger = () => fileInputRef.current?.click()
  const hasSingle = !!preview
  const accept = 'image/jpeg,image/png,image/webp'

  if (multiple) {
    return (
      <div className="w-full max-w-full min-w-0">
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          multiple
          onChange={(e) => e.target.files && handleFiles(e.target.files)}
          className="hidden"
          disabled={uploading}
        />
        <div
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          className={cn('w-full max-w-full rounded-2xl border-2 border-dashed p-3 sm:p-4 overflow-hidden', uploading ? 'opacity-60' : 'border-primary-300 hover:border-gold hover:bg-gold/5')}
        >
          {multiPreviews.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3 mb-4 w-full max-w-full">
              {multiPreviews.map((url, i) => (
                <div key={i} className="relative aspect-square rounded-xl overflow-hidden border border-primary-200 group w-full max-w-full min-w-0">
                  <img src={url} alt={`صورة ${i + 1}`} className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeMulti(i)}
                    className="absolute top-1 left-1 p-1 bg-red-500/90 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    aria-label="حذف"
                  >
                    <X className="h-3 w-3" />
                  </button>
                  {i === 0 ? (
                    <span className="absolute bottom-1 right-1 bg-gold text-primary-950 text-[10px] px-1.5 py-0.5 rounded-full">رئيسية</span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setAsMain(i)}
                      className="absolute bottom-1 right-1 bg-primary-900/80 text-white text-[10px] px-1.5 py-0.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      تعيين رئيسية
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
          <button
            type="button"
            onClick={trigger}
            disabled={uploading}
            className="w-full max-w-full flex flex-col items-center justify-center gap-1 sm:gap-2 py-4 sm:py-6 px-2 text-primary-500 hover:text-gold transition-colors disabled:opacity-50 min-w-0"
          >
            {uploading ? <Loader2 className="h-5 w-5 sm:h-6 sm:w-6 animate-spin" /> : <Upload className="h-5 w-5 sm:h-6 sm:w-6" />}
            <span className="text-sm font-medium truncate max-w-full">{uploading ? 'جاري الرفع...' : label}</span>
            <span className="text-xs text-primary-400 text-center px-2">اسحب وأفلت أو انقر للاختيار — JPEG/PNG/WebP حتى 5MB</span>
          </button>
          {error && (
            <div className="mt-3 px-3 py-2 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              <span>{error}</span>
            </div>
          )}
        </div>
      </div>
    )
  }

  // Single mode
  return (
    <div className="w-full max-w-full min-w-0">
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={(e) => e.target.files?.[0] && handleFiles(e.target.files)}
        className="hidden"
        disabled={uploading}
      />
      <div
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        className={cn(
          'relative w-full max-w-full border-2 border-dashed rounded-2xl transition-all overflow-hidden min-w-0',
          hasSingle ? 'border-transparent bg-transparent' : 'border-primary-300 hover:border-gold hover:bg-gold/5',
          uploading && 'opacity-75'
        )}
      >
        {hasSingle ? (
          <div className="relative w-full max-w-full aspect-square rounded-xl overflow-hidden min-w-0">
            <img src={preview!} alt="معاينة" className="w-full h-full object-cover rounded-xl" />
            {uploading && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-xl text-white">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            )}
            <button
              type="button"
              onClick={removeSingle}
              disabled={uploading}
              className="absolute top-2 left-2 p-1.5 bg-red-500/90 text-white rounded-full hover:bg-red-600"
              aria-label="حذف"
            >
              <X className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={trigger}
              disabled={uploading}
              className="absolute bottom-2 left-2 p-1.5 bg-primary-900/90 text-white rounded-full hover:bg-primary-800"
              aria-label="تغيير"
            >
              <ImageIcon className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={trigger}
            disabled={uploading}
            className="w-full max-w-full aspect-square flex flex-col items-center justify-center gap-2 sm:gap-3 p-4 sm:p-8 text-center text-primary-500 hover:text-gold disabled:opacity-50 min-w-0 overflow-hidden"
          >
            <div className="p-2 sm:p-3 bg-primary-100 rounded-full shrink-0">
              <Upload className="h-6 w-6 sm:h-8 sm:w-8" />
            </div>
            <span className="font-medium text-sm sm:text-base truncate max-w-full px-2">{label}</span>
            <p className="text-xs sm:text-sm text-primary-400">أو اسحب وأفلت الصورة هنا</p>
            <p className="text-xs text-primary-300">JPG, PNG, WebP • حتى 5MB</p>
          </button>
        )}
        {error && (
          <div className="absolute bottom-full left-0 right-0 mb-2 px-3 py-2 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            <span>{error}</span>
          </div>
        )}
      </div>
    </div>
  )
}
