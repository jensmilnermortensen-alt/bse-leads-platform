import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";
import { TRPCError } from "@trpc/server";
import { runLeadFinderAgent, runDataRefreshAgent } from "./agent";
import { enrichContact, isFullEnrichDemoMode } from "./fullenrich";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // ============================================================================
  // COMPANIES PROCEDURES
  // ============================================================================
  companies: router({
    list: publicProcedure.query(async () => {
      return await db.getAllCompanies();
    }),

    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const company = await db.getCompanyById(input.id);
        if (!company) throw new TRPCError({ code: "NOT_FOUND" });
        return company;
      }),

    search: publicProcedure
      .input(z.object({ searchTerm: z.string() }))
      .query(async ({ input }) => {
        return await db.searchCompanies(input.searchTerm);
      }),

    filter: publicProcedure
      .input(z.object({
        region: z.string().optional(),
        fundingStage: z.string().optional(),
        industry: z.string().optional(),
        category: z.string().optional(),
        companySize: z.string().optional(),
        leadStatus: z.string().optional(),
      }))
      .query(async ({ input }) => {
        return await db.filterCompanies(input);
      }),

    create: protectedProcedure
      .input(z.object({
        name: z.string(),
        description: z.string().optional(),
        website: z.string().optional(),
        location: z.string(),
        country: z.string(),
        region: z.enum(["Denmark", "Germany", "Sweden", "Norway", "EMEA", "Other"]),
        companySize: z.enum(["1-10", "11-50", "51-120", "121-500", "500+", "Unknown"]).optional(),
        fundingStage: z.enum(["Pre-Seed", "Seed", "Series A", "Series B", "Series C+", "Growth", "Public", "Unknown"]),
        industry: z.enum(["Academia", "Agro/Foodtech", "Bio-industrial", "Biotech", "Health Tech", "Healthcare", "Medical Devices", "Pharmaceuticals", "VC/PE/Fund", "Other"]),
        category: z.enum(["Biotech", "MedTech", "HealthTech", "Pharma", "Other"]),
        totalFundingAmount: z.number().optional(),
        latestFundingDate: z.date().optional(),
        latestFundingRound: z.string().optional(),
        latestFundingAmount: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        return await db.createCompany(input);
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        data: z.object({
          name: z.string().optional(),
          description: z.string().optional(),
          website: z.string().optional(),
          location: z.string().optional(),
          country: z.string().optional(),
          region: z.enum(["Denmark", "Germany", "Sweden", "Norway", "EMEA", "Other"]).optional(),
          companySize: z.enum(["1-10", "11-50", "51-120", "121-500", "500+", "Unknown"]).optional(),
          fundingStage: z.enum(["Pre-Seed", "Seed", "Series A", "Series B", "Series C+", "Growth", "Public", "Unknown"]).optional(),
          industry: z.enum(["Academia", "Agro/Foodtech", "Bio-industrial", "Biotech", "Health Tech", "Healthcare", "Medical Devices", "Pharmaceuticals", "VC/PE/Fund", "Other"]).optional(),
          category: z.enum(["Biotech", "MedTech", "HealthTech", "Pharma", "Other"]).optional(),
          leadStatus: z.enum(["New", "Contacted", "Qualified", "Disqualified"]).optional(),
          leadNotes: z.string().optional(),
        }),
      }))
      .mutation(async ({ input }) => {
        return await db.updateCompany(input.id, input.data);
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteCompany(input.id);
        return { success: true };
      }),

    assign: protectedProcedure
      .input(z.object({ companyId: z.number(), assignedToId: z.number().nullable() }))
      .mutation(async ({ input }) => {
        return await db.assignCompany(input.companyId, input.assignedToId);
      }),
  }),

  // ============================================================================
  // CONTACTS PROCEDURES
  // ============================================================================
  contacts: router({
    getByCompanyId: publicProcedure
      .input(z.object({ companyId: z.number() }))
      .query(async ({ input }) => {
        return await db.getContactsByCompanyId(input.companyId);
      }),

    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const contact = await db.getContactById(input.id);
        if (!contact) throw new TRPCError({ code: "NOT_FOUND" });
        return contact;
      }),

    search: publicProcedure
      .input(z.object({ searchTerm: z.string() }))
      .query(async ({ input }) => {
        return await db.searchContacts(input.searchTerm);
      }),

    create: protectedProcedure
      .input(z.object({
        companyId: z.number(),
        firstName: z.string(),
        lastName: z.string(),
        fullName: z.string(),
        position: z.string().optional(),
        email: z.string().email().optional(),
        phone: z.string().optional(),
        linkedinUrl: z.string().optional(),
        decisionMaker: z.boolean().optional(),
        hiringResponsible: z.boolean().optional(),
      }))
      .mutation(async ({ input }) => {
        return await db.createContact(input);
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        data: z.object({
          firstName: z.string().optional(),
          lastName: z.string().optional(),
          fullName: z.string().optional(),
          position: z.string().optional(),
          email: z.string().optional(),
          phone: z.string().optional(),
          linkedinUrl: z.string().optional(),
          decisionMaker: z.boolean().optional(),
          hiringResponsible: z.boolean().optional(),
        }),
      }))
      .mutation(async ({ input }) => {
        return await db.updateContact(input.id, input.data);
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteContact(input.id);
        return { success: true };
      }),

    enrich: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const contact = await db.getContactById(input.id);
        if (!contact) throw new TRPCError({ code: "NOT_FOUND" });

        const company = await db.getCompanyById(contact.companyId);

        const result = await enrichContact({
          firstName: contact.firstName,
          lastName: contact.lastName,
          linkedinUrl: contact.linkedinUrl,
          companyName: company?.name,
        });

        // Only fill in fields that are currently empty
        const updates: Record<string, unknown> = { enrichedAt: result.enrichedAt };
        if (result.email && !contact.email) updates.email = result.email;
        if (result.phone && !contact.phone) updates.phone = result.phone;

        await db.updateContact(input.id, updates as any);
        return { ...result, contactId: input.id };
      }),

    isEnrichDemoMode: publicProcedure.query(() => isFullEnrichDemoMode()),
  }),

  // ============================================================================
  // ROLES PROCEDURES
  // ============================================================================
  roles: router({
    getByCompanyId: publicProcedure
      .input(z.object({ companyId: z.number() }))
      .query(async ({ input }) => {
        return await db.getRolesByCompanyId(input.companyId);
      }),

    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const role = await db.getRoleById(input.id);
        if (!role) throw new TRPCError({ code: "NOT_FOUND" });
        return role;
      }),

    search: publicProcedure
      .input(z.object({ searchTerm: z.string() }))
      .query(async ({ input }) => {
        return await db.searchRoles(input.searchTerm);
      }),

    filter: publicProcedure
      .input(z.object({
        industry: z.string().optional(),
        category: z.string().optional(),
        experienceLevel: z.string().optional(),
        status: z.string().optional(),
      }))
      .query(async ({ input }) => {
        return await db.filterRoles(input);
      }),

    create: protectedProcedure
      .input(z.object({
        companyId: z.number(),
        jobTitle: z.string(),
        description: z.string().optional(),
        department: z.string().optional(),
        industry: z.enum(["Academia", "Agro/Foodtech", "Bio-industrial", "Biotech", "Health Tech", "Healthcare", "Medical Devices", "Pharmaceuticals", "VC/PE/Fund", "Other"]),
        category: z.enum(["Biotech", "MedTech", "HealthTech", "Pharma", "Other"]),
        requiredSkills: z.string().optional(),
        experienceLevel: z.enum(["Entry", "Mid", "Senior", "Lead", "Executive", "Unknown"]).optional(),
        hiringManagerName: z.string().optional(),
        hiringManagerEmail: z.string().optional(),
        status: z.enum(["Open", "In Progress", "Filled", "On Hold", "Unknown"]).optional(),
        postedDate: z.date().optional(),
      }))
      .mutation(async ({ input }) => {
        return await db.createRole(input);
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        data: z.object({
          jobTitle: z.string().optional(),
          description: z.string().optional(),
          department: z.string().optional(),
          industry: z.enum(["Academia", "Agro/Foodtech", "Bio-industrial", "Biotech", "Health Tech", "Healthcare", "Medical Devices", "Pharmaceuticals", "VC/PE/Fund", "Other"]).optional(),
          category: z.enum(["Biotech", "MedTech", "HealthTech", "Pharma", "Other"]).optional(),
          requiredSkills: z.string().optional(),
          experienceLevel: z.enum(["Entry", "Mid", "Senior", "Lead", "Executive", "Unknown"]).optional(),
          hiringManagerName: z.string().optional(),
          hiringManagerEmail: z.string().optional(),
          status: z.enum(["Open", "In Progress", "Filled", "On Hold", "Unknown"]).optional(),
        }),
      }))
      .mutation(async ({ input }) => {
        return await db.updateRole(input.id, input.data);
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteRole(input.id);
        return { success: true };
      }),
  }),

  // ============================================================================
  // QUALIFICATIONS PROCEDURES
  // ============================================================================
  qualifications: router({
    getByCompanyId: publicProcedure
      .input(z.object({ companyId: z.number() }))
      .query(async ({ input }) => {
        return await db.getQualificationByCompanyId(input.companyId);
      }),

    updateStatus: protectedProcedure
      .input(z.object({
        companyId: z.number(),
        status: z.enum(["New", "Contacted", "Qualified", "Disqualified"]),
        notes: z.string().optional(),
        disqualifiedReason: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const existing = await db.getQualificationByCompanyId(input.companyId);
        const updateData: any = {
          status: input.status,
          notes: input.notes || existing?.notes,
        };

        if (input.status === "Contacted" && !existing?.contactedDate) {
          updateData.contactedDate = new Date();
        }
        if (input.status === "Qualified" && !existing?.qualifiedDate) {
          updateData.qualifiedDate = new Date();
        }
        if (input.status === "Disqualified") {
          updateData.disqualifiedReason = input.disqualifiedReason;
        }

        if (existing) {
          return await db.updateQualification(input.companyId, updateData);
        } else {
          return await db.createQualification({
            companyId: input.companyId,
            ...updateData,
          });
        }
      }),

    addNotes: protectedProcedure
      .input(z.object({
        companyId: z.number(),
        notes: z.string(),
      }))
      .mutation(async ({ input }) => {
        const existing = await db.getQualificationByCompanyId(input.companyId);
        const currentNotes = existing?.notes || "";
        const updatedNotes = currentNotes ? `${currentNotes}\n\n${input.notes}` : input.notes;

        if (existing) {
          return await db.updateQualification(input.companyId, { notes: updatedNotes });
        } else {
          return await db.createQualification({
            companyId: input.companyId,
            status: "New",
            notes: updatedNotes,
          });
        }
      }),
  }),

  // ============================================================================
  // PENDING LEADS PROCEDURES
  // ============================================================================
  pendingLeads: router({
    list: protectedProcedure
      .input(z.object({ status: z.enum(["pending", "approved", "rejected"]).optional() }))
      .query(async ({ input }) => {
        return await db.getPendingLeads(input.status);
      }),

    approve: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const lead = await db.getPendingLeadById(input.id);
        if (!lead) throw new TRPCError({ code: "NOT_FOUND" });

        // Promote to full company
        await db.createCompany({
          name: lead.name,
          description: lead.description,
          website: lead.website,
          location: lead.location || "Unknown",
          country: lead.country || "Unknown",
          region: lead.region || "Other",
          companySize: lead.companySize || "Unknown",
          fundingStage: lead.fundingStage || "Unknown",
          industry: lead.industry || "Other",
          category: lead.category || "Other",
          totalFundingAmount: lead.totalFundingAmount ? Number(lead.totalFundingAmount) : undefined,
          latestFundingRound: lead.latestFundingRound,
          leadStatus: "New",
          leadNotes: lead.agentNotes,
        });

        return await db.updatePendingLeadStatus(input.id, "approved");
      }),

    reject: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        return await db.updatePendingLeadStatus(input.id, "rejected");
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deletePendingLead(input.id);
        return { success: true };
      }),
  }),

  // ============================================================================
  // AGENT PROCEDURES
  // ============================================================================
  agents: router({
    isDemoMode: protectedProcedure.query(() => !process.env.ANTHROPIC_API_KEY),

    runLeadFinder: protectedProcedure
      .mutation(async () => {
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
            // skip duplicates or invalid entries
          }
        }
        return { found: leads.length, saved };
      }),

    runDataRefresh: protectedProcedure
      .mutation(async () => {
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
        return { checked: subset.length, updatesFound: updates.length, saved };
      }),
  }),

  // ============================================================================
  // USERS PROCEDURES
  // ============================================================================
  users: router({
    list: protectedProcedure.query(async () => {
      return await db.getUsers();
    }),
  }),
});

export type AppRouter = typeof appRouter;
