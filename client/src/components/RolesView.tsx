import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Mail, User } from "lucide-react";

interface RolesViewProps {
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

export default function RolesView({ searchTerm, filters }: RolesViewProps) {
  const { data: roles, isLoading } = trpc.roles.search.useQuery(
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

  if (!roles || roles.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">No open roles found.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4">
        {roles.map((role) => (
          <Card key={role.id} className="hover:shadow-md transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-lg font-semibold">{role.jobTitle}</h3>
                    <Badge variant="outline">{role.status}</Badge>
                    <Badge variant="secondary">{role.experienceLevel}</Badge>
                  </div>

                  {role.description && (
                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{role.description}</p>
                  )}

                  <div className="flex flex-wrap gap-2 mb-3">
                    <Badge variant="outline" className="text-xs">{role.industry}</Badge>
                    <Badge variant="outline" className="text-xs">{role.category}</Badge>
                    {role.department && (
                      <Badge variant="outline" className="text-xs">{role.department}</Badge>
                    )}
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                    {role.requiredSkills && (
                      <div>
                        <span className="text-muted-foreground">Skills:</span>
                        <p className="font-medium line-clamp-2">{role.requiredSkills}</p>
                      </div>
                    )}
                    {role.hiringManagerName && (
                      <div>
                        <span className="text-muted-foreground flex items-center gap-1"><User className="w-3 h-3" /> Hiring Manager:</span>
                        <p className="font-medium">{role.hiringManagerName}</p>
                      </div>
                    )}
                    {role.hiringManagerEmail && (
                      <div>
                        <span className="text-muted-foreground flex items-center gap-1"><Mail className="w-3 h-3" /> Contact:</span>
                        <p className="font-medium"><a href={`mailto:${role.hiringManagerEmail}`} className="text-blue-600 hover:underline">{role.hiringManagerEmail}</a></p>
                      </div>
                    )}
                    {role.postedDate && (
                      <div>
                        <span className="text-muted-foreground">Posted:</span>
                        <p className="font-medium">{new Date(role.postedDate).toLocaleDateString()}</p>
                      </div>
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
