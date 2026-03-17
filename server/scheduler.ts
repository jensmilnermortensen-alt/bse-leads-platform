/**
 * Weekly agent scheduler.
 *
 * Runs the Lead Finder and Data Refresh agents every Monday at 08:00 (server
 * local time) without requiring any external cron library.
 *
 * Results are saved as pending leads for manual review — exactly the same as
 * clicking "Run Lead Finder" / "Refresh Company Data" in the UI.
 *
 * In demo mode (no ANTHROPIC_API_KEY) the agents return realistic dummy data,
 * so the full workflow is visible without spending any API credits.
 */

import { runLeadFinderAgent, runDataRefreshAgent } from "./agent";
import * as db from "./db";

function msUntilNextRun(): number {
  const now = new Date();
  const next = new Date(now);

  const dayOfWeek = now.getDay(); // 0=Sun, 1=Mon, ...
  const daysUntilMonday = dayOfWeek === 1 ? 0 : (8 - dayOfWeek) % 7 || 7;

  next.setDate(now.getDate() + daysUntilMonday);
  next.setHours(8, 0, 0, 0);

  // If next Monday 8am has already passed (e.g. it's Monday 09:00), push a week out
  if (next.getTime() <= now.getTime()) {
    next.setDate(next.getDate() + 7);
  }

  return next.getTime() - now.getTime();
}

async function runWeeklyAgents() {
  const demo = !process.env.ANTHROPIC_API_KEY;
  console.log(`[Scheduler] Running weekly agents${demo ? " (demo mode)" : ""}...`);

  // --- Lead Finder ---
  try {
    const leads = await runLeadFinderAgent();
    let saved = 0;
    for (const lead of leads) {
      try {
        await db.createPendingLead({
          name: lead.name,
          description: lead.description,
          website: lead.website,
          location: lead.location,
          country: lead.country,
          region: lead.region,
          companySize: lead.companySize,
          fundingStage: lead.fundingStage,
          industry: lead.industry,
          category: lead.category,
          totalFundingAmount: lead.totalFundingAmount?.toString(),
          latestFundingRound: lead.latestFundingRound,
          agentNotes: lead.agentNotes,
          sources: lead.sources ? JSON.stringify(lead.sources) : null,
          agentType: "lead_finder",
        });
        saved++;
      } catch {
        // skip duplicates / invalid
      }
    }
    console.log(`[Scheduler] Lead Finder: ${leads.length} found, ${saved} saved for review`);
  } catch (err) {
    console.error("[Scheduler] Lead Finder failed:", err);
  }

  // --- Data Refresh ---
  try {
    const allCompanies = await db.getAllCompanies();
    const subset = allCompanies.slice(0, 20).map((c) => ({
      id: c.id,
      name: c.name,
      website: c.website,
      location: c.location,
    }));

    const updates = await runDataRefreshAgent(subset);
    let saved = 0;
    for (const update of updates) {
      try {
        await db.createPendingLead({
          name: update.companyName,
          agentNotes: `DATA REFRESH for company ID ${update.companyId}:\n${update.agentNotes}\n\nChanges found: ${JSON.stringify(update.changes, null, 2)}`,
          sources: update.sources ? JSON.stringify(update.sources) : null,
          agentType: "data_refresh",
          location: "N/A",
          country: "N/A",
          fundingStage: "Unknown",
          industry: "Other",
          category: "Other",
        });
        saved++;
      } catch {
        // skip
      }
    }
    console.log(`[Scheduler] Data Refresh: ${subset.length} checked, ${updates.length} updates, ${saved} saved`);
  } catch (err) {
    console.error("[Scheduler] Data Refresh failed:", err);
  }
}

function scheduleNext() {
  const ms = msUntilNextRun();
  const nextRun = new Date(Date.now() + ms);
  console.log(`[Scheduler] Next weekly run: ${nextRun.toLocaleString()} (in ${Math.round(ms / 3600000)}h)`);

  setTimeout(async () => {
    await runWeeklyAgents();
    scheduleNext(); // schedule the following week
  }, ms);
}

export function startScheduler() {
  console.log("[Scheduler] Weekly agent scheduler started — runs every Monday at 08:00");
  scheduleNext();
}
