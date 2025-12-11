'use client'

import { useEffect } from 'react'
// Removida importação não utilizada de framer-motion
import MainLayout from '@/components/layout/MainLayout'
import ScrollToTop from '@/components/ui/ScrollToTop'
import PerformanceOptimizer from '@/components/ui/PerformanceOptimizer'
import SEOOptimizer from '@/components/ui/SEOOptimizer'
import AccessibilityEnhancer from '@/components/ui/AccessibilityEnhancer'
import CrossBrowserTester from '@/components/ui/CrossBrowserTester'

export default function RootLayout({
  children
}: {
  children: React.ReactNode
}) {
  // Efeito para animação de fade-in na página
  useEffect(() => {
    document.body.classList.add('animate-fade-in')
    return () => {
      document.body.classList.remove('animate-fade-in')
    }
  }, [])

  return (
    <>
      <SEOOptimizer />
      <PerformanceOptimizer />
      <AccessibilityEnhancer />
      <CrossBrowserTester />
      <MainLayout>
        {children}
      </MainLayout>
      <ScrollToTop />
    </>
  )
}
