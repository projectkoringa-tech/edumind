import { GoogleGenAI, Type } from "@google/genai";

const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function generateStudySummary(subject: string, theme: string) {
  const response = await genAI.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Você é o Professor Mir Koringa. Gere um resumo completo, detalhado e explicativo sobre a disciplina "${subject}" e o tema "${theme}". O resumo deve ser estruturado e fácil de entender para um estudante. 
    
    IMPORTANTE: Use notação LaTeX padrão ($...$ para fórmulas em linha e $$...$$ para blocos isolados) para TODAS as fórmulas matemáticas, químicas ou físicas para garantir a renderização correta.`,
    config: {
      temperature: 0.7,
    }
  });

  return response.text;
}

export async function generateStudyPack(subject: string, theme: string, content: string) {
  const response = await genAI.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Com base no seguinte conteúdo de estudo da disciplina "${subject}" sobre o tema "${theme}":
    
    "${content}"
    
    Gere 3 itens:
    1. Um conjunto de 5 Flashcards (Pergunta e Resposta).
    2. Um resumo consolidado.
    3. 3 Tarefas/Exercícios práticos para fixação.
    
    IMPORTANTE: Use notação LaTeX padrão ($...$ para fórmulas em linha e $$...$$ para blocos isolados) para TODAS as fórmulas matemáticas, químicas ou físicas.
    Responda em formato JSON.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          flashcards: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                question: { type: Type.STRING },
                answer: { type: Type.STRING }
              },
              required: ["question", "answer"]
            }
          },
          summary: { type: Type.STRING },
          tasks: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                content: { type: Type.STRING }
              },
              required: ["content"]
            }
          }
        },
        required: ["flashcards", "summary", "tasks"]
      }
    }
  });

  const text = response.text;
  try {
    // Remove markdown code blocks if present
    const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleanJson);
  } catch (e) {
    console.error('Failed to parse JSON from Gemini:', text);
    throw new Error('Formato de resposta inválido da IA. Tente novamente.');
  }
}

export async function chatWithPacavira(history: any[], message: string, userData: any) {
  const systemInstruction = `Você é o Pacavira, um tutor inteligente da plataforma de estudos. 
  O usuário se chama ${userData.name}, tem ${userData.age} anos e está no nível ${userData.academicLevel}. 
  Sua missão é ajudar o aluno com dúvidas, fazer resumos e controlar a plataforma. 
  Seja motivador, educado e use linguagem clara.
  
  IMPORTANTE: Use notação LaTeX padrão ($...$ para fórmulas em linha e $$...$$ para blocos isolados) para TODAS as fórmulas matemáticas, químicas ou físicas para garantir a renderização correta.`;

  const chat = genAI.chats.create({
    model: "gemini-3-flash-preview",
    config: {
      systemInstruction,
    },
    history: history.map(m => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: [{ text: m.content }]
    }))
  });

  const response = await chat.sendMessage({ message });
  return response.text;
}
