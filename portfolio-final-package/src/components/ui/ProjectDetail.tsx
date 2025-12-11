'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'

interface ProjectDetailProps {
  title: string
  category: string
  description: string
  client: string
  year: string
  services: string[]
  images: string[]
}

export default function ProjectDetail({
  title,
  category,
  description,
  client,
  year,
  services,
  images
}: ProjectDetailProps) {
  return (
    <div className="pt-24 pb-20 px-4">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">{title}</h1>
            <p className="text-xl text-gray-300">{category}</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-12 gap-12 mb-16">
            <div className="md:col-span-8">
              <p className="text-gray-300 text-lg">{description}</p>
            </div>
            
            <div className="md:col-span-4">
              <div className="bg-zinc-900 p-6">
                <div className="mb-4">
                  <h3 className="text-white font-bold mb-2">Cliente</h3>
                  <p className="text-gray-300">{client}</p>
                </div>
                
                <div className="mb-4">
                  <h3 className="text-white font-bold mb-2">Ano</h3>
                  <p className="text-gray-300">{year}</p>
                </div>
                
                <div>
                  <h3 className="text-white font-bold mb-2">Serviços</h3>
                  <ul className="text-gray-300">
                    {services.map((service, index) => (
                      <li key={index}>{service}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
          
          <div className="space-y-8">
            {images.map((image, index) => (
              <motion.div
                key={index}
                className="w-full"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <div className="aspect-video bg-zinc-800 relative overflow-hidden">
                  {/* Placeholder para imagem do projeto */}
                  <div className="absolute inset-0 flex items-center justify-center text-gray-500">
                    Imagem do Projeto {index + 1}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
          
          <div className="mt-16 flex justify-between items-center">
            <Link 
              href="/projetos"
              className="text-white hover:text-green-500 transition-colors"
            >
              ← Voltar para projetos
            </Link>
            
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Link 
                href="/contato"
                className="inline-block text-white border border-green-500 px-6 py-3 hover:bg-green-500 hover:text-black transition-colors duration-300"
              >
                Iniciar um projeto
              </Link>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
