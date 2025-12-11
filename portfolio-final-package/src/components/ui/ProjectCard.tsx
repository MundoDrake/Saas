'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'

interface ProjectCardProps {
  id: number
  title: string
  category: string
  color: string
  // Propriedade image mantida na interface mas não utilizada no componente
  image: string
}

export default function ProjectCard({ id, title, category, color }: Omit<ProjectCardProps, 'image'>) {
  return (
    <Link href={`/projetos/${id}`}>
      <motion.div 
        className={`relative aspect-square overflow-hidden border-2 ${color} group cursor-pointer`}
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        viewport={{ once: true }}
        whileHover={{ scale: 1.02 }}
      >
        <div className="absolute inset-0 bg-black/70 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="text-center">
            <h3 className="text-xl font-bold text-white">{title}</h3>
            <p className="text-gray-300">{category}</p>
          </div>
        </div>
      </motion.div>
    </Link>
  )
}
