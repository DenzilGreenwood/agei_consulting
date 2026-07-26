import { createClient } from '@/utils/supabase/server';
import Link from 'next/link';
import { ShieldCheck, Mail, Plus, Download, XCircle, RefreshCw } from 'lucide-react';
import InviteForm from './InviteForm';

export const metadata = {
  title: 'Admin Console | Invitations & NDAs',
};

export default async function AdminInvitationsPage() {
  const supabase = await createClient();

  // Note: in a real app, verify the user is actually an admin before rendering.
  // For now, we assume the middleware or a layout protects this route.

  const { data: invitations, error } = await supabase
    .from('invitations')
    .select('*')
    .order('created_at', { ascending: false });

  return (
    <div className="container mx-auto px-4 py-12 max-w-7xl min-h-[calc(100vh-4rem)]">
      
      <div className="mb-10 border-b border-border pb-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight mb-4 flex items-center gap-3">
            <ShieldCheck className="h-10 w-10 text-primary" />
            Access & Invitations
          </h1>
          <p className="text-muted-foreground text-lg">
            Manage enterprise invitations, monitor registration status, and review signed NDAs.
          </p>
        </div>
        
        {/* Client component for the invite form modal/slide-over would go here, or inline */}
        <InviteForm />
      </div>

      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted text-foreground border-b border-border">
              <tr>
                <th className="px-6 py-4 font-bold">Email</th>
                <th className="px-6 py-4 font-bold">Role</th>
                <th className="px-6 py-4 font-bold">Status</th>
                <th className="px-6 py-4 font-bold">NDA Signed</th>
                <th className="px-6 py-4 font-bold">Created</th>
                <th className="px-6 py-4 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-muted-foreground">
              {error && (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-destructive">
                    Failed to load invitations. Ensure you have run the database migrations.
                  </td>
                </tr>
              )}
              {invitations && invitations.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center">
                    No invitations found. Generate an invite above.
                  </td>
                </tr>
              )}
              {invitations?.map((invite) => (
                <tr key={invite.id} className="hover:bg-muted/50 transition-colors">
                  <td className="px-6 py-4 font-medium text-foreground">{invite.email}</td>
                  <td className="px-6 py-4">
                    <span className="bg-primary/10 text-primary text-xs font-bold px-2.5 py-1 rounded-full uppercase">
                      {invite.role}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full uppercase ${
                      invite.status === 'accepted' ? 'bg-success/10 text-success' :
                      invite.status === 'pending' ? 'bg-amber-500/10 text-amber-500' :
                      'bg-destructive/10 text-destructive'
                    }`}>
                      {invite.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {invite.nda_signed ? (
                       <span className="text-success font-bold flex items-center gap-1"><ShieldCheck className="h-4 w-4"/> Verified</span>
                    ) : (
                       <span className="text-muted-foreground">Pending</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {new Date(invite.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-right flex items-center justify-end gap-2">
                    {invite.nda_signed && invite.nda_file_path && (
                      <button className="p-2 text-primary hover:bg-primary/10 rounded-md transition-colors" title="Download NDA">
                        <Download className="h-4 w-4" />
                      </button>
                    )}
                    {invite.status === 'pending' && (
                      <>
                        <button className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors" title="Resend Invite">
                          <RefreshCw className="h-4 w-4" />
                        </button>
                        <button className="p-2 text-destructive hover:bg-destructive/10 rounded-md transition-colors" title="Revoke Invite">
                          <XCircle className="h-4 w-4" />
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
