'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface UnitCounts {
  rtu: number;
  splitUnit: number;
  reachIn: number;
  walkIn: number;
  iceMachine: number;
}

export default function PMPage() {
  const router = useRouter();
  const [jobNumber, setJobNumber] = useState('');
  const [unitCounts, setUnitCounts] = useState<UnitCounts>({
    rtu: 0,
    splitUnit: 0,
    reachIn: 0,
    walkIn: 0,
    iceMachine: 0,
  });

  const [saved, setSaved] = useState(false);

  const updateUnitCount = (type: keyof UnitCounts, count: number) => {
    const newCount = Math.max(0, count);
    setUnitCounts(prev => ({ ...prev, [type]: newCount }));
  };

  const getTotalUnits = () => {
    return Object.values(unitCounts).reduce((sum, count) => sum + count, 0);
  };

  const handleSave = () => {
    setSaved(true);
    // Here you would typically save to backend or state management
    console.log('Job Number:', jobNumber);
    console.log('Unit counts saved:', unitCounts);
    
    // Navigate to PM summary page with data
    setTimeout(() => {
      router.push(`/pm/summary?jobNumber=${jobNumber}&unitCounts=${JSON.stringify(unitCounts)}`);
    }, 500);
  };

  const unitTypes = [
    {
      key: 'rtu' as keyof UnitCounts,
      name: 'RTU',
      fullName: 'Roof Top Unit',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 2L2 7L12 12L22 7L12 2Z"/>
          <path d="M2 17L12 22L22 17"/>
          <path d="M2 12L12 17L22 12"/>
        </svg>
      ),
      color: 'blue',
    },
    {
      key: 'splitUnit' as keyof UnitCounts,
      name: 'Split Unit',
      fullName: 'Split System',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="2" y="7" width="20" height="15" rx="2" ry="2"/>
          <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
        </svg>
      ),
      color: 'green',
    },
    {
      key: 'reachIn' as keyof UnitCounts,
      name: 'Reach-in',
      fullName: 'Reach-in Cooler/Freezer',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
        </svg>
      ),
      color: 'yellow',
    },
    {
      key: 'walkIn' as keyof UnitCounts,
      name: 'Walk-in',
      fullName: 'Walk-in Cooler/Freezer',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
          <line x1="9" y1="9" x2="15" y2="9"/>
          <line x1="9" y1="15" x2="15" y2="15"/>
        </svg>
      ),
      color: 'cyan',
    },
    {
      key: 'iceMachine' as keyof UnitCounts,
      name: 'Ice Machine',
      fullName: 'Ice Maker',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 2L2 7L12 12L22 7L12 2Z"/>
          <path d="M2 17L12 22L22 17"/>
          <circle cx="12" cy="12" r="3"/>
        </svg>
      ),
      color: 'purple',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <div className="border-b border-gray-700 bg-gray-800">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => router.push('/job-type')}
              className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-400">
                <path d="M19 12H5M12 19l-7-7 7-7"/>
              </svg>
            </button>
            <h1 className="text-2xl font-bold text-white">
              Preventive Maintenance - Setup
            </h1>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-400">
              Total Units: <span className="font-semibold text-white">{getTotalUnits()}</span>
            </span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Job Number Input */}
        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Job Number
          </label>
          <input
            type="text"
            value={jobNumber}
            onChange={(e) => {
              const value = e.target.value.replace(/\D/g, '').slice(0, 4);
              setJobNumber(value);
            }}
            placeholder="Enter 4-digit job number"
            className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg tracking-widest"
            maxLength={4}
          />
          {jobNumber && jobNumber.length !== 4 && (
            <p className="text-yellow-400 text-sm mt-2">
              Enter a 4-digit job number
            </p>
          )}
        </div>

        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-white mb-2">
            How many units are you servicing today?
          </h2>
          <p className="text-gray-400 text-sm">
            Enter the count of each unit type you'll be working on for this PM job.
          </p>
        </div>

        {/* Unit Input Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {unitTypes.map((unit) => {
            const count = unitCounts[unit.key];
            const colorClasses = {
              blue: 'bg-blue-600 hover:bg-blue-700',
              green: 'bg-green-600 hover:bg-green-700',
              yellow: 'bg-yellow-600 hover:bg-yellow-700',
              cyan: 'bg-cyan-600 hover:bg-cyan-700',
              purple: 'bg-purple-600 hover:bg-purple-700',
            };

            return (
              <div
                key={unit.key}
                className="bg-gray-800 border border-gray-700 rounded-lg p-6 hover:border-gray-600 transition-colors"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-12 h-12 ${colorClasses[unit.color as keyof typeof colorClasses]} rounded-full flex items-center justify-center text-white`}>
                    {unit.icon}
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-white">{count}</div>
                    <div className="text-xs text-gray-400">units</div>
                  </div>
                </div>
                
                <h3 className="text-white font-medium mb-1">{unit.name}</h3>
                <p className="text-sm text-gray-400 mb-4">{unit.fullName}</p>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => updateUnitCount(unit.key, count - 1)}
                    className="flex-1 px-3 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors text-lg font-semibold"
                  >
                    −
                  </button>
                  <input
                    type="number"
                    value={count || ''}
                    onChange={(e) => updateUnitCount(unit.key, parseInt(e.target.value) || 0)}
                    className="w-20 px-2 py-2 bg-gray-700 text-white text-center rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min="0"
                  />
                  <button
                    onClick={() => updateUnitCount(unit.key, count + 1)}
                    className="flex-1 px-3 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors text-lg font-semibold"
                  >
                    +
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-4">
          <button
            onClick={() => router.push('/job-type')}
            className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={getTotalUnits() === 0 || jobNumber.length !== 4}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors font-medium flex items-center space-x-2"
          >
            {saved ? (
              <>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 6L9 17l-5-5"/>
                </svg>
                <span>Saved!</span>
              </>
            ) : (
              <>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
                  <path d="M17 21v-8H7v8"/>
                  <path d="M7 3v5h8"/>
                </svg>
                <span>Save & Continue</span>
              </>
            )}
          </button>
        </div>

        {(getTotalUnits() === 0 || jobNumber.length !== 4) && (
          <div className="mt-4 p-4 bg-yellow-900/20 border border-yellow-700 rounded-lg">
            <p className="text-yellow-300 text-sm text-center">
              {jobNumber.length !== 4 
                ? 'Please enter a 4-digit job number to continue.'
                : 'Please select at least one unit to continue with the PM job.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

