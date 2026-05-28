import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function correctGrammar(text: string): Promise<string> {
  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "user",
        content: `Please correct the grammar, spelling and punctuation in the following text. Word alteration should be minimal. Return only the corrected text, no formatting or comments.\n\n${text}`,
      },
    ],
  });
  return response.choices[0].message.content ?? text;
}

export async function aiEdit(text: string): Promise<string> {
  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "user",
        content: `You are a clarity and editing assistant. Correct grammar, punctuation, and flow while keeping the original tone and word choices as much as possible, making the writing sound more professional. Only return the corrected version. No commentary, summaries, or explanations.\n\nInput: ${text}`,
      },
    ],
  });
  return response.choices[0].message.content ?? text;
}
