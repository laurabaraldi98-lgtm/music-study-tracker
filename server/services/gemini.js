const {
    GoogleGenAI
} = require("@google/genai");

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY
});

async function generatePracticeInsight(reportData) {
    const dataForGemini = {
        period: reportData.period,
        summary: reportData.summary,
        insights: reportData.insights
    };

    const prompt = `
Sei un assistente per studenti di musica.

Le conclusioni contenute in "insights" sono già state calcolate dall'applicazione e sono la fonte di verità.

Non ricalcolare i risultati.
Non scegliere categorie diverse.
Non inventare valori, percentuali o conclusioni.
Usa esclusivamente le conclusioni presenti in "insights" e i dati generali presenti in "summary".

Dati:
${JSON.stringify(dataForGemini, null, 2)}

Scrivi un commento breve in italiano, massimo 3 frasi.

Il commento deve:
- descrivere la tendenza indicata in insights.trend;
- riportare il miglior risultato indicato in insights.best;
- riportare l'area da migliorare indicata in insights.improvement;
- essere concreto e non eccessivamente entusiasta;
- non ripetere inutilmente tutti i numeri.

Se un dato è insufficiente o assente, non inventarlo.
`;

    const response = await ai.models.generateContent({
        model: "gemini-3.5-flash-lite",
        contents: prompt
    });

    return response.text;
}

module.exports = {
    generatePracticeInsight
};