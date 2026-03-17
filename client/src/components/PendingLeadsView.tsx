import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Loader2, CheckCircle, XCircle, ExternalLink, Bot, RefreshCw } from "lucide-react";

export default function PendingLeadsView() {
  const utils = trpc.useUtils();
  const [agentStatus, setAgentStatus] = useState<string | null>(null);
  const [runningAgent, setRunningAgent] = useState<"finder" | "refresh" | null>(null);

  const { data: isDemoMode } = trpc.agents.isDemoMode.useQuery();
  const { data: pending, isLoading } = trpc.pendingLeads.list.useQuery({ status: "pending" });
  const { data: approved } = trpc.pendingLeads.list.useQuery({ status: "approved" });
  const { data: rejected } = trpc.pendingLeads.list.useQuery({ status: "rejected" });

  const approveMutation = trpc.pendingLeads.approve.useMutation({
    onSuccess: () => utils.pendingLeads.list.invalidate(),
  });
  const rejectMutation = trpc.pendingLeads.reject.useMutation({
    onSuccess: () => utils.pendingLeads.list.invalidate(),
  });

  const runLeadFinder = trpc.agents.runLeadFinder.useMutation({
    onSuccess: (data) => {
      setAgentStatus(`Done! Found ${data.found} companies, ${data.saved} saved for review.`);
      setRunningAgent(null);
      utils.pendingLeads.list.invalidate();
    },
    onError: (err) => {
      setAgentStatus(`Error: ${err.message}`);
      setRunningAgent(null);
    },
  });

  const runDataRefresh = trpc.agents.runDataRefresh.useMutation({
    onSuccess: (data) => {
      setAgentStatus(`Done! Checked ${data.checked} companies, found ${data.updatesFound} updates.`);
      setRunningAgent(null);
      utils.pendingLeads.list.invalidate();
    },
    onError: (err) => {
      setAgentStatus(`Error: ${err.message}`);
      setRunningAgent(null);
    },
  });

  const handleRunFinder = () => {
    setRunningAgent("finder");
    setAgentStatus("Agent is searching the web for new leads... this may take a minute.");
    runLeadFinder.mutate();
  };

  const handleRunRefresh = () => {
    setRunningAgent("refresh");
    setAgentStatus("Agent is refreshing company data... this may take a minute.");
    runDataRefresh.mutate();
  };

  return (
    <div className="space-y-6">
      {/* Demo mode banner */}
      {isDemoMode && (
        <div className="bg-amber-50 border border-amber-200 rounded-md px-4 py-3 text-sm text-amber-800 flex items-start gap-2">
          <Bot className="w-4 h-4 mt-0.5 shrink-0" />
          <div>
            <span className="font-semibold">Demo Mode</span> — No API key configured. The agents will run with realistic dummy data so you can preview the workflow. Add an <code className="bg-amber-100 px-1 rounded">ANTHROPIC_API_KEY</code> to enable live web search.
          </div>
        </div>
      )}

      {/* Agent Controls */}
      <div className="flex gap-3 flex-wrap items-center">
        <Button
          onClick={handleRunFinder}
          disabled={runningAgent !== null}
          className="gap-2"
        >
          {runningAgent === "finder" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Bot className="w-4 h-4" />}
          Run Lead Finder
        </Button>
        <Button
          variant="outline"
          onClick={handleRunRefresh}
          disabled={runningAgent !== null}
          className="gap-2"
        >
          {runningAgent === "refresh" ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          Refresh Company Data
        </Button>
        {agentStatus && (
          <div className={`text-sm px-3 py-2 rounded flex items-center gap-2 ${
            agentStatus.startsWith("Error") ? "bg-red-50 text-red-700 border border-red-200" :
            agentStatus.startsWith("Done") ? "bg-green-50 text-green-700 border border-green-200" :
            "bg-blue-50 text-blue-700 border border-blue-200"
          }`}>
            {runningAgent && <Loader2 className="w-3 h-3 animate-spin" />}
            {agentStatus}
            {!runningAgent && (
              <button className="underline text-xs opacity-70 hover:opacity-100 ml-1" onClick={() => setAgentStatus(null)}>dismiss</button>
            )}
          </div>
        )}
      </div>

      {/* Review Tabs */}
      <Tabs defaultValue="pending">
        <TabsList>
          <TabsTrigger value="pending">
            Pending Review
            {pending && pending.length > 0 && (
              <Badge className="ml-2 bg-orange-100 text-orange-700">{pending.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="approved">Approved ({approved?.length ?? 0})</TabsTrigger>
          <TabsTrigger value="rejected">Rejected ({rejected?.length ?? 0})</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="mt-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : !pending || pending.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Bot className="w-8 h-8 mx-auto mb-3 text-muted-foreground" />
                <p className="text-muted-foreground font-medium">No pending leads</p>
                <p className="text-sm text-muted-foreground mt-1">Run the Lead Finder agent to discover new companies.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {pending.map((lead) => (
                <PendingLeadCard
                  key={lead.id}
                  lead={lead}
                  onApprove={() => approveMutation.mutate({ id: lead.id })}
                  onReject={() => rejectMutation.mutate({ id: lead.id })}
                  isLoading={approveMutation.isPending || rejectMutation.isPending}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="approved" className="mt-4">
          <div className="space-y-3">
            {approved?.map((lead) => (
              <PendingLeadCard key={lead.id} lead={lead} readOnly />
            ))}
            {(!approved || approved.length === 0) && (
              <Card><CardContent className="py-8 text-center text-muted-foreground">No approved leads yet.</CardContent></Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="rejected" className="mt-4">
          <div className="space-y-3">
            {rejected?.map((lead) => (
              <PendingLeadCard key={lead.id} lead={lead} readOnly />
            ))}
            {(!rejected || rejected.length === 0) && (
              <Card><CardContent className="py-8 text-center text-muted-foreground">No rejected leads.</CardContent></Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function PendingLeadCard({
  lead,
  onApprove,
  onReject,
  isLoading,
  readOnly,
}: {
  lead: any;
  onApprove?: () => void;
  onReject?: () => void;
  isLoading?: boolean;
  readOnly?: boolean;
}) {
  const [showNotes, setShowNotes] = useState(false);
  const sources: string[] = lead.sources ? JSON.parse(lead.sources) : [];
  const isDataRefresh = lead.agentType === "data_refresh";

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="pt-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <h3 className="text-base font-semibold">{lead.name}</h3>
              {isDataRefresh && <Badge variant="outline" className="text-xs bg-purple-50 text-purple-700">Data Refresh</Badge>}
              {lead.fundingStage && <Badge variant="outline" className="text-xs">{lead.fundingStage}</Badge>}
              {lead.region && <Badge variant="secondary" className="text-xs">{lead.region}</Badge>}
              {lead.reviewStatus === "approved" && <Badge className="text-xs bg-green-100 text-green-700">Approved</Badge>}
              {lead.reviewStatus === "rejected" && <Badge className="text-xs bg-red-100 text-red-700">Rejected</Badge>}
            </div>

            {lead.description && (
              <p className="text-sm text-muted-foreground mb-2">{lead.description}</p>
            )}

            <div className="flex flex-wrap gap-2 mb-2">
              {lead.industry && <Badge variant="outline" className="text-xs">{lead.industry}</Badge>}
              {lead.category && <Badge variant="outline" className="text-xs">{lead.category}</Badge>}
              {lead.companySize && <Badge variant="outline" className="text-xs">{lead.companySize} employees</Badge>}
            </div>

            <div className="flex flex-wrap gap-4 text-xs text-muted-foreground mb-2">
              {lead.location && <span>{lead.location}</span>}
              {lead.totalFundingAmount && <span>Total funding: €{lead.totalFundingAmount}M</span>}
              {lead.latestFundingRound && <span>{lead.latestFundingRound}</span>}
              {lead.website && (
                <a href={lead.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-blue-600 hover:underline">
                  <ExternalLink className="w-3 h-3" /> Website
                </a>
              )}
            </div>

            {lead.agentNotes && (
              <div className="mt-2">
                <button
                  className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                  onClick={() => setShowNotes(!showNotes)}
                >
                  <Bot className="w-3 h-3" />
                  {showNotes ? "Hide" : "Show"} agent notes
                  {sources.length > 0 && ` (${sources.length} sources)`}
                </button>
                {showNotes && (
                  <div className="mt-2 bg-muted p-3 rounded text-xs whitespace-pre-wrap space-y-2">
                    <p>{lead.agentNotes}</p>
                    {sources.length > 0 && (
                      <div>
                        <p className="font-medium mb-1">Sources:</p>
                        {sources.map((src, i) => (
                          <a key={i} href={src} target="_blank" rel="noopener noreferrer" className="block text-blue-600 hover:underline truncate">{src}</a>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {!readOnly && (
            <div className="flex flex-col gap-2 shrink-0">
              <Button
                size="sm"
                className="gap-1 bg-green-600 hover:bg-green-700"
                onClick={onApprove}
                disabled={isLoading}
              >
                <CheckCircle className="w-4 h-4" />
                Approve
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="gap-1 text-red-600 border-red-200 hover:bg-red-50"
                onClick={onReject}
                disabled={isLoading}
              >
                <XCircle className="w-4 h-4" />
                Reject
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
