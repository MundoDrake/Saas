'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'

interface AnimatedImageProps {
  src: string
  alt: string
  width?: number
  height?: number
  className?: string
  priority?: boolean
}

export default function AnimatedImage({
  src,
  alt,
  width = 500,
  height = 300,
  className = '',
  priority = false
}: AnimatedImageProps) {
  return (
    <motion.div
      className={`overflow-hidden ${className}`}
      initial={{ opacity: 0, scale: 0.95 }}
      whileInView={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6 }}
      viewport={{ once: true }}
    >
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        className="w-full h-auto object-cover"
        priority={priority}
      />
    </motion.div>
  )
}
