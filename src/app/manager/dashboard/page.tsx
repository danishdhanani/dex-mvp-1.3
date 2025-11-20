'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import AuthButton from '@/components/AuthButton';

interface Technician {
  id: string;
  name: string;
  role: string;
}

export default function ManagerDashboard() {
  const [user, setUser] = useState<any>(null);
  const [userData, setUserData] = useState<any>(null);
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    // Check if user is authenticated
    supabase.auth.getUser().then(({ data: { user: authUser } }) => {
      if (!authUser) {
        router.push('/job-type');
        return;
      }
      setUser(authUser);
      
      // Fetch user data from users table
      supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single()
        .then(({ data, error }) => {
          if (error) {
            console.error('Error fetching user data:', error);
            router.push('/job-type');
            return;
          }
          
          setUserData(data);
          
          // Check if user is a manager
          if (data.role !== 'manager') {
            router.push('/job-type');
            return;
          }
          
          // Fetch technicians from the same org
          if (data.org_id) {
            supabase
              .from('users')
              .select('id, name, role')
              .eq('org_id', data.org_id)
              .eq('role', 'technician')
              .order('name', { ascending: true })
              .then(async ({ data: techs, error: techError }) => {
                if (techError) {
                  console.error('Error fetching technicians:', techError);
                  setLoading(false);
                  return;
                }
                
                setTechnicians(techs || []);
                setLoading(false);
              });
          } else {
            setLoading(false);
          }
        });
    });
  }, [router, supabase]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" className="text-white">
              <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <p className="text-gray-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <div className="border-b border-gray-700 bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-white">
                  <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Manager Dashboard</h1>
                <p className="text-sm text-gray-400">Welcome, {userData?.name?.split(' ')[0] || 'Manager'}</p>
              </div>
            </div>
            <AuthButton />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-white mb-2">Technicians</h2>
        </div>

        {technicians.length === 0 ? (
          <div className="bg-gray-800 rounded-lg p-8 text-center border border-gray-700">
            <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-400">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">No Technicians Found</h3>
            <p className="text-gray-400">
              {userData?.org_id
                ? 'There are no technicians in your organization yet.'
                : 'You need to be assigned to an organization to view technicians.'}
            </p>
          </div>
        ) : (
          <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Name
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {technicians.map((technician) => (
                    <tr key={technician.id} className="hover:bg-gray-700/50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center mr-3">
                            <span className="text-white font-medium text-sm">
                              {technician.name?.charAt(0).toUpperCase() || 'T'}
                            </span>
                          </div>
                          <div className="text-sm font-medium text-white">
                            {technician.name || 'Unknown'}
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

