'use client'

import { motion } from 'framer-motion'
import { TrendingUp, Users, Package, Activity } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { AnimatedCounter } from '@/components/motion-primitives/animated-counter'

const containerVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] as const },
  },
}

const itemVariants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: (i: number) => ({
    opacity: 1,
    scale: 1,
    transition: { delay: i * 0.1, duration: 0.5, ease: [0.16, 1, 0.3, 1] as const },
  }),
}

export function StatsBar() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['pistoleo-stats'],
    queryFn: async () => {
      const res = await fetch('/api/pistoleo/stats')
      if (!res.ok) throw new Error('Failed to fetch stats')
      return res.json()
    },
    refetchInterval: 30000,
  })

  const stats = [
    { 
      icon: <Package size={20} />, 
      label: 'Total Batches', 
      value: data?.totalBatches ?? 0,
      color: 'text-blue-500',
      bg: 'bg-blue-500/10'
    },
    { 
      icon: <TrendingUp size={20} />, 
      label: 'Total Items', 
      value: data?.totalItems ?? 0,
      color: 'text-emerald-500',
      bg: 'bg-emerald-500/10'
    },
    { 
      icon: <Activity size={20} />, 
      label: 'Scanned Items', 
      value: data?.scannedItems ?? 0,
      color: 'text-amber-500',
      bg: 'bg-amber-500/10'
    },
    { 
      icon: <Users size={20} />, 
      label: 'Active Batches', 
      value: data?.activeBatches ?? 0,
      color: 'text-purple-500',
      bg: 'bg-purple-500/10'
    },
  ]

  if (isLoading) return <div className="h-24 flex items-center justify-center text-neutral-400">Loading stats...</div>
  if (isError) return <div className="h-24 flex items-center justify-center text-red-400">Error loading statistics</div>

  return (
    <section className="py-12 bg-white border-y border-neutral-200">
      <motion.div 
        className="page-container grid grid-cols-2 lg:grid-cols-4 gap-4"
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
      >
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            custom={i}
            variants={itemVariants}
            className="p-4 rounded-2xl bg-neutral-50 border border-neutral-100 flex items-center gap-4 hover:shadow-md transition-shadow"
          >
            <div className={`p-3 rounded-xl ${stat.bg} ${stat.color}`}>
              {stat.icon}
            </div>
            <div>
              <p className="text-sm text-neutral-500 font-medium">{stat.label}</p>
              <p className="text-2xl font-bold text-neutral-900">
                <AnimatedCounter value={stat.value} />
              </p>
            </div>
          </motion.div>
        ))}
      </motion.div>
    </section>
  )
}
