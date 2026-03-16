import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, Download, Filter } from "lucide-react";
import { trpc } from "@/lib/trpc";
import CompaniesView from "@/components/CompaniesView";
import ContactsView from "@/components/ContactsView";
import RolesView from "@/components/RolesView";

export default function Dashboard() {
  const { user, isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState("companies");
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  // Filters state
  const [filters, setFilters] = useState({
    region: "",
    fundingStage: "",
    industry: "",
    category: "",
    companySize: "",
    leadStatus: "",
  });

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>BSE Leads Platform</CardTitle>
            <CardDescription>Please log in to access the leads dashboard</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              This platform helps you manage and qualify life science leads across the EMEA region.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">BSE Leads Platform</h1>
            <p className="text-sm text-muted-foreground">Life Science Recruitment Lead Management</p>
          </div>
          <div className="text-right">
            <p className="text-sm font-medium">{user?.name}</p>
            <p className="text-xs text-muted-foreground">{user?.email}</p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        {/* Search and Filter Bar */}
        <div className="mb-6 space-y-4">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search companies, contacts, or roles..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button
              variant={showFilters ? "default" : "outline"}
              onClick={() => setShowFilters(!showFilters)}
              className="gap-2"
            >
              <Filter className="w-4 h-4" />
              Filters
            </Button>
            <Button variant="outline" className="gap-2">
              <Download className="w-4 h-4" />
              Export CSV
            </Button>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Add Lead
            </Button>
          </div>

          {/* Filters Panel */}
          {showFilters && (
            <Card className="p-4">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                <div>
                  <label className="text-xs font-medium mb-1 block">Region</label>
                  <Select value={filters.region} onValueChange={(val) => setFilters({ ...filters, region: val })}>
                    <SelectTrigger className="h-8">
                      <SelectValue placeholder="All" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Regions</SelectItem>
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
                  <Select value={filters.fundingStage} onValueChange={(val) => setFilters({ ...filters, fundingStage: val })}>
                    <SelectTrigger className="h-8">
                      <SelectValue placeholder="All" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Stages</SelectItem>
                      <SelectItem value="Seed">Seed</SelectItem>
                      <SelectItem value="Series A">Series A</SelectItem>
                      <SelectItem value="Series B">Series B</SelectItem>
                      <SelectItem value="Growth">Growth</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-xs font-medium mb-1 block">Industry</label>
                  <Select value={filters.industry} onValueChange={(val) => setFilters({ ...filters, industry: val })}>
                    <SelectTrigger className="h-8">
                      <SelectValue placeholder="All" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Industries</SelectItem>
                      <SelectItem value="Biotech">Biotech</SelectItem>
                      <SelectItem value="Health Tech">Health Tech</SelectItem>
                      <SelectItem value="Medical Devices">Medical Devices</SelectItem>
                      <SelectItem value="Pharmaceuticals">Pharmaceuticals</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-xs font-medium mb-1 block">Category</label>
                  <Select value={filters.category} onValueChange={(val) => setFilters({ ...filters, category: val })}>
                    <SelectTrigger className="h-8">
                      <SelectValue placeholder="All" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Categories</SelectItem>
                      <SelectItem value="Biotech">Biotech</SelectItem>
                      <SelectItem value="MedTech">MedTech</SelectItem>
                      <SelectItem value="HealthTech">HealthTech</SelectItem>
                      <SelectItem value="Pharma">Pharma</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-xs font-medium mb-1 block">Company Size</label>
                  <Select value={filters.companySize} onValueChange={(val) => setFilters({ ...filters, companySize: val })}>
                    <SelectTrigger className="h-8">
                      <SelectValue placeholder="All" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Sizes</SelectItem>
                      <SelectItem value="1-10">1-10</SelectItem>
                      <SelectItem value="11-50">11-50</SelectItem>
                      <SelectItem value="51-120">51-120</SelectItem>
                      <SelectItem value="121-500">121-500</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-xs font-medium mb-1 block">Lead Status</label>
                  <Select value={filters.leadStatus} onValueChange={(val) => setFilters({ ...filters, leadStatus: val })}>
                    <SelectTrigger className="h-8">
                      <SelectValue placeholder="All" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Statuses</SelectItem>
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
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="companies">Companies</TabsTrigger>
            <TabsTrigger value="contacts">Contacts</TabsTrigger>
            <TabsTrigger value="roles">Open Roles</TabsTrigger>
          </TabsList>

          <TabsContent value="companies" className="mt-6">
            <CompaniesView searchTerm={searchTerm} filters={filters} />
          </TabsContent>

          <TabsContent value="contacts" className="mt-6">
            <ContactsView searchTerm={searchTerm} />
          </TabsContent>

          <TabsContent value="roles" className="mt-6">
            <RolesView searchTerm={searchTerm} filters={filters} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
