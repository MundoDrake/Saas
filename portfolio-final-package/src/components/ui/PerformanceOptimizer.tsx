
'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'

export default function PerformanceOptimizer() {
  const [isLoaded, setIsLoaded] = useState(false)
  
  useEffect(() => {
    // Simular carregamento completo da página
    const timer = setTimeout(() => {
      setIsLoaded(true)
      
      // Registrar métricas de performance
      if (typeof window !== 'undefined' && 'performance' in window) {
        const performanceMetrics = {
          loadTime: window.performance.timing.domContentLoadedEventEnd - window.performance.timing.navigationStart,
          domInteractive: window.performance.timing.domInteractive - window.performance.timing.navigationStart,
          domComplete: window.performance.timing.domComplete - window.performance.timing.navigationStart
        }
        
        console.log('Performance Metrics:', performanceMetrics)
      }
    }, 1000)
    
    return () => clearTimeout(timer)
  }, [])
  
  // Lazy loading para imagens
  useEffect(() => {
    if ('loading' in HTMLImageElement.prototype) {
      const images = document.querySelectorAll('img[loading="lazy"]')
      images.forEach(img => {
        // Cast img to HTMLImageElement before accessing src and dataset
        const imageElement = img as HTMLImageElement;
        imageElement.src = imageElement.dataset.src || ''
      })
    } else {
      // Fallback para navegadores que não suportam lazy loading nativo
      const script = document.createElement('script')
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/lazysizes/5.3.2/lazysizes.min.js'
      document.body.appendChild(script)
    }
  }, [isLoaded])
  
  return (
    <>
      {!isLoaded && (
        <motion.div
          className="fixed inset-0 bg-black z-50 flex items-center justify-center"
          initial={{ opacity: 1 }}
          animate={{ opacity: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          onAnimationComplete={() => {
            const elem = document.getElementById('page-loader')
            if (elem) elem.style.display = 'none'
          }}
          id="page-loader"
        >
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-t-green-500 border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-white text-lg">Carregando...</p>
          </div>
        </motion.div>
      )}
    </>
  )
}

