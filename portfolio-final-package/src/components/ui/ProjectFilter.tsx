'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
// Removidas importações não utilizadas

export default function ProjectFilter({ onFilterChange }: { onFilterChange: (category: string) => void }) {
  const [selectedFilter, setSelectedFilter] = useState('todos')
  
  const filterOptions = [
    { value: 'todos', label: 'Todos' },
    { value: 'identidade-visual', label: 'Identidade Visual' },
    { value: 'branding', label: 'Branding' },
    { value: 'web-design', label: 'Web Design' }
  ]
  
  const handleFilterChange = (value: string) => {
    setSelectedFilter(value)
    onFilterChange(value)
  }
  
  return (
    <div className="mb-12">
      <div className="flex flex-wrap gap-4 justify-center">
        {filterOptions.map((option) => (
          <motion.button
            key={option.value}
            className={`px-4 py-2 border ${
              selectedFilter === option.value 
                ? 'border-green-500 bg-green-500 text-black' 
                : 'border-zinc-700 text-white hover:border-green-500'
            } transition-colors`}
            onClick={() => handleFilterChange(option.value)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {option.label}
          </motion.button>
        ))}
      </div>
    </div>
  )
}
