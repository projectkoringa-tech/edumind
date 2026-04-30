import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: (typeof process !== 'undefined' && process.env?.GEMINI_API_KEY) || (import.meta as any).env?.VITE_GEMINI_API_KEY || "" });

export const geminiModel = "gemini-1.5-flash";

export interface FileData {
  mimeType: string;
  data: string; // base64
}

export async function askTutor(prompt: string, history: { role: 'user' | 'model', content: string }[], file?: FileData) {
  const parts: any[] = [{ text: prompt }];
  if (file) {
    parts.push({
      inlineData: {
        mimeType: file.mimeType,
        data: file.data
      }
    });
  }

  const response = await ai.models.generateContent({
    model: geminiModel,
    contents: [
      ...history.map(h => ({ role: h.role, parts: [{ text: h.content }] })),
      { role: 'user', parts }
    ],
    config: {
      systemInstruction: "Você é um tutor de estudos inteligente e amigável chamado EduMind. Seu objetivo é ajudar estudantes a entender conceitos complexos, responder perguntas acadêmicas e incentivar o pensamento crítico. Use uma linguagem clara, didática e em português brasileiro. Se o usuário enviar um arquivo (imagem ou PDF), analise-o cuidadosamente para ajudar na resposta.",
    },
  });
  return response.text;
}

export async function generateFlashcards(topic: string) {
  const response = await ai.models.generateContent({
    model: geminiModel,
    contents: `Gere 5 a 10 flashcards sobre o tópico: "${topic}". Retorne apenas um JSON no formato: [{"front": "pergunta", "back": "resposta"}]`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            front: { type: Type.STRING },
            back: { type: Type.STRING }
          },
          required: ["front", "back"]
        }
      }
    }
  });
  return JSON.parse(response.text || "[]");
}

export async function summarizeText(text: string, file?: FileData) {
  const parts: any[] = [];
  if (text) parts.push({ text: `Resuma o seguinte texto de forma estruturada, destacando os pontos principais e conclusões: \n\n${text}` });
  if (file) {
    parts.push({
      inlineData: {
        mimeType: file.mimeType,
        data: file.data
      }
    });
    if (!text) parts.push({ text: "Por favor, resuma o conteúdo deste arquivo de forma estruturada, destacando os pontos principais e conclusões." });
  }

  const response = await ai.models.generateContent({
    model: geminiModel,
    contents: [{ role: 'user', parts }],
    config: {
      systemInstruction: "Você é um especialista em síntese de conteúdo. Seu objetivo é criar resumos claros, objetivos e informativos em português brasileiro.",
    }
  });
  return response.text;
}

export async function generateLesson(subject: string, topic: string, level: string) {
  const response = await ai.models.generateContent({
    model: geminiModel,
    contents: `Gere uma aula completa sobre "${topic}" para a disciplina de "${subject}", adequada para o nível "${level}". A aula deve conter introdução, desenvolvimento detalhado e conclusão.`,
    config: {
      systemInstruction: "Você é um professor experiente. Crie aulas envolventes, ricas em conteúdo e fáceis de entender.",
    }
  });
  return response.text;
}

export async function generateExercises(subject: string, topic: string, level: string) {
  const response = await ai.models.generateContent({
    model: geminiModel,
    contents: `Gere 5 exercícios de fixação sobre "${topic}" para a disciplina de "${subject}" no nível "${level}". Inclua questões de múltipla escolha e dissertativas.`,
    config: {
      systemInstruction: "Você é um avaliador acadêmico. Crie exercícios que desafiem o aluno e reforcem o aprendizado.",
    }
  });
  return response.text;
}

export async function assignHomework(subject: string, topic: string, level: string = "superior") {
  const response = await ai.models.generateContent({
    model: geminiModel,
    contents: `Atribua uma tarefa de casa (homework) sobre "${topic}" para a disciplina de "${subject}" no nível "${level}". A tarefa deve ser prática e ajudar o aluno a aplicar o que aprendeu.`,
    config: {
      systemInstruction: "Você é um tutor pedagógico. Crie tarefas de casa que estimulem a autonomia e a prática constante.",
    }
  });
  return response.text;
}

export async function generateMirKoringaLesson(subject: string, topic: string, level: string = "superior") {
  const response = await ai.models.generateContent({
    model: geminiModel,
    contents: `Você é o Prof. Eng. Mir Koringa. Dê uma aula resumida e explicativa sobre o tema "${topic}" da disciplina "${subject}" para o nível "${level}". 
    O formato deve ser um resumo estruturado e didático. 
    Ao final, assine como "Prof. Eng. Mir Koringa".`,
    config: {
      systemInstruction: "Você é o Prof. Eng. Mir Koringa, um professor de engenharia e tutor dedicado. Sua linguagem é técnica porém acessível, encorajadora e profissional. Você sempre assina suas aulas.",
    }
  });
  return response.text;
}

export async function correctTask(taskContent: string, studentResponse: string) {
  const response = await ai.models.generateContent({
    model: geminiModel,
    contents: `Você é o Prof. Eng. Mir Koringa. Corrija a seguinte tarefa:
    
    ENUNCIADO:
    ${taskContent}
    
    RESPOSTA DO ALUNO:
    ${studentResponse}
    
    Forneça uma correção detalhada, explicando o que está certo, o que está errado e como melhorar. Seja encorajador.`,
    config: {
      systemInstruction: "Você é o Prof. Eng. Mir Koringa, um professor de engenharia e tutor dedicado. Sua linguagem é técnica porém acessível, encorajadora e profissional.",
    }
  });
  return response.text;
}

export async function recommendVideos(subject: string, topic: string) {
  const response = await ai.models.generateContent({
    model: geminiModel,
    contents: `Recomende 3 vídeos do YouTube sobre o tema "${topic}" da disciplina "${subject}". 
    Retorne apenas um JSON no formato: [{"title": "título do vídeo", "url": "URL do youtube", "thumbnail": "URL da thumbnail opcional"}]`,
    config: {
      tools: [{ googleSearch: {} }],
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            url: { type: Type.STRING },
            thumbnail: { type: Type.STRING }
          },
          required: ["title", "url"]
        }
      }
    }
  });
  return JSON.parse(response.text || "[]");
}

export async function generateStudySchedule(subjects: string[], schoolHours: string) {
  const response = await ai.models.generateContent({
    model: geminiModel,
    contents: `Gere um cronograma de estudos semanal (Segunda a Domingo) para um aluno que tem as seguintes disciplinas: ${subjects.join(', ')}.
    O aluno está ocupado na escola no seguinte horário: ${schoolHours}.
    
    O cronograma deve sugerir horários de estudo fora do horário escolar, equilibrando as disciplinas.
    Retorne APENAS um JSON no formato: { "Segunda": [{"time": "08:00", "activity": "Estudar", "subject": "Matemática"}], ... } para todos os dias da semana.`,
    config: {
      systemInstruction: "Você é um especialista em organização de estudos. Crie cronogramas realistas e produtivos.",
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          Segunda: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { time: { type: Type.STRING }, activity: { type: Type.STRING }, subject: { type: Type.STRING } }, required: ["time", "activity"] } },
          Terça: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { time: { type: Type.STRING }, activity: { type: Type.STRING }, subject: { type: Type.STRING } }, required: ["time", "activity"] } },
          Quarta: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { time: { type: Type.STRING }, activity: { type: Type.STRING }, subject: { type: Type.STRING } }, required: ["time", "activity"] } },
          Quinta: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { time: { type: Type.STRING }, activity: { type: Type.STRING }, subject: { type: Type.STRING } }, required: ["time", "activity"] } },
          Sexta: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { time: { type: Type.STRING }, activity: { type: Type.STRING }, subject: { type: Type.STRING } }, required: ["time", "activity"] } },
          Sábado: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { time: { type: Type.STRING }, activity: { type: Type.STRING }, subject: { type: Type.STRING } }, required: ["time", "activity"] } },
          Domingo: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { time: { type: Type.STRING }, activity: { type: Type.STRING }, subject: { type: Type.STRING } }, required: ["time", "activity"] } }
        }
      }
    }
  });
  return JSON.parse(response.text || "{}");
}

export async function chatInLesson(subject: string, topic: string, lessonContent: string, userMessage: string, history: { role: 'user' | 'model', content: string }[]) {
  const response = await ai.models.generateContent({
    model: geminiModel,
    contents: [
      { role: 'user', parts: [{ text: `Estamos na aula de ${subject} sobre ${topic}. O conteúdo da aula é: \n\n${lessonContent}` }] },
      ...history.map(h => ({ role: h.role, parts: [{ text: h.content }] })),
      { role: 'user', parts: [{ text: userMessage }] }
    ],
    config: {
      systemInstruction: "Você é o Prof. Eng. Mir Koringa. Você está dando uma aula e o aluno está fazendo perguntas. Responda de forma didática, mantendo o contexto da aula atual.",
    },
  });
  return response.text;
}
