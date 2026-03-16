import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";
import { TRPCError } from "@trpc/server";

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
});

export type AppRouter = typeof appRouter;
