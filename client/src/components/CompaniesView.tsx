import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ChevronRight, Loader2 } from "lucide-react";

interface CompaniesViewProps {
  searchTerm: string;
  filters: {
    region?: string;
    fundingStage?: string;
    industry?: string;
    category?: string;
    companySize?: string;
    leadStatus?: string;
  };
}

export default function CompaniesView({ searchTerm, filters }: CompaniesViewProps) {
  const [selectedCompanyId, setSelectedCompanyId] = useState<number | null>(null);
  const [isAddingCompany, setIsAddingCompany] = useState(false);

  // Fetch companies based on filters
  const { data: companies, isLoading: companiesLoading } = trpc.companies.filter.useQuery(
    filters as any,
    { enabled: !searchTerm }
  );

  // Search companies
  const { data: searchResults, isLoading: searchLoading } = trpc.companies.search.useQuery(
    { searchTerm },
    { enabled: !!searchTerm }
  );

  const displayCompanies = searchTerm ? searchResults : companies;
  const isLoading = searchTerm ? searchLoading : companiesLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!displayCompanies || displayCompanies.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">No companies found. Try adjusting your filters or search terms.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4">
        {displayCompanies.map((company) => (
          <Card key={company.id} className="hover:shadow-md transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-lg font-semibold">{company.name}</h3>
                    <Badge variant="outline">{company.fundingStage}</Badge>
                    <Badge variant="secondary">{company.region}</Badge>
                  </div>
                  
                  {company.description && (
                    <p className="text-sm text-muted-foreground mb-3">{company.description}</p>
                  )}

                  <div className="flex flex-wrap gap-2 mb-3">
                    <Badge variant="outline" className="text-xs">{company.industry}</Badge>
                    <Badge variant="outline" className="text-xs">{company.category}</Badge>
                    {company.companySize && (
                      <Badge variant="outline" className="text-xs">{company.companySize} employees</Badge>
                    )}
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                    <div>
                      <span className="text-muted-foreground">Location:</span>
                      <p className="font-medium">{company.location}</p>
                    </div>
                    {company.totalFundingAmount && (
                      <div>
                        <span className="text-muted-foreground">Total Funding:</span>
                        <p className="font-medium">${company.totalFundingAmount}M</p>
                      </div>
                    )}
                    {company.latestFundingDate && (
                      <div>
                        <span className="text-muted-foreground">Latest Round:</span>
                        <p className="font-medium">{new Date(company.latestFundingDate).toLocaleDateString()}</p>
                      </div>
                    )}
                    <div>
                      <span className="text-muted-foreground">Status:</span>
                      <p className="font-medium">
                        <Badge 
                          className={
                            company.leadStatus === "Qualified" ? "bg-green-100 text-green-800" :
                            company.leadStatus === "Contacted" ? "bg-blue-100 text-blue-800" :
                            company.leadStatus === "Disqualified" ? "bg-red-100 text-red-800" :
                            "bg-gray-100 text-gray-800"
                          }
                        >
                          {company.leadStatus}
                        </Badge>
                      </p>
                    </div>
                  </div>
                </div>

                <Dialog>
                  <DialogTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setSelectedCompanyId(company.id)}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>{company.name}</DialogTitle>
                      <DialogDescription>{company.location}</DialogDescription>
                    </DialogHeader>
                    <CompanyDetailDialog companyId={company.id} />
                  </DialogContent>
                </Dialog>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function CompanyDetailDialog({ companyId }: { companyId: number }) {
  const { data: company, isLoading } = trpc.companies.getById.useQuery({ id: companyId });
  const { data: contacts } = trpc.contacts.getByCompanyId.useQuery({ companyId });
  const { data: roles } = trpc.roles.getByCompanyId.useQuery({ companyId });
  const { data: qualification } = trpc.qualifications.getByCompanyId.useQuery({ companyId });

  const updateStatusMutation = trpc.qualifications.updateStatus.useMutation();
  const addNotesMutation = trpc.qualifications.addNotes.useMutation();

  const [newNotes, setNewNotes] = useState("");

  if (isLoading) {
    return <div className="flex items-center justify-center py-8"><Loader2 className="w-6 h-6 animate-spin" /></div>;
  }

  if (!company) {
    return <div className="text-center py-8">Company not found</div>;
  }

  const handleStatusChange = (status: "New" | "Contacted" | "Qualified" | "Disqualified") => {
    updateStatusMutation.mutate({ companyId, status });
  };

  const handleAddNotes = () => {
    if (newNotes.trim()) {
      addNotesMutation.mutate({ companyId, notes: newNotes });
      setNewNotes("");
    }
  };

  return (
    <div className="space-y-6">
      {/* Company Info */}
      <div className="space-y-4">
        <div>
          <h4 className="font-semibold mb-2">Company Details</h4>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-muted-foreground">Funding Stage:</span>
              <p className="font-medium">{company.fundingStage}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Industry:</span>
              <p className="font-medium">{company.industry}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Category:</span>
              <p className="font-medium">{company.category}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Company Size:</span>
              <p className="font-medium">{company.companySize}</p>
            </div>
            {company.website && (
              <div className="col-span-2">
                <span className="text-muted-foreground">Website:</span>
                <p className="font-medium"><a href={company.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{company.website}</a></p>
              </div>
            )}
          </div>
        </div>

        {/* Lead Qualification */}
        <div className="border-t pt-4">
          <h4 className="font-semibold mb-3">Lead Qualification</h4>
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium mb-2 block">Status</label>
              <div className="flex gap-2">
                {["New", "Contacted", "Qualified", "Disqualified"].map((status) => (
                  <Button
                    key={status}
                    variant={qualification?.status === status ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleStatusChange(status as any)}
                    disabled={updateStatusMutation.isPending}
                  >
                    {status}
                  </Button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Notes</label>
              <div className="space-y-2">
                {qualification?.notes && (
                  <div className="bg-muted p-3 rounded text-sm whitespace-pre-wrap">
                    {qualification.notes}
                  </div>
                )}
                <div className="flex gap-2">
                  <Textarea
                    placeholder="Add notes about this lead..."
                    value={newNotes}
                    onChange={(e) => setNewNotes(e.target.value)}
                    className="text-sm"
                    rows={3}
                  />
                </div>
                <Button
                  size="sm"
                  onClick={handleAddNotes}
                  disabled={!newNotes.trim() || addNotesMutation.isPending}
                >
                  Add Note
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Contacts */}
        {contacts && contacts.length > 0 && (
          <div className="border-t pt-4">
            <h4 className="font-semibold mb-3">Contacts ({contacts.length})</h4>
            <div className="space-y-2">
              {contacts.map((contact) => (
                <div key={contact.id} className="bg-muted p-3 rounded text-sm">
                  <p className="font-medium">{contact.fullName}</p>
                  <p className="text-muted-foreground">{contact.position}</p>
                  {contact.email && <p className="text-blue-600">{contact.email}</p>}
                  {contact.phone && <p className="text-muted-foreground">{contact.phone}</p>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Open Roles */}
        {roles && roles.length > 0 && (
          <div className="border-t pt-4">
            <h4 className="font-semibold mb-3">Open Roles ({roles.length})</h4>
            <div className="space-y-2">
              {roles.map((role) => (
                <div key={role.id} className="bg-muted p-3 rounded text-sm">
                  <p className="font-medium">{role.jobTitle}</p>
                  <p className="text-muted-foreground">{role.department}</p>
                  {role.hiringManagerName && <p className="text-muted-foreground">Hiring Manager: {role.hiringManagerName}</p>}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
