'use client'

import { motion } from 'framer-motion'
// Removidas importações não utilizadas

interface AnimatedTextProps {
  text: string
  className?: string
  delay?: number
  staggerChildren?: number
  once?: boolean
}

export default function AnimatedText({
  text,
  className = '',
  delay = 0,
  staggerChildren = 0.03,
  once = true
}: AnimatedTextProps) {
  const words = text.split(' ')
  
  const container = {
    hidden: { opacity: 0 },
    visible: () => ({
      opacity: 1,
      transition: { 
        staggerChildren: staggerChildren, 
        delayChildren: delay,
      },
    }),
  }
  
  const child = {
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: 'spring',
        damping: 12,
        stiffness: 100,
      },
    },
    hidden: {
      opacity: 0,
      y: 20,
      transition: {
        type: 'spring',
        damping: 12,
        stiffness: 100,
      },
    },
  }

  return (
    <motion.div
      className={`overflow-hidden ${className}`}
      variants={container}
      initial="hidden"
      whileInView="visible"
      viewport={{ once }}
    >
      {words.map((word, index) => (
        <motion.span
          key={index}
          className="inline-block mr-1"
          variants={child}
        >
          {word}
        </motion.span>
      ))}
    </motion.div>
  )
}
