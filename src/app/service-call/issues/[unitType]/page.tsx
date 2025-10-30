'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Issue {
  id: string;
  name: string;
  description: string;
}

export default function ServiceCallIssuesPage({ params }: { params: Promise<{ unitType: string }> }) {
  const router = useRouter();
  const [unitType, setUnitType] = useState<string>('');
  const [selectedIssue, setSelectedIssue] = useState<string | null>(null);
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customIssueDetails, setCustomIssueDetails] = useState('');

  // Resolve params promise
  useEffect(() => {
    params.then((resolved) => {
      setUnitType(resolved.unitType);
    });
  }, [params]);

  const getIssuesForUnitType = (unitType: string): Issue[] => {
    const issuesMap: Record<string, Issue[]> = {
      rtu: [
        { id: 'no-heat', name: 'No Heat', description: 'Unit not producing heat' },
        { id: 'no-cooling', name: 'No Cooling', description: 'Unit not producing cooling' },
        { id: 'poor-airflow', name: 'Poor Airflow', description: 'Reduced or no airflow' },
        { id: 'noisy-operation', name: 'Noisy Operation', description: 'Unusual sounds during operation' },
        { id: 'short-cycling', name: 'Short Cycling', description: 'Unit turning on/off frequently' },
        { id: 'high-energy-usage', name: 'High Energy Usage', description: 'Excessive power consumption' }
      ],
      splitUnit: [
        { id: 'no-cooling', name: 'No Cooling', description: 'Unit not producing cooling' },
        { id: 'poor-airflow', name: 'Poor Airflow', description: 'Reduced or no airflow' },
        { id: 'noisy-operation', name: 'Noisy Operation', description: 'Unusual sounds during operation' },
        { id: 'short-cycling', name: 'Short Cycling', description: 'Unit turning on/off frequently' },
        { id: 'water-leak', name: 'Water Leak', description: 'Water dripping or pooling' }
      ],
      reachIn: [
        { id: 'not-cooling', name: 'Not Cooling', description: 'Temperature not reaching set point' },
        { id: 'excessive-frost', name: 'Excessive Frost', description: 'Heavy ice buildup on coils' },
        { id: 'door-seal-issue', name: 'Door Seal Issue', description: 'Poor door seal causing temperature issues' },
        { id: 'fan-not-working', name: 'Fan Not Working', description: 'Evaporator fan not operating' },
        { id: 'temperature-fluctuation', name: 'Temperature Fluctuation', description: 'Inconsistent temperature control' }
      ],
      walkIn: [
        { id: 'running-warm', name: 'Running Warm', description: 'Temperature above set point' },
        { id: 'ice-frost-build-up', name: 'Ice / Frost Build Up', description: 'Heavy ice or frost buildup' },
        { id: 'water-leaking', name: 'Water Leaking', description: 'Water dripping or pooling' },
        { id: 'box-too-cold', name: 'Box Too Cold', description: 'Temperature below set point' },
        { id: 'something-else', name: 'Something Else', description: 'Other issue not listed' }
      ],
      iceMachine: [
        { id: 'no-ice-production', name: 'No Ice Production', description: 'Machine not making ice' },
        { id: 'poor-ice-quality', name: 'Poor Ice Quality', description: 'Ice is cloudy, small, or malformed' },
        { id: 'water-leak', name: 'Water Leak', description: 'Water dripping or pooling' },
        { id: 'machine-not-cycling', name: 'Machine Not Cycling', description: 'Machine not completing cycles' },
        { id: 'water-quality-issue', name: 'Water Quality Issue', description: 'Water filter or quality problems' }
      ]
    };
    return issuesMap[unitType] || [];
  };

  const handleIssueSelect = (issueId: string) => {
    if (issueId === 'something-else') {
      setShowCustomInput(true);
      return;
    }
    setSelectedIssue(issueId);
    router.push(`/service-call/checklist/${unitType}/${issueId}`);
  };

  const handleCustomIssueSubmit = () => {
    if (customIssueDetails.trim()) {
      // Store custom issue details in localStorage for the checklist page
      const customIssueId = 'custom-issue';
      localStorage.setItem(`service-issue-${unitType}-${customIssueId}`, customIssueDetails.trim());
      router.push(`/service-call/checklist/${unitType}/${customIssueId}`);
    }
  };

  const getUnitTypeName = (unitType: string): string => {
    const names: Record<string, string> = {
      rtu: 'RTU',
      splitUnit: 'Split Unit',
      reachIn: 'Reach-in',
      walkIn: 'Walk-in',
      iceMachine: 'Ice Machine'
    };
    return names[unitType] || unitType;
  };

  // Show loading state while params are resolving
  if (!unitType) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" className="text-white">
              <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2"/>
            </svg>
          </div>
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  const issues = getIssuesForUnitType(unitType);

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <div className="border-b border-gray-700 bg-gray-800">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => router.push('/service-call/unit-selection')}
              className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-400">
                <path d="M19 12H5M12 19l-7-7 7-7"/>
              </svg>
            </button>
            <div>
              <h1 className="text-2xl font-bold text-white">
                {getUnitTypeName(unitType)} Issues
              </h1>
              <p className="text-sm text-gray-400 mt-1">What issue are you experiencing?</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {issues.map((issue) => {
            const getIconForIssue = (issueId: string) => {
              const iconMap: Record<string, { svg: string; color: string }> = {
                'running-warm': {
                  svg: 'M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z',
                  color: 'bg-red-600 group-hover:bg-red-700'
                },
                'ice-frost-build-up': {
                  svg: 'M2.5 12l-2-2 2-2 2 2-2 2zm19 0l-2-2 2-2 2 2-2 2zM12 2.5l-2-2-2 2 2 2 2-2zm0 19l-2-2-2 2 2 2 2-2zM6.5 6.5l-2-2-2 2 2 2 2-2zm11 11l-2-2-2 2 2 2 2-2zm0-11l2-2-2-2-2 2 2 2zm-11 11l2-2-2-2-2 2 2 2z',
                  color: 'bg-blue-600 group-hover:bg-blue-700'
                },
                'water-leaking': {
                  svg: 'M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z',
                  color: 'bg-cyan-600 group-hover:bg-cyan-700'
                },
                'box-too-cold': {
                  svg: 'M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0zM7 10h2M7 6h2',
                  color: 'bg-indigo-600 group-hover:bg-indigo-700'
                },
                'something-else': {
                  svg: 'M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3M12 17h.01',
                  color: 'bg-gray-600 group-hover:bg-gray-700'
                }
              };
              return iconMap[issueId] || { svg: 'M9 12l2 2 4-4M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9 9 4.03 9 9z', color: 'bg-green-600 group-hover:bg-green-700' };
            };

            const iconData = getIconForIssue(issue.id);
            
            return (
              <button
                key={issue.id}
                onClick={() => handleIssueSelect(issue.id)}
                className="group relative bg-gray-800 hover:bg-gray-700 border-2 border-gray-700 hover:border-green-600 rounded-lg p-6 transition-all duration-200 text-left"
              >
                <div className="flex items-start space-x-4">
                  <div className={`w-12 h-12 ${iconData.color} rounded-full flex items-center justify-center flex-shrink-0 transition-colors`}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-white">
                      <path d={iconData.svg}/>
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-green-400 transition-colors">
                      {issue.name}
                    </h3>
                    <p className="text-gray-400 text-sm">
                      {issue.description}
                    </p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Custom Issue Input Modal */}
      {showCustomInput && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-white mb-4">Describe the Issue</h2>
            <p className="text-gray-400 text-sm mb-4">
              Please provide details about the issue you're experiencing:
            </p>
            <textarea
              value={customIssueDetails}
              onChange={(e) => setCustomIssueDetails(e.target.value)}
              placeholder="Enter issue description..."
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 resize-none mb-4"
              rows={4}
              autoFocus
            />
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowCustomInput(false);
                  setCustomIssueDetails('');
                }}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCustomIssueSubmit}
                disabled={!customIssueDetails.trim()}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

