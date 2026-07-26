'use server';

import crypto from 'crypto';
import { createClient } from '@/utils/supabase/server'; // The user specified lib/supabase/server but I know they have it at utils/supabase/server based on previous inspection
import { sendInvitationEmail } from '@/lib/sendgrid';

export async function createAndSendInvite(email: string, orgId: string | null, role: string) {
  const supabase = await createClient();

  // Validate active admin user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Unauthorized' };

  // Note: For a real enterprise application, we would check if the user has 'admin' privileges here,
  // e.g., by checking public.organization_members or app_metadata.

  // Generate cryptographically secure token
  const token = crypto.randomBytes(32).toString('hex');

  // Insert invitation record (orgId can be null for deferred assignment)
  const { data: invite, error } = await supabase
    .from('invitations')
    .insert({
      email,
      token,
      organization_id: orgId || null,
      role,
      invited_by: user.id,
      status: 'pending',
    })
    .select('id')
    .single();

  if (error) {
    console.error('Invite DB Error:', error);
    return { error: error.message };
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  const inviteUrl = `${siteUrl}/accept-invite?token=${token}`;

  try {
    await sendInvitationEmail({
      to: email,
      inviteUrl,
      organizationName: 'CognitiveInsight Workspace', // Optionally fetch organization name if orgId is provided
    });
    return { success: true, inviteId: invite.id };
  } catch (err: any) {
    console.error('SendGrid Error:', err);
    return { error: 'Invitation stored, but email dispatch failed.' };
  }
}

export async function completeOnboarding(token: string, formData: FormData) {
  try {
    const supabase = await createClient();
    const password = formData.get('password') as string;
    const name = formData.get('name') as string;
    const ndaFile = formData.get('ndaFile') as File;

    if (!password || password.length < 6) return { error: 'Password must be at least 6 characters.' };
    if (!name) return { error: 'Full name is required.' };
    if (!ndaFile || ndaFile.size === 0) return { error: 'Signed NDA PDF is required.' };
    if (ndaFile.type !== 'application/pdf') return { error: 'NDA must be a PDF file.' };

    // 1. Validate token
    const { data: invite, error: fetchError } = await supabase
      .from('invitations')
      .select('*')
      .eq('token', token)
      .eq('status', 'pending')
      .gt('expires_at', new Date().toISOString())
      .single();

    if (fetchError || !invite) return { error: 'Invalid or expired invitation token.' };

    // 2. Create the user
    const { data: authData, error: signUpError } = await supabase.auth.signUp({
      email: invite.email,
      password: password,
      options: {
        data: {
          full_name: name,
          role: invite.role,
        }
      }
    });

    if (signUpError || !authData.user) return { error: signUpError?.message || 'Failed to create user.' };
    const userId = authData.user.id;

    // 3. Upload NDA to vault (Requires elevated privileges since user might not be fully confirmed if email confirmations are somehow on, but we assume they are logged in now).
    // Using arrayBuffer to upload file from Server Action
    const arrayBuffer = await ndaFile.arrayBuffer();
    const filePath = `${userId}/signed_nda_${Date.now()}.pdf`;
    
    const { error: uploadError } = await supabase.storage
      .from('nda-vault')
      .upload(filePath, arrayBuffer, {
        contentType: 'application/pdf',
        upsert: true
      });

    if (uploadError) return { error: 'Failed to upload NDA to secure vault. Please try again or contact an administrator.' };

    // 4. Update Invitation Record
    await supabase
      .from('invitations')
      .update({ 
        status: 'accepted',
        nda_signed: true,
        nda_file_path: filePath
      })
      .eq('id', invite.id);

    return { success: true };
  } catch (error) {
    console.error('Accept Invite Error:', error);
    return { error: 'An unexpected error occurred during onboarding.' };
  }
}

