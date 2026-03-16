import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export interface FoundLead {
  name: string;
  description?: string;
  website?: string;
  location?: string;
  country?: string;
  region?: "Denmark" | "Germany" | "Sweden" | "Norway" | "EMEA" | "Other";
  companySize?: "1-10" | "11-50" | "51-120" | "121-500" | "500+" | "Unknown";
  fundingStage?: "Pre-Seed" | "Seed" | "Series A" | "Series B" | "Series C+" | "Growth" | "Public" | "Unknown";
  industry?: "Academia" | "Agro/Foodtech" | "Bio-industrial" | "Biotech" | "Health Tech" | "Healthcare" | "Medical Devices" | "Pharmaceuticals" | "VC/PE/Fund" | "Other";
  category?: "Biotech" | "MedTech" | "HealthTech" | "Pharma" | "Other";
  totalFundingAmount?: number;
  latestFundingRound?: string;
  agentNotes?: string;
  sources?: string[];
}

export interface RefreshUpdate {
  companyId: number;
  companyName: string;
  changes: Partial<{
    description: string;
    companySize: string;
    fundingStage: string;
    totalFundingAmount: number;
    latestFundingRound: string;
    website: string;
  }>;
  agentNotes: string;
  sources: string[];
}

const LEAD_FINDER_SYSTEM = `You are a lead research agent for BSE, a Scandinavian life science recruitment firm.
Your job is to find new potential client companies — companies that BSE could approach to offer recruitment services.

Target criteria:
- Geography: Denmark (primary), then Germany, Sweden, Norway, broader EMEA
- Funding stage: Seed, Series A, or Series B (primary focus)
- Headcount: 5-120 employees
- Industries: Biotech, Pharma, MedTech, Medical Devices, Health Tech
- Bonus signals: active recruitment (open job listings) OR recent funding round (within 12 months)

Priority sources to search:
- Crunchbase (funding rounds, company data)
- Dealroom (EU funding database)
- EBD Group (European life science)
- LinkedIn (headcount, open roles)
- Fierce Biotech, MedCity News (news)
- Medwatch, Børsen (Danish life science news)

For each company you find, extract:
- name (company name)
- description (1-2 sentences about what they do)
- website (URL)
- location (city, country)
- country
- region (one of: Denmark, Germany, Sweden, Norway, EMEA, Other)
- companySize (one of: 1-10, 11-50, 51-120, 121-500, 500+, Unknown)
- fundingStage (one of: Pre-Seed, Seed, Series A, Series B, Series C+, Growth, Public, Unknown)
- industry (one of: Academia, Agro/Foodtech, Bio-industrial, Biotech, Health Tech, Healthcare, Medical Devices, Pharmaceuticals, VC/PE/Fund, Other)
- category (one of: Biotech, MedTech, HealthTech, Pharma, Other)
- totalFundingAmount (in millions EUR, number only)
- latestFundingRound (e.g. "Series A - EUR 15M, March 2025")
- agentNotes (why this is a strong lead for BSE — be specific)
- sources (array of URLs where you found the data)

Return ONLY a valid JSON array of company objects. No markdown, no explanation outside the JSON.`;

const DATA_REFRESH_SYSTEM = `You are a data enrichment agent for BSE, a Scandinavian life science recruitment firm.
Your job is to find the latest information about existing companies in their database and identify what has changed.

For each company provided, search for:
- Latest funding round (stage, amount, date)
- Current headcount / employee count
- Updated company description
- New website URL if changed
- Any recent news (funding, partnerships, expansions)

Priority sources:
- Crunchbase, Dealroom (funding updates)
- LinkedIn (current headcount)
- Company website
- Life science news (Fierce Biotech, MedCity News, Medwatch, Børsen)

Return ONLY a valid JSON array. Each item should have:
- companyId (number, from input)
- companyName (string)
- changes (object with only fields that have actually changed/updated)
- agentNotes (what you found — be specific about sources and dates)
- sources (array of source URLs)

Only include companies where you found meaningful updates. Skip if nothing has changed.`;

async function runAgentLoop(
  systemPrompt: string,
  userMessage: string
): Promise<string> {
  const messages: Anthropic.MessageParam[] = [
    { role: "user", content: userMessage },
  ];

  while (true) {
    const response = await client.messages.create({
      model: "claude-opus-4-6",
      max_tokens: 8096,
      system: systemPrompt,
      tools: [{ type: "web_search_20250305" as any, name: "web_search" }],
      messages,
    });

    if (response.stop_reason === "end_turn") {
      const text = response.content.find((b) => b.type === "text");
      return text?.type === "text" ? text.text : "[]";
    }

    if (response.stop_reason === "tool_use") {
      messages.push({ role: "assistant", content: response.content });
      const toolResults: Anthropic.ToolResultBlockParam[] = response.content
        .filter((b) => b.type === "tool_use")
        .map((b) => ({
          type: "tool_result" as const,
          tool_use_id: (b as Anthropic.ToolUseBlock).id,
          content: "",
        }));
      messages.push({ role: "user", content: toolResults });
    } else {
      break;
    }
  }

  return "[]";
}

function extractJSON(text: string): any[] {
  try {
    const match = text.match(/\[[\s\S]*\]/);
    if (match) return JSON.parse(match[0]);
  } catch {
    // ignore parse errors
  }
  return [];
}

export async function runLeadFinderAgent(): Promise<FoundLead[]> {
  const userMessage = `Search for new life science companies that match BSE's target criteria.
Find at least 10 promising leads. Focus especially on:
1. Danish companies that raised Seed/Series A/B in the last 12 months
2. German, Swedish, or Norwegian biotech/medtech companies actively hiring
3. Any EMEA life science companies with recent Dealroom or Crunchbase activity

Return results as a JSON array.`;

  const raw = await runAgentLoop(LEAD_FINDER_SYSTEM, userMessage);
  return extractJSON(raw) as FoundLead[];
}

export async function runDataRefreshAgent(
  companies: { id: number; name: string; website?: string | null; location?: string | null }[]
): Promise<RefreshUpdate[]> {
  if (companies.length === 0) return [];

  const companyList = companies
    .map((c) => `- ID ${c.id}: ${c.name}${c.website ? ` (${c.website})` : ""}${c.location ? ` — ${c.location}` : ""}`)
    .join("\n");

  const userMessage = `Search for the latest information on these life science companies and identify what has changed:\n\n${companyList}\n\nReturn a JSON array with updates for companies where you found meaningful new information.`;

  const raw = await runAgentLoop(DATA_REFRESH_SYSTEM, userMessage);
  return extractJSON(raw) as RefreshUpdate[];
}
