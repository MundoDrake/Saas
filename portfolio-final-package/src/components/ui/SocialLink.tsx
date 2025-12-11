'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'

interface SocialLinkProps {
  platform: 'behance' | 'linkedin' | 'instagram'
  url: string
}

export default function SocialLink({ platform, url }: SocialLinkProps) {
  const platformConfig = {
    behance: {
      label: 'BEHANCE',
      color: 'border-green-500 hover:text-green-500'
    },
    linkedin: {
      label: 'LINKEDIN',
      color: 'border-blue-500 hover:text-blue-500'
    },
    instagram: {
      label: 'INSTAGRAM',
      color: 'border-yellow-500 hover:text-yellow-500'
    }
  }

  const config = platformConfig[platform]

  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      <Link 
        href={url} 
        target="_blank" 
        className={`text-white ${config.color} transition-colors border px-3 py-1 inline-block`}
      >
        {config.label}
      </Link>
    </motion.div>
  )
}
