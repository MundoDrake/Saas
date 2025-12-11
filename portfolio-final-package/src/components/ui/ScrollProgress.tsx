'use client'

import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'

interface ScrollProgressProps {
  color?: string
}

export default function ScrollProgress({ color = 'bg-green-500' }: ScrollProgressProps) {
  const [scrollProgress, setScrollProgress] = useState(0)
  
  useEffect(() => {
    const handleScroll = () => {
      const totalHeight = document.body.scrollHeight - window.innerHeight
      const progress = (window.scrollY / totalHeight) * 100
      setScrollProgress(progress)
    }
    
    window.addEventListener('scroll', handleScroll)
    
    return () => {
      window.removeEventListener('scroll', handleScroll)
    }
  }, [])
  
  return (
    <motion.div 
      className="fixed top-0 left-0 right-0 h-1 z-50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.5 }}
    >
      <motion.div 
        className={color}
        style={{ width: `${scrollProgress}%`, height: '100%' }}
      />
    </motion.div>
  )
}
