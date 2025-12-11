'use client'

import { useEffect } from 'react'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import ScrollProgress from '@/components/ui/ScrollProgress'

export default function MainLayout({
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
    <div className="flex flex-col min-h-screen bg-black">
      <ScrollProgress color="bg-green-500" />
      <Header />
      <main className="flex-grow">
        {children}
      </main>
      <Footer />
    </div>
  )
}
