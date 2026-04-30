import React from 'react';
import { motion } from 'motion/react';
import { GraduationCap, Shield, Globe, CreditCard, Heart, Mail, Phone } from 'lucide-react';

export const About = () => {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-4xl mx-auto space-y-12 pb-20"
    >
      <header className="text-center space-y-4">
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="p-4 bg-indigo-600 rounded-3xl w-fit mx-auto shadow-xl shadow-indigo-100"
        >
          <GraduationCap className="w-12 h-12 text-white" />
        </motion.div>
        <h1 className="text-4xl font-bold text-slate-900 tracking-tight">Sobre o EduMind</h1>
        <p className="text-slate-500 text-lg max-w-2xl mx-auto">
          Revolucionando a forma de aprender através da inteligência artificial personalizada.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 space-y-4"
        >
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl w-fit">
            <Shield className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">Nossa Missão</h2>
          <p className="text-slate-600 leading-relaxed">
            Democratizar o acesso ao ensino de alta qualidade, fornecendo um tutor inteligente que se adapta ao ritmo e às necessidades de cada estudante, independentemente da sua localização ou nível acadêmico.
          </p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 space-y-4"
        >
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl w-fit">
            <Globe className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">Nossa Visão</h2>
          <p className="text-slate-600 leading-relaxed">
            Ser a plataforma líder em educação personalizada na África e no mundo, utilizando a tecnologia para transformar o potencial humano em conquistas reais.
          </p>
        </motion.div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="bg-indigo-900 rounded-[2.5rem] p-12 text-white relative overflow-hidden"
      >
        <div className="relative z-10 space-y-8">
          <div className="space-y-2">
            <h2 className="text-3xl font-bold">Apoie o Projeto</h2>
            <p className="text-indigo-200 max-w-xl">
              O EduMind é um projeto em constante evolução. Sua doação nos ajuda a manter os servidores e a desenvolver novas funcionalidades inteligentes.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="bg-white/10 backdrop-blur-md p-6 rounded-2xl border border-white/10">
              <div className="flex items-center gap-3 mb-4">
                <CreditCard className="w-6 h-6 text-indigo-300" />
                <span className="font-bold">Multicaixa Express</span>
              </div>
              <p className="text-2xl font-mono font-bold tracking-wider">936 842 307</p>
              <p className="text-xs text-indigo-300 mt-2 italic">Titular: Mir Koringa</p>
            </div>
            
            <div className="bg-white/10 backdrop-blur-md p-6 rounded-2xl border border-white/10">
              <div className="flex items-center gap-3 mb-4">
                <Heart className="w-6 h-6 text-pink-400" />
                <span className="font-bold">Desenvolvedor</span>
              </div>
              <p className="font-medium">Sakidila Tech</p>
              <p className="text-sm text-indigo-300">Mir Koringa</p>
            </div>
          </div>
        </div>
        
        {/* Decorative elements */}
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl opacity-50" />
        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-violet-500/20 rounded-full blur-3xl opacity-50" />
      </motion.div>

      <footer className="text-center space-y-4 pt-8 border-t border-slate-100 pb-10">
        <div className="flex items-center justify-center gap-6 text-slate-400">
          <a href="mailto:contato@edumind.com" className="hover:text-indigo-600 transition-colors"><Mail className="w-5 h-5" /></a>
          <a href="tel:+244936842307" className="hover:text-indigo-600 transition-colors"><Phone className="w-5 h-5" /></a>
        </div>
        <p className="text-xs text-slate-400 font-medium">© 2026 EduMind. Todos os direitos reservados.</p>
      </footer>
    </motion.div>
  );
};
