import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Mail, Phone, Linkedin } from "lucide-react";

interface ContactsViewProps {
  searchTerm: string;
}

export default function ContactsView({ searchTerm }: ContactsViewProps) {
  const { data: contacts, isLoading } = trpc.contacts.search.useQuery(
    { searchTerm: searchTerm || "" },
    { enabled: true }
  );

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
      <div className="grid gap-4">
        {contacts.map((contact) => (
          <Card key={contact.id} className="hover:shadow-md transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-lg font-semibold">{contact.fullName}</h3>
                    {contact.decisionMaker && <Badge className="bg-purple-100 text-purple-800">Decision Maker</Badge>}
                    {contact.hiringResponsible && <Badge className="bg-blue-100 text-blue-800">Hiring Manager</Badge>}
                  </div>

                  {contact.position && (
                    <p className="text-sm text-muted-foreground mb-3">{contact.position}</p>
                  )}

                  <div className="flex flex-wrap gap-3 text-sm">
                    {contact.email && (
                      <a href={`mailto:${contact.email}`} className="flex items-center gap-1 text-blue-600 hover:underline">
                        <Mail className="w-4 h-4" />
                        {contact.email}
                      </a>
                    )}
                    {contact.phone && (
                      <a href={`tel:${contact.phone}`} className="flex items-center gap-1 text-blue-600 hover:underline">
                        <Phone className="w-4 h-4" />
                        {contact.phone}
                      </a>
                    )}
                    {contact.linkedinUrl && (
                      <a href={contact.linkedinUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-blue-600 hover:underline">
                        <Linkedin className="w-4 h-4" />
                        LinkedIn
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
