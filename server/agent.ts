import Anthropic from "@anthropic-ai/sdk";

const DEMO_MODE = !process.env.ANTHROPIC_API_KEY;
const client = DEMO_MODE ? null : new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// ============================================================================
// DEMO DATA — shown when no API key is configured
// ============================================================================

const DEMO_LEADS: FoundLead[] = [
  {
    name: "Symphogen A/S",
    description: "Danish antibody mixture company developing recombinant polyclonal antibodies for oncology and infectious disease.",
    website: "https://www.symphogen.com",
    location: "Lyngby, Denmark",
    country: "Denmark",
    region: "Denmark",
    companySize: "51-120",
    fundingStage: "Series B",
    industry: "Biotech",
    category: "Biotech",
    totalFundingAmount: 142,
    latestFundingRound: "Series B — EUR 85M, Jan 2025",
    agentNotes: "Strong signal: Recently closed Series B and posted 12 open roles on LinkedIn including 2 senior clinical positions. Based in greater Copenhagen area. Fits BSE's core Biotech/Denmark criteria perfectly.",
    sources: ["https://www.crunchbase.com/organization/symphogen", "https://www.linkedin.com/company/symphogen"],
  },
  {
    name: "Novo Nordisk Foundation Center for Protein Research",
    description: "Copenhagen-based research center focused on proteomics and systems biology with growing translational pipeline.",
    website: "https://www.cpr.ku.dk",
    location: "Copenhagen, Denmark",
    country: "Denmark",
    region: "Denmark",
    companySize: "51-120",
    fundingStage: "Seed",
    industry: "Academia",
    category: "Biotech",
    totalFundingAmount: 28,
    latestFundingRound: "Seed Grant — EUR 28M, Nov 2024",
    agentNotes: "Expanding team significantly. 8 open research positions posted. Increasing industry collaboration signals potential for executive and specialist recruitment needs.",
    sources: ["https://www.cpr.ku.dk", "https://www.linkedin.com/company/cpr-ku"],
  },
  {
    name: "BioInnovation Institute",
    description: "Copenhagen-based life science incubator spinning out biotech and medtech companies with active portfolio of 20+ startups.",
    website: "https://bii.dk",
    location: "Copenhagen, Denmark",
    country: "Denmark",
    region: "Denmark",
    companySize: "11-50",
    fundingStage: "Seed",
    industry: "Biotech",
    category: "Biotech",
    totalFundingAmount: 45,
    latestFundingRound: "Foundation Grant — EUR 45M, 2024",
    agentNotes: "Portfolio companies collectively hiring across 30+ roles. Strong network contact for BSE — one introduction could unlock multiple placement opportunities.",
    sources: ["https://bii.dk", "https://www.dealroom.co/companies/bioinnovation-institute"],
  },
  {
    name: "Hemab Therapeutics",
    description: "Clinical-stage biotech developing next-generation therapies for rare bleeding and thrombotic disorders.",
    website: "https://www.hemab.com",
    location: "Copenhagen, Denmark",
    country: "Denmark",
    region: "Denmark",
    companySize: "11-50",
    fundingStage: "Series A",
    industry: "Biotech",
    category: "Pharma",
    totalFundingAmount: 95,
    latestFundingRound: "Series A — USD 95M, Oct 2024",
    agentNotes: "Just raised large Series A, entering rapid scale-up phase. Actively recruiting across clinical development and medical affairs. High-quality lead.",
    sources: ["https://www.crunchbase.com/organization/hemab", "https://www.fiercebiotech.com/biotech/hemab-therapeutics"],
  },
  {
    name: "Cortendo AB",
    description: "Swedish specialty pharma company focused on endocrinology and rare endocrine disorders.",
    website: "https://www.cortendo.com",
    location: "Gothenburg, Sweden",
    country: "Sweden",
    region: "Sweden",
    companySize: "11-50",
    fundingStage: "Series B",
    industry: "Pharmaceuticals",
    category: "Pharma",
    totalFundingAmount: 67,
    latestFundingRound: "Series B — EUR 67M, Dec 2024",
    agentNotes: "Post-Series B scale-up underway. 6 open roles including VP Commercial and Senior Medical Director. Swedish HQ with EU expansion plans.",
    sources: ["https://www.crunchbase.com/organization/cortendo", "https://www.linkedin.com/company/cortendo"],
  },
  {
    name: "Unilabs Group",
    description: "European diagnostic services company with strong Scandinavian presence expanding molecular diagnostics division.",
    website: "https://www.unilabs.com",
    location: "Oslo, Norway",
    country: "Norway",
    region: "Norway",
    companySize: "121-500",
    fundingStage: "Growth",
    industry: "Health Tech",
    category: "HealthTech",
    totalFundingAmount: 210,
    latestFundingRound: "Growth — EUR 210M, 2024",
    agentNotes: "Major Norway-based diagnostics expansion. Recently acquired two smaller labs and is actively hiring laboratory managers, pathologists, and commercial directors.",
    sources: ["https://www.unilabs.com", "https://www.dealroom.co/companies/unilabs"],
  },
  {
    name: "Enochian Biosciences",
    description: "Clinical-stage gene therapy company targeting HIV and hepatitis B with novel AAV-based platforms.",
    website: "https://www.enochian.com",
    location: "Berlin, Germany",
    country: "Germany",
    region: "Germany",
    companySize: "11-50",
    fundingStage: "Series A",
    industry: "Biotech",
    category: "Biotech",
    totalFundingAmount: 55,
    latestFundingRound: "Series A — EUR 55M, Feb 2025",
    agentNotes: "Fresh Series A from German government-backed fund. Building out Berlin R&D hub. Seeking 4 senior scientists and a Head of Clinical Operations.",
    sources: ["https://www.crunchbase.com/organization/enochian", "https://www.medcitynews.com"],
  },
  {
    name: "Sifco MedTech",
    description: "Danish MedTech startup developing AI-assisted surgical planning software for orthopedic procedures.",
    website: "https://www.sifcomedtech.com",
    location: "Aarhus, Denmark",
    country: "Denmark",
    region: "Denmark",
    companySize: "1-10",
    fundingStage: "Seed",
    industry: "Medical Devices",
    category: "MedTech",
    totalFundingAmount: 4.5,
    latestFundingRound: "Seed — EUR 4.5M, Mar 2025",
    agentNotes: "Early stage but high momentum. Fresh seed round. Looking for their first commercial hire and a CTO. Founder has strong network in Danish MedTech ecosystem.",
    sources: ["https://www.medwatch.dk", "https://bii.dk/portfolio"],
  },
];

