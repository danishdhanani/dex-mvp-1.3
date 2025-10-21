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
      available: true,
      icon: (
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-400">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
          <path d="M9 22V12h6v10"/>
          <circle cx="12" cy="8" r="2"/>
        </svg>
      )
    },
    {
      id: 'split-unit',
      name: 'Split Unit',
      fullName: 'Split System',
      description: 'Residential and light commercial HVAC',
      available: true,
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
      available: true,
      icon: (
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-400">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
          <path d="M8 3v18"/>
          <path d="M16 3v18"/>
          <path d="M3 8h18"/>
          <path d="M3 16h18"/>
          <circle cx="12" cy="12" r="2"/>
        </svg>
      )
    },
    {
      id: 'walk-in',
      name: 'Walk-in Cooler/Freezer',
      fullName: 'Walk-in Refrigeration',
      description: 'Large commercial walk-in refrigeration',
      available: true,
      icon: (
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-400">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
          <path d="M8 3v18"/>
          <path d="M16 3v18"/>
          <path d="M3 8h18"/>
          <path d="M3 16h18"/>
          <path d="M8 8h8v8H8z"/>
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
          <path d="M12 2L2 7L12 12L22 7L12 2Z"/>
          <path d="M2 17L12 22L22 17"/>
          <path d="M2 12L12 17L22 12"/>
          <circle cx="12" cy="12" r="3"/>
          <path d="M12 1v2"/>
          <path d="M12 21v2"/>
          <path d="M4.22 4.22l1.42 1.42"/>
          <path d="M18.36 18.36l1.42 1.42"/>
          <path d="M1 12h2"/>
          <path d="M21 12h2"/>
          <path d="M4.22 19.78l1.42-1.42"/>
          <path d="M18.36 5.64l1.42-1.42"/>
        </svg>
      )
    }
  ];

  return (
    <div className="flex-1 flex flex-col bg-gray-900">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 px-3 py-3 sm:px-4 sm:py-6">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-xl sm:text-3xl font-bold text-white mb-1 sm:mb-2">Dex Service Copilot</h1>
          <p className="text-gray-400 text-sm sm:text-lg">AI-powered HVAC/R troubleshooting assistant</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center px-3 py-4 sm:px-4 sm:py-12">
        <div className="max-w-4xl w-full">
          <div className="text-center mb-6 sm:mb-12">
            <h2 className="text-lg sm:text-2xl font-semibold text-white mb-2 sm:mb-4">What type of unit are you working on?</h2>
            <p className="text-gray-400 text-sm sm:text-lg">Select the equipment type to get started with troubleshooting</p>
          </div>

          {/* Unit Type Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
            {unitTypes.map((unitType) => (
              <div
                key={unitType.id}
                className={`relative bg-gray-800 rounded-lg p-3 sm:p-6 border-2 transition-all duration-200 ${
                  unitType.available
                    ? 'border-gray-600 hover:border-blue-500 hover:bg-gray-750 cursor-pointer'
                    : 'border-gray-700 bg-gray-800/50 cursor-not-allowed'
                }`}
                onClick={() => unitType.available && onUnitTypeSelect(unitType.id)}
              >
                {/* Status Badge */}
                {!unitType.available ? (
                  <div className="absolute top-3 right-3">
                    <span className="bg-gray-600 text-gray-300 text-xs px-2 py-1 rounded-full">
                      Coming Soon
                    </span>
                  </div>
                ) : (
                  <div className="absolute top-3 right-3">
                    <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded-full">
                      Available
                    </span>
                  </div>
                )}

                {/* Content with icon on left for mobile, centered for desktop */}
                <div className="flex items-center space-x-6 sm:flex-col sm:space-x-0 sm:text-center">
                  {/* Icon */}
                  <div className="flex-shrink-0 w-8 h-8 sm:w-12 sm:h-12 sm:mb-4 flex items-center justify-center">
                    {unitType.icon}
                  </div>

                  {/* Text Content */}
                  <div className="flex-1 sm:flex-none">
                    <h3 className={`text-sm sm:text-lg font-semibold mb-1 sm:mb-2 ${
                      unitType.available ? 'text-white' : 'text-gray-400'
                    }`}>
                      {unitType.name}
                    </h3>
                    <p className={`text-xs ${
                      unitType.available ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      {unitType.description}
                    </p>
                  </div>
                </div>

              </div>
            ))}
          </div>

          {/* Footer Info */}
          <div className="mt-6 sm:mt-12 text-center">
            <p className="text-gray-500 text-xs sm:text-sm">
              Supporting all major HVAC/R equipment types. Upload your service manuals to get started.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
