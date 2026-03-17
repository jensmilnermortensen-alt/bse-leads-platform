/**
 * FullEnrich API client for contact enrichment (email + phone lookup).
 *
 * API docs: https://docs.fullenrich.com
 * Endpoint: POST https://api.fullenrich.com/v1/enrich
 * Auth header: x-api-key: <FULLENRICH_API_KEY>
 *
 * When FULLENRICH_API_KEY is not set, runs in demo mode and returns
 * realistic-looking dummy data so the workflow can be previewed without
 * spending any credits.
 */

const DEMO_MODE = !process.env.FULLENRICH_API_KEY;
const FULLENRICH_BASE = "https://api.fullenrich.com";

export interface EnrichResult {
  email?: string;
  phone?: string;
  enrichedAt: Date;
  demo?: boolean;
}

export async function enrichContact(contact: {
  firstName: string;
  lastName: string;
  linkedinUrl?: string | null;
  companyName?: string | null;
}): Promise<EnrichResult> {
  if (DEMO_MODE) {
    // Simulate API latency
    await new Promise((r) => setTimeout(r, 900));

    const first = contact.firstName.toLowerCase();
    const last = contact.lastName.toLowerCase();
    const domain = contact.companyName
      ? contact.companyName.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 20) + ".com"
      : "company.com";

    // Vary the format to make demo data look realistic
    const formats = [
      `${first}.${last}@${domain}`,
      `${first[0]}${last}@${domain}`,
      `${first}@${domain}`,
    ];
    const email = formats[Math.floor(Math.random() * formats.length)];

    // Danish/EU phone number format
    const phoneArea = ["45", "49", "46", "47"][Math.floor(Math.random() * 4)];
    const phoneNum = Math.floor(10000000 + Math.random() * 89999999);
    const phone = `+${phoneArea} ${String(phoneNum).replace(/(\d{2})(\d{3})(\d{3})/, "$1 $2 $3")}`;

    return { email, phone, enrichedAt: new Date(), demo: true };
  }

  // --- Live FullEnrich API call ---
  // Adjust this body to match FullEnrich's exact request schema if it differs.
  const body: Record<string, string> = {
    first_name: contact.firstName,
    last_name: contact.lastName,
  };
  if (contact.linkedinUrl) body.linkedin_url = contact.linkedinUrl;
  if (contact.companyName) body.company_name = contact.companyName;

  const res = await fetch(`${FULLENRICH_BASE}/v1/enrich`, {
    method: "POST",
    headers: {
      "x-api-key": process.env.FULLENRICH_API_KEY!,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`FullEnrich API error ${res.status}: ${text}`);
  }

  const data = await res.json();

  // FullEnrich returns email/phone at the top level; adjust if your plan returns nested data.
  return {
    email: data.email ?? data.work_email ?? undefined,
    phone: data.phone ?? data.phone_number ?? undefined,
    enrichedAt: new Date(),
  };
}

export const isFullEnrichDemoMode = () => DEMO_MODE;
