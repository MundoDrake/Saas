'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'

interface CtaButtonProps {
  text: string
  href: string
  color?: 'green' | 'blue' | 'yellow' | 'purple'
  size?: 'sm' | 'md' | 'lg'
}

export default function CtaButton({ 
  text, 
  href, 
  color = 'green', 
  size = 'md' 
}: CtaButtonProps) {
  const colorClasses = {
    green: 'border-green-500 hover:bg-green-500',
    blue: 'border-blue-500 hover:bg-blue-500',
    yellow: 'border-yellow-500 hover:bg-yellow-500',
    purple: 'border-purple-500 hover:bg-purple-500'
  }
  
  const sizeClasses = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg'
  }

  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      <Link 
        href={href}
        className={`inline-block text-white border ${colorClasses[color]} ${sizeClasses[size]} hover:text-black transition-colors duration-300`}
      >
        {text}
      </Link>
    </motion.div>
  )
}
