'use client'

import { motion } from 'framer-motion'

interface MethodologyStepProps {
  number: string
  title: string
  description: string
  color: string
  delay?: number
}

export default function MethodologyStep({ 
  number, 
  title, 
  description, 
  color,
  delay = 0
}: MethodologyStepProps) {
  return (
    <motion.div 
      className={`bg-zinc-900 p-6 border-t-4 ${color} h-full`}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: delay * 0.1 }}
      viewport={{ once: true }}
    >
      <div className="flex items-center mb-4">
        <span className={`text-${color.split('-')[1]}-500 text-3xl font-bold mr-3`}>{number}</span>
        <h3 className="text-2xl font-bold text-white">{title}</h3>
      </div>
      <p className="text-gray-400">{description}</p>
    </motion.div>
  )
}
