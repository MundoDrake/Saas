'use client'

import { motion } from 'framer-motion'

interface SectionTitleProps {
  title: string
  subtitle?: string
  align?: 'left' | 'center' | 'right'
}

export default function SectionTitle({ title, subtitle, align = 'left' }: SectionTitleProps) {
  const textAlign = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right'
  }

  return (
    <motion.div 
      className={`mb-12 ${textAlign[align]}`}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      viewport={{ once: true }}
    >
      <h2 className="text-3xl md:text-4xl font-bold text-white">{title}</h2>
      {subtitle && (
        <p className="text-xl text-gray-300 max-w-3xl mt-4 mx-auto">
          {subtitle}
        </p>
      )}
    </motion.div>
  )
}
