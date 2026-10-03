import { GoogleGenAI } from '@google/genai';
import 'dotenv/config';

export const GEMINI_MODEL = 'gemini-3.1-flash-lite';

export const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });