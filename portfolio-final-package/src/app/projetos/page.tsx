'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import ProjectFilter from '@/components/ui/ProjectFilter'

export default function Projetos() {
  const allProjects = [
    {
      id: 1,
      title: 'Allana Ketrine',
      category: 'identidade-visual',
      color: 'bg-blue-500',
      image: '/project1.jpg'
    },
    {
      id: 2,
      title: 'Ecoaliza',
      category: 'identidade-visual',
      color: 'bg-yellow-500',
      image: '/project2.jpg'
    },
    {
      id: 3,
      title: 'Pitaya Consulting',
      category: 'branding',
      color: 'bg-purple-500',
      image: '/project3.jpg'
    },
    {
      id: 4,
      title: 'Personal Branding',
      category: 'identidade-visual',
      color: 'bg-green-500',
      image: '/project4.jpg'
    },
    {
      id: 5,
      title: 'Projeto 5',
      category: 'web-design',
      color: 'bg-red-500',
      image: '/project1.jpg'
    },
    {
      id: 6,
      title: 'Projeto 6',
      category: 'branding',
      color: 'bg-orange-500',
      image: '/project2.jpg'
    }
  ]
  
  const [filteredProjects, setFilteredProjects] = useState(allProjects)
  
  const handleFilterChange = (category: string) => {
    if (category === 'todos') {
      setFilteredProjects(allProjects)
    } else {
      const filtered = allProjects.filter(project => project.category === category)
      setFilteredProjects(filtered)
    }
  }

  return (
    <div className="pt-32 pb-20 px-4">
      <div className="container-custom">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-8 text-center">Projetos</h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-16 text-center">
            Conheça alguns dos projetos de design e estratégia de marca desenvolvidos para clientes que buscam se destacar no mercado.
          </p>
        </motion.div>
        
        <ProjectFilter onFilterChange={handleFilterChange} />
        
        <AnimatePresence>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredProjects.map((project) => (
              <motion.div
                key={project.id}
                layout
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.5 }}
              >
                <Link href={`/projetos/${project.id}`}>
                  <div className={`relative aspect-square overflow-hidden border-2 ${project.color} group cursor-pointer`}>
                    <div className="absolute inset-0 bg-black/70 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <div className="text-center">
                        <h3 className="text-xl font-bold text-white">{project.title}</h3>
                        <p className="text-gray-300">{project.category.replace('-', ' ')}</p>
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </AnimatePresence>
        
        {filteredProjects.length === 0 && (
          <motion.div 
            className="text-center py-12"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <p className="text-gray-400 text-lg mb-4">Nenhum projeto encontrado nesta categoria.</p>
            <button 
              onClick={() => handleFilterChange('todos')}
              className="text-green-500 hover:underline"
            >
              Ver todos os projetos
            </button>
          </motion.div>
        )}
        
        <motion.div 
          className="mt-20 text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
        >
          <Link 
            href="/contato"
            className="inline-block text-white border border-green-500 px-8 py-4 hover:bg-green-500 hover:text-black transition-colors duration-300 text-lg"
          >
            Iniciar um projeto
          </Link>
        </motion.div>
      </div>
    </div>
  )
}
