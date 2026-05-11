import { motion } from 'motion/react';
import { Info, Sparkles, ShieldCheck } from 'lucide-react';

export default function Sobre() {
  return (
    <div className="max-w-3xl mx-auto space-y-12 py-8">
      <div className="text-center space-y-4">
        <div className="w-20 h-20 bg-indigo-600 rounded-[30px] flex items-center justify-center mx-auto shadow-2xl shadow-indigo-200">
          <Sparkles className="text-white" size={40} />
        </div>
        <h1 className="text-4xl font-black text-slate-900">EduMind.AO</h1>
        <div className="inline-flex items-center gap-2 bg-indigo-100 text-indigo-600 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest">
          Versão Beta 1.0.0
        </div>
      </div>

      <div className="bg-white rounded-[40px] p-10 border border-slate-100 shadow-sm space-y-8">
        <section className="space-y-4">
          <h2 className="text-xl font-bold flex items-center gap-2 text-slate-900 border-b border-slate-50 pb-2">
            <Info className="text-indigo-600" size={20} />
            Sobre a Plataforma
          </h2>
          <p className="text-slate-600 leading-relaxed font-medium">
            O EduMind.AO nasceu para ser o seu braço direito na jornada acadêmica. Integrando as mais avançadas tecnologias inteligentes, oferecemos um ecossistema completo para gestão de tempo, conteúdo e active recall.
          </p>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-2">
            <h3 className="font-bold text-slate-900">Tutor Pacavira</h3>
            <p className="text-sm text-slate-500 font-medium">Seu mentor pessoal que entende seu perfil, envia lembretes e tira dúvidas em tempo real.</p>
          </div>
          <div className="space-y-2">
            <h3 className="font-bold text-slate-900">Prof. Mir Koringa</h3>
            <p className="text-sm text-slate-500 font-medium">Especialista em didática, gera resumos imersivos, flashcards e exercícios personalizados enquanto você estuda.</p>
          </div>
        </section>

        <div className="pt-8 border-t border-slate-50 flex items-center justify-center gap-4 text-slate-400">
          <ShieldCheck size={20} />
          <p className="text-xs font-bold uppercase tracking-widest">Plataforma Segura e Privada</p>
        </div>
      </div>

      <div className="text-center text-slate-400 text-xs">
        © 2026 EduMind.AO. Todos os direitos reservados.
      </div>
    </div>
  );
}
