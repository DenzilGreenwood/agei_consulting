'use server'

import crypto from 'crypto'
import sgMail from '@sendgrid/mail'
import { createClient } from '@/utils/supabase/server'

// Initialize SendGrid
sgMail.setApiKey(process.env.SENDGRID_API_KEY as string)

export async function sendInvitation(email: string, role: string = 'user', orgId?: string) {
  try {
    const supabase = await createClient()

    // 1. Verify caller is authorized (assuming admin or authenticated for this action)
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { error: 'Unauthorized to send invitations.' }
    }

    // 2. Generate secure token
    const token = crypto.randomBytes(32).toString('hex')

    // 3. Insert into PostgreSQL invitations table
    const { error: dbError } = await supabase
      .from('invitations')
      .insert({
        email,
        token,
        role,
        organization_id: orgId || null,
        invited_by: user.id
      })

    if (dbError) {
      console.error('Database Error:', dbError)
      return { error: 'Failed to create invitation record.' }
    }

    // 4. Dispatch Email via SendGrid HTTPS API
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
    const verificationUrl = `${siteUrl}/invite?token=${token}`

    const msg = {
      to: email,
      from: process.env.SENDGRID_FROM_EMAIL as string,
      templateId: process.env.SENDGRID_INVITATION_TEMPLATE_ID as string,
      dynamicTemplateData: {
        verify_url: verificationUrl, // We map this inside the SendGrid template
        role: role
      },
    }

    await sgMail.send(msg)

    return { success: true }
  } catch (error) {
    console.error('SendGrid Error:', error)
    return { error: 'Failed to dispatch email.' }
  }
}

export async function acceptInvitation(token: string, formData: FormData) {
  try {
    const supabase = await createClient()
    const password = formData.get('password') as string

    if (!password || password.length < 6) {
      return { error: 'Password must be at least 6 characters.' }
    }

    // 1. Validate token
    const { data: invite, error: fetchError } = await supabase
      .from('invitations')
      .select('*')
      .eq('token', token)
      .eq('status', 'pending')
      .single()

    if (fetchError || !invite) {
      return { error: 'Invalid or expired invitation token.' }
    }

    // 2. Create the user in Supabase Auth
    const { error: signUpError } = await supabase.auth.signUp({
      email: invite.email,
      password: password,
      options: {
        data: {
          role: invite.role,
          organization_id: invite.organization_id
        }
      }
    })

    if (signUpError) {
      return { error: signUpError.message }
    }

    // 3. Mark invitation as accepted
    await supabase
      .from('invitations')
      .update({ status: 'accepted' })
      .eq('id', invite.id)

    return { success: true }
  } catch (error) {
    console.error('Accept Invite Error:', error)
    return { error: 'An unexpected error occurred.' }
  }
}

