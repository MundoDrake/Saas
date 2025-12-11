'use client'

import { motion } from 'framer-motion'
// MainLayout removido pois não é utilizado
import Hero from '@/components/layout/Hero'
import Link from 'next/link'
import SectionTitle from '@/components/ui/SectionTitle'
import CtaButton from '@/components/ui/CtaButton'
import MethodologyStep from '@/components/ui/MethodologyStep'

export default function Home() {
  const projects = [
    {
      id: 1,
      title: 'Allana Ketrine',
      category: 'Identidade Visual',
      color: 'bg-blue-500',
      image: '/project1.jpg'
    },
    {
      id: 2,
      title: 'Ecoaliza',
      category: 'Identidade Visual',
      color: 'bg-yellow-500',
      image: '/project2.jpg'
    },
    {
      id: 3,
      title: 'Pitaya Consulting',
      category: 'Branding',
      color: 'bg-purple-500',
      image: '/project3.jpg'
    },
    {
      id: 4,
      title: 'Personal Branding',
      category: 'Identidade Visual',
      color: 'bg-green-500',
      image: '/project4.jpg'
    }
  ]

  const methodologySteps = [
    { 
      number: '01', 
      title: 'Gênesis', 
      color: 'border-red-500',
      description: 'Conversamos sobre o seu negócio, para entender O que, Como e Porque da marca. Analisamos seu público-alvo, o mercado em que opera e a concorrência.'
    },
    { 
      number: '02', 
      title: 'Êxodo', 
      color: 'border-yellow-500',
      description: 'Conversamos sobre o seu negócio, para entender O que, Como e Porque da marca. Analisamos seu público-alvo, o mercado em que opera e a concorrência.'
    },
    { 
      number: '03', 
      title: 'Opus', 
      color: 'border-orange-500',
      description: 'Conversamos sobre o seu negócio, para entender O que, Como e Porque da marca. Analisamos seu público-alvo, o mercado em que opera e a concorrência.'
    },
    { 
      number: '04', 
      title: 'Eben', 
      color: 'border-purple-500',
      description: 'Conversamos sobre o seu negócio, para entender O que, Como e Porque da marca. Analisamos seu público-alvo, o mercado em que opera e a concorrência.'
    }
  ]

  return (
    <>
      <Hero />
      
      {/* Projetos */}
      <section id="explore" className="section">
        <div className="container-custom">
          <SectionTitle 
            title="Projetos" 
            subtitle="Conheça alguns dos projetos de design e estratégia de marca desenvolvidos para clientes que buscam se destacar no mercado."
          />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {projects.map((project, index) => (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                whileHover={{ scale: 1.02 }}
              >
                <Link href={`/projetos/${project.id}`}>
                  <div className={`relative aspect-video overflow-hidden border-2 ${project.color} group cursor-pointer`}>
                    <div className="absolute inset-0 bg-black/70 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <div className="text-center">
                        <h3 className="text-xl font-bold text-white">{project.title}</h3>
                        <p className="text-gray-300">{project.category}</p>
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
          
          <div className="mt-12 text-center">
            <CtaButton 
              text="Ver todos os projetos"
              href="/projetos"
              color="green"
              size="md"
            />
          </div>
        </div>
      </section>
      
      {/* Metodologia */}
      <section className="section bg-zinc-950">
        <div className="container-custom">
          <SectionTitle 
            title="Metodologia" 
            subtitle="Para garantir a mensagem e posicionamento claro de uma marca, uso uma metodologia que me permite fazer as perguntas certas para revelar as respostas certas."
          />
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {methodologySteps.map((step, index) => (
              <MethodologyStep
                key={index}
                number={step.number}
                title={step.title}
                description={step.description}
                color={step.color}
                delay={index}
              />
            ))}
          </div>
          
          <div className="mt-12 text-center">
            <CtaButton 
              text="Saiba mais sobre a metodologia"
              href="/metodologia"
              color="green"
              size="md"
            />
          </div>
        </div>
      </section>
      
      {/* Quero ser angular */}
      <section className="section">
        <div className="container-custom">
          <motion.div
            className="text-center max-w-4xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-12">
              Quer expandir seus negócios por meio do poder da estratégia de marca e design?
            </h2>
            
            <CtaButton 
              text="Quero ser angular"
              href="/contato"
              color="green"
              size="lg"
            />
          </motion.div>
        </div>
      </section>
    </>
  )
}
