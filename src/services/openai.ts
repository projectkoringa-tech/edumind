import OpenAI from "openai";

const client = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true
});

export async function askChatGPT(message: string) {
  const response = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: "Você é um tutor inteligente e amigável." },
      { role: "user", content: message }
    ]
  });

  return response.choices[0].message.content;
}
