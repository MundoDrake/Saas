'use client'

import { motion } from 'framer-motion'
import SectionTitle from '@/components/ui/SectionTitle'
import Link from 'next/link'
import SocialLink from '@/components/ui/SocialLink'

export default function Sobre() {
  return (
    <div className="pt-32 pb-20 px-4">
      <div className="container-custom">
        <SectionTitle 
          title="Sobre" 
          subtitle="Conheça um pouco mais sobre minha trajetória e abordagem no design e estratégia de marcas."
        />
        
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 mb-16">
          <motion.div 
            className="md:col-span-5"
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
          >
            <div className="aspect-square bg-zinc-800 mb-6 relative overflow-hidden">
              {/* Placeholder para foto de perfil */}
              <div className="absolute inset-0 flex items-center justify-center text-gray-500">
                Foto de Perfil
              </div>
            </div>
            
            <div className="flex flex-wrap gap-3">
              <SocialLink platform="behance" url="https://behance.net" />
              <SocialLink platform="linkedin" url="https://linkedin.com" />
              <SocialLink platform="instagram" url="https://instagram.com" />
            </div>
          </motion.div>
          
          <motion.div 
            className="md:col-span-7"
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl font-bold text-white mb-6">Olá, sou Designer de Marcas.</h2>
            
            <div className="space-y-6 text-gray-300 text-lg">
              <p>
                Crio estratégias para marcas que desejam deixar um legado, combino criatividade e design para impulsionar um futuro de sucesso para meus clientes.
              </p>
              
              <p>
                Com mais de 8 anos de experiência em design e estratégia de marcas, desenvolvi uma metodologia única que me permite criar identidades visuais que não apenas são esteticamente atraentes, mas também estrategicamente alinhadas com os objetivos de negócio dos meus clientes.
              </p>
              
              <p>
                Minha abordagem é baseada na compreensão profunda do negócio, do público-alvo e do mercado, o que me permite criar soluções de design que comunicam de forma clara e eficaz a mensagem e o posicionamento da marca.
              </p>
              
              <p>
                Trabalho com empresas de diversos segmentos, desde startups até empresas estabelecidas, ajudando-as a se destacarem em seus mercados através de identidades visuais memoráveis e estratégias de marca eficazes.
              </p>
            </div>
          </motion.div>
        </div>
        
        <motion.div 
          className="mt-20 text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
        >
          <h2 className="text-3xl font-bold text-white mb-8">Vamos trabalhar juntos?</h2>
          <Link 
            href="/contato"
            className="inline-block text-white border border-green-500 px-8 py-4 hover:bg-green-500 hover:text-black transition-colors duration-300 text-lg"
          >
            Entre em contato
          </Link>
        </motion.div>
      </div>
    </div>
  )
}
