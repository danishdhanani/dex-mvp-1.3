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
        { id: 'not-cooling', name: 'Not Cooling', description: 'Temperature not reaching set point' },
        { id: 'excessive-frost', name: 'Excessive Frost', description: 'Heavy ice buildup on coils' },
        { id: 'door-seal-issue', name: 'Door Seal Issue', description: 'Poor door seal causing temperature issues' },
        { id: 'fan-not-working', name: 'Fan Not Working', description: 'Evaporator fan not operating' },
        { id: 'defrost-issue', name: 'Defrost Issue', description: 'Defrost cycle not working properly' }
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
    setSelectedIssue(issueId);
    router.push(`/service-call/checklist/${unitType}/${issueId}`);
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
          {issues.map((issue) => (
            <button
              key={issue.id}
              onClick={() => handleIssueSelect(issue.id)}
              className="group relative bg-gray-800 hover:bg-gray-700 border-2 border-gray-700 hover:border-green-600 rounded-lg p-6 transition-all duration-200 text-left"
            >
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-green-600 group-hover:bg-green-700 rounded-full flex items-center justify-center flex-shrink-0 transition-colors">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-white">
                    <path d="M9 12l2 2 4-4"/>
                    <path d="M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9 9 4.03 9 9z"/>
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
          ))}
        </div>
      </div>
    </div>
  );
}
