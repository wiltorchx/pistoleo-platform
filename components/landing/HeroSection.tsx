'use client'

import { motion } from 'framer-motion'
import { Barcode, Scan, Package } from 'lucide-react'
import Link from 'next/link'
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
    <section className="relative min-h-[90dvh] flex items-center overflow-hidden bg-gradient-hero">
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjBpIGhlaWdodT0iNjBpIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PHBhdGggZD0iTTM2IDM0djItSDI0di0yaDEyek0zNiAyNHYySDI0di0yaDEyeiIvPjwvZz48L2c+PC9zdmc+')] opacity-50" />
      
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-neutral-50/10" />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary-500/10 rounded-full blur-[120px]" />
      
      <motion.div
        className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-secondary-400 to-transparent opacity-70"
        animate={{ top: ['0%', '100%', '0%'] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
      />

      <motion.div
        className="page-container relative z-10 w-full grid grid-cols-1 lg:grid-cols-2 gap-12 items-center"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <div className="text-center lg:text-left">
          <motion.div variants={itemVariants} className="mb-6">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/20 text-white/80 text-sm font-medium backdrop-blur-sm">
              <Scan size={16} className="text-secondary-400" />
              Sistema de Control de Inventario
            </span>
          </motion.div>

          <motion.h1
            variants={itemVariants}
            className="typo-display text-white mb-6"
          >
            {APP_NAME}
          </motion.h1>

          <motion.p
            variants={itemVariants}
            className="typo-subtitle text-white/70 max-w-xl mx-auto lg:mx-0 mb-10"
          >
            Gestión inteligente de lotes, escaneo de códigos y trazabilidad completa
            para el control de inventario de tu empresa.
          </motion.p>

          <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
            <Link
              href={ROUTES.LOGIN}
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-primary-700 rounded-xl font-bold hover:bg-white/90 transition-all shadow-lg shadow-primary-900/20"
            >
              <Scan size={20} />
              Iniciar Sesión
            </Link>
            <Link
              href={ROUTES.ADMIN_DASHBOARD}
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white/10 border border-white/30 text-white rounded-xl font-bold hover:bg-white/20 transition-all backdrop-blur-sm"
            >
              <Package size={20} />
              Ir al Dashboard
            </Link>
          </motion.div>
        </div>

        <motion.div 
          variants={itemVariants}
          className="relative hidden lg:block"
        >
          <div className="relative z-10 rounded-3xl overflow-hidden shadow-2xl border-4 border-white/20 aspect-[4/3]">
            <img 
              src="https://images.unsplash.com/photo-1586528116311-ad8de9c20fb1?auto=format&fit=crop&q=80&w=1200" 
              alt="Pistoleo Warehouse" 
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-primary-900/40 to-transparent" />
          </div>
          <div className="absolute -top-6 -right-6 w-32 h-32 bg-secondary-500/20 rounded-full blur-3xl" />
          <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-primary-500/20 rounded-full blur-3xl" />
        </motion.div>
      </motion.div>

      <motion.div
        className="page-container relative z-10 w-full mt-20"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto pb-16">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              custom={i}
              variants={kpiVariants}
              initial="hidden"
              animate="visible"
              className="flex items-center gap-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl px-5 py-4"
            >
              <span className="text-secondary-400">{stat.icon}</span>
              <div>
                <p className="text-2xl font-bold text-white">{stat.value.toLocaleString()}</p>
                <p className="text-xs text-white/60">{stat.label}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </section>
  )
}
