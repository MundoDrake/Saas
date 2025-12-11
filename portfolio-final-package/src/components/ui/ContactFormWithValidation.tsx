'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
// Removida importação não utilizada de ContactForm e useEffect

export default function ContactFormWithValidation() {
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    telefone: '',
    empresa: '',
    mensagem: ''
  })
  
  const [errors, setErrors] = useState({
    nome: '',
    email: '',
    mensagem: ''
  })
  
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitSuccess, setSubmitSuccess] = useState(false)
  const [submitError, setSubmitError] = useState(false)
  
  const validateForm = () => {
    let valid = true
    const newErrors = {
      nome: '',
      email: '',
      mensagem: ''
    }
    
    // Validar nome
    if (!formData.nome.trim()) {
      newErrors.nome = 'Nome é obrigatório'
      valid = false
    }
    
    // Validar email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!formData.email.trim()) {
      newErrors.email = 'Email é obrigatório'
      valid = false
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = 'Email inválido'
      valid = false
    }
    
    // Validar mensagem
    if (!formData.mensagem.trim()) {
      newErrors.mensagem = 'Mensagem é obrigatória'
      valid = false
    }
    
    setErrors(newErrors)
    return valid
  }
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    
    // Limpar erro do campo quando o usuário digita
    if (errors[name as keyof typeof errors]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }))
    }
  }
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (validateForm()) {
      setIsSubmitting(true)
      setSubmitError(false)
      
      // Simulação de envio de formulário
      setTimeout(() => {
        // Simulação de sucesso (95% de chance) ou erro (5% de chance)
        const success = Math.random() > 0.05
        
        if (success) {
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
        } else {
          setSubmitError(true)
        }
        
        setIsSubmitting(false)
      }, 1500)
    }
  }
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      viewport={{ once: true }}
    >
      {submitSuccess ? (
        <motion.div 
          className="bg-green-500/20 border border-green-500 p-6 rounded-md"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          <h3 className="text-xl font-bold text-white mb-2">Mensagem enviada com sucesso!</h3>
          <p className="text-gray-300">Obrigado pelo seu contato. Retornaremos em breve.</p>
        </motion.div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {submitError && (
            <motion.div 
              className="bg-red-500/20 border border-red-500 p-4 rounded-md mb-6"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
            >
              <p className="text-white">Ocorreu um erro ao enviar sua mensagem. Por favor, tente novamente.</p>
            </motion.div>
          )}
          
          <div>
            <label htmlFor="nome" className="block text-gray-300 mb-2">Nome *</label>
            <input
              type="text"
              id="nome"
              name="nome"
              value={formData.nome}
              onChange={handleChange}
              className={`w-full bg-zinc-900 border ${errors.nome ? 'border-red-500' : 'border-zinc-700'} text-white px-4 py-2 focus:outline-none focus:border-green-500`}
            />
            {errors.nome && <p className="text-red-500 text-sm mt-1">{errors.nome}</p>}
          </div>
          
          <div>
            <label htmlFor="email" className="block text-gray-300 mb-2">Email *</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className={`w-full bg-zinc-900 border ${errors.email ? 'border-red-500' : 'border-zinc-700'} text-white px-4 py-2 focus:outline-none focus:border-green-500`}
            />
            {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
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
            <label htmlFor="mensagem" className="block text-gray-300 mb-2">Mensagem *</label>
            <textarea
              id="mensagem"
              name="mensagem"
              value={formData.mensagem}
              onChange={handleChange}
              rows={5}
              className={`w-full bg-zinc-900 border ${errors.mensagem ? 'border-red-500' : 'border-zinc-700'} text-white px-4 py-2 focus:outline-none focus:border-green-500`}
            ></textarea>
            {errors.mensagem && <p className="text-red-500 text-sm mt-1">{errors.mensagem}</p>}
          </div>
          
          <div className="text-gray-400 text-sm mb-4">
            * Campos obrigatórios
          </div>
          
          <motion.button
            type="submit"
            disabled={isSubmitting}
            className="inline-block text-white border border-green-500 px-6 py-3 hover:bg-green-500 hover:text-black transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {isSubmitting ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Enviando...
              </span>
            ) : 'Enviar Mensagem'}
          </motion.button>
        </form>
      )}
    </motion.div>
  )
}
