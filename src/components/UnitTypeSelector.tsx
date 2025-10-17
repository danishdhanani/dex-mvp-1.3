'use client';

interface UnitTypeSelectorProps {
  onUnitTypeSelect: (unitType: string) => void;
}

export default function UnitTypeSelector({ onUnitTypeSelect }: UnitTypeSelectorProps) {
  const unitTypes = [
    {
      id: 'rtu',
      name: 'RTU',
      fullName: 'Roof Top Unit',
      description: 'Commercial rooftop HVAC systems',
      available: false,
      icon: (
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-400">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
          <path d="M9 9h6v6H9z"/>
          <path d="M9 1v6"/>
          <path d="M15 1v6"/>
          <path d="M9 17v6"/>
          <path d="M15 17v6"/>
        </svg>
      )
    },
    {
      id: 'split-unit',
      name: 'Split Unit',
      fullName: 'Split System',
      description: 'Residential and light commercial HVAC',
      available: false,
      icon: (
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-400">
          <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
          <line x1="8" y1="21" x2="16" y2="21"/>
          <line x1="12" y1="17" x2="12" y2="21"/>
          <circle cx="6" cy="10" r="2"/>
          <circle cx="18" cy="10" r="2"/>
        </svg>
      )
    },
    {
      id: 'reach-in',
      name: 'Reach-in Cooler/Freezer',
      fullName: 'Reach-in Refrigeration',
      description: 'Commercial reach-in refrigeration units',
      available: false,
      icon: (
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-400">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
          <path d="M9 9h6v6H9z"/>
          <path d="M9 1v6"/>
          <path d="M15 1v6"/>
          <path d="M9 17v6"/>
          <path d="M15 17v6"/>
        </svg>
      )
    },
    {
      id: 'walk-in',
      name: 'Walk-in Cooler/Freezer',
      fullName: 'Walk-in Refrigeration',
      description: 'Large commercial walk-in refrigeration',
      available: false,
      icon: (
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-400">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
          <path d="M9 9h6v6H9z"/>
          <path d="M9 1v6"/>
          <path d="M15 1v6"/>
          <path d="M9 17v6"/>
          <path d="M15 17v6"/>
        </svg>
      )
    },
    {
      id: 'ice-machine',
      name: 'Ice Machine',
      fullName: 'Ice Machine',
      description: 'Commercial ice making equipment',
      available: true,
      icon: (
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-blue-400">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
          <path d="M9 9h6v6H9z"/>
          <path d="M9 1v6"/>
          <path d="M15 1v6"/>
          <path d="M9 17v6"/>
          <path d="M15 17v6"/>
        </svg>
      )
    }
  ];

  return (
    <div className="flex-1 flex flex-col bg-gray-900">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 px-4 py-6">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-3xl font-bold text-white mb-2">Dex Service Copilot</h1>
          <p className="text-gray-400 text-lg">AI-powered HVAC/R troubleshooting assistant</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="max-w-4xl w-full">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-semibold text-white mb-4">What type of unit are you working on?</h2>
            <p className="text-gray-400 text-lg">Select the equipment type to get started with troubleshooting</p>
          </div>

          {/* Unit Type Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {unitTypes.map((unitType) => (
              <div
                key={unitType.id}
                className={`relative bg-gray-800 rounded-lg p-6 border-2 transition-all duration-200 ${
                  unitType.available
                    ? 'border-gray-600 hover:border-blue-500 hover:bg-gray-750 cursor-pointer'
                    : 'border-gray-700 bg-gray-800/50 cursor-not-allowed'
                }`}
                onClick={() => unitType.available && onUnitTypeSelect(unitType.id)}
              >
                {/* Coming Soon Badge */}
                {!unitType.available && (
                  <div className="absolute top-3 right-3">
                    <span className="bg-gray-600 text-gray-300 text-xs px-2 py-1 rounded-full">
                      Coming Soon
                    </span>
                  </div>
                )}

                {/* Icon */}
                <div className="flex justify-center mb-4">
                  {unitType.icon}
                </div>

                {/* Content */}
                <div className="text-center">
                  <h3 className={`text-lg font-semibold mb-2 ${
                    unitType.available ? 'text-white' : 'text-gray-400'
                  }`}>
                    {unitType.name}
                  </h3>
                  <p className={`text-sm mb-1 ${
                    unitType.available ? 'text-gray-300' : 'text-gray-500'
                  }`}>
                    {unitType.fullName}
                  </p>
                  <p className={`text-xs ${
                    unitType.available ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    {unitType.description}
                  </p>
                </div>

                {/* Available Indicator */}
                {unitType.available && (
                  <div className="mt-4 flex justify-center">
                    <div className="flex items-center space-x-2 text-blue-400 text-sm">
                      <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                      <span>Available</span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Footer Info */}
          <div className="mt-12 text-center">
            <p className="text-gray-500 text-sm">
              More equipment types coming soon. Currently supporting Ice Machine troubleshooting.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
