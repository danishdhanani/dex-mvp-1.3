'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface UnitType {
  id: string;
  name: string;
  icon: string;
  color: string;
}

export default function ServiceCallUnitSelectionPage() {
  const router = useRouter();
  const [selectedUnitType, setSelectedUnitType] = useState<string | null>(null);

  const unitTypes: UnitType[] = [
    {
      id: 'rtu',
      name: 'RTU',
      icon: 'M12 2L2 7L12 12L22 7L12 2Z',
      color: 'blue'
    },
    {
      id: 'splitUnit',
      name: 'Split AC Unit',
      icon: 'M12 2L2 7L12 12L22 7L12 2Z',
      color: 'green'
    },
    {
      id: 'reachIn',
      name: 'Reach-in',
      icon: 'M12 2L2 7L12 12L22 7L12 2Z',
      color: 'yellow'
    },
    {
      id: 'walkIn',
      name: 'Walk-in',
      icon: 'M12 2L2 7L12 12L22 7L12 2Z',
      color: 'cyan'
    },
    {
      id: 'iceMachine',
      name: 'Ice Machine',
      icon: 'M12 2L2 7L12 12L22 7L12 2Z',
      color: 'purple'
    }
  ];

  const handleUnitTypeSelect = (unitType: string) => {
    setSelectedUnitType(unitType);
    router.push(`/service-call/issues/${unitType}`);
  };

  const getColorClasses = (color: string) => {
    const colorMap: Record<string, string> = {
      blue: 'bg-blue-600 group-hover:bg-blue-700 border-blue-600 group-hover:text-blue-400',
      green: 'bg-green-600 group-hover:bg-green-700 border-green-600 group-hover:text-green-400',
      yellow: 'bg-yellow-600 group-hover:bg-yellow-700 border-yellow-600 group-hover:text-yellow-400',
      cyan: 'bg-cyan-600 group-hover:bg-cyan-700 border-cyan-600 group-hover:text-cyan-400',
      purple: 'bg-purple-600 group-hover:bg-purple-700 border-purple-600 group-hover:text-purple-400'
    };
    return colorMap[color] || colorMap.blue;
  };

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <div className="border-b border-gray-700 bg-gray-800">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => router.push('/job-type')}
              className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-400">
                <path d="M19 12H5M12 19l-7-7 7-7"/>
              </svg>
            </button>
            <div>
              <h1 className="text-2xl font-bold text-white">
                Service Call
              </h1>
              <p className="text-sm text-gray-400 mt-1">What type of unit are you working on?</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {unitTypes.map((unitType) => (
            <button
              key={unitType.id}
              onClick={() => handleUnitTypeSelect(unitType.id)}
              className="group relative bg-gray-800 hover:bg-gray-700 border-2 border-gray-700 hover:border-gray-600 rounded-lg p-3 transition-all duration-200"
            >
              <div className="text-center">
                <div className={`w-10 h-10 ${getColorClasses(unitType.color).split(' ')[0]} ${getColorClasses(unitType.color).split(' ')[1]} rounded-full flex items-center justify-center mx-auto mb-1 transition-colors`}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-white">
                    <path d={unitType.icon} strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <h2 className={`text-base font-bold text-white ${getColorClasses(unitType.color).split(' ')[3]} transition-colors`}>
                  {unitType.name}
                </h2>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
