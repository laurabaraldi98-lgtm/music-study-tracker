const {
    GoogleGenAI
} = require("@google/genai");

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY
});

async function generatePracticeInsight(reportData) {
    const prompt = `
Sei un assistente per studenti di musica.

Analizza esclusivamente i dati forniti.
Non inventare valori, percentuali o risultati.

Dati del report:
${JSON.stringify(reportData, null, 2)}

Scrivi un commento breve in italiano, massimo 3 frasi.

Il commento deve:
- descrivere l'andamento generale;
- evidenziare il miglior risultato;
- indicare l'area da migliorare;
- essere concreto e non eccessivamente entusiasta;
- non ripetere inutilmente tutti i numeri.
`;

    const response =
        await ai.models.generateContent({
            model: "gemini-3.5-flash-lite",
            contents: prompt
        });

    return response.text;
}

module.exports = {
    generatePracticeInsight
};