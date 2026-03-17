import type { Company, Contact } from "../drizzle/schema";

// ---------------------------------------------------------------------------
// Demo mode — active when BULLHORN_CLIENT_ID is not set in the environment.
// Returns realistic fake Bullhorn IDs so the workflow can be demoed without
// a live Bullhorn account.
// ---------------------------------------------------------------------------
const DEMO_MODE = !process.env.BULLHORN_CLIENT_ID;

export const isBullhornDemoMode = () => DEMO_MODE;

// ---------------------------------------------------------------------------
// Auth helpers (live mode only)
// ---------------------------------------------------------------------------

interface BullhornSession {
  restUrl: string;
  token: string;
}

let _session: (BullhornSession & { expiresAt: number }) | null = null;

async function getBullhornSession(): Promise<BullhornSession> {
  // Reuse an existing session for up to 9 minutes (tokens last ~10 min)
  if (_session && Date.now() < _session.expiresAt) {
    return { restUrl: _session.restUrl, token: _session.token };
  }

  // Step 1: OAuth password grant → access_token
  const tokenRes = await fetch(
    "https://auth.bullhornstaffing.com/oauth/token",
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "password",
        username: process.env.BULLHORN_USERNAME ?? "",
        password: process.env.BULLHORN_PASSWORD ?? "",
        client_id: process.env.BULLHORN_CLIENT_ID ?? "",
        client_secret: process.env.BULLHORN_CLIENT_SECRET ?? "",
      }),
    }
  );

  if (!tokenRes.ok) {
    const text = await tokenRes.text();
    throw new Error(`Bullhorn OAuth failed (${tokenRes.status}): ${text}`);
  }

  const { access_token } = await tokenRes.json();

  // Step 2: REST login → BhRestToken + restUrl
  const loginRes = await fetch(
    `https://rest.bullhornstaffing.com/rest-services/login?version=*&access_token=${access_token}`,
    { method: "POST" }
  );

  if (!loginRes.ok) {
    const text = await loginRes.text();
    throw new Error(`Bullhorn REST login failed (${loginRes.status}): ${text}`);
  }

  const { BhRestToken, restUrl } = await loginRes.json();

  _session = {
    restUrl: restUrl.endsWith("/") ? restUrl : `${restUrl}/`,
    token: BhRestToken,
    expiresAt: Date.now() + 9 * 60 * 1000,
  };

  return { restUrl: _session.restUrl, token: _session.token };
}

// ---------------------------------------------------------------------------
// Sync company → Bullhorn ClientCorporation
// ---------------------------------------------------------------------------

export async function syncCompanyToBullhorn(
  company: Company
): Promise<{ bullhornId: string }> {
  if (DEMO_MODE) {
    await new Promise((r) => setTimeout(r, 800));
    const fakeId = `BH-CRP-${Math.floor(1000 + Math.random() * 9000)}`;
    return { bullhornId: fakeId };
  }

  const { restUrl, token } = await getBullhornSession();

  const payload: Record<string, unknown> = {
    name: company.name,
  };

  if (company.website) payload.companyURL = company.website;
  if (company.description) payload.description = company.description;
  if (company.location) {
    payload.address = { city: company.location };
  }

  const res = await fetch(
    `${restUrl}entity/ClientCorporation?BhRestToken=${token}`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(
      `Bullhorn ClientCorporation create failed (${res.status}): ${text}`
    );
  }

  const data = await res.json();
  return { bullhornId: String(data.changedEntityId) };
}

// ---------------------------------------------------------------------------
// Sync contact → Bullhorn ClientContact
// ---------------------------------------------------------------------------

export async function syncContactToBullhorn(
  contact: Contact,
  bullhornCompanyId: string
): Promise<{ bullhornId: string }> {
  if (DEMO_MODE) {
    await new Promise((r) => setTimeout(r, 800));
    const fakeId = `BH-CNT-${Math.floor(1000 + Math.random() * 9000)}`;
    return { bullhornId: fakeId };
  }

  const { restUrl, token } = await getBullhornSession();

  const payload: Record<string, unknown> = {
    firstName: contact.firstName,
    lastName: contact.lastName,
    clientCorporation: { id: Number(bullhornCompanyId) },
  };

  if (contact.email) payload.email = contact.email;
  if (contact.phone) payload.phone = contact.phone;
  if (contact.position) payload.title = contact.position;
  if (contact.linkedinUrl) payload.description = `LinkedIn: ${contact.linkedinUrl}`;

  const res = await fetch(
    `${restUrl}entity/ClientContact?BhRestToken=${token}`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(
      `Bullhorn ClientContact create failed (${res.status}): ${text}`
    );
  }

  const data = await res.json();
  return { bullhornId: String(data.changedEntityId) };
}
