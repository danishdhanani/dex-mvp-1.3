import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const error = searchParams.get('error')

  // If there's an error parameter, log it and redirect to home
  if (error) {
    console.error('Auth callback error:', error)
    // Redirect to home - user can try signing in again
    return NextResponse.redirect(`${origin}/job-type`)
  }

  // If there's a code (for OAuth providers), exchange it for a session
  if (code) {
    try {
      const supabase = await createClient()
      const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
      
      if (exchangeError) {
        console.error('Code exchange error:', exchangeError)
        // Redirect to home on error - user can try again
        return NextResponse.redirect(`${origin}/job-type`)
      }

      // Success - redirect to home
      return NextResponse.redirect(`${origin}/job-type`)
    } catch (err) {
      console.error('Unexpected error in callback:', err)
      // Redirect to home on unexpected errors
      return NextResponse.redirect(`${origin}/job-type`)
    }
  }

  // No code, just redirect to home
  return NextResponse.redirect(`${origin}/job-type`)
}

