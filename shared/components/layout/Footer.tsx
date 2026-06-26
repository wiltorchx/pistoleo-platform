import Link from 'next/link'
import { Barcode } from 'lucide-react'
import { APP_NAME } from '@/shared/utils/constants'

export function Footer() {
  return (
    <footer className="bg-neutral-900 text-white border-t border-white/10">
      <div className="page-container py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-xl font-bold">
              <Barcode className="text-secondary-400" />
              <span>{APP_NAME}</span>
            </div>
            <p className="text-neutral-400 text-sm leading-relaxed">
              Sistema profesional de gestión de inventarios y trazabilidad de mercadería.
            </p>
          </div>
          
          <div className="grid grid-cols-2 gap-8">
            <div className="space-y-4">
              <h4 className="font-bold text-white">Plataforma</h4>
              <ul className="space-y-2 text-sm text-neutral-400">
                <li><Link href="/admin" className="hover:text-white transition-colors">Dashboard</Link></li>
                <li><Link href="/admin/lotes" className="hover:text-white transition-colors">Lotes</Link></li>
                <li><Link href="/admin/items" className="hover:text-white transition-colors">Items</Link></li>
              </ul>
            </div>
            <div className="space-y-4">
              <h4 className="font-bold text-white">Legal</h4>
              <ul className="space-y-2 text-sm text-neutral-400">
                <li><Link href="/privacidad" className="hover:text-white transition-colors">Privacidad</Link></li>
                <li><Link href="/terminos" className="hover:text-white transition-colors">Términos</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="flex flex-col justify-between items-end">
            <div className="text-right text-sm text-neutral-400">
              © {new Date().getFullYear()} {APP_NAME}
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
