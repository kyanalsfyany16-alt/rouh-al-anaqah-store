import { Link } from 'react-router-dom'
import { SEO } from '../components/SEO'

export function NotFoundPage() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
      <SEO title="الصفحة غير موجودة" description="الصفحة التي تبحث عنها غير موجودة." robots="noindex, nofollow" />
      <div className="w-20 h-20 rounded-full bg-primary-100 flex items-center justify-center mb-6">
        <span className="text-3xl font-display font-bold text-primary-400">404</span>
      </div>
      <h1 className="text-2xl font-display font-bold text-primary-900 mb-2">الصفحة غير موجودة</h1>
      <p className="text-primary-500 mb-6 max-w-md">الرابط الذي أدخلته غير صحيح أو تم نقل الصفحة. حاول العودة للرئيسية أو المتجر.</p>
      <div className="flex gap-3">
        <Link to="/" className="btn-gold">
          الرئيسية
        </Link>
        <Link to="/shop" className="btn-outline">
          المتجر
        </Link>
      </div>
    </div>
  )
}
