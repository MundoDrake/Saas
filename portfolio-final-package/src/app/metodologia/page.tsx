'use client'

import { motion } from 'framer-motion'
import SectionTitle from '@/components/ui/SectionTitle'
import MethodologyStep from '@/components/ui/MethodologyStep'
import Link from 'next/link'

export default function Metodologia() {
  const steps = [
    { 
      number: '01', 
      title: 'Gênesis', 
      color: 'border-red-500',
      description: 'Conversamos sobre o seu negócio, para entender O que, Como e Porque da marca. Analisamos seu público-alvo, o mercado em que opera e a concorrência.',
      details: 'Nesta fase inicial, realizamos uma imersão profunda no seu negócio. Através de entrevistas e pesquisas, buscamos compreender a essência da sua marca, seus valores fundamentais e o que a torna única. Analisamos o mercado, identificamos oportunidades e estudamos a concorrência para posicionar sua marca de forma estratégica.'
    },
    { 
      number: '02', 
      title: 'Êxodo', 
      color: 'border-yellow-500',
      description: 'Conversamos sobre o seu negócio, para entender O que, Como e Porque da marca. Analisamos seu público-alvo, o mercado em que opera e a concorrência.',
      details: 'Com base nas informações coletadas, desenvolvemos a estratégia de marca. Definimos o posicionamento, a personalidade, a voz e o tom da marca. Criamos a narrativa que conectará sua marca ao público-alvo, estabelecendo as bases para o desenvolvimento visual.'
    },
    { 
      number: '03', 
      title: 'Opus', 
      color: 'border-orange-500',
      description: 'Conversamos sobre o seu negócio, para entender O que, Como e Porque da marca. Analisamos seu público-alvo, o mercado em que opera e a concorrência.',
      details: 'Nesta fase criativa, transformamos a estratégia em elementos visuais. Desenvolvemos o sistema de identidade visual completo, incluindo logotipo, paleta de cores, tipografia, iconografia e demais elementos gráficos que representarão visualmente a essência da sua marca.'
    },
    { 
      number: '04', 
      title: 'Eben', 
      color: 'border-purple-500',
      description: 'Conversamos sobre o seu negócio, para entender O que, Como e Porque da marca. Analisamos seu público-alvo, o mercado em que opera e a concorrência.',
      details: 'Na fase final, implementamos a identidade visual em todos os pontos de contato da marca. Criamos o manual de identidade visual e desenvolvemos as aplicações necessárias, garantindo consistência e coerência em todas as manifestações da marca.'
    }
  ]

  return (
    <div className="pt-32 pb-20 px-4">
      <div className="container-custom">
        <SectionTitle 
          title="Metodologia" 
          subtitle="Para garantir a mensagem e posicionamento claro de uma marca, uso uma metodologia que me permite fazer as perguntas certas para revelar as respostas certas."
        />
        
        <div className="space-y-16 mt-12">
          {steps.map((step, index) => (
            <div key={index} className="grid grid-cols-1 md:grid-cols-12 gap-8">
              <div className="md:col-span-4">
                <MethodologyStep
                  number={step.number}
                  title={step.title}
                  description={step.description}
                  color={step.color}
                  delay={index}
                />
              </div>
              <motion.div 
                className="md:col-span-8 flex items-center"
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.2 + index * 0.1 }}
                viewport={{ once: true }}
              >
                <p className="text-gray-300 text-lg">{step.details}</p>
              </motion.div>
            </div>
          ))}
        </div>
        
        <motion.div 
          className="mt-20 text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
        >
          <h2 className="text-3xl font-bold text-white mb-8">Pronto para transformar sua marca?</h2>
          <Link 
            href="/contato"
            className="inline-block text-white border border-green-500 px-8 py-4 hover:bg-green-500 hover:text-black transition-colors duration-300 text-lg"
          >
            Quero ser angular
          </Link>
        </motion.div>
      </div>
    </div>
  )
}
