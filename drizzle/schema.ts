import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, decimal, boolean } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Companies table - stores life science companies and startups
 */
export const companies = mysqlTable("companies", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  website: varchar("website", { length: 255 }),
  location: varchar("location", { length: 255 }).notNull(), // e.g., "Copenhagen, Denmark"
  country: varchar("country", { length: 100 }).notNull(), // e.g., "Denmark"
  region: mysqlEnum("region", ["Denmark", "Germany", "Sweden", "Norway", "EMEA", "Other"]).notNull(),
  
  // Company profile
  companySize: mysqlEnum("companySize", ["1-10", "11-50", "51-120", "121-500", "500+", "Unknown"]).default("Unknown"),
  fundingStage: mysqlEnum("fundingStage", ["Pre-Seed", "Seed", "Series A", "Series B", "Series C+", "Growth", "Public", "Unknown"]).notNull(),
  industry: mysqlEnum("industry", ["Academia", "Agro/Foodtech", "Bio-industrial", "Biotech", "Health Tech", "Healthcare", "Medical Devices", "Pharmaceuticals", "VC/PE/Fund", "Other"]).notNull(),
  category: mysqlEnum("category", ["Biotech", "MedTech", "HealthTech", "Pharma", "Other"]).notNull(),
  
  // Funding information
  totalFundingAmount: decimal("totalFundingAmount", { precision: 12, scale: 2 }), // in millions
  fundingCurrency: varchar("fundingCurrency", { length: 10 }).default("EUR"),
  latestFundingDate: timestamp("latestFundingDate"),
  latestFundingRound: varchar("latestFundingRound", { length: 100 }),
  latestFundingAmount: decimal("latestFundingAmount", { precision: 12, scale: 2 }),
  
  // Lead qualification
  leadStatus: mysqlEnum("leadStatus", ["New", "Contacted", "Qualified", "Disqualified"]).default("New"),
  leadNotes: text("leadNotes"),

  // Assignment
  assignedToId: int("assignedToId"),
  assignedAt: timestamp("assignedAt"),

  // Bullhorn CRM sync
  bullhornId: varchar("bullhornId", { length: 50 }),
  bullhornSyncedAt: timestamp("bullhornSyncedAt"),

  // Metadata
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Company = typeof companies.$inferSelect;
export type InsertCompany = typeof companies.$inferInsert;

/**
 * Contacts table - stores sales contacts and decision-makers at companies
 */
export const contacts = mysqlTable("contacts", {
  id: int("id").autoincrement().primaryKey(),
  companyId: int("companyId").notNull(), // Foreign key to companies
  firstName: varchar("firstName", { length: 100 }).notNull(),
  lastName: varchar("lastName", { length: 100 }).notNull(),
  fullName: varchar("fullName", { length: 255 }).notNull(), // Denormalized for search
  
  // Contact details
  position: varchar("position", { length: 255 }), // e.g., "CEO", "VP of R&D", "Hiring Manager"
  email: varchar("email", { length: 320 }),
  phone: varchar("phone", { length: 20 }),
  linkedinUrl: varchar("linkedinUrl", { length: 255 }),
  
  // Contact classification
  decisionMaker: boolean("decisionMaker").default(false),
  hiringResponsible: boolean("hiringResponsible").default(false),
  
  // Enrichment
  enrichedAt: timestamp("enrichedAt"),

  // Bullhorn CRM sync
  bullhornId: varchar("bullhornId", { length: 50 }),
  bullhornSyncedAt: timestamp("bullhornSyncedAt"),

  // Metadata
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Contact = typeof contacts.$inferSelect;
export type InsertContact = typeof contacts.$inferInsert;

/**
 * Roles table - stores open job positions at companies
 */
export const roles = mysqlTable("roles", {
  id: int("id").autoincrement().primaryKey(),
  companyId: int("companyId").notNull(), // Foreign key to companies
  
  // Role details
  jobTitle: varchar("jobTitle", { length: 255 }).notNull(),
  description: text("description"),
  department: varchar("department", { length: 100 }),
  
  // Role classification
  industry: mysqlEnum("industry", ["Academia", "Agro/Foodtech", "Bio-industrial", "Biotech", "Health Tech", "Healthcare", "Medical Devices", "Pharmaceuticals", "VC/PE/Fund", "Other"]).notNull(),
  category: mysqlEnum("category", ["Biotech", "MedTech", "HealthTech", "Pharma", "Other"]).notNull(),
  
  // Skills and requirements
  requiredSkills: text("requiredSkills"), // JSON array stored as text
  experienceLevel: mysqlEnum("experienceLevel", ["Entry", "Mid", "Senior", "Lead", "Executive", "Unknown"]).default("Unknown"),
  
  // Hiring manager
  hiringManagerId: int("hiringManagerId"), // Foreign key to contacts
  hiringManagerName: varchar("hiringManagerName", { length: 255 }),
  hiringManagerEmail: varchar("hiringManagerEmail", { length: 320 }),
  
  // Role status
  status: mysqlEnum("status", ["Open", "In Progress", "Filled", "On Hold", "Unknown"]).default("Open"),
  postedDate: timestamp("postedDate"),
  
  // Metadata
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Role = typeof roles.$inferSelect;
export type InsertRole = typeof roles.$inferInsert;

/**
 * Qualifications table - tracks lead qualification workflow and status changes
 */
export const qualifications = mysqlTable("qualifications", {
  id: int("id").autoincrement().primaryKey(),
  companyId: int("companyId").notNull(), // Foreign key to companies
  
  // Qualification tracking
  status: mysqlEnum("status", ["New", "Contacted", "Qualified", "Disqualified"]).notNull(),
  notes: text("notes"),
  contactedDate: timestamp("contactedDate"),
  qualifiedDate: timestamp("qualifiedDate"),
  disqualifiedReason: text("disqualifiedReason"),
  
  // Metadata
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Qualification = typeof qualifications.$inferSelect;
export type InsertQualification = typeof qualifications.$inferInsert;

/**
 * Pending leads table - stores AI-discovered leads awaiting manual review
 */
export const pendingLeads = mysqlTable("pendingLeads", {
  id: int("id").autoincrement().primaryKey(),

  // Company info
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  website: varchar("website", { length: 255 }),
  location: varchar("location", { length: 255 }),
  country: varchar("country", { length: 100 }),
  region: mysqlEnum("region", ["Denmark", "Germany", "Sweden", "Norway", "EMEA", "Other"]),
  companySize: mysqlEnum("companySize", ["1-10", "11-50", "51-120", "121-500", "500+", "Unknown"]),
  fundingStage: mysqlEnum("fundingStage", ["Pre-Seed", "Seed", "Series A", "Series B", "Series C+", "Growth", "Public", "Unknown"]),
  industry: mysqlEnum("industry", ["Academia", "Agro/Foodtech", "Bio-industrial", "Biotech", "Health Tech", "Healthcare", "Medical Devices", "Pharmaceuticals", "VC/PE/Fund", "Other"]),
  category: mysqlEnum("category", ["Biotech", "MedTech", "HealthTech", "Pharma", "Other"]),
  totalFundingAmount: decimal("totalFundingAmount", { precision: 12, scale: 2 }),
  latestFundingRound: varchar("latestFundingRound", { length: 100 }),

  // Agent metadata
  agentNotes: text("agentNotes"),   // Why the agent flagged this as a good lead
  sources: text("sources"),         // JSON array of source URLs used
  agentType: mysqlEnum("agentType", ["lead_finder", "data_refresh"]).default("lead_finder"),

  // Review
  reviewStatus: mysqlEnum("reviewStatus", ["pending", "approved", "rejected"]).default("pending"),
  reviewedAt: timestamp("reviewedAt"),

  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PendingLead = typeof pendingLeads.$inferSelect;
export type InsertPendingLead = typeof pendingLeads.$inferInsert;
