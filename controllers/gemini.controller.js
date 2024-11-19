import { model } from "../app.js";

export async function geminiController(req, res) {
  const { word } = req.body;
  console.log("POST request received with word:", word);
  if (!word) {
    return res.status(400).json({
      message: "Please provide a word",
      status: "error",
    });
  }
  const receivedTex = askGemini(word);
  return res.json(receivedTex);
}

  export async function askGemini(word) {
    const combined = [
      {
        role: "user",
        parts: [
          {
            text: `
                 You are provided with a word. Please give the following details for the word "${word}":
      
      1. **Meaning**: A concise meaning of the word.
      2. **Word Type**: Identify if the word is a noun, verb, adjective, adverb, etc.
      3. **Example Sentences**: Provide 3 example sentences using the word.
      4. **Synonyms**: List any  synonyms.
      5. **Antonyms**: List any  antonyms.
      6. **Importance**: Explain how necessary it is to learn this word and in what contexts it is commonly used.
                  `,
          },
        ],
      },
    ];

    try {
      const result = await model.generateContent({
        contents: combined,
        generationConfig: {
          maxOutputTokens: 100,
          temperature: 0.1,
        },
      });

      const receivedTex = result.response?.text();
      return receivedTex;
    } catch (error) {
      console.error("Error generating content:", error);
      throw new Error("Failed to generate content from Gemini AI");
    }
  }
