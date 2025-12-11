'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'

export default function ScrollToTop() {
  const [isVisible, setIsVisible] = useState(false)
  
  useEffect(() => {
    const toggleVisibility = () => {
      if (window.scrollY > 500) {
        setIsVisible(true)
      } else {
        setIsVisible(false)
      }
    }
    
    window.addEventListener('scroll', toggleVisibility)
    
    return () => {
      window.removeEventListener('scroll', toggleVisibility)
    }
  }, [])
  
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    })
  }
  
  return (
    <motion.button
      className={`fixed bottom-6 right-6 w-12 h-12 rounded-full bg-green-500 text-black flex items-center justify-center shadow-lg z-50 ${isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
      onClick={scrollToTop}
      initial={{ scale: 0 }}
      animate={{ scale: isVisible ? 1 : 0 }}
      transition={{ duration: 0.3 }}
      aria-label="Voltar ao topo"
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 19V5M5 12l7-7 7 7"/>
      </svg>
    </motion.button>
  )
}
