'use client'

import { useEffect } from 'react'

export default function SEOOptimizer() {
  useEffect(() => {
    // Adicionar metadados estruturados para melhorar SEO
    const script = document.createElement('script')
    script.type = 'application/ld+json'
    script.text = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'ProfessionalService',
      'name': 'Portfólio de Design',
      'description': 'Portfólio de design e estratégia de marcas',
      'url': 'https://www.portfolio.com.br',
      'sameAs': [
        'https://www.behance.net',
        'https://www.linkedin.com',
        'https://www.instagram.com'
      ],
      'address': {
        '@type': 'PostalAddress',
        'addressCountry': 'BR'
      },
      'openingHours': 'Mo,Tu,We,Th,Fr 09:00-18:00 Sa 09:00-13:00',
      'contactPoint': {
        '@type': 'ContactPoint',
        'telephone': '+55-11-99999-9999',
        'contactType': 'customer service',
        'email': 'contato@portfolio.com.br'
      },
      'image': 'https://www.portfolio.com.br/logo.png'
    })
    
    document.head.appendChild(script)
    
    return () => {
      document.head.removeChild(script)
    }
  }, [])
  
  return null
}
