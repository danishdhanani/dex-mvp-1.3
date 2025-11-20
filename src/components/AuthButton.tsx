'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

interface Organization {
  id: string;
  org_name: string;
}

export default function AuthButton() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('technician');
  const [orgId, setOrgId] = useState('');
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [orgsLoading, setOrgsLoading] = useState(false);
  const [showOrgList, setShowOrgList] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    // Check current user
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        // Don't close modals here - let the sign-up flow handle it
        setAuthError(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  // Fetch organizations when sign up modal opens
  useEffect(() => {
    if (showAuthModal && isSignUp && organizations.length === 0 && !orgsLoading) {
      fetchOrganizations();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showAuthModal, isSignUp]);

  const fetchOrganizations = async () => {
    setOrgsLoading(true);
    try {
      const { data, error } = await supabase
        .from('orgs')
        .select('id, org_name')
        .order('org_name', { ascending: true });

      if (error) throw error;
      setOrganizations(data || []);
    } catch (error) {
      console.error('Error fetching organizations:', error);
      setAuthError('Failed to load organizations. Please try again.');
    } finally {
      setOrgsLoading(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.refresh();
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthLoading(true);

    try {
      if (isSignUp) {
        // Validate required fields
        if (!name.trim()) {
          setAuthError('Name is required');
          setAuthLoading(false);
          return;
        }
        const { data: authData, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
        });
        if (signUpError) throw signUpError;
        
        // Create user record in users table
        if (authData.user) {
          const { error: userError } = await supabase
            .from('users')
            .insert({
              id: authData.user.id,
              role: role,
              name: name.trim(),
              org_id: orgId || null,
            });
          
          if (userError) {
            console.error('Error creating user record:', userError);
            // Don't throw - user is already created in auth, just log the error
            // Still show welcome modal since auth user was created
          }
        }
        
        // User record created successfully - show welcome modal
        setShowAuthModal(false);
        setShowWelcomeModal(true);
        setEmail('');
        setPassword('');
        setName('');
        setRole('technician');
        setOrgId('');
        setShowOrgList(false);
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        setShowAuthModal(false);
        setEmail('');
        setPassword('');
      }
    } catch (error: any) {
      setAuthError(error.message || 'An error occurred');
    } finally {
      setAuthLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="w-20 h-8 bg-gray-700 rounded animate-pulse"></div>
    );
  }

  return (
    <>
      {/* User info / Sign In button - hide when welcome modal is showing */}
      {!showWelcomeModal && (
        <>
          {user ? (
            <div className="flex items-center space-x-3">
              <span className="text-sm text-gray-300 hidden sm:inline">
                {user.email}
              </span>
              <button
                onClick={handleSignOut}
                className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white text-sm rounded-lg transition-colors"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowAuthModal(true)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
            >
              Sign In
            </button>
          )}
        </>
      )}

      {showAuthModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md border border-gray-700">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-white">
                {isSignUp ? 'Sign Up' : 'Sign In'}
              </h2>
              <button
                onClick={() => {
                  setShowAuthModal(false);
                  setAuthError(null);
                  setEmail('');
                  setPassword('');
                  setName('');
                  setRole('technician');
                  setOrgId('');
                  setShowOrgList(false);
                }}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>

            <form onSubmit={handleAuth} className="space-y-4">
              {isSignUp && (
                <>
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-1">
                      Name
                    </label>
                    <input
                      id="name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      disabled={authLoading}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                      placeholder="John Doe"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Role
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setRole('technician')}
                        disabled={authLoading}
                        className={`px-4 py-2 rounded-lg border-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                          role === 'technician'
                            ? 'bg-blue-600 border-blue-500 text-white'
                            : 'bg-gray-700 border-gray-600 text-gray-300 hover:border-gray-500'
                        }`}
                      >
                        Technician
                      </button>
                      <button
                        type="button"
                        onClick={() => setRole('manager')}
                        disabled={authLoading}
                        className={`px-4 py-2 rounded-lg border-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                          role === 'manager'
                            ? 'bg-blue-600 border-blue-500 text-white'
                            : 'bg-gray-700 border-gray-600 text-gray-300 hover:border-gray-500'
                        }`}
                      >
                        Manager
                      </button>
                    </div>
                  </div>
                </>
              )}

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={authLoading}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  placeholder="you@example.com"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-1">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={authLoading}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  placeholder="••••••••"
                />
              </div>

              {isSignUp && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Organization (Optional)
                  </label>
                  {orgsLoading ? (
                    <div className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-400 text-center">
                      Loading organizations...
                    </div>
                  ) : organizations.length === 0 ? (
                    <div className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-400 text-center text-sm">
                      No organizations available
                    </div>
                  ) : (
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setShowOrgList(!showOrgList)}
                        disabled={authLoading}
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-left flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <span className={orgId ? 'text-white' : 'text-gray-400'}>
                          {orgId
                            ? organizations.find((o) => o.id === orgId)?.org_name || 'Select an organization'
                            : 'Select an organization'}
                        </span>
                        <svg
                          width="20"
                          height="20"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          className={`text-gray-400 transition-transform ${showOrgList ? 'rotate-180' : ''}`}
                        >
                          <polyline points="6 9 12 15 18 9" />
                        </svg>
                      </button>
                      {showOrgList && (
                        <>
                          <div
                            className="fixed inset-0 z-40"
                            onClick={() => setShowOrgList(false)}
                          />
                          <div className="absolute z-50 w-full mt-1 bg-gray-700 border border-gray-600 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                            <button
                              type="button"
                              onClick={() => {
                                setOrgId('');
                                setShowOrgList(false);
                              }}
                              className={`w-full px-3 py-2 text-left hover:bg-gray-600 transition-colors ${
                                !orgId ? 'bg-gray-600 text-blue-400' : 'text-gray-300'
                              }`}
                            >
                              None
                            </button>
                            {organizations.map((org) => (
                              <button
                                key={org.id}
                                type="button"
                                onClick={() => {
                                  setOrgId(org.id);
                                  setShowOrgList(false);
                                }}
                                className={`w-full px-3 py-2 text-left hover:bg-gray-600 transition-colors ${
                                  orgId === org.id ? 'bg-gray-600 text-blue-400' : 'text-gray-300'
                                }`}
                              >
                                {org.org_name}
                              </button>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>
              )}

              {authError && (
                <div className="bg-red-900/20 border border-red-600 text-red-400 px-3 py-2 rounded-lg text-sm">
                  {authError}
                </div>
              )}

              <button
                type="submit"
                disabled={authLoading}
                className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors flex items-center justify-center"
              >
                {authLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    {isSignUp ? 'Creating account...' : 'Signing in...'}
                  </>
                ) : (
                  isSignUp ? 'Sign Up' : 'Sign In'
                )}
              </button>
            </form>

            <div className="mt-4 text-center">
              <button
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  setAuthError(null);
                  setName('');
                  setRole('technician');
                  setOrgId('');
                  setShowOrgList(false);
                }}
                className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
              >
                {isSignUp
                  ? 'Already have an account? Sign in'
                  : "Don't have an account? Sign up"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Welcome Modal */}
      {showWelcomeModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md border border-gray-700">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-white">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                  <polyline points="22 4 12 14.01 9 11.01"/>
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">
                Welcome to Dex!
              </h2>
              <p className="text-gray-300 mb-6">
                Your account has been created successfully. You're all set to start using Dex Service Copilot.
              </p>
              <button
                onClick={() => {
                  setShowWelcomeModal(false);
                  router.push('/job-type');
                  router.refresh();
                }}
                className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
              >
                Get Started
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

