import { NextResponse } from 'next/server'
// The client you created from the Server-Side Auth instructions
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/db'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  // if "next" is in param, use it as the redirect URL
  const next = searchParams.get('next') ?? '/'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      // Check if user has completed onboarding
      const { data: { user } } = await supabase.auth.getUser()
      let redirectPath = next

      if (user) {
        const profile = await prisma.userProfile.findUnique({
          where: { userId: user.id },
        })
        if (!profile?.onboardingCompleted) {
          redirectPath = '/onboarding'
        }
      }

      const forwardedHost = request.headers.get('x-forwarded-host') // original origin before load balancer
      const isLocalEnv = process.env.NODE_ENV === 'development'

      let redirectUrl: string
      if (isLocalEnv) {
        redirectUrl = `${origin}${redirectPath}`
      } else if (forwardedHost) {
        redirectUrl = `https://${forwardedHost}${redirectPath}`
      } else {
        redirectUrl = `${origin}${redirectPath}`
      }

      const response = NextResponse.redirect(redirectUrl)

      // Set onboarding cookie for returning users who already completed it
      if (redirectPath !== '/onboarding') {
        response.cookies.set('onboarding_completed', '1', {
          path: '/',
          maxAge: 60 * 60 * 24 * 365,
          httpOnly: false,
          sameSite: 'lax',
        })
      }

      return response
    }
  }

  // return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/auth/auth-code-error`)
}
