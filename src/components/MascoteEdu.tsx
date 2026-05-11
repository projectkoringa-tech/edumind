import { motion, AnimatePresence } from 'motion/react';
import { useState, useEffect, useMemo } from 'react';

type Mood = 'idle' | 'happy' | 'focused' | 'celebrating' | 'sad';

interface MascoteEduProps {
  name?: string;
  xp?: number;
  level?: number;
  isStudying?: boolean;
}

const GREETINGS = [
  "Olá {name}! Vamos dominar os estudos hoje?",
  "E aí {name}, pronto para o show de conhecimento?",
  "Bem-vindo de volta! Senti cheiro de inteligência no ar.",
  "Pronto para subir de nível hoje, {name}?",
  "Hora de brilhar! Qual o foco de agora?",
  "Sentiu minha falta? Estou pronto para te ajudar!",
];

const XP_MESSAGES = [
  "Boa! Mais conhecimento para a conta!",
  "XP ganho! Seu cérebro está crescendo... 🧠",
  "Você está voando! Continue assim!",
  "Olha só esse progresso! Incrível! 🚀",
  "Cada ponto conta. Você está cada vez melhor!",
  "Isso aí! O esforço sempre vale a pena.",
  "Mais XP? Você é uma máquina de aprender!",
  "Sinto cheiro de sucesso! Mais XP!",
  "Level up está logo ali! Gaaanha esse XP!",
  "Seu esforço está sendo recompensado!",
  "Uau, você aprende rápido!",
  "Continue alimentando seu cérebro!",
];

const LEVEL_MESSAGES = [
  "UAU! Nível {level}! Você é imparável, {name}! 🎉",
  "Nível {level} alcançado! O mestre dos estudos chegou!",
  "Incrível! Você subiu de nível! O que vem depois? 🏆",
  "Parabéns pelo Nível {level}! Sua dedicação é inspiradora.",
  "Opa! Alguém aqui subiu de nível! Parabéns, {name}!",
  "Nível {level} desbloqueado! Suas habilidades estão aumentando!",
  "Você atingiu o Nível {level}. Praticamente um gênio!",
];

const FOCUS_START_MESSAGES = [
  "Shhh... foco total agora. Eu te ajudo a manter o ritmo! 🧠",
  "Modo Foco: ATIVADO. Vamos destruir essa matéria!",
  "Concentração máxima! Estou aqui de guarda.",
  "Celular longe, mente aqui. Vamos lá!",
  "Hora de entrar na zona. Você consegue!",
  "Ignore as distrações, foque no seu futuro!",
  "Apenas você e o conhecimento agora.",
];

const FOCUS_END_MESSAGES = [
  "Bela sessão de estudos! Descansa um pouco, você merece.",
  "Ufa! Que foco! Você foi muito produtivo agora.",
  "Missão cumprida! Seu eu do futuro agradece esse foco.",
  "Sessão finalizada. Hora de esticar as pernas! 🚶‍♂️",
  "Excelente trabalho! Você mandou muito bem.",
  "Produtividade nota 10! Hora de recarregar as energias.",
  "Você foi incrível nessa sessão de foco!",
];

const IDLE_CHIRPS = [
  "Já bebeu água hoje? Hidratação ajuda no foco! 💧",
  "Uma pausa de 5 minutos agora cairia bem?",
  "Sabia que revisar logo após estudar ajuda muito na memória?",
  "Estou aqui se precisar de um incentivo extra! 💪",
  "Como estão as metas para hoje?",
  "Não esqueça: consistência é o segredo do sucesso!",
  "Que tal revisar aquela matéria difícil agora?",
  "A jornada de mil milhas começa com um passo. Qual o seu de hoje?",
  "Você é capaz de aprender qualquer coisa!",
  "O conhecimento é a melhor ferramenta que você pode ter.",
  "Sinto que hoje será um dia muito produtivo para você!",
  "Lembra de alongar as costas! Postura de estudante é importante. 🧘‍♂️",
  "O EduMind.AO está orgulhoso do seu progresso!",
  "Um pouquinho por dia e logo você será um mestre!",
];

