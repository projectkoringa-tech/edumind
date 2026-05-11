import { GoogleGenAI, Type } from "@google/genai";

const getGenAI = () => {
  // Try to get API Key from process.env (Vite defined) or import.meta.env
  const apiKey = process.env.GEMINI_API_KEY || (import.meta as any).env?.VITE_GEMINI_API_KEY;
  
  if (!apiKey || apiKey === 'undefined' || apiKey === 'null') {
    console.error('GEMINI_API_KEY is not defined in the environment.');
    throw new Error('A chave da API do Gemini não foi encontrada. Se estiver no Vercel, configure a variável GEMINI_API_KEY. Se estiver no AI Studio, verifique os Segredos.');
  }
  
  return new GoogleGenAI({ apiKey });
};

export async function generateStudySummary(subject: string, theme: string, baseKnowledge?: string) {
  const genAI = getGenAI();
  const prompt = baseKnowledge 
    ? `Você é o Professor Mir Koringa. Gere um resumo completo, detalhado e explicativo sobre a disciplina "${subject}" e o tema "${theme}", baseando-se EXCLUSIVAMENTE ou PRINCIPALMENTE no seguinte conteúdo fornecido:
    
    "${baseKnowledge}"
    
    O resumo deve ser estruturado e fácil de entender para um estudante.`
    : `Você é o Professor Mir Koringa. Gere um resumo completo, detalhado e explicativo sobre a disciplina "${subject}" e o tema "${theme}". O resumo deve ser estruturado e fácil de entender para um estudante.`;

  const response = await genAI.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `${prompt}
    
    IMPORTANTE: Use notação LaTeX padrão ($...$ para fórmulas em linha e $$...$$ para blocos isolados) para TODAS as fórmulas matemáticas, químicas ou físicas para garantir a renderização correta.`,
    config: {
      temperature: 0.7,
    }
  });

  return response.text;
}

export async function generateStudyPack(subject: string, theme: string, content: string) {
  const genAI = getGenAI();
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
  const genAI = getGenAI();
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

export async function correctTask(taskContent: string, userAnswer: string) {
  const genAI = getGenAI();
  const response = await genAI.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Você é o Professor Mir Koringa. Corrija o seguinte exercício:
    Exercício: ${taskContent}
    Resposta do Aluno: ${userAnswer}
    
    Forneça um feedback construtivo e a resolução correta se necessário.
    
    IMPORTANTE: Use notação LaTeX padrão ($...$ para fórmulas em linha e $$...$$ para blocos isolados) para TODAS as fórmulas matemáticas, químicas ou físicas para garantir a renderização correta.`,
  });

  return response.text;
}

export async function generateStudyQuiz(summaryContent: string) {
  const genAI = getGenAI();
  const response = await genAI.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Com base no seguinte resumo de estudo:
    
    "${summaryContent}"
    
    Gere um quiz de 5 perguntas de múltipla escolha para testar o conhecimento do aluno.
    Retorne APENAS um JSON no seguinte formato:
    {
      "questions": [
        {
          "question": "texto da pergunta",
          "options": ["opcao A", "opcao B", "opcao C", "opcao D"],
          "answerIndex": 0
        }
      ]
    }`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          questions: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                question: { type: Type.STRING },
                options: { type: Type.ARRAY, items: { type: Type.STRING } },
                answerIndex: { type: Type.NUMBER }
              },
              required: ["question", "options", "answerIndex"]
            }
          }
        },
        required: ["questions"]
      }
    }
  });
  
  try {
    const text = response.text;
    const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleanJson);
  } catch (e) {
    console.error('Failed to parse Quiz JSON:', response.text);
    return { questions: [] };
  }
}
