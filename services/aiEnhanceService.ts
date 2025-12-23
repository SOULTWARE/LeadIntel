import { prisma } from "@/db";

export interface EnhanceOptions {
  placeData: any;
  leadPurpose: string;
}

export class AIEnhanceService {
  private apiKey: string;
  private model: string;

  constructor() {
    this.apiKey = process.env.OPENAI_API_KEY || "";
    this.model = process.env.AI_MODEL || "gpt-5-nano";
  }

  async enhanceLead(options: EnhanceOptions) {
    const { placeData, leadPurpose } = options;

    const prompt = `
You are an expert sales analyst.
Your task is to check the compatibility of a potential business lead with a specific "Contact Purpose".

BUSINESS INFO:
- Name: ${placeData.name}
- Type: ${placeData.type || 'N/A'}
- Description/Status: ${placeData.description || 'N/A'}
- Reviews: ${placeData.reviews} (${placeData.rating} stars)
- Website: ${placeData.website || 'No website found'}
- Address: ${placeData.address}

CONTACT PURPOSE:
"${leadPurpose}"

INSTRUCTIONS:
1. Analyze if this business actually needs what is being offered in the Contact Purpose.
2. Identify 2-3 specific "Compatibility Hooks" (reasons why they need this).
3. Assign a Compatibility Score (0-100).
4. Identify potential problems they might be facing that we can solve.

Return ONLY a valid JSON object with:
{
  "compatibilityScore": number,
  "compatibilityHooks": string[],
  "identifiedProblems": string[],
  "recommendation": "Highly Recommended" | "Recommended" | "Neutral" | "Not Recommended",
  "reasoning": string
}
`;

    try {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            { role: "system", content: "You are a lead qualification assistant. Return JSON only." },
            { role: "user", content: prompt },
          ],
          response_format: { type: "json_object" },
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI error: ${response.status}`);
      }

      const data = await response.json();
      const content = JSON.parse(data.choices[0].message.content);

      return content;
    } catch (error) {
      console.error("[AIEnhanceService] Error:", error);
      return {
        compatibilityScore: 0,
        compatibilityHooks: [],
        identifiedProblems: [],
        recommendation: "Neutral",
        reasoning: "Failed to analyze compatibility."
      };
    }
  }

  async enhanceBatch(leads: any[], leadPurpose: string) {
    const results = await Promise.all(
      leads.map(lead => this.enhanceLead({ placeData: lead, leadPurpose }))
    );
    return results;
  }
}

export const aiEnhanceService = new AIEnhanceService();