export default function MascoteEdu({ name, xp = 0, level = 1, isStudying }: MascoteEduProps) {
  const [visible, setVisible] = useState(false);
  const [mensagem, setMensagem] = useState('');
  const [mood, setMood] = useState<Mood>('idle');
  const [lastXP, setLastXP] = useState(xp);
  const [lastLevel, setLastLevel] = useState(level);

  const getRandom = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)];

  // Monitorar ganhos de XP e Level
  useEffect(() => {
    if (xp > lastXP) {
      setMood('happy');
      setMensagem(getRandom(XP_MESSAGES));
      setVisible(true);
      setLastXP(xp);
      const timer = setTimeout(() => {
        setMood('idle');
        setVisible(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [xp, lastXP]);

  useEffect(() => {
    if (level > lastLevel) {
      setMood('celebrating');
      setMensagem(getRandom(LEVEL_MESSAGES).replace('{level}', level.toString()).replace('{name}', name || 'estudante'));
      setVisible(true);
      setLastLevel(level);
      const timer = setTimeout(() => {
        setMood('idle');
        setVisible(false);
      }, 8000);
      return () => clearTimeout(timer);
    }
  }, [level, lastLevel, name]);

  useEffect(() => {
    if (isStudying) {
      setMood('focused');
      setMensagem(getRandom(FOCUS_START_MESSAGES));
      setVisible(true);
    } else {
      if (mood === 'focused') {
        setMood('happy');
        setMensagem(getRandom(FOCUS_END_MESSAGES));
        const timer = setTimeout(() => {
          setMood('idle');
          setVisible(false);
        }, 5000);
        return () => clearTimeout(timer);
      }
    }
  }, [isStudying]);

  // Mensagem inicial e Chirps ocasionais
  useEffect(() => {
    const initialTimer = setTimeout(() => {
      setMensagem(getRandom(GREETINGS).replace('{name}', name || 'estudante'));
      setVisible(true);
      setTimeout(() => setVisible(false), 6000);
    }, 2000);

    // Chirps ocasionais a cada 2 minutos se estiver idle
    const chirpInterval = setInterval(() => {
      if (!isStudying && !visible && mood === 'idle') {
        setMensagem(getRandom(IDLE_CHIRPS));
        setVisible(true);
        setTimeout(() => setVisible(false), 6000);
      }
    }, 120000);

    return () => {
      clearTimeout(initialTimer);
      clearInterval(chirpInterval);
    };
  }, [name, isStudying]);

  const colors = useMemo(() => {
    switch (mood) {
      case 'happy': return { primary: '#10B981', accent: '#FCD34D' }; // Verde/Amarelo
      case 'focused': return { primary: '#3B82F6', accent: '#60A5FA' }; // Azul
      case 'celebrating': return { primary: '#EC4899', accent: '#F472B6' }; // Rosa
      case 'sad': return { primary: '#64748B', accent: '#94A3B8' }; // Cinza
      default: return { primary: '#4F46E5', accent: '#818CF8' }; // Roxo original
    }
  }, [mood]);

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end pointer-events-none">
      <AnimatePresence>
        {visible && mensagem && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 10 }}
            className="mb-4 mr-2"
          >
            <div 
              className="relative bg-white text-slate-800 p-4 rounded-2xl shadow-2xl border-2 max-w-[220px] text-sm font-bold pointer-events-auto transition-colors duration-500"
              style={{ borderColor: colors.primary }}
            >
              {mensagem}
              <div 
                className="absolute -bottom-2 right-6 w-4 h-4 bg-white border-r-2 border-b-2 rotate-45 transform translate-y-[-2px]"
                style={{ borderColor: colors.primary }}
              ></div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        animate={mood === 'celebrating' ? {
          y: [0, -40, 0, -40, 0],
          rotate: [0, 10, -10, 360, 0],
          scale: [1, 1.2, 1.2, 1, 1]
        } : { 
          y: [0, -12, 0],
          rotate: mood === 'happy' ? [0, 5, -5, 0] : 0
        }}
        transition={{ 
          duration: mood === 'celebrating' ? 2 : 4, 
          repeat: Infinity, 
          ease: "easeInOut" 
        }}
        className="cursor-pointer pointer-events-auto"
        onClick={() => setVisible(!visible)}
      >
        <svg width="90" height="90" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Corpo do Robô */}
          <motion.rect 
            x="40" y="70" width="120" height="100" rx="40" 
            animate={{ 
              fill: colors.primary,
              rx: mood === 'happy' ? [40, 50, 40] : 40 
            }}
            transition={{ duration: 0.5 }}
          />
          
          {/* Cabeça */}
          <rect x="60" y="30" width="80" height="60" rx="30" className="fill-slate-900" />
          
          {/* Olhos */}
          <motion.g animate={mood === 'focused' ? { scale: 0.8 } : {}}>
            <motion.circle 
              cx="85" cy="60" r="8" 
              animate={{ 
                fill: colors.accent,
                scaleY: mood === 'happy' ? [1, 0.2, 1] : [1, 0.1, 1]
              }}
              transition={{ duration: 3, repeat: Infinity, times: [0, 0.1, 0.2] }}
            />
            <motion.circle 
              cx="115" cy="60" r="8" 
              animate={{ 
                fill: colors.accent,
                scaleY: mood === 'happy' ? [1, 0.2, 1] : [1, 0.1, 1]
              }}
              transition={{ duration: 3, repeat: Infinity, times: [0, 0.1, 0.2] }}
            />
          </motion.g>
          
          {/* Antena */}
          <motion.line 
            x1="100" y1="30" x2="100" y2="10" 
            stroke={colors.primary} 
            strokeWidth="6" 
            strokeLinecap="round"
            animate={{ x2: mood === 'happy' ? [100, 110, 90, 100] : 100 }}
          />
          <motion.circle 
            cx="100" cy="10" r="6" 
            animate={{ 
              fill: colors.accent,
              opacity: [1, 0.5, 1],
              x: mood === 'happy' ? [100, 110, 90, 100] : 100
            }}
            transition={{ duration: 1, repeat: Infinity }}
          />
          
          {/* Luz no Peito */}
          <motion.circle 
            cx="100" cy="120" r="15" 
            animate={{ 
              r: mood === 'celebrating' ? [15, 25, 15] : [15, 20, 15],
              fill: mood === 'focused' ? ["rgba(59,130,246,0.5)", "rgba(59,130,246,0.8)", "rgba(59,130,246,0.5)"] : ["rgba(255,255,255,0.2)", "rgba(255,255,255,0.5)", "rgba(255,255,255,0.2)"]
            }}
            transition={{ duration: 1, repeat: Infinity }}
          />

          {/* Braços (Simples) */}
          <motion.path 
            d="M40 100 Q20 100 20 120" 
            stroke={colors.primary} 
            strokeWidth="10" 
            strokeLinecap="round"
            animate={mood === 'celebrating' ? { rotate: [0, -45, 0] } : {}}
          />
          <motion.path 
            d="M160 100 Q180 100 180 120" 
            stroke={colors.primary} 
            strokeWidth="10" 
            strokeLinecap="round"
            animate={mood === 'celebrating' ? { rotate: [0, 45, 0] } : {}}
          />
        </svg>
      </motion.div>
    </div>
  );
}
