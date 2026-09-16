import { GoogleGenAI } from '@google/genai';
import 'dotenv/config';

// GEMINI_MOCK=true evita gastar cota/depender de rede em dev e nos testes
// automatizados (regra anti-atraso: "Gemini sempre atrás de mock")
export const GEMINI_MOCK = process.env.GEMINI_MOCK === 'true';

export const GEMINI_MODEL = 'gemini-3.1-flash-lite';

export const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });