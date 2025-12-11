'use client'

import { motion } from 'framer-motion'
import AnimatedText from '@/components/ui/AnimatedText'
// Removida importação não utilizada de CtaButton

export default function Hero() {
  return (
    <section className="h-screen w-full flex items-center justify-center bg-black relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-black/50 to-black z-10"></div>
      
      <div className="absolute inset-0 bg-[url('/hero-bg.jpg')] bg-center bg-cover opacity-30"></div>
      
      <div className="relative z-20 text-center px-4 max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <AnimatedText 
            text="SEJA © ANGULAR"
            className="text-5xl md:text-7xl lg:text-8xl font-bold text-white mb-6"
            staggerChildren={0.05}
          />
          
          <motion.p 
            className="text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto mb-12"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.8 }}
          >
            Para garantir a mensagem e posicionamento claro de uma marca, uso uma metodologia que me permite fazer as perguntas certas para revelar as respostas certas.
          </motion.p>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 1.2 }}
          >
            <a 
              href="#explore" 
              className="inline-flex items-center text-white border border-green-500 px-6 py-3 hover:bg-green-500 hover:text-black transition-colors duration-300"
            >
              Explore
              <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
            </a>
          </motion.div>
        </motion.div>
      </div>
      
      <motion.div 
        className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-20"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 1.5 }}
      >
        <div className="w-6 h-10 border-2 border-white rounded-full flex justify-center">
          <motion.div 
            className="w-1 h-2 bg-white rounded-full mt-2"
            animate={{ 
              y: [0, 12, 0],
              opacity: [1, 0.5, 1]
            }}
            transition={{ 
              duration: 1.5, 
              repeat: Infinity,
              repeatType: "loop" 
            }}
          />
        </div>
      </motion.div>
    </section>
  )
}
