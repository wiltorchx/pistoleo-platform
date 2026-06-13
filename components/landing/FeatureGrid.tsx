'use client'

import { motion } from 'framer-motion'
import { Scan, Activity, ClipboardCheck, ShieldCheck, Zap, BarChart3 } from 'lucide-react'

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

const features = [
  {
    title: 'Escaneo Rápido',
    description: 'Captura instantánea de códigos de barras y QR con alta precisión, optimizando el tiempo de recepción.',
    icon: <Scan size={28} />,
    color: 'text-blue-500',
    bg: 'bg-blue-500/10',
    gradient: 'from-blue-500/20 to-transparent'
  },
  {
    title: 'Trazabilidad Total',
    description: 'Sigue cada item desde su llegada hasta el despacho final, con un historial detallado de movimientos.',
    icon: <Activity size={28} />,
    color: 'text-emerald-500',
    bg: 'bg-emerald-500/10',
    gradient: 'from-emerald-500/20 to-transparent'
  },
  {
    title: 'Reportes en Tiempo Real',
    description: 'Monitorea la productividad y el estado de tus lotes con dashboards actualizados al segundo.',
    icon: <BarChart3 size={28} />,
    color: 'text-amber-500',
    bg: 'bg-amber-500/10',
    gradient: 'from-amber-500/20 to-transparent'
  },
  {
    title: 'Control de Calidad',
    description: 'Valida la integridad de los items escaneados y detecta discrepancias automáticamente.',
    icon: <ShieldCheck size={28} />,
    color: 'text-purple-500',
    bg: 'bg-purple-500/10',
    gradient: 'from-purple-500/20 to-transparent'
  },
  {
    title: 'Gestión de Lotes',
    description: 'Organiza la mercadería en lotes lógicos para una búsqueda y despacho mucho más eficientes.',
    icon: <ClipboardCheck size={28} />,
    color: 'text-rose-500',
    bg: 'bg-rose-500/10',
    gradient: 'from-rose-500/20 to-transparent'
  },
  {
    title: 'Sincronización Instantánea',
    description: 'Accede a la información desde cualquier dispositivo conectado, eliminando el uso de papel.',
    icon: <Zap size={28} />,
    color: 'text-indigo-500',
    bg: 'bg-indigo-500/10',
    gradient: 'from-indigo-500/20 to-transparent'
  },
]

export function FeatureGrid() {
  return (
    <section className="py-24 bg-neutral-50">
      <div className="page-container">
        <div className="text-center mb-16">
          <h2 className="typo-section text-neutral-900 mb-4">Potencia tu Operación</h2>
          <p className="typo-subtitle text-neutral-500 max-w-2xl mx-auto">
            Diseñado específicamente para la logística de alta velocidad, Pistoleo elimina el error humano y maximiza la eficiencia.
          </p>
        </div>

        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              variants={itemVariants}
              className="group relative p-8 bg-white rounded-3xl border border-neutral-200 hover:border-primary-500/30 transition-all hover:shadow-xl hover:-translate-y-1 overflow-hidden"
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
              
              <div className="relative z-10">
                <div className={`w-14 h-14 rounded-2xl ${feature.bg} ${feature.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold text-neutral-900 mb-3">{feature.title}</h3>
                <p className="text-neutral-500 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
