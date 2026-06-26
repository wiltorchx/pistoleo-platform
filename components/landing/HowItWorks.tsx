'use client'

import { motion } from 'framer-motion'
import { Scan, PackageSearch, FileCheck } from 'lucide-react'

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.2 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] as const },
  },
}

const steps = [
  {
    title: 'Escanear',
    description: 'Utiliza la pistola de escaneo para capturar los códigos de los items al ingresar al depósito.',
    icon: <Scan size={32} />,
    step: '01'
  },
  {
    title: 'Rastrear',
    description: 'El sistema asigna automáticamente el item al lote correspondiente y registra la ubicación.',
    icon: <PackageSearch size={32} />,
    step: '02'
  },
  {
    title: 'Reportar',
    description: 'Genera reportes instantáneos de stock, faltantes y productividad en tiempo real.',
    icon: <FileCheck size={32} />,
    step: '03'
  },
]

export function HowItWorks() {
  return (
    <section className="py-24 bg-white overflow-hidden">
      <div className="page-container">
        <div className="text-center mb-20">
          <h2 className="typo-section text-neutral-900 mb-4">Cómo Funciona</h2>
          <p className="typo-subtitle text-neutral-500 max-w-2xl mx-auto">
            Un flujo de trabajo optimizado para eliminar cuellos de botella en tu recepción de mercadería.
          </p>
        </div>

        <div className="relative">
          {/* Connecting line for desktop */}
          <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-0.5 bg-neutral-100 -translate-y-1/2 z-0" />
          
          <motion.div 
            className="grid grid-cols-1 lg:grid-cols-3 gap-12 relative z-10"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            {steps.map((step, i) => (
              <motion.div
                key={step.title}
                variants={itemVariants}
                className="flex flex-col items-center text-center group"
              >
                <div className="relative mb-8">
                  <div className="w-20 h-20 rounded-3xl bg-primary-50 text-primary-600 flex items-center justify-center group-hover:bg-primary-600 group-hover:text-white transition-all duration-500 shadow-xl shadow-primary-500/10">
                    {step.icon}
                  </div>
                  <div className="absolute -top-4 -right-4 w-10 h-10 bg-white border-2 border-primary-500 text-primary-600 rounded-full flex items-center justify-center font-bold text-sm shadow-sm">
                    {step.step}
                  </div>
                </div>
                <h3 className="text-xl font-bold text-neutral-900 mb-3">{step.title}</h3>
                <p className="text-neutral-500 leading-relaxed max-w-xs mx-auto">
                  {step.description}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  )
}
