'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
// Removida importação não utilizada de Image
import { motion } from 'framer-motion'
import ThemeSwitcher from '@/components/ui/ThemeSwitcher'

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  
  // Detectar scroll para mudar o estilo do header
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setScrolled(true)
      } else {
        setScrolled(false)
      }
    }
    
    window.addEventListener('scroll', handleScroll)
    return () => {
      window.removeEventListener('scroll', handleScroll)
    }
  }, [])

  return (
    <header className={`fixed top-0 left-0 w-full z-50 px-4 py-4 transition-all duration-300 ${scrolled ? 'bg-black/80 backdrop-blur-md' : 'bg-transparent'}`}>
      <div className="container-custom flex justify-between items-center">
        <motion.div 
          className="flex items-center"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Link href="/" className="text-white">
            <div className="w-10 h-10 bg-green-500 flex items-center justify-center">
              <span className="font-bold text-black">P</span>
            </div>
          </Link>
        </motion.div>

        <nav className="hidden md:flex items-center space-x-8">
          {[
            { label: 'Home', href: '/' },
            { label: 'Projetos', href: '/projetos' },
            { label: 'Metodologia', href: '/metodologia' },
            { label: 'Sobre', href: '/sobre' },
            { label: 'Contato', href: '/contato' }
          ].map((item, index) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              <Link
                href={item.href}
                className="text-white hover:text-green-500 transition-colors relative group"
              >
                {item.label}
                <span className="absolute left-0 bottom-0 w-0 h-0.5 bg-green-500 transition-all duration-300 group-hover:w-full"></span>
              </Link>
            </motion.div>
          ))}
        </nav>
        
        <div className="flex items-center space-x-4">
          <ThemeSwitcher className="hidden md:block" />
          
          <motion.button 
            className="md:hidden text-white"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            whileTap={{ scale: 0.9 }}
            aria-label="Menu"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              {isMenuOpen ? (
                <>
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </>
              ) : (
                <>
                  <line x1="3" y1="12" x2="21" y2="12"></line>
                  <line x1="3" y1="6" x2="21" y2="6"></line>
                  <line x1="3" y1="18" x2="21" y2="18"></line>
                </>
              )}
            </svg>
          </motion.button>
        </div>

        {/* Menu Mobile */}
        {isMenuOpen && (
          <motion.div 
            className="mobile-menu"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.nav 
              className="flex flex-col items-center space-y-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              {[
                { label: 'Home', href: '/' },
                { label: 'Projetos', href: '/projetos' },
                { label: 'Metodologia', href: '/metodologia' },
                { label: 'Sobre', href: '/sobre' },
                { label: 'Contato', href: '/contato' }
              ].map((item, index) => (
                <motion.div
                  key={item.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + index * 0.1 }}
                >
                  <Link
                    href={item.href}
                    className="text-white text-2xl hover:text-green-500 transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {item.label}
                  </Link>
                </motion.div>
              ))}
              
              <ThemeSwitcher className="mt-8" />
            </motion.nav>
          </motion.div>
        )}
      </div>
    </header>
  )
}
