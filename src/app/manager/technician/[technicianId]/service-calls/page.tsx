'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter, useParams } from 'next/navigation';
import AuthButton from '@/components/AuthButton';
import Link from 'next/link';

interface ServiceCall {
  id: number;
  created_at: string;
  type: 'service_call' | 'preventive_maintenance';
  details: {
    unitType?: string;
    issueId?: string;
    unitId?: string;
    sections?: any[];
    readings?: any;
    wrapUpNotes?: string;
    chosenWrapUp?: boolean;
    blockingMessageResolutions?: Record<string, 'resolved' | 'acknowledged'>;
    customIssueDescription?: string;
    hypotheses?: any[];
    chosenPathTitles?: string[];
    currentSection?: number;
  };
}

interface Technician {
  id: string;
  name: string;
}

export default function TechnicianServiceCallsPage() {
  const params = useParams();
  const router = useRouter();
  const technicianId = params.technicianId as string;
  const [user, setUser] = useState<any>(null);
  const [userData, setUserData] = useState<any>(null);
  const [technician, setTechnician] = useState<Technician | null>(null);
  const [serviceCalls, setServiceCalls] = useState<ServiceCall[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedServiceCall, setSelectedServiceCall] = useState<ServiceCall | null>(null);
  const [filter, setFilter] = useState<'all' | 'service_call' | 'preventive_maintenance'>('all');
  const supabase = createClient();

  useEffect(() => {
    const fetchData = async () => {
      // Check if user is authenticated
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) {
        router.push('/job-type');
        return;
      }
      setUser(authUser);

      // Fetch user data from users table
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single();

      if (userError) {
        console.error('Error fetching user data:', userError);
        router.push('/job-type');
        return;
      }

      setUserData(userData);

      // Check if user is a manager
      if (userData.role !== 'manager') {
        router.push('/job-type');
        return;
      }

      // Fetch technician info
      const { data: techData, error: techError } = await supabase
        .from('users')
        .select('id, name')
        .eq('id', technicianId)
        .single();

      if (techError) {
        console.error('Error fetching technician:', techError);
        router.push('/manager/dashboard');
        return;
      }

      // Verify technician is in the same org
      const { data: techUserData } = await supabase
        .from('users')
        .select('org_id')
        .eq('id', technicianId)
        .single();

      if (techUserData?.org_id !== userData.org_id) {
        router.push('/manager/dashboard');
        return;
      }

      setTechnician(techData);

      // Fetch service calls for this technician
      const { data: calls, error: callsError } = await supabase
        .from('service_calls')
        .select('id, created_at, details')
        .eq('user_id', technicianId)
        .order('created_at', { ascending: false });

      // Fetch preventive maintenance jobs for this technician
      const { data: pmJobs, error: pmError } = await supabase
        .from('preventive_maintenance')
        .select('id, created_at, details')
        .eq('user_id', technicianId)
        .order('created_at', { ascending: false });

      if (callsError) {
        console.error('Error fetching service calls:', callsError);
      }

      if (pmError) {
        console.error('Error fetching preventive maintenance jobs:', pmError);
      }

      // Combine and sort by date
      const allJobs: ServiceCall[] = [
        ...(calls || []).map(call => ({ ...call, type: 'service_call' as const })),
        ...(pmJobs || []).map(job => ({ ...job, type: 'preventive_maintenance' as const })),
      ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      setServiceCalls(allJobs);

      setLoading(false);
    };

    if (technicianId) {
      fetchData();
    }
  }, [router, supabase, technicianId]);

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
          <p className="text-gray-400">Loading jobs...</p>
        </div>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatUnitType = (unitType?: string) => {
    if (!unitType) return 'Unknown';
    return unitType
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const formatIssueId = (issueId?: string) => {
    if (!issueId) return 'Unknown Issue';
    return issueId
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <div className="border-b border-gray-700 bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Link
                href="/manager/dashboard"
                className="text-gray-400 hover:text-white transition-colors"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="15 18 9 12 15 6"/>
                </svg>
              </Link>
              <div>
                <h1 className="text-xl font-bold text-white">Jobs</h1>
                <p className="text-sm text-gray-400">{technician?.name || 'Technician'}</p>
              </div>
            </div>
            <AuthButton />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Filter Buttons */}
        <div className="mb-6 flex gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            All Jobs
          </button>
          <button
            onClick={() => setFilter('service_call')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === 'service_call'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            Service Calls
          </button>
          <button
            onClick={() => setFilter('preventive_maintenance')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === 'preventive_maintenance'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            Preventive Maintenance
          </button>
        </div>

        {(() => {
          const filteredCalls = filter === 'all' 
            ? serviceCalls 
            : serviceCalls.filter(call => call.type === filter);
          
          return filteredCalls.length === 0 ? (
          <div className="bg-gray-800 rounded-lg p-8 text-center border border-gray-700">
            <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-400">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
                <line x1="16" y1="13" x2="8" y2="13"/>
                <line x1="16" y1="17" x2="8" y2="17"/>
                <polyline points="10 9 9 9 8 9"/>
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">No Jobs Found</h3>
            <p className="text-gray-400">
              {filter === 'all'
                ? "This technician hasn't completed any jobs yet."
                : filter === 'service_call'
                ? "This technician hasn't completed any service calls yet."
                : "This technician hasn't completed any preventive maintenance jobs yet."}
            </p>
          </div>
          ) : (
            <div className="space-y-4">
              {filteredCalls.map((call) => (
              <div
                key={`${call.type}-${call.id}`}
                className="bg-gray-800 rounded-lg border border-gray-700 p-6 hover:border-gray-600 transition-colors cursor-pointer"
                onClick={() => setSelectedServiceCall(call)}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-lg font-semibold text-white">
                        {call.type === 'preventive_maintenance' 
                          ? `PM - ${call.details?.unitId || 'Unknown Unit'}`
                          : `${formatUnitType(call.details?.unitType)} - ${formatIssueId(call.details?.issueId)}`}
                      </h3>
                      <span className={`text-xs px-2 py-0.5 rounded ${
                        call.type === 'preventive_maintenance' 
                          ? 'bg-green-600/20 text-green-400' 
                          : 'bg-blue-600/20 text-blue-400'
                      }`}>
                        {call.type === 'preventive_maintenance' ? 'PM' : 'Service Call'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-400">
                      {formatDate(call.created_at)}
                    </p>
                  </div>
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className="text-gray-400"
                  >
                    <polyline points="9 18 15 12 9 6"/>
                  </svg>
                </div>
              </div>
              ))}
            </div>
          );
        })()}
      </div>

      {/* Service Call Details Modal */}
      {selectedServiceCall && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedServiceCall(null)}
        >
          <div
            className="bg-gray-800 rounded-lg border border-gray-700 w-full max-w-4xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-gray-800 border-b border-gray-700 px-6 py-4 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold text-white">
                    {selectedServiceCall.type === 'preventive_maintenance'
                      ? `PM - ${selectedServiceCall.details?.unitId || 'Unknown Unit'}`
                      : `${formatUnitType(selectedServiceCall.details?.unitType)} - ${formatIssueId(selectedServiceCall.details?.issueId)}`}
                  </h2>
                  <span className={`text-xs px-2 py-0.5 rounded ${
                    selectedServiceCall.type === 'preventive_maintenance' 
                      ? 'bg-green-600/20 text-green-400' 
                      : 'bg-blue-600/20 text-blue-400'
                  }`}>
                    {selectedServiceCall.type === 'preventive_maintenance' ? 'Preventive Maintenance' : 'Service Call'}
                  </span>
                </div>
                <p className="text-sm text-gray-400 mt-1">
                  {formatDate(selectedServiceCall.created_at)}
                </p>
              </div>
              <button
                onClick={() => setSelectedServiceCall(null)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Custom Issue Description - Only for service calls */}
              {selectedServiceCall.type === 'service_call' && selectedServiceCall.details?.customIssueDescription && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-300 mb-2">Issue Description</h3>
                  <p className="text-white bg-gray-700 rounded-lg p-3">
                    {selectedServiceCall.details.customIssueDescription}
                  </p>
                </div>
              )}

              {/* Readings */}
              {selectedServiceCall.details?.readings && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-300 mb-3">Readings</h3>
                  <div className="bg-gray-700 rounded-lg p-4 grid grid-cols-2 gap-4">
                    {Object.entries(selectedServiceCall.details.readings).map(([key, value]) => {
                      if (!value) return null;
                      return (
                        <div key={key}>
                          <span className="text-gray-400 text-sm">
                            {key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')}:
                          </span>
                          <span className="text-white ml-2">{String(value)}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Checklist Sections */}
              {selectedServiceCall.details?.sections && selectedServiceCall.details.sections.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-300 mb-3">Checklist</h3>
                  <div className="space-y-4">
                    {selectedServiceCall.details.sections.map((section: any, sectionIdx: number) => (
                      <div key={sectionIdx} className="bg-gray-700 rounded-lg p-4">
                        <h4 className="text-white font-medium mb-3">{section.title}</h4>
                        <div className="space-y-2">
                          {section.items?.map((item: any, itemIdx: number) => {
                            if (!item.checked && !item.selectedOptions?.length && !item.notes && !item.numericValue) {
                              return null;
                            }
                            return (
                              <div key={itemIdx} className="text-sm text-gray-300 pl-4 border-l-2 border-gray-600">
                                <div className="flex items-start">
                                  {item.checked && (
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-green-400 mr-2 mt-0.5">
                                      <polyline points="20 6 9 17 4 12"/>
                                    </svg>
                                  )}
                                  <div className="flex-1">
                                    <span className="text-white">{item.text}</span>
                                    {item.selectedOptions && item.selectedOptions.length > 0 && (
                                      <div className="mt-1 text-gray-400">
                                        Selected: {item.selectedOptions.join(', ')}
                                      </div>
                                    )}
                                    {item.numericValue && (
                                      <div className="mt-1 text-gray-400">
                                        Value: {item.numericValue} {item.unit || ''}
                                      </div>
                                    )}
                                    {item.notes && (
                                      <div className="mt-1 text-gray-400 italic">
                                        Notes: {item.notes}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Wrap Up Notes - Only for service calls */}
              {selectedServiceCall.type === 'service_call' && selectedServiceCall.details?.wrapUpNotes && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-300 mb-2">Wrap Up Notes</h3>
                  <p className="text-white bg-gray-700 rounded-lg p-3">
                    {selectedServiceCall.details.wrapUpNotes}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

