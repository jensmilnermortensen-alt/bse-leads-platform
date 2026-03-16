import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ChevronRight, Loader2, UserPlus, User } from "lucide-react";

interface CompaniesViewProps {
  searchTerm: string;
  currentUserId?: number;
  filters: {
    region?: string;
    fundingStage?: string;
    industry?: string;
    category?: string;
    companySize?: string;
    leadStatus?: string;
  };
}

type AssignmentFilter = "all" | "mine" | "unassigned";

export default function CompaniesView({ searchTerm, filters, currentUserId }: CompaniesViewProps) {
  const [assignmentFilter, setAssignmentFilter] = useState<AssignmentFilter>("all");
  const utils = trpc.useUtils();

  const { data: companies, isLoading: companiesLoading } = trpc.companies.filter.useQuery(
    filters as any,
    { enabled: !searchTerm }
  );
  const { data: searchResults, isLoading: searchLoading } = trpc.companies.search.useQuery(
    { searchTerm },
    { enabled: !!searchTerm }
  );
  const { data: allUsers } = trpc.users.list.useQuery();

  const assignMutation = trpc.companies.assign.useMutation({
    onSuccess: () => {
      utils.companies.filter.invalidate();
      utils.companies.search.invalidate();
    },
  });

  const allCompanies = searchTerm ? searchResults : companies;
  const isLoading = searchTerm ? searchLoading : companiesLoading;

  const displayCompanies = allCompanies?.filter((c) => {
    if (assignmentFilter === "mine") return c.assignedToId === currentUserId;
    if (assignmentFilter === "unassigned") return !c.assignedToId;
    return true;
  });

  const myLeadsCount = allCompanies?.filter((c) => c.assignedToId === currentUserId).length ?? 0;
  const unassignedCount = allCompanies?.filter((c) => !c.assignedToId).length ?? 0;

  const getUserName = (id: number | null | undefined) => {
    if (!id) return null;
    if (id === currentUserId) return "You";
    const u = allUsers?.find((u) => u.id === id);
    return u?.name || u?.email || "Unknown";
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Assignment filter tabs */}
      <div className="flex gap-1 border-b pb-3">
        {(["all", "mine", "unassigned"] as AssignmentFilter[]).map((f) => (
          <button
            key={f}
            onClick={() => setAssignmentFilter(f)}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-1.5 ${
              assignmentFilter === f
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
          >
            {f === "all" && "All Leads"}
            {f === "mine" && (
              <>
                My Leads
                {myLeadsCount > 0 && (
                  <span className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${assignmentFilter === "mine" ? "bg-white/20 text-white" : "bg-primary text-primary-foreground"}`}>
                    {myLeadsCount}
                  </span>
                )}
              </>
            )}
            {f === "unassigned" && (
              <>
                Unassigned
                {unassignedCount > 0 && (
                  <span className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${assignmentFilter === "unassigned" ? "bg-white/20 text-white" : "bg-muted-foreground/20 text-muted-foreground"}`}>
                    {unassignedCount}
                  </span>
                )}
              </>
            )}
          </button>
        ))}
      </div>

      {!displayCompanies || displayCompanies.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              {assignmentFilter === "mine"
                ? "No leads assigned to you yet. Click 'Assign to me' on any lead to claim it."
                : assignmentFilter === "unassigned"
                ? "All leads are assigned."
                : "No companies found. Try adjusting your filters or search terms."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {displayCompanies.map((company) => {
            const assigneeName = getUserName(company.assignedToId);
            const isAssignedToMe = company.assignedToId === currentUserId;

            return (
              <Card key={company.id} className="hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <h3 className="text-lg font-semibold">{company.name}</h3>
                        <Badge variant="outline">{company.fundingStage}</Badge>
                        <Badge variant="secondary">{company.region}</Badge>
                        {assigneeName ? (
                          <Badge className={`gap-1 ${isAssignedToMe ? "bg-blue-100 text-blue-800" : "bg-gray-100 text-gray-700"}`}>
                            <User className="w-3 h-3" />
                            {isAssignedToMe ? "Assigned to you" : `Assigned to ${assigneeName}`}
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-muted-foreground gap-1 text-xs">
                            <User className="w-3 h-3" />
                            Unassigned
                          </Badge>
                        )}
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

                      <div className="flex flex-wrap items-end gap-3">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs flex-1">
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
                              <Badge className={
                                company.leadStatus === "Qualified" ? "bg-green-100 text-green-800" :
                                company.leadStatus === "Contacted" ? "bg-blue-100 text-blue-800" :
                                company.leadStatus === "Disqualified" ? "bg-red-100 text-red-800" :
                                "bg-gray-100 text-gray-800"
                              }>
                                {company.leadStatus}
                              </Badge>
                            </p>
                          </div>
                        </div>

                        {!isAssignedToMe && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="gap-1 text-xs shrink-0"
                            disabled={assignMutation.isPending}
                            onClick={() => assignMutation.mutate({ companyId: company.id, assignedToId: currentUserId ?? null })}
                          >
                            <UserPlus className="w-3 h-3" />
                            Assign to me
                          </Button>
                        )}
                      </div>
                    </div>

                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <ChevronRight className="w-4 h-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>{company.name}</DialogTitle>
                          <DialogDescription>{company.location}</DialogDescription>
                        </DialogHeader>
                        <CompanyDetailDialog companyId={company.id} currentUserId={currentUserId} allUsers={allUsers} />
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

function CompanyDetailDialog({
  companyId,
  currentUserId,
  allUsers,
}: {
  companyId: number;
  currentUserId?: number;
  allUsers?: { id: number; name: string | null; email: string | null; role: "user" | "admin" }[];
}) {
  const utils = trpc.useUtils();
  const { data: company, isLoading } = trpc.companies.getById.useQuery({ id: companyId });
  const { data: contacts } = trpc.contacts.getByCompanyId.useQuery({ companyId });
  const { data: roles } = trpc.roles.getByCompanyId.useQuery({ companyId });
  const { data: qualification } = trpc.qualifications.getByCompanyId.useQuery({ companyId });

  const updateStatusMutation = trpc.qualifications.updateStatus.useMutation();
  const addNotesMutation = trpc.qualifications.addNotes.useMutation();
  const assignMutation = trpc.companies.assign.useMutation({
    onSuccess: () => {
      utils.companies.getById.invalidate({ id: companyId });
      utils.companies.filter.invalidate();
      utils.companies.search.invalidate();
    },
  });

  const [newNotes, setNewNotes] = useState("");

  if (isLoading) {
    return <div className="flex items-center justify-center py-8"><Loader2 className="w-6 h-6 animate-spin" /></div>;
  }
  if (!company) return <div className="text-center py-8">Company not found</div>;

  const currentAssignee = allUsers?.find((u) => u.id === company.assignedToId);
  const isAdmin = allUsers?.find((u) => u.id === currentUserId)?.role === "admin";

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div>
          <h4 className="font-semibold mb-2">Company Details</h4>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div><span className="text-muted-foreground">Funding Stage:</span><p className="font-medium">{company.fundingStage}</p></div>
            <div><span className="text-muted-foreground">Industry:</span><p className="font-medium">{company.industry}</p></div>
            <div><span className="text-muted-foreground">Category:</span><p className="font-medium">{company.category}</p></div>
            <div><span className="text-muted-foreground">Company Size:</span><p className="font-medium">{company.companySize}</p></div>
            {company.website && (
              <div className="col-span-2">
                <span className="text-muted-foreground">Website:</span>
                <p className="font-medium"><a href={company.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{company.website}</a></p>
              </div>
            )}
          </div>
        </div>

        <div className="border-t pt-4">
          <h4 className="font-semibold mb-3">Assignment</h4>
          <div className="flex items-center gap-3">
            {isAdmin ? (
              <Select
                value={company.assignedToId?.toString() ?? "unassigned"}
                onValueChange={(val) => assignMutation.mutate({ companyId, assignedToId: val === "unassigned" ? null : parseInt(val) })}
              >
                <SelectTrigger className="w-52"><SelectValue placeholder="Assign to..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned">Unassigned</SelectItem>
                  {allUsers?.map((u) => (
                    <SelectItem key={u.id} value={u.id.toString()}>
                      {u.id === currentUserId ? `${u.name || u.email} (you)` : u.name || u.email || `User ${u.id}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">Assigned to:</span>
                <span className="font-medium">
                  {currentAssignee ? (currentAssignee.id === currentUserId ? "You" : currentAssignee.name || currentAssignee.email) : "Unassigned"}
                </span>
                {company.assignedToId !== currentUserId && (
                  <Button size="sm" variant="outline" className="gap-1 text-xs ml-2" onClick={() => assignMutation.mutate({ companyId, assignedToId: currentUserId ?? null })} disabled={assignMutation.isPending}>
                    <UserPlus className="w-3 h-3" /> Assign to me
                  </Button>
                )}
              </div>
            )}
            {assignMutation.isPending && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
          </div>
        </div>

        <div className="border-t pt-4">
          <h4 className="font-semibold mb-3">Lead Qualification</h4>
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium mb-2 block">Status</label>
              <div className="flex gap-2 flex-wrap">
                {["New", "Contacted", "Qualified", "Disqualified"].map((status) => (
                  <Button key={status} variant={qualification?.status === status ? "default" : "outline"} size="sm" onClick={() => updateStatusMutation.mutate({ companyId, status: status as any })} disabled={updateStatusMutation.isPending}>
                    {status}
                  </Button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Notes</label>
              <div className="space-y-2">
                {qualification?.notes && <div className="bg-muted p-3 rounded text-sm whitespace-pre-wrap">{qualification.notes}</div>}
                <Textarea placeholder="Add notes about this lead..." value={newNotes} onChange={(e) => setNewNotes(e.target.value)} className="text-sm" rows={3} />
                <Button size="sm" onClick={() => { if (newNotes.trim()) { addNotesMutation.mutate({ companyId, notes: newNotes }); setNewNotes(""); } }} disabled={!newNotes.trim() || addNotesMutation.isPending}>
                  Add Note
                </Button>
              </div>
            </div>
          </div>
        </div>

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
