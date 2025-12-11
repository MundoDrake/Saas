
'use client'

import { useEffect } from 'react'

export default function CrossBrowserTester() {
  useEffect(() => {
    // Detectar navegador e versão
    const detectBrowser = () => {
      const userAgent = navigator.userAgent
      let browserName = "Desconhecido"
      let browserVersion = "Desconhecido"
      
      // Detectar Chrome
      if (userAgent.match(/chrome|chromium|crios/i)) {
        browserName = "Chrome"
        const match = userAgent.match(/(?:chrome|chromium|crios)\/(\d+)/)
        if (match) browserVersion = match[1]
      } 
      // Detectar Firefox
      else if (userAgent.match(/firefox|fxios/i)) {
        browserName = "Firefox"
        const match = userAgent.match(/(?:firefox|fxios)\/(\d+)/)
        if (match) browserVersion = match[1]
      }
      // Detectar Safari
      else if (userAgent.match(/safari/i) && !userAgent.match(/chrome|chromium|crios/i)) {
        browserName = "Safari"
        const match = userAgent.match(/version\/(\d+)/)
        if (match) browserVersion = match[1]
      }
      // Detectar Edge
      else if (userAgent.match(/edg/i)) {
        browserName = "Edge"
        const match = userAgent.match(/edg\/(\d+)/)
        if (match) browserVersion = match[1]
      }
      // Detectar Opera
      else if (userAgent.match(/opr\//i)) {
        browserName = "Opera"
        const match = userAgent.match(/opr\/(\d+)/)
        if (match) browserVersion = match[1]
      }
      // Detectar IE
      else if (userAgent.match(/trident/i)) {
        browserName = "Internet Explorer"
        const match = userAgent.match(/(?:msie |rv:)(\d+)/)
        if (match) browserVersion = match[1]
      }
      
      return { name: browserName, version: browserVersion }
    }
    
    // Verificar suporte a recursos modernos
    const checkFeatureSupport = () => {
      const features = {
        flexbox: typeof document.createElement('div').style.flexBasis !== 'undefined',
        grid: typeof document.createElement('div').style.grid !== 'undefined',
        webp: false,
        webgl: false,
        webanimations: typeof document.createElement('div').animate === 'function',
        webworkers: typeof Worker !== 'undefined',
        localstorage: typeof localStorage !== 'undefined',
        sessionstorage: typeof sessionStorage !== 'undefined',
        // websql: typeof window.openDatabase !== 'undefined', // WebSQL is deprecated
        indexeddb: typeof window.indexedDB !== 'undefined',
        svg: document.implementation.hasFeature("http://www.w3.org/TR/SVG11/feature#BasicStructure", "1.1")
      }
      
      // Verificar suporte a WebP - Explicitly define Promise type as boolean
      const webpCheck = new Promise<boolean>(resolve => {
        const webp = new Image()
        webp.onload = webp.onerror = () => {
          resolve(webp.height === 2)
        }
        webp.src = 'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA'
      })
      
      // Verificar suporte a WebGL
      try {
        const canvas = document.createElement('canvas')
        features.webgl = !!(window.WebGLRenderingContext && (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')))
      } catch {
        features.webgl = false
      }
      
      webpCheck.then(supported => {
        features.webp = supported // Now 'supported' is correctly typed as boolean
        console.log('Suporte a recursos do navegador:', features)
      })
    }
    
    const browser = detectBrowser()
    console.log(`Navegador detectado: ${browser.name} ${browser.version}`)
    
    checkFeatureSupport()
    
    // Adicionar classe ao body para estilos específicos de navegador se necessário
    document.body.classList.add(`browser-${browser.name.toLowerCase().replace(/\s+/g, '-')}`)
    
  }, [])
  
  return null
}

