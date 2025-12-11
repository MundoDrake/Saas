'use client'

import { useEffect } from 'react'

export default function AccessibilityEnhancer() {
  useEffect(() => {
    // Adicionar atributos ARIA para melhorar acessibilidade
    const enhanceAccessibility = () => {
      // Adicionar roles e labels para elementos interativos sem texto
      document.querySelectorAll('button:not([aria-label])').forEach(button => {
        if (!button.textContent?.trim()) {
          button.setAttribute('aria-label', 'Botão')
        }
      })
      
      // Garantir que todos os inputs tenham labels associados
      document.querySelectorAll('input, textarea, select').forEach(input => {
        const id = input.getAttribute('id')
        if (id) {
          const hasLabel = document.querySelector(`label[for="${id}"]`)
          if (!hasLabel) {
            const placeholder = input.getAttribute('placeholder')
            if (placeholder) {
              input.setAttribute('aria-label', placeholder)
            }
          }
        } else {
          const placeholder = input.getAttribute('placeholder')
          if (placeholder) {
            input.setAttribute('aria-label', placeholder)
          }
        }
      })
      
      // Adicionar skip links para navegação por teclado
      if (!document.getElementById('skip-link')) {
        const skipLink = document.createElement('a')
        skipLink.id = 'skip-link'
        skipLink.href = '#main-content'
        skipLink.className = 'sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:p-4 focus:bg-black focus:text-white'
        skipLink.textContent = 'Pular para o conteúdo principal'
        document.body.insertBefore(skipLink, document.body.firstChild)
        
        // Adicionar id para o conteúdo principal
        const mainContent = document.querySelector('main')
        if (mainContent && !mainContent.id) {
          mainContent.id = 'main-content'
        }
      }
    }
    
    // Executar após o carregamento da página e após mudanças no DOM
    enhanceAccessibility()
    
    // Observer para detectar mudanças no DOM
    const observer = new MutationObserver(enhanceAccessibility)
    observer.observe(document.body, { childList: true, subtree: true })
    
    return () => {
      observer.disconnect()
    }
  }, [])
  
  return null
}
