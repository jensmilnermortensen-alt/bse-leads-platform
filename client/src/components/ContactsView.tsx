import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Mail, Phone, Linkedin, Sparkles, CheckCircle2 } from "lucide-react";

interface ContactsViewProps {
  searchTerm: string;
}

export default function ContactsView({ searchTerm }: ContactsViewProps) {
  const utils = trpc.useUtils();

  const { data: contacts, isLoading } = trpc.contacts.search.useQuery(
    { searchTerm: searchTerm || "" },
    { enabled: true }
  );
  const { data: isDemoMode } = trpc.contacts.isEnrichDemoMode.useQuery();

  const enrichMutation = trpc.contacts.enrich.useMutation({
    onSuccess: () => {
      utils.contacts.search.invalidate();
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!contacts || contacts.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">No contacts found.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {isDemoMode && (
        <div className="bg-amber-50 border border-amber-200 rounded-md px-4 py-3 text-sm text-amber-800 flex items-start gap-2">
          <Sparkles className="w-4 h-4 mt-0.5 shrink-0" />
          <div>
            <span className="font-semibold">Demo Mode</span> — No FullEnrich API key configured. Enrichment will return realistic dummy data so you can preview the workflow. Add a <code className="bg-amber-100 px-1 rounded">FULLENRICH_API_KEY</code> to enable live enrichment.
          </div>
        </div>
      )}

      <div className="grid gap-4">
        {contacts.map((contact) => (
          <ContactCard
            key={contact.id}
            contact={contact}
            isEnriching={enrichMutation.isPending && enrichMutation.variables?.id === contact.id}
            onEnrich={() => enrichMutation.mutate({ id: contact.id })}
          />
        ))}
      </div>
    </div>
  );
}

function ContactCard({
  contact,
  isEnriching,
  onEnrich,
}: {
  contact: any;
  isEnriching: boolean;
  onEnrich: () => void;
}) {
  const alreadyEnriched = !!contact.enrichedAt;
  const missingData = !contact.email || !contact.phone;

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="pt-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <h3 className="text-lg font-semibold">{contact.fullName}</h3>
              {contact.decisionMaker && (
                <Badge className="bg-purple-100 text-purple-800">Decision Maker</Badge>
              )}
              {contact.hiringResponsible && (
                <Badge className="bg-blue-100 text-blue-800">Hiring Manager</Badge>
              )}
              {alreadyEnriched && (
                <Badge className="bg-green-100 text-green-700 gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Enriched
                </Badge>
              )}
            </div>

            {contact.position && (
              <p className="text-sm text-muted-foreground mb-3">{contact.position}</p>
            )}

            <div className="flex flex-wrap gap-3 text-sm">
              {contact.email && (
                <a
                  href={`mailto:${contact.email}`}
                  className="flex items-center gap-1 text-blue-600 hover:underline"
                >
                  <Mail className="w-4 h-4" />
                  {contact.email}
                </a>
              )}
              {contact.phone && (
                <a
                  href={`tel:${contact.phone}`}
                  className="flex items-center gap-1 text-blue-600 hover:underline"
                >
                  <Phone className="w-4 h-4" />
                  {contact.phone}
                </a>
              )}
              {contact.linkedinUrl && (
                <a
                  href={contact.linkedinUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-blue-600 hover:underline"
                >
                  <Linkedin className="w-4 h-4" />
                  LinkedIn
                </a>
              )}
            </div>
          </div>

          {missingData && (
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5 shrink-0"
              onClick={onEnrich}
              disabled={isEnriching}
            >
              {isEnriching ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Sparkles className="w-3.5 h-3.5" />
              )}
              {isEnriching ? "Enriching…" : "Enrich"}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
