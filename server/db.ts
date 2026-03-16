import { eq, like, and, or, inArray } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, companies, contacts, roles, qualifications, Company, Contact, Role, Qualification } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// ============================================================================
// COMPANIES QUERIES
// ============================================================================

export async function getAllCompanies(): Promise<Company[]> {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(companies);
}

export async function getCompanyById(id: number): Promise<Company | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(companies).where(eq(companies.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function searchCompanies(searchTerm: string): Promise<Company[]> {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(companies).where(
    or(
      like(companies.name, `%${searchTerm}%`),
      like(companies.description, `%${searchTerm}%`)
    )
  );
}

export async function filterCompanies(filters: {
  region?: string;
  fundingStage?: string;
  industry?: string;
  category?: string;
  companySize?: string;
  leadStatus?: string;
}): Promise<Company[]> {
  const db = await getDb();
  if (!db) return [];

  const conditions = [];
  if (filters.region) conditions.push(eq(companies.region, filters.region as any));
  if (filters.fundingStage) conditions.push(eq(companies.fundingStage, filters.fundingStage as any));
  if (filters.industry) conditions.push(eq(companies.industry, filters.industry as any));
  if (filters.category) conditions.push(eq(companies.category, filters.category as any));
  if (filters.companySize) conditions.push(eq(companies.companySize, filters.companySize as any));
  if (filters.leadStatus) conditions.push(eq(companies.leadStatus, filters.leadStatus as any));

  if (conditions.length === 0) return await getAllCompanies();
  return await db.select().from(companies).where(and(...conditions));
}

export async function createCompany(data: any): Promise<Company> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(companies).values(data);
  const id = result[0].insertId;
  const company = await getCompanyById(id as number);
  if (!company) throw new Error("Failed to create company");
  return company;
}

export async function updateCompany(id: number, data: Partial<Company>): Promise<Company> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(companies).set(data).where(eq(companies.id, id));
  const company = await getCompanyById(id);
  if (!company) throw new Error("Failed to update company");
  return company;
}

export async function deleteCompany(id: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(companies).where(eq(companies.id, id));
}

// ============================================================================
// CONTACTS QUERIES
// ============================================================================

export async function getContactsByCompanyId(companyId: number): Promise<Contact[]> {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(contacts).where(eq(contacts.companyId, companyId));
}

export async function getContactById(id: number): Promise<Contact | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(contacts).where(eq(contacts.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function searchContacts(searchTerm: string): Promise<Contact[]> {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(contacts).where(
    or(
      like(contacts.fullName, `%${searchTerm}%`),
      like(contacts.email, `%${searchTerm}%`),
      like(contacts.position, `%${searchTerm}%`)
    )
  );
}

export async function createContact(data: any): Promise<Contact> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(contacts).values(data);
  const id = result[0].insertId;
  const contact = await getContactById(id as number);
  if (!contact) throw new Error("Failed to create contact");
  return contact;
}

export async function updateContact(id: number, data: Partial<Contact>): Promise<Contact> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(contacts).set(data).where(eq(contacts.id, id));
  const contact = await getContactById(id);
  if (!contact) throw new Error("Failed to update contact");
  return contact;
}

export async function deleteContact(id: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(contacts).where(eq(contacts.id, id));
}

// ============================================================================
// ROLES QUERIES
// ============================================================================

export async function getRolesByCompanyId(companyId: number): Promise<Role[]> {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(roles).where(eq(roles.companyId, companyId));
}

export async function getRoleById(id: number): Promise<Role | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(roles).where(eq(roles.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function searchRoles(searchTerm: string): Promise<Role[]> {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(roles).where(
    or(
      like(roles.jobTitle, `%${searchTerm}%`),
      like(roles.description, `%${searchTerm}%`),
      like(roles.department, `%${searchTerm}%`)
    )
  );
}

export async function filterRoles(filters: {
  industry?: string;
  category?: string;
  experienceLevel?: string;
  status?: string;
}): Promise<Role[]> {
  const db = await getDb();
  if (!db) return [];

  const conditions = [];
  if (filters.industry) conditions.push(eq(roles.industry, filters.industry as any));
  if (filters.category) conditions.push(eq(roles.category, filters.category as any));
  if (filters.experienceLevel) conditions.push(eq(roles.experienceLevel, filters.experienceLevel as any));
  if (filters.status) conditions.push(eq(roles.status, filters.status as any));

  if (conditions.length === 0) {
    return await db.select().from(roles);
  }
  return await db.select().from(roles).where(and(...conditions));
}

export async function createRole(data: any): Promise<Role> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(roles).values(data);
  const id = result[0].insertId;
  const role = await getRoleById(id as number);
  if (!role) throw new Error("Failed to create role");
  return role;
}

export async function updateRole(id: number, data: Partial<Role>): Promise<Role> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(roles).set(data).where(eq(roles.id, id));
  const role = await getRoleById(id);
  if (!role) throw new Error("Failed to update role");
  return role;
}

export async function deleteRole(id: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(roles).where(eq(roles.id, id));
}

// ============================================================================
// QUALIFICATIONS QUERIES
// ============================================================================

export async function getQualificationByCompanyId(companyId: number): Promise<Qualification | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(qualifications).where(eq(qualifications.companyId, companyId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createQualification(data: any): Promise<Qualification> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(qualifications).values(data);
  const id = result[0].insertId;
  const qualification = await db.select().from(qualifications).where(eq(qualifications.id, id as number)).limit(1);
  if (!qualification || qualification.length === 0) throw new Error("Failed to create qualification");
  return qualification[0];
}

export async function updateQualification(companyId: number, data: Partial<Qualification>): Promise<Qualification> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(qualifications).set(data).where(eq(qualifications.companyId, companyId));
  const qualification = await getQualificationByCompanyId(companyId);
  if (!qualification) throw new Error("Failed to update qualification");
  return qualification;
}