const DEMO_REFRESH_UPDATES: RefreshUpdate[] = [
  {
    companyId: 0,
    companyName: "DEMO: Example Company",
    changes: { fundingStage: "Series B", companySize: "51-120" },
    agentNotes: "DEMO: Updated from Series A to Series B after closing EUR 45M round in Feb 2025. Headcount grew from 35 to 68 per LinkedIn. Source: Crunchbase + LinkedIn.",
    sources: ["https://www.crunchbase.com", "https://www.linkedin.com"],
  },
];

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
  if (DEMO_MODE) {
    // Simulate a short delay so the UI feels like work is happening
    await new Promise((r) => setTimeout(r, 1500));
    return DEMO_LEADS;
  }

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
  if (DEMO_MODE) {
    await new Promise((r) => setTimeout(r, 1200));
    return companies.slice(0, 1).map((c) => ({
      companyId: c.id,
      companyName: c.name,
      changes: { companySize: "51-120" as const, fundingStage: "Series B" as const },
      agentNotes: `DEMO MODE: Found updated information for ${c.name}. LinkedIn shows headcount grew to 51-120 range. Crunchbase indicates a new funding round closed. In live mode, the agent would search the web for real-time data.`,
      sources: ["https://www.crunchbase.com", "https://www.linkedin.com"],
    }));
  }

  if (companies.length === 0) return [];

  const companyList = companies
    .map((c) => `- ID ${c.id}: ${c.name}${c.website ? ` (${c.website})` : ""}${c.location ? ` — ${c.location}` : ""}`)
    .join("\n");

  const userMessage = `Search for the latest information on these life science companies and identify what has changed:\n\n${companyList}\n\nReturn a JSON array with updates for companies where you found meaningful new information.`;

  const raw = await runAgentLoop(DATA_REFRESH_SYSTEM, userMessage);
  return extractJSON(raw) as RefreshUpdate[];
}
