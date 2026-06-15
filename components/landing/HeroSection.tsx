'use client'

import { motion } from 'framer-motion'
import { Barcode, Scan, Package } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { APP_NAME, ROUTES } from '@/shared/utils/constants'

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15, delayChildren: 0.2 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] as const },
  },
}

const kpiVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: 0.8 + i * 0.15, duration: 0.6, ease: [0.16, 1, 0.3, 1] as const },
  }),
}

const stats = [
  { icon: <Package size={24} />, label: 'Lotes Activos', value: 12 },
  { icon: <Barcode size={24} />, label: 'Items Registrados', value: 2847 },
  { icon: <Scan size={24} />, label: 'Escaneos Hoy', value: 156 },
]

export function HeroSection() {
  return (
    <section className="relative min-h-[80vh] flex items-center bg-surface-dark overflow-hidden">
      <div className="page-container relative z-10 w-full grid grid-cols-1 lg:grid-cols-2 gap-12 items-center py-20">
        <div className="text-center lg:text-left">
          <motion.div variants={itemVariants} className="mb-6">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary-900/20 border border-primary-500/30 text-primary-400 text-sm font-medium">
              <Scan size={16} />
              Sistema de Control de Inventario
            </span>
          </motion.div>

          <motion.h1
            variants={itemVariants}
            className="text-5xl lg:text-7xl font-bold text-white mb-6 tracking-tight"
          >
            {APP_NAME}
          </motion.h1>

          <motion.p
            variants={itemVariants}
            className="text-lg lg:text-xl text-gray-400 max-w-xl mx-auto lg:mx-0 mb-10"
          >
            Gestión inteligente de lotes, escaneo de códigos y trazabilidad completa
            para el control de inventario de tu empresa.
          </motion.p>

          <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
            <Link
              href={ROUTES.LOGIN}
              className="inline-flex items-center justify-center gap-2 px-8 py-3 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-500 transition-colors"
            >
              <Scan size={20} />
              Iniciar Sesión
            </Link>
            <Link
              href={ROUTES.ADMIN_DASHBOARD}
              className="inline-flex items-center justify-center gap-2 px-8 py-3 bg-surface-dark-elevated border border-gray-700 text-white rounded-lg font-semibold hover:bg-gray-800 transition-colors"
            >
              <Package size={20} />
              Ir al Dashboard
            </Link>
          </motion.div>
        </div>

        <div className="hidden lg:flex items-center justify-center p-8 bg-surface-dark-elevated rounded-2xl border border-gray-800">
           {/* Replace broken image with a clean icon grid */}
           <div className="grid grid-cols-2 gap-4">
               <div className="p-6 bg-gray-900 rounded-xl border border-gray-800">
                   <Barcode size={48} className="text-primary-500" />
               </div>
               <div className="p-6 bg-gray-900 rounded-xl border border-gray-800">
                   <Scan size={48} className="text-primary-500" />
               </div>
                <div className="p-6 bg-gray-900 rounded-xl border border-gray-800">
                   <Package size={48} className="text-primary-500" />
               </div>
               <div className="p-6 bg-gray-900 rounded-xl border border-gray-800">
                   <div className="w-12 h-12 bg-primary-500 rounded-full" />
               </div>
           </div>
        </div>
      </div>
    </section>
  )
}
