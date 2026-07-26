'use client';

import { useState } from 'react';
import { createAndSendInvite } from '@/app/actions/invite-actions';
import { Mail, Loader2, Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function InviteForm() {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const router = useRouter();

  async function handleSubmit(formData: FormData) {
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    const email = formData.get('email') as string;
    const role = formData.get('role') as string;
    
    // Org assignment is deferred in this implementation as per architectural choice
    const res = await createAndSendInvite(email, null, role);

    if (res.error) {
      setError(res.error);
    } else {
      setSuccess(`Invite sent to ${email}`);
      router.refresh();
      setTimeout(() => {
        setIsOpen(false);
        setSuccess(null);
      }, 2000);
    }
    setIsLoading(false);
  }

  if (!isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        className="bg-primary text-primary-foreground font-bold px-6 py-3 rounded-lg hover:bg-primary/90 transition-colors shadow-sm flex items-center gap-2"
      >
        <Plus className="h-5 w-5" />
        Generate New Invite
      </button>
    );
  }

  return (
    <div className="bg-card border border-border p-6 rounded-xl shadow-lg w-full max-w-md">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold text-lg">Send Platform Invite</h3>
        <button onClick={() => setIsOpen(false)} className="text-muted-foreground hover:text-foreground">✕</button>
      </div>

      <form action={handleSubmit} className="space-y-4">
        {error && <div className="text-destructive text-sm bg-destructive/10 p-2 rounded">{error}</div>}
        {success && <div className="text-success text-sm bg-success/10 p-2 rounded">{success}</div>}
        
        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-1">Email Address</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Mail className="h-4 w-4 text-muted-foreground" />
            </div>
            <input 
              name="email" 
              type="email" 
              required 
              className="block w-full pl-10 pr-3 py-2 bg-background border border-border rounded-md focus:ring-1 focus:ring-primary"
              placeholder="user@enterprise.com" 
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-1">Role</label>
          <select name="role" className="block w-full px-3 py-2 bg-background border border-border rounded-md focus:ring-1 focus:ring-primary">
            <option value="member">Member</option>
            <option value="auditor">Auditor</option>
            <option value="admin">Admin</option>
          </select>
        </div>

        <button 
          type="submit" 
          disabled={isLoading}
          className="w-full flex justify-center items-center py-2 px-4 bg-primary text-primary-foreground rounded-md font-bold hover:bg-primary/90 disabled:opacity-50"
        >
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
          Dispatch Invite & NDA Link
        </button>
      </form>
    </div>
  );
}
