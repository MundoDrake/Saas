'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import SocialLink from '@/components/ui/SocialLink'

export default function Footer() {
  return (
    <footer className="w-full bg-black py-12 px-4 border-t border-zinc-800">
      <div className="container-custom">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 mb-12">
          <div className="md:col-span-5">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
            >
              <Link href="/" className="inline-block mb-6">
                <div className="w-12 h-12 bg-green-500 flex items-center justify-center">
                  <span className="font-bold text-black text-xl">P</span>
                </div>
              </Link>
              
              <p className="text-gray-400 max-w-md text-lg">
                Criando estratégias para marcas que desejam deixar um legado, combinando criatividade e design para impulsionar um futuro de sucesso.
              </p>
            </motion.div>
          </div>
          
          <div className="md:col-span-3">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              viewport={{ once: true }}
            >
              <h3 className="text-white text-xl font-bold mb-4">Navegação</h3>
              <ul className="space-y-2">
                {[
                  { label: 'Home', href: '/' },
                  { label: 'Projetos', href: '/projetos' },
                  { label: 'Metodologia', href: '/metodologia' },
                  { label: 'Sobre', href: '/sobre' },
                  { label: 'Contato', href: '/contato' }
                ].map((item) => (
                  <li key={item.label}>
                    <Link 
                      href={item.href}
                      className="text-gray-400 hover:text-white transition-colors"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </motion.div>
          </div>
          
          <div className="md:col-span-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              viewport={{ once: true }}
            >
              <h3 className="text-white text-xl font-bold mb-4">Contato</h3>
              <p className="text-gray-400 mb-2">contato@portfolio.com.br</p>
              <p className="text-gray-400 mb-6">+55 (11) 99999-9999</p>
              
              <p className="text-white mb-4">(FOLLOW)</p>
              <div className="flex flex-wrap gap-3">
                <SocialLink platform="behance" url="https://behance.net" />
                <SocialLink platform="linkedin" url="https://linkedin.com" />
                <SocialLink platform="instagram" url="https://instagram.com" />
              </div>
            </motion.div>
          </div>
        </div>
        
        <motion.div 
          className="pt-8 border-t border-zinc-800 text-center"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          viewport={{ once: true }}
        >
          <p className="text-gray-500 text-sm">
            © {new Date().getFullYear()} Portfólio. Todos os direitos reservados.
          </p>
        </motion.div>
      </div>
    </footer>
  )
}
