import { Link } from 'react-router-dom'
import { Facebook, Twitter, Instagram, MessageSquare, Send, MapPin, Phone, Mail } from 'lucide-react'
import { useSettings } from '../../contexts/SettingsContext'

export function Footer() {
  const { settings, social } = useSettings()

  const footerLinks = [
    { title: 'روابط سريعة', links: [
      { label: 'الرئيسية', href: '/' },
      { label: 'المتجر', href: '/shop' },
      { label: 'تواصل معنا', href: '/contact' },
      { label: 'سياسة الشحن', href: '/page/shipping-policy' },
      { label: 'سياسة الإرجاع', href: '/page/return-policy' },
    ]},
    { title: 'خدمة العملاء', links: [
      { label: 'طلباتي', href: '/orders' },
      { label: 'المفضلة', href: '/wishlist' },
      { label: 'تتبع الطلب', href: '/orders' },
      { label: 'الأسئلة الشائعة', href: '/page/faq' },
      { label: 'الشروط والأحكام', href: '/page/terms' },
    ]},
    { title: 'معلومات', links: [
      { label: 'من نحن', href: '/page/about-us' },
      { label: 'سياسة الخصوصية', href: '/page/privacy-policy' },
      { label: 'الوظائف', href: '/page/careers' },
      { label: 'المدونة', href: '/page/blog' },
    ]},
  ]

  return (
    <footer className="bg-primary-900 text-primary-100">
      <div className="container-app py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          <div className="lg:col-span-1">
            <Link to="/" className="flex items-center gap-3 mb-6" aria-label="الصفحة الرئيسية">
              <div className="w-12 h-12 rounded-xl bg-gold flex items-center justify-center">
                <span className="text-3xl font-bold text-primary-950">ر</span>
              </div>
              <span className="font-display font-bold text-2xl text-white">{settings?.store_name || 'روح الأناقة'}</span>
            </Link>
            <p className="text-primary-300 text-sm leading-relaxed mb-6">
              متجر إلكتروني رجالي فاخر يقدم أفضل المنتجات الرجالية من ملابس، أحذية، ساعات، عطور، شنط وإكسسوارات.
            </p>
            <div className="flex gap-4">
              {social.map(item => (
                <a
                  key={item.id}
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full bg-primary-800 flex items-center justify-center text-primary-200 hover:bg-gold hover:text-primary-950 transition-colors"
                  aria-label={item.platform}
                >
                  {item.icon && (
                    <span className="text-xl">{item.icon}</span>
                  )}
                </a>
              ))}
              {!social.length && (
                <>
                  <a href="#" className="w-10 h-10 rounded-full bg-primary-800 flex items-center justify-center text-primary-200 hover:bg-gold hover:text-primary-950 transition-colors" aria-label="فيسبوك"><Facebook className="w-5 h-5" /></a>
                  <a href="#" className="w-10 h-10 rounded-full bg-primary-800 flex items-center justify-center text-primary-200 hover:bg-gold hover:text-primary-950 transition-colors" aria-label="تويتر"><Twitter className="w-5 h-5" /></a>
                  <a href="#" className="w-10 h-10 rounded-full bg-primary-800 flex items-center justify-center text-primary-200 hover:bg-gold hover:text-primary-950 transition-colors" aria-label="انستغرام"><Instagram className="w-5 h-5" /></a>
                  <a href="#" className="w-10 h-10 rounded-full bg-primary-800 flex items-center justify-center text-primary-200 hover:bg-gold hover:text-primary-950 transition-colors" aria-label="سناب شات"><MessageSquare className="w-5 h-5" /></a>
                  <a href="#" className="w-10 h-10 rounded-full bg-primary-800 flex items-center justify-center text-primary-200 hover:bg-gold hover:text-primary-950 transition-colors" aria-label="واتساب"><Send className="w-5 h-5" /></a>
                </>
              )}
            </div>
          </div>

          {footerLinks.map((section, index) => (
            <div key={index}>
              <h4 className="font-bold text-white mb-4">{section.title}</h4>
              <ul className="space-y-3" role="list">
                {section.links.map((link, linkIndex) => (
                  <li key={linkIndex}>
                    <Link to={link.href} className="text-sm text-primary-300 hover:text-gold transition-colors">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div>
            <h4 className="font-bold text-white mb-4">تواصل معنا</h4>
            <ul className="space-y-3 text-sm text-primary-300" role="list">
              {settings?.phone && (
                <li className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-gold flex-shrink-0" />
                  <a href={`tel:${settings.phone}`} className="hover:text-gold transition-colors">{settings.phone}</a>
                </li>
              )}
              {settings?.email && (
                <li className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-gold flex-shrink-0" />
                  <a href={`mailto:${settings.email}`} className="hover:text-gold transition-colors">{settings.email}</a>
                </li>
              )}
              {settings?.address && (
                <li className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-gold flex-shrink-0 mt-0.5" />
                  <span>{settings.address}</span>
                </li>
              )}
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-primary-800">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-primary-400 text-center md:text-right">
              © {new Date().getFullYear()} {settings?.store_name || 'روح الأناقة'}. جميع الحقوق محفوظة.
            </p>
            <div className="flex items-center gap-6 text-sm text-primary-400">
              <Link to="/page/privacy-policy" className="hover:text-gold transition-colors">سياسة الخصوصية</Link>
              <Link to="/page/terms" className="hover:text-gold transition-colors">الشروط والأحكام</Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}