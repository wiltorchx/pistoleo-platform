'use client'

import { motion } from 'framer-motion'
import { Zap } from 'lucide-react'
import Link from 'next/link'
import { ROUTES } from '@/shared/utils/constants'

export function CtaSection() {
  return (
    <section className="py-24 bg-neutral-50">
      <div className="page-container">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="relative overflow-hidden rounded-3xl bg-primary-700 px-8 py-16 text-center text-white shadow-2xl"
        >
          {/* Background decorations */}
          <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/4 w-96 h-96 bg-primary-500/30 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/4 w-96 h-96 bg-secondary-500/20 rounded-full blur-3xl" />

          <div className="relative z-10 max-w-2xl mx-auto">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 text-white mb-8">
              <Zap size={32} className="text-secondary-400" />
            </div>
            <h2 className="typo-section text-white mb-6">¿Listo para optimizar tu inventario?</h2>
            <p className="typo-subtitle text-white/70 mb-10">
              Únete a las empresas que ya han eliminado el error humano y han acelerado su logística con Pistoleo.
            </p>
            <Link
              href={ROUTES.LOGIN}
              className="inline-flex items-center justify-center gap-2 px-10 py-4 bg-white text-primary-700 rounded-xl font-bold hover:bg-white/90 transition-all shadow-xl shadow-black/20"
            >
              Acceder al Sistema
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
