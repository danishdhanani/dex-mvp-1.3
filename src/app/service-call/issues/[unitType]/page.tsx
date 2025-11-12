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
        { id: 'not-cooling', name: 'Not Cooling', description: 'Unit is not delivering cooling' },
        { id: 'not-heating', name: 'Not Heating', description: 'Unit is not delivering heat' },
        { id: 'zoning-issues', name: 'Zoning Issues', description: 'Uneven temperatures or unexpected cooling/heating across zones' },
        { id: 'poor-airflow', name: 'Poor Airflow', description: 'Little or no airflow from supply vents' },
        { id: 'unit-not-running', name: 'Unit Not Running (incl. thermostat / comm error)', description: 'System will not start, thermostat is blank, or will not communicate' },
        { id: 'unit-leaking', name: 'Water Leaking From Unit', description: 'Water dripping from the roof or ceiling around the unit' },
        { id: 'short-cycling', name: 'Short Cycling / Noisy Operation', description: 'Unit turns on/off rapidly or making unusual sounds during operation' },
        { id: 'something-else', name: 'Something Else', description: 'Other issue not listed' }
      ],
      splitUnit: [
        { id: 'not-cooling', name: 'Not Cooling', description: 'Unit is not delivering cooling' },
        { id: 'not-heating', name: 'Not Heating', description: 'Unit is not delivering heat' },
        { id: 'poor-airflow', name: 'Poor Airflow', description: 'Little or no airflow from supply vents' },
        { id: 'unit-not-running', name: 'Unit Not Running (incl. thermostat / comm error)', description: 'System will not start, thermostat is blank, or will not communicate' },
        { id: 'unit-leaking', name: 'Water Leaking From Unit', description: 'Water dripping from the roof or ceiling around the unit' },
        { id: 'short-cycling', name: 'Short Cycling / Noisy Operation', description: 'Unit turns on/off rapidly or making unusual sounds during operation' },
        { id: 'something-else', name: 'Something Else', description: 'Other issue not listed' }
      ],
      reachIn: [
        { id: 'running-warm', name: 'Running Warm', description: 'Temperature above set point' },
        { id: 'unit-not-running-display', name: 'Not Running / Blank Display', description: 'System will not start or display is blank' },
        { id: 'ice-frost-build-up', name: 'Ice / Frost Build Up', description: 'Heavy ice or frost buildup on coils' },
        { id: 'water-leaking', name: 'Water Leaking', description: 'Water dripping or pooling' },
        { id: 'running-constantly', name: 'Constant Run / Short Cycle', description: 'Unit runs continuously or turns on/off rapidly' },
        { id: 'noisy-operation', name: 'Noisy Operation / Vibrating', description: 'Unusual sounds or excessive vibration' },
        { id: 'door-gasket-issue', name: 'Door or Gasket Issue', description: 'Poor door seal or gasket problems' },
        { id: 'other-alarm', name: 'Other / Alarm on Controller', description: 'Other issue or alarm displayed on controller' }
      ],
      walkIn: [
        { id: 'running-warm', name: 'Running Warm', description: 'Temperature above set point' },
        { id: 'unit-not-running-display', name: 'Not Running / Blank Display', description: 'System will not start or display is blank' },
        { id: 'ice-frost-build-up', name: 'Ice / Frost Build Up', description: 'Heavy ice or frost buildup on coils' },
        { id: 'water-leaking', name: 'Water Leaking', description: 'Water dripping or pooling' },
        { id: 'running-constantly', name: 'Constant Run / Short Cycle', description: 'Unit runs continuously or turns on/off rapidly' },
        { id: 'noisy-operation', name: 'Noisy Operation / Vibrating', description: 'Unusual sounds or excessive vibration' },
        { id: 'door-gasket-issue', name: 'Door or Gasket Issue', description: 'Poor door seal or gasket problems' },
        { id: 'other-alarm', name: 'Other / Alarm on Controller', description: 'Other issue or alarm displayed on controller' }
      ],
      iceMachine: [
        { id: 'no-ice-production', name: 'No (or slow) Ice Production', description: 'Machine not making ice or producing slowly' },
        { id: 'poor-ice-quality', name: 'Poor Ice Quality', description: 'Ice is cloudy, small, or malformed' },
        { id: 'water-leaking', name: 'Water Leaking', description: 'Water dripping or pooling' },
        { id: 'machine-icing-up', name: 'Machine Icing Up', description: 'Ice buildup on machine components' },
        { id: 'noisy-operation', name: 'Noisy Operation / Vibrating', description: 'Unusual sounds or excessive vibration' },
        { id: 'machine-not-cycling', name: 'Power or Cycle Issues', description: 'Machine will not start or not completing cycles' },
        { id: 'other-alarm', name: 'Other / Alarm on Controller', description: 'Other issue or alarm displayed on controller' }
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
              const iconMap: Record<string, { svg: string; color: string; fill?: boolean }> = {
                'not-cooling': {
                  svg: 'M12 18a6 6 0 1 0-6-6 6 6 0 0 0 6 6zm0-14V2m0 20v-2m10-8h-2M4 12H2m15.07-5.07 1.41-1.41M5.52 18.48l-1.41 1.41M18.48 18.48l1.41 1.41M5.52 5.52 4.11 4.11',
                  color: 'bg-sky-600 group-hover:bg-sky-700'
                },
                'not-heating': {
                  svg: 'M12 2a4 4 0 0 0-4 4v6.26a4.5 4.5 0 1 0 4 0V6a1 1 0 1 1 2 0v6.26a6.5 6.5 0 1 1-6-0.11V6a6 6 0 1 1 12 0v6.26a4.5 4.5 0 1 0 2 0V6a8 8 0 0 0-8-4z',
                  color: 'bg-orange-600 group-hover:bg-orange-700'
                },
                'poor-airflow': {
                  svg: 'M3 12h18M5 8h14M7 4h10M5 16h14M7 20h10',
                  color: 'bg-cyan-600 group-hover:bg-cyan-700'
                },
                'unit-not-running': {
                  svg: 'M12 6v6l4 2M12 22a10 10 0 1 1 10-10',
                  color: 'bg-gray-600 group-hover:bg-gray-700'
                },
                'unit-not-running-display': {
                  svg: 'M12 6v6l4 2M12 22a10 10 0 1 1 10-10',
                  color: 'bg-gray-600 group-hover:bg-gray-700'
                },
                'unit-leaking': {
                  svg: 'M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z',
                  color: 'bg-emerald-600 group-hover:bg-emerald-700'
                },
                'short-cycling': {
                  svg: 'M21 12a9 9 0 1 1-2.64-6.36M21 3v6h-6',
                  color: 'bg-purple-600 group-hover:bg-purple-700'
                },
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
                  color: 'bg-emerald-600 group-hover:bg-emerald-700'
                },
                'box-too-cold': {
                  svg: 'M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0zM7 10h2M7 6h2',
                  color: 'bg-indigo-600 group-hover:bg-indigo-700'
                },
                'door-seal-issue': {
                  svg: 'M4 4h16v16H4zM8 8h8v8H8z',
                  color: 'bg-amber-600 group-hover:bg-amber-700'
                },
                'fan-not-working': {
                  svg: 'M4 9a4 4 0 1 0 4 4H4zm12 12a4 4 0 1 0-4-4v4zm0-20v4a4 4 0 1 0 4-4zm-8 8H4a4 4 0 1 0 4-4z',
                  color: 'bg-teal-600 group-hover:bg-teal-700'
                },
                'temperature-fluctuation': {
                  svg: 'M12 4v16m0 0-3-3m3 3 3-3m0-10-3 3m3-3 3 3',
                  color: 'bg-pink-600 group-hover:bg-pink-700'
                },
                'zoning-issues': {
                  svg: 'M3 3h8v8H3zM13 3h8v8h-8zM3 13h8v8H3zM13 13h8v8h-8z',
                  color: 'bg-violet-600 group-hover:bg-violet-700'
                },
                'running-constantly': {
                  svg: 'M21 12a9 9 0 1 1-2.64-6.36M21 3v6h-6',
                  color: 'bg-purple-600 group-hover:bg-purple-700'
                },
                'noisy-operation': {
                  svg: 'M12 6v12M8 8l-2-2M4 10l-2 2M16 8l2-2M20 10l2 2M8 16l-2 2M4 14l-2-2M16 16l2 2M20 14l2-2',
                  color: 'bg-orange-600 group-hover:bg-orange-700'
                },
                'door-gasket-issue': {
                  svg: 'M4 4h16v16H4zM8 8h8v8H8z',
                  color: 'bg-amber-600 group-hover:bg-amber-700'
                },
                'no-ice-production': {
                  svg: 'M6 6h12v12H6zM8 8h8v8H8zM10 10h4v4h-4z',
                  color: 'bg-blue-600 group-hover:bg-blue-700'
                },
                'poor-ice-quality': {
                  svg: 'M12 2L2 22h20L12 2zm0 8v6m0 2h.01',
                  color: 'bg-amber-600 group-hover:bg-amber-700'
                },
                'machine-not-cycling': {
                  svg: 'M12 6v6l4 2M12 22a10 10 0 1 1 10-10',
                  color: 'bg-gray-600 group-hover:bg-gray-700'
                },
                'machine-icing-up': {
                  svg: 'M2.5 12l-2-2 2-2 2 2-2 2zm19 0l-2-2 2-2 2 2-2 2zM12 2.5l-2-2-2 2 2 2 2-2zm0 19l-2-2-2 2 2 2 2-2zM6.5 6.5l-2-2-2 2 2 2 2-2zm11 11l-2-2-2 2 2 2 2-2zm0-11l2-2-2-2-2 2 2 2zm-11 11l2-2-2-2-2 2 2 2z',
                  color: 'bg-indigo-600 group-hover:bg-indigo-700'
                },
                'other-alarm': {
                  svg: 'M12 2c-1.1 0-2 .9-2 2v8c0 1.1.9 2 2 2s2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3z',
                  color: 'bg-red-600 group-hover:bg-red-700',
                  fill: false
                },
                'something-else': {
                  svg: 'M9.5 6.5a2.5 2.5 0 0 1 5 0c0 1.38-1.12 2.5-2.5 2.5v1.5h2v-1.5c1.38 0 2.5-1.12 2.5-2.5a4.5 4.5 0 0 0-9 0h2zm0 9h2v2h-2z',
                  color: 'bg-gray-600 group-hover:bg-gray-700',
                  fill: true
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
                    <svg width="24" height="24" viewBox="0 0 24 24" fill={iconData.fill ? "currentColor" : "none"} stroke="currentColor" strokeWidth={iconData.fill ? "0" : "2"} className="text-white">
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

