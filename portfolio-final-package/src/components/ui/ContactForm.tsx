'use client'

import { motion } from 'framer-motion'
import { useState } from 'react'

interface FormData {
  nome: string;
  email: string;
  telefone: string;
  empresa: string;
  mensagem: string;
}

interface ContactFormProps {
  onSubmit?: (formData: FormData) => void
}

export default function ContactForm({ onSubmit }: ContactFormProps) {
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    telefone: '',
    empresa: '',
    mensagem: ''
  })
  
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitSuccess, setSubmitSuccess] = useState(false)
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    // Simulação de envio de formulário ou uso da função onSubmit se fornecida
    setTimeout(() => {
      if (onSubmit) {
        onSubmit(formData)
      }
      
      setIsSubmitting(false)
      setSubmitSuccess(true)
      setFormData({
        nome: '',
        email: '',
        telefone: '',
        empresa: '',
        mensagem: ''
      })
      
      // Reset do status de sucesso após 5 segundos
      setTimeout(() => {
        setSubmitSuccess(false)
      }, 5000)
    }, 1500)
  }
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      viewport={{ once: true }}
    >
      {submitSuccess ? (
        <div className="bg-green-500/20 border border-green-500 p-4 rounded-md">
          <p className="text-white">Mensagem enviada com sucesso! Entraremos em contato em breve.</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="nome" className="block text-gray-300 mb-2">Nome</label>
            <input
              type="text"
              id="nome"
              name="nome"
              value={formData.nome}
              onChange={handleChange}
              required
              className="w-full bg-zinc-900 border border-zinc-700 text-white px-4 py-2 focus:outline-none focus:border-green-500"
            />
          </div>
          
          <div>
            <label htmlFor="email" className="block text-gray-300 mb-2">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="w-full bg-zinc-900 border border-zinc-700 text-white px-4 py-2 focus:outline-none focus:border-green-500"
            />
          </div>
          
          <div>
            <label htmlFor="telefone" className="block text-gray-300 mb-2">Telefone</label>
            <input
              type="tel"
              id="telefone"
              name="telefone"
              value={formData.telefone}
              onChange={handleChange}
              className="w-full bg-zinc-900 border border-zinc-700 text-white px-4 py-2 focus:outline-none focus:border-green-500"
            />
          </div>
          
          <div>
            <label htmlFor="empresa" className="block text-gray-300 mb-2">Empresa</label>
            <input
              type="text"
              id="empresa"
              name="empresa"
              value={formData.empresa}
              onChange={handleChange}
              className="w-full bg-zinc-900 border border-zinc-700 text-white px-4 py-2 focus:outline-none focus:border-green-500"
            />
          </div>
          
          <div>
            <label htmlFor="mensagem" className="block text-gray-300 mb-2">Mensagem</label>
            <textarea
              id="mensagem"
              name="mensagem"
              value={formData.mensagem}
              onChange={handleChange}
              required
              rows={5}
              className="w-full bg-zinc-900 border border-zinc-700 text-white px-4 py-2 focus:outline-none focus:border-green-500"
            ></textarea>
          </div>
          
          <motion.button
            type="submit"
            disabled={isSubmitting}
            className="inline-block text-white border border-green-500 px-6 py-3 hover:bg-green-500 hover:text-black transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {isSubmitting ? 'Enviando...' : 'Enviar Mensagem'}
          </motion.button>
        </form>
      )}
    </motion.div>
  )
}
