export interface EnhanceOptions {
  placeData: LeadPlaceData;
  leadPurpose: string;
  qualityStrictness?: number;
}

export interface LeadPlaceData {
  name: string;
  type?: string | null;
  description?: string | null;
  reviews?: number | null;
  rating?: number | null;
  website?: string | null;
  address?: string | null;
  [key: string]: unknown;
}

export interface CompanyProfile {
  industry: string;
  companySize: string;
  employeeRange: string;
  revenueRange: string;
  locationSummary: string;
  confidence: number;
}

export interface AIAnalysisResult {
  compatibilityScore: number;
  compatibilityHooks: string[];
  identifiedProblems: string[];
  recommendation:
    | "Highly Recommended"
    | "Recommended"
    | "Neutral"
    | "Not Recommended";
  reasoning: string;
  companyProfile?: CompanyProfile | null;
  decisionMakerRoles: string[];
  outreachSignals: string[];
}

export class AIEnhanceService {
  private apiKey: string;
  private model: string;

  constructor() {
    this.apiKey = process.env.OPENAI_API_KEY || "";
    this.model = process.env.AI_MODEL || "gpt-5-nano";
  }

  async enhanceLead(options: EnhanceOptions): Promise<AIAnalysisResult> {
    const { placeData, leadPurpose, qualityStrictness } = options;

    const prompt = `
You are an expert sales analyst.
Your task is to check the compatibility of a potential business lead with a specific "Contact Purpose".

BUSINESS INFO:
- Name: ${placeData.name}
- Type: ${placeData.type || "N/A"}
- Description/Status: ${placeData.description || "N/A"}
- Reviews: ${placeData.reviews} (${placeData.rating} stars)
- Website: ${placeData.website || "No website found"}
- Address: ${placeData.address}

CONTACT PURPOSE:
"${leadPurpose}"

QUALITY STRICTNESS:
${qualityStrictness ?? 50}/100

STRICTNESS GUIDANCE:
- Higher strictness means score more conservatively and only recommend strong-fit leads.
- Lower strictness means allow broader-fit leads while staying realistic.

INSTRUCTIONS:
1. Analyze if this business actually needs what is being offered in the Contact Purpose.
2. Identify 2-3 specific "Compatibility Hooks" (reasons why they need this).
3. Assign a Compatibility Score (0-100).
4. Identify potential problems they might be facing that we can solve.
5. Estimate firmographics even if confidence is moderate.
6. Suggest the most likely decision-maker or owner-side roles.
7. Suggest 1-3 low-friction warm-up steps before outreach.

Return ONLY a valid JSON object with:
{
  "compatibilityScore": number,
  "compatibilityHooks": string[],
  "identifiedProblems": string[],
  "recommendation": "Highly Recommended" | "Recommended" | "Neutral" | "Not Recommended",
  "reasoning": string,
  "companyProfile": {
    "industry": string,
    "companySize": string,
    "employeeRange": string,
    "revenueRange": string,
    "locationSummary": string,
    "confidence": number
  },
  "decisionMakerRoles": string[],
  "outreachSignals": string[]
}
`;

    try {
      const response = await fetch(
        "https://api.openai.com/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${this.apiKey}`,
          },
          body: JSON.stringify({
            model: this.model,
            messages: [
              {
                role: "system",
                content:
                  "You are a lead qualification assistant. Return JSON only.",
              },
              { role: "user", content: prompt },
            ],
            response_format: { type: "json_object" },
          }),
        },
      );

      if (!response.ok) {
        throw new Error(`OpenAI error: ${response.status}`);
      }

      const data = await response.json();
      const content = JSON.parse(data.choices[0].message.content) as unknown;

      return content as AIAnalysisResult;
    } catch (error) {
      console.error("[AIEnhanceService] Error:", error);
      return {
        compatibilityScore: 0,
        compatibilityHooks: [],
        identifiedProblems: [],
        recommendation: "Neutral",
        reasoning: "Failed to analyze compatibility.",
        companyProfile: null,
        decisionMakerRoles: [],
        outreachSignals: [],
      };
    }
  }

  async enhanceBatch(
    leads: LeadPlaceData[],
    leadPurpose: string,
    qualityStrictness?: number,
  ): Promise<AIAnalysisResult[]> {
    const results = await Promise.all(
      leads.map((lead) =>
        this.enhanceLead({ placeData: lead, leadPurpose, qualityStrictness }),
      ),
    );
    return results;
  }
}

export const aiEnhanceService = new AIEnhanceService();
