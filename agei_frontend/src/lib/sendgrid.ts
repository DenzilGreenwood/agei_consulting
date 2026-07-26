import sgMail from '@sendgrid/mail';

if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

interface SendInviteParams {
  to: string;
  inviteUrl: string;
  organizationName?: string;
}

export async function sendInvitationEmail({ to, inviteUrl, organizationName = 'CognitiveInsight Workspace' }: SendInviteParams) {
  const from = process.env.SENDGRID_FROM_EMAIL;
  if (!from) throw new Error('SENDGRID_FROM_EMAIL is not configured');

  const msg = {
    to,
    from,
    subject: `Invitation to Access ${organizationName} on CognitiveInsight AGEI`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background: #090d16; color: #f3f4f6; border-radius: 8px;">
        <h2 style="color: #3b82f6; margin-bottom: 16px;">Enterprise Platform Access Request</h2>
        <p>You have been authorized to access <strong>${organizationName}</strong> under the CognitiveInsight AI Governance Evidence Infrastructure (AGEI) platform.</p>
        <p>Prior to accessing technical specifications and database contracts, you must execute the mutual NDA agreement.</p>
        <div style="margin: 32px 0;">
          <a href="${inviteUrl}" style="background-color: #2563eb; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block;">
            Review NDA & Complete Registration
          </a>
        </div>
        <p style="font-size: 12px; color: #9ca3af;">This link expires in 7 days.</p>
      </div>
    `,
  };

  await sgMail.send(msg);
}
