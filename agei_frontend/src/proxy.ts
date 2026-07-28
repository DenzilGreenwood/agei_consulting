import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/utils/supabase/proxy'

export default async function proxy(request: NextRequest) {
  // 1. HTTP Basic Auth for Admin routes
  if (request.nextUrl.pathname.startsWith('/admin')) {
    const basicAuth = request.headers.get('authorization');
    
    if (basicAuth) {
      const authValue = basicAuth.split(' ')[1];
      const [user, pwd] = atob(authValue).split(':');

      const adminUsersEnv = process.env.ADMIN_USERS || 'admin:password';
      const validAdmins = adminUsersEnv.split(',');

      const isValidUser = validAdmins.some((validPair) => {
        const [validUser, validPwd] = validPair.split(':');
        return user === validUser && pwd === validPwd;
      });

      if (!isValidUser) {
        return new NextResponse('Unauthorized: Access restricted to Administrators.', {
          status: 401,
          headers: { 'WWW-Authenticate': 'Basic realm="Secure Admin Area"' },
        });
      }
    } else {
      return new NextResponse('Unauthorized: Access restricted to Administrators.', {
        status: 401,
        headers: { 'WWW-Authenticate': 'Basic realm="Secure Admin Area"' },
      });
    }
  }

  // 2. Proceed with Supabase session update
  return await updateSession(request)
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
