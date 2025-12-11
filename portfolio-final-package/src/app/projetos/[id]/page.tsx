
'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

// Define the type for the page props, including params and searchParams as Promises
interface ProjetoDetailPageProps {
  params: Promise<{ id: string }>; 
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default function ProjetoDetail({ params: paramsPromise }: ProjetoDetailPageProps) {
  // Unwrap the params Promise using React.use()
  const params = React.use(paramsPromise);
  
  // Definindo interface para o tipo de projeto
  interface Project {
    id: string;
    title: string;
    category: string;
    description: string;
    client: string;
    year: string;
    services: string[];
    images: string[];
  }
  
  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)

  // Simular carregamento de dados do projeto
  useEffect(() => {
    const fetchProject = async () => {
      // Simulação de busca de dados
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Dados simulados do projeto
      const projectData = {
        id: params.id, // Access id from the unwrapped params
        title: `Projeto ${params.id}`,
        category: 'Identidade Visual',
        description: 'Este projeto foi desenvolvido para um cliente que buscava uma identidade visual moderna e impactante. O objetivo era criar uma marca que refletisse os valores da empresa e se destacasse no mercado. Trabalhamos em conjunto para desenvolver uma solução que atendesse às necessidades do cliente e superasse suas expectativas.',
        client: 'Cliente Exemplo',
        year: '2025',
        services: ['Identidade Visual', 'Branding', 'Design Gráfico'],
        images: ['/project1.jpg', '/project2.jpg', '/project3.jpg', '/project4.jpg']
      }
      
      setProject(projectData)
      setLoading(false)
    }
    
    fetchProject()
  }, [params.id]) // Use unwrapped params.id in dependency array
  
  const nextImage = () => {
    if (project) {
      setCurrentImageIndex((prev) => (prev + 1) % project.images.length)
    }
  }
  
  const prevImage = () => {
    if (project) {
      setCurrentImageIndex((prev) => (prev - 1 + project.images.length) % project.images.length)
    }
  }

  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-black">
        <div className="text-white text-2xl">Carregando...</div>
      </div>
    )
  }

  // Verificação adicional para garantir que project não é null
  if (!project) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-black">
        <div className="text-white text-2xl">Projeto não encontrado</div>
      </div>
    )
  }

  return (
    <div className="pt-32 pb-20 px-4">
      <div className="container-custom">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">{project.title}</h1>
            <p className="text-xl text-gray-300">{project.category}</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-12 gap-12 mb-16">
            <div className="md:col-span-8">
              <p className="text-gray-300 text-lg">{project.description}</p>
            </div>
            
            <div className="md:col-span-4">
              <div className="bg-zinc-900 p-6">
                <div className="mb-4">
                  <h3 className="text-white font-bold mb-2">Cliente</h3>
                  <p className="text-gray-300">{project.client}</p>
                </div>
                
                <div className="mb-4">
                  <h3 className="text-white font-bold mb-2">Ano</h3>
                  <p className="text-gray-300">{project.year}</p>
                </div>
                
                <div>
                  <h3 className="text-white font-bold mb-2">Serviços</h3>
                  <ul className="text-gray-300">
                    {project.services.map((service: string, index: number) => (
                      <li key={index}>{service}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
          
          {/* Galeria de imagens com navegação */}
          <div className="relative mb-12">
            <div className="aspect-video bg-zinc-800 relative overflow-hidden">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentImageIndex}
                  className="absolute inset-0 flex items-center justify-center"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  {/* Placeholder para imagem do projeto */}
                  <div className="absolute inset-0 flex items-center justify-center text-gray-500 text-xl">
                    Imagem do Projeto {currentImageIndex + 1}
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
            
            {/* Controles de navegação */}
            <div className="absolute top-1/2 left-0 right-0 transform -translate-y-1/2 flex justify-between px-4">
              <motion.button
                className="w-10 h-10 bg-black/50 text-white rounded-full flex items-center justify-center"
                onClick={prevImage}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                ←
              </motion.button>
              
              <motion.button
                className="w-10 h-10 bg-black/50 text-white rounded-full flex items-center justify-center"
                onClick={nextImage}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                →
              </motion.button>
            </div>
            
            {/* Indicadores de imagem */}
            <div className="flex justify-center mt-4 space-x-2">
              {project.images.map((_: string, index: number) => (
                <button
                  key={index}
                  className={`w-3 h-3 rounded-full ${index === currentImageIndex ? 'bg-green-500' : 'bg-zinc-600'}`}
                  onClick={() => setCurrentImageIndex(index)}
                />
              ))}
            </div>
          </div>
          
          <div className="mt-16 flex justify-between items-center">
            <motion.a 
              href="/projetos"
              className="text-white hover:text-green-500 transition-colors"
              whileHover={{ x: -5 }}
            >
              ← Voltar para projetos
            </motion.a>
            
            <motion.a 
              href="/contato"
              className="inline-block text-white border border-green-500 px-6 py-3 hover:bg-green-500 hover:text-black transition-colors duration-300"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Iniciar um projeto
            </motion.a>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

