import { useState, useRef } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Search, Plus, Download, Upload, Filter, LogOut } from "lucide-react";
import { trpc } from "@/lib/trpc";
import CompaniesView from "@/components/CompaniesView";
import ContactsView from "@/components/ContactsView";
import RolesView from "@/components/RolesView";
import PendingLeadsView from "@/components/PendingLeadsView";

const REGIONS = ["Denmark", "Germany", "Sweden", "Norway", "EMEA", "Other"] as const;
const FUNDING_STAGES = ["Pre-Seed", "Seed", "Series A", "Series B", "Series C+", "Growth", "Public", "Unknown"] as const;
const INDUSTRIES = ["Academia", "Agro/Foodtech", "Bio-industrial", "Biotech", "Health Tech", "Healthcare", "Medical Devices", "Pharmaceuticals", "VC/PE/Fund", "Other"] as const;
const CATEGORIES = ["Biotech", "MedTech", "HealthTech", "Pharma", "Other"] as const;
const COMPANY_SIZES = ["1-10", "11-50", "51-120", "121-500", "500+", "Unknown"] as const;

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

function toCSV(headers: string[], rows: string[][]): string {
  return [headers, ...rows]
    .map((row) => row.map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`).join(","))
    .join("\n");
}

function downloadCSV(csv: string, filename: string) {
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${filename}-${new Date().toISOString().split("T")[0]}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export default function Dashboard() {
  const { user, isAuthenticated, logout } = useAuth();
  const utils = trpc.useUtils();

  const [activeTab, setActiveTab] = useState("companies");
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [showAddLead, setShowAddLead] = useState(false);
  const [importStatus, setImportStatus] = useState<{ type: "success" | "error" | "info"; message: string } | null>(null);

  const [filters, setFilters] = useState({
    region: "",
    fundingStage: "",
    industry: "",
    category: "",
    companySize: "",
    leadStatus: "",
  });

  const emptyLead = {
    name: "",
    location: "",
    country: "",
    region: "" as typeof REGIONS[number] | "",
    fundingStage: "" as typeof FUNDING_STAGES[number] | "",
    industry: "" as typeof INDUSTRIES[number] | "",
    category: "" as typeof CATEGORIES[number] | "",
    companySize: "" as typeof COMPANY_SIZES[number] | "",
    website: "",
    description: "",
    totalFundingAmount: "",
  };
  const [newLead, setNewLead] = useState(emptyLead);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const createCompanyMutation = trpc.companies.create.useMutation({
    onSuccess: () => utils.companies.list.invalidate(),
  });

  const handleExportCSV = async () => {
    if (activeTab === "companies") {
      const data = await utils.companies.list.fetch();
      const headers = ["Name", "Location", "Country", "Region", "Funding Stage", "Industry", "Category", "Company Size", "Lead Status", "Website", "Total Funding (M)", "Description"];
      const rows = data.map((c) => [
        c.name, c.location, c.country, c.region, c.fundingStage,
        c.industry, c.category, c.companySize ?? "", c.leadStatus ?? "",
        c.website ?? "", c.totalFundingAmount?.toString() ?? "", c.description ?? "",
      ]);
      downloadCSV(toCSV(headers, rows), "bse-companies");
    } else if (activeTab === "contacts") {
      const data = await utils.contacts.search.fetch({ searchTerm: "" });
      const headers = ["Full Name", "Position", "Email", "Phone", "LinkedIn", "Decision Maker", "Hiring Responsible"];
      const rows = data.map((c) => [
        c.fullName, c.position ?? "", c.email ?? "", c.phone ?? "",
        c.linkedinUrl ?? "", c.decisionMaker ? "Yes" : "No", c.hiringResponsible ? "Yes" : "No",
      ]);
      downloadCSV(toCSV(headers, rows), "bse-contacts");
    } else if (activeTab === "roles") {
      const data = await utils.roles.search.fetch({ searchTerm: "" });
      const headers = ["Job Title", "Department", "Industry", "Category", "Experience Level", "Status", "Hiring Manager", "Hiring Manager Email", "Required Skills"];
      const rows = data.map((r) => [
        r.jobTitle, r.department ?? "", r.industry, r.category,
        r.experienceLevel ?? "", r.status ?? "", r.hiringManagerName ?? "",
        r.hiringManagerEmail ?? "", r.requiredSkills ?? "",
      ]);
      downloadCSV(toCSV(headers, rows), "bse-roles");
    }
  };

  const handleImportCSV = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportStatus({ type: "info", message: "Parsing CSV..." });

    const text = await file.text();
    const lines = text.split("\n").filter((l) => l.trim());
    if (lines.length < 2) {
      setImportStatus({ type: "error", message: "CSV must have a header row and at least one data row." });
      return;
    }

    const rawHeaders = parseCSVLine(lines[0]).map((h) => h.toLowerCase().replace(/[^a-z]/g, ""));
    const headerMap: Record<string, string> = {
      name: "name", companyname: "name",
      location: "location", city: "location",
      country: "country",
      region: "region",
      fundingstage: "fundingStage", stage: "fundingStage",
      industry: "industry",
      category: "category",
      companysize: "companySize", size: "companySize", employees: "companySize",
      website: "website", url: "website",
      description: "description",
      totalfunding: "totalFundingAmount", funding: "totalFundingAmount", totalfundingm: "totalFundingAmount",
    };

    let imported = 0;
    let failed = 0;

    for (let i = 1; i < lines.length; i++) {
      const values = parseCSVLine(lines[i]);
      const row: Record<string, string> = {};
      rawHeaders.forEach((h, idx) => {
        const field = headerMap[h];
        if (field) row[field] = values[idx] ?? "";
      });

      if (!row.name || !row.location || !row.country || !row.region || !row.fundingStage || !row.industry || !row.category) {
        failed++;
        continue;
      }

      if (
        !REGIONS.includes(row.region as any) ||
        !FUNDING_STAGES.includes(row.fundingStage as any) ||
        !INDUSTRIES.includes(row.industry as any) ||
        !CATEGORIES.includes(row.category as any)
      ) {
        failed++;
        continue;
      }

      try {
        await createCompanyMutation.mutateAsync({
          name: row.name,
          location: row.location,
          country: row.country,
          region: row.region as any,
          fundingStage: row.fundingStage as any,
          industry: row.industry as any,
          category: row.category as any,
          companySize: row.companySize && COMPANY_SIZES.includes(row.companySize as any) ? (row.companySize as any) : undefined,
          website: row.website || undefined,
          description: row.description || undefined,
          totalFundingAmount: row.totalFundingAmount ? parseFloat(row.totalFundingAmount) : undefined,
        });
        imported++;
      } catch {
        failed++;
      }
    }

    setImportStatus({
      type: imported > 0 ? "success" : "error",
      message: `Import complete: ${imported} added, ${failed} skipped.`,
    });
    e.target.value = "";
  };

  const handleAddLead = async () => {
    if (!newLead.name || !newLead.location || !newLead.country || !newLead.region || !newLead.fundingStage || !newLead.industry || !newLead.category) return;
    await createCompanyMutation.mutateAsync({
      name: newLead.name,
      location: newLead.location,
      country: newLead.country,
      region: newLead.region as any,
      fundingStage: newLead.fundingStage as any,
      industry: newLead.industry as any,
      category: newLead.category as any,
      companySize: newLead.companySize as any || undefined,
      website: newLead.website || undefined,
      description: newLead.description || undefined,
      totalFundingAmount: newLead.totalFundingAmount ? parseFloat(newLead.totalFundingAmount) : undefined,
    });
    setNewLead(emptyLead);
    setShowAddLead(false);
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>BSE Leads Platform</CardTitle>
            <CardDescription>Life Science Recruitment Lead Management</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              This platform helps you manage and qualify life science leads across the EMEA region.
            </p>
            <Button className="w-full" onClick={() => { window.location.href = getLoginUrl(); }}>
              Log in
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const addLeadFormValid = !!(newLead.name && newLead.location && newLead.country && newLead.region && newLead.fundingStage && newLead.industry && newLead.category);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">BSE Leads Platform</h1>
            <p className="text-sm text-muted-foreground">Life Science Recruitment Lead Management</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-medium">{user?.name}</p>
              <p className="text-xs text-muted-foreground">{user?.email}</p>
            </div>
            <Button variant="outline" size="sm" onClick={logout} className="gap-2">
              <LogOut className="w-4 h-4" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        {/* Search and Filter Bar */}
        <div className="mb-6 space-y-4">
          <div className="flex gap-2 flex-wrap">
            <div className="flex-1 relative min-w-48">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search companies, contacts, or roles..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant={showFilters ? "default" : "outline"} onClick={() => setShowFilters(!showFilters)} className="gap-2">
              <Filter className="w-4 h-4" />
              Filters
            </Button>
            <Button variant="outline" className="gap-2" onClick={handleExportCSV}>
              <Download className="w-4 h-4" />
              Export CSV
            </Button>
            <Button variant="outline" className="gap-2" onClick={() => fileInputRef.current?.click()}>
              <Upload className="w-4 h-4" />
              Import CSV
            </Button>
            <Button className="gap-2" onClick={() => setShowAddLead(true)}>
              <Plus className="w-4 h-4" />
              Add Lead
            </Button>
          </div>

          {importStatus && (
            <div className={`text-sm px-3 py-2 rounded flex items-center justify-between ${
              importStatus.type === "success" ? "bg-green-50 text-green-700 border border-green-200" :
              importStatus.type === "error" ? "bg-red-50 text-red-700 border border-red-200" :
              "bg-blue-50 text-blue-700 border border-blue-200"
            }`}>
              <span>{importStatus.message}</span>
              <button className="ml-4 underline text-xs opacity-70 hover:opacity-100" onClick={() => setImportStatus(null)}>dismiss</button>
            </div>
          )}

          <input ref={fileInputRef} type="file" accept=".csv" className="hidden" onChange={handleImportCSV} />

          {/* Filters Panel */}
          {showFilters && (
            <Card className="p-4">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                <div>
                  <label className="text-xs font-medium mb-1 block">Region</label>
                  <Select value={filters.region || "all"} onValueChange={(val) => setFilters({ ...filters, region: val === "all" ? "" : val })}>
                    <SelectTrigger className="h-8"><SelectValue placeholder="All" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Regions</SelectItem>
                      <SelectItem value="Denmark">Denmark</SelectItem>
                      <SelectItem value="Germany">Germany</SelectItem>
                      <SelectItem value="Sweden">Sweden</SelectItem>
                      <SelectItem value="Norway">Norway</SelectItem>
                      <SelectItem value="EMEA">EMEA</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs font-medium mb-1 block">Funding Stage</label>
                  <Select value={filters.fundingStage || "all"} onValueChange={(val) => setFilters({ ...filters, fundingStage: val === "all" ? "" : val })}>
                    <SelectTrigger className="h-8"><SelectValue placeholder="All" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Stages</SelectItem>
                      <SelectItem value="Pre-Seed">Pre-Seed</SelectItem>
                      <SelectItem value="Seed">Seed</SelectItem>
                      <SelectItem value="Series A">Series A</SelectItem>
                      <SelectItem value="Series B">Series B</SelectItem>
                      <SelectItem value="Series C+">Series C+</SelectItem>
                      <SelectItem value="Growth">Growth</SelectItem>
                      <SelectItem value="Public">Public</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs font-medium mb-1 block">Industry</label>
                  <Select value={filters.industry || "all"} onValueChange={(val) => setFilters({ ...filters, industry: val === "all" ? "" : val })}>
                    <SelectTrigger className="h-8"><SelectValue placeholder="All" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Industries</SelectItem>
                      <SelectItem value="Biotech">Biotech</SelectItem>
                      <SelectItem value="Health Tech">Health Tech</SelectItem>
                      <SelectItem value="Healthcare">Healthcare</SelectItem>
                      <SelectItem value="Medical Devices">Medical Devices</SelectItem>
                      <SelectItem value="Pharmaceuticals">Pharmaceuticals</SelectItem>
                      <SelectItem value="Academia">Academia</SelectItem>
                      <SelectItem value="Agro/Foodtech">Agro/Foodtech</SelectItem>
                      <SelectItem value="Bio-industrial">Bio-industrial</SelectItem>
                      <SelectItem value="VC/PE/Fund">VC/PE/Fund</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs font-medium mb-1 block">Category</label>
                  <Select value={filters.category || "all"} onValueChange={(val) => setFilters({ ...filters, category: val === "all" ? "" : val })}>
                    <SelectTrigger className="h-8"><SelectValue placeholder="All" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      <SelectItem value="Biotech">Biotech</SelectItem>
                      <SelectItem value="MedTech">MedTech</SelectItem>
                      <SelectItem value="HealthTech">HealthTech</SelectItem>
                      <SelectItem value="Pharma">Pharma</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs font-medium mb-1 block">Company Size</label>
                  <Select value={filters.companySize || "all"} onValueChange={(val) => setFilters({ ...filters, companySize: val === "all" ? "" : val })}>
                    <SelectTrigger className="h-8"><SelectValue placeholder="All" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Sizes</SelectItem>
                      <SelectItem value="1-10">1-10</SelectItem>
                      <SelectItem value="11-50">11-50</SelectItem>
                      <SelectItem value="51-120">51-120</SelectItem>
                      <SelectItem value="121-500">121-500</SelectItem>
                      <SelectItem value="500+">500+</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs font-medium mb-1 block">Lead Status</label>
                  <Select value={filters.leadStatus || "all"} onValueChange={(val) => setFilters({ ...filters, leadStatus: val === "all" ? "" : val })}>
                    <SelectTrigger className="h-8"><SelectValue placeholder="All" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="New">New</SelectItem>
                      <SelectItem value="Contacted">Contacted</SelectItem>
                      <SelectItem value="Qualified">Qualified</SelectItem>
                      <SelectItem value="Disqualified">Disqualified</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </Card>
          )}
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="companies">Companies</TabsTrigger>
            <TabsTrigger value="contacts">Contacts</TabsTrigger>
            <TabsTrigger value="roles">Open Roles</TabsTrigger>
            <TabsTrigger value="pending">AI Leads</TabsTrigger>
          </TabsList>
          <TabsContent value="companies" className="mt-6">
            <CompaniesView searchTerm={searchTerm} filters={filters} currentUserId={user?.id} />
          </TabsContent>
          <TabsContent value="contacts" className="mt-6">
            <ContactsView searchTerm={searchTerm} />
          </TabsContent>
          <TabsContent value="roles" className="mt-6">
            <RolesView searchTerm={searchTerm} filters={filters} />
          </TabsContent>
          <TabsContent value="pending" className="mt-6">
            <PendingLeadsView />
          </TabsContent>
        </Tabs>
      </main>

      {/* Add Lead Dialog */}
      <Dialog open={showAddLead} onOpenChange={setShowAddLead}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Lead</DialogTitle>
            <DialogDescription>Add a new company to your leads pipeline. Fields marked * are required.</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 mt-2">
            <div className="col-span-2">
              <Label>Company Name *</Label>
              <Input value={newLead.name} onChange={(e) => setNewLead({ ...newLead, name: e.target.value })} placeholder="e.g. BioNovate A/S" />
            </div>
            <div>
              <Label>Location *</Label>
              <Input value={newLead.location} onChange={(e) => setNewLead({ ...newLead, location: e.target.value })} placeholder="e.g. Copenhagen, Denmark" />
            </div>
            <div>
              <Label>Country *</Label>
              <Input value={newLead.country} onChange={(e) => setNewLead({ ...newLead, country: e.target.value })} placeholder="e.g. Denmark" />
            </div>
            <div>
              <Label>Region *</Label>
              <Select value={newLead.region} onValueChange={(val) => setNewLead({ ...newLead, region: val as any })}>
                <SelectTrigger><SelectValue placeholder="Select region" /></SelectTrigger>
                <SelectContent>
                  {REGIONS.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Funding Stage *</Label>
              <Select value={newLead.fundingStage} onValueChange={(val) => setNewLead({ ...newLead, fundingStage: val as any })}>
                <SelectTrigger><SelectValue placeholder="Select stage" /></SelectTrigger>
                <SelectContent>
                  {FUNDING_STAGES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Industry *</Label>
              <Select value={newLead.industry} onValueChange={(val) => setNewLead({ ...newLead, industry: val as any })}>
                <SelectTrigger><SelectValue placeholder="Select industry" /></SelectTrigger>
                <SelectContent>
                  {INDUSTRIES.map((i) => <SelectItem key={i} value={i}>{i}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Category *</Label>
              <Select value={newLead.category} onValueChange={(val) => setNewLead({ ...newLead, category: val as any })}>
                <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Company Size</Label>
              <Select value={newLead.companySize || "none"} onValueChange={(val) => setNewLead({ ...newLead, companySize: val === "none" ? "" : val as any })}>
                <SelectTrigger><SelectValue placeholder="Select size" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Unknown</SelectItem>
                  {COMPANY_SIZES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Total Funding (M€)</Label>
              <Input type="number" value={newLead.totalFundingAmount} onChange={(e) => setNewLead({ ...newLead, totalFundingAmount: e.target.value })} placeholder="e.g. 12.5" />
            </div>
            <div className="col-span-2">
              <Label>Website</Label>
              <Input value={newLead.website} onChange={(e) => setNewLead({ ...newLead, website: e.target.value })} placeholder="https://..." />
            </div>
            <div className="col-span-2">
              <Label>Description</Label>
              <Textarea value={newLead.description} onChange={(e) => setNewLead({ ...newLead, description: e.target.value })} placeholder="Brief description of the company..." rows={3} />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setShowAddLead(false)}>Cancel</Button>
            <Button onClick={handleAddLead} disabled={!addLeadFormValid || createCompanyMutation.isPending}>
              {createCompanyMutation.isPending ? "Adding..." : "Add Lead"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
