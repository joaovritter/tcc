import { GoogleGenAI } from "@google/genai";
import 'dotenv/config';

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY
});


async function testeGemini() {
    const resposta = await ai.models.generateContent({
        model: "gemini-3.1-flash-lite",
        contents: ' Diga oi em uma frase pequena',
    });
    console.log(resposta.text);
}

testeGemini()