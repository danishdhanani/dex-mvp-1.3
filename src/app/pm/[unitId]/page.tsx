'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface ChecklistItem {
  id: string;
  title: string;
  items: {
    id: string;
    text: string;
    checked: boolean;
    notes?: string;
  }[];
}

interface PMChecklist {
  unitType: string;
  unitName: string;
  sections: ChecklistItem[];
}

export default function PMChecklistPage({ params }: { params: { unitId: string } }) {
  const router = useRouter();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [checklist, setChecklist] = useState<PMChecklist>(getDefaultChecklist(params.unitId));
  const [currentSection, setCurrentSection] = useState(1); // Current section (1-8)
  const [readings, setReadings] = useState({
    gasPressure: '',
    tempRise: '',
    blowerAmps: '',
    additionalRepairs: '',
  });

  // Load saved progress from localStorage on mount
  useEffect(() => {
    const savedData = localStorage.getItem(`pm-checklist-${params.unitId}`);
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        if (parsed.sections) {
          setChecklist(parsed);
        }
        if (parsed.readings) {
          setReadings(parsed.readings);
        }
      } catch (error) {
        console.error('Error loading saved progress:', error);
      }
    }
  }, [params.unitId]);

  // Save progress to localStorage whenever checklist or readings change
  useEffect(() => {
    const dataToSave = {
      sections: checklist.sections,
      readings: readings
    };
    localStorage.setItem(`pm-checklist-${params.unitId}`, JSON.stringify(dataToSave));
  }, [checklist, readings, params.unitId]);

  const toggleItem = (sectionId: string, itemId: string) => {
    setChecklist(prev => ({
      ...prev,
      sections: prev.sections.map(section =>
        section.id === sectionId
          ? {
              ...section,
              items: section.items.map(item =>
                item.id === itemId ? { ...item, checked: !item.checked } : item
              )
            }
          : section
      )
    }));
  };

  const updateNotes = (sectionId: string, itemId: string, notes: string) => {
    setChecklist(prev => ({
      ...prev,
      sections: prev.sections.map(section =>
        section.id === sectionId
          ? {
              ...section,
              items: section.items.map(item =>
                item.id === itemId ? { ...item, notes } : item
              )
            }
          : section
      )
    }));
  };

  const getProgress = () => {
    const totalItems = checklist.sections.reduce((sum, section) => sum + section.items.length, 0);
    const checkedItems = checklist.sections.reduce(
      (sum, section) => sum + section.items.filter(item => item.checked).length,
      0
    );
    return { checkedItems, totalItems, percentage: Math.round((checkedItems / totalItems) * 100) };
  };

  const goToSection = (sectionNumber: number) => {
    if (sectionNumber >= 1 && sectionNumber <= checklist.sections.length) {
      setCurrentSection(sectionNumber);
    }
  };

  const goToNextSection = () => {
    if (currentSection < checklist.sections.length) {
      setCurrentSection(currentSection + 1);
    }
  };

  const goToPreviousSection = () => {
    if (currentSection > 1) {
      setCurrentSection(currentSection - 1);
    }
  };

  const progress = getProgress();
  const currentSectionData = checklist.sections[currentSection - 1];

  // Calculate total timeline width (8 balls + gaps)
  const timelineWidth = (8 * 50) + (7 * 24) + 20; // 8 balls @ 50px + 7 gaps @ 24px + padding

  // Auto-scroll to active section
  useEffect(() => {
    if (scrollContainerRef.current) {
      const activeButton = scrollContainerRef.current.querySelector(`[data-section="${currentSection}"]`);
      if (activeButton) {
        activeButton.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    }
  }, [currentSection]);

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <div className="border-b border-gray-700 bg-gray-800 sticky top-0 z-10">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => router.back()}
                className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-400">
                  <path d="M19 12H5M12 19l-7-7 7-7"/>
                </svg>
              </button>
              <div>
                <h1 className="text-2xl font-bold text-white">{checklist.unitName}</h1>
                <p className="text-sm text-gray-400">Preventive Maintenance Checklist</p>
              </div>
            </div>
          </div>

          {/* Section Navigation - Scrollable */}
          <div className="relative">
            {/* Scrollable navigation container */}
            <div 
              ref={scrollContainerRef}
              className="overflow-x-auto pb-2"
              style={{ 
                WebkitOverflowScrolling: 'touch',
                scrollbarWidth: 'none',
                msOverflowStyle: 'none'
              }}
            >
              <div className="relative">
                <div 
                  className="flex items-start justify-start relative z-10"
                  style={{ 
                    paddingLeft: '10px',
                    paddingRight: '10px',
                    gap: '24px'
                  }}
                >
                {checklist.sections.map((section, index) => {
                  const sectionNumber = index + 1;
                  const isActive = sectionNumber === currentSection;
                  const isCompleted = section.title === 'Notes & Recommended Repairs' 
                    ? readings.gasPressure.trim() !== '' || readings.tempRise.trim() !== '' || readings.blowerAmps.trim() !== '' || readings.additionalRepairs.trim() !== ''
                    : section.items.every(item => item.checked);
                  
                  // Get short descriptor for each section
                  const getDescriptor = (title: string) => {
                    const descriptors: Record<string, string> = {
                      'Safety / Prep': 'Safety',
                      'Airflow': 'Airflow',
                      'Gas Heat Section': 'Gas',
                      'Controls / Sensors': 'Controls',
                      'Electrical': 'Electrical',
                      'Coils / Drain / Housekeeping': 'Coils',
                      'Operational Test': 'Test',
                      'Notes & Recommended Repairs': 'Notes'
                    };
                    return descriptors[title] || 'Step';
                  };
                  
                  return (
                    <div 
                      key={sectionNumber} 
                      data-section={sectionNumber}
                      className="flex flex-col items-center space-y-1"
                      style={{ 
                        minWidth: '50px',
                        flexShrink: 0
                      }}
                    >
                      <button
                        data-section={sectionNumber}
                        onClick={() => goToSection(sectionNumber)}
                        className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-colors ${
                          isActive
                            ? 'bg-blue-600 text-white'
                            : isCompleted
                            ? 'bg-green-600 text-white'
                            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        }`}
                      >
                        {sectionNumber}
                      </button>
                      <span className="text-xs text-gray-400 text-center whitespace-nowrap">
                        {getDescriptor(section.title)}
                      </span>
                    </div>
                  );
                })}
                </div>
                {/* Timeline background line - spans the full content width */}
                <div className="absolute top-5 h-0.5 bg-gray-600 z-0" style={{ 
                  left: '10px',
                  width: `${timelineWidth}px`
                }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Checklist Content */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Current Section */}
        <div className="bg-gray-800 rounded-lg overflow-hidden">
          {/* Section Header */}
          <div className="px-6 py-4 bg-gray-750 border-b border-gray-700">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                {currentSection}
              </div>
              <h2 className="text-lg font-semibold text-white">{currentSectionData.title}</h2>
            </div>
          </div>

          {/* Section Content */}
          <div className="px-6 py-6">
            {/* Special rendering for "Notes & Recommended Repairs" section */}
            {currentSectionData.title === 'Notes & Recommended Repairs' ? (
              <>
                {/* Reading inputs */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-gray-300 mb-2">Gas Pressure</label>
                    <input
                      type="text"
                      value={readings.gasPressure}
                      onChange={(e) => setReadings({ ...readings, gasPressure: e.target.value })}
                      placeholder="Enter reading"
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-300 mb-2">Temp Rise / Delta T</label>
                    <input
                      type="text"
                      value={readings.tempRise}
                      onChange={(e) => setReadings({ ...readings, tempRise: e.target.value })}
                      placeholder="Enter reading"
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-300 mb-2">Blower Amps</label>
                    <input
                      type="text"
                      value={readings.blowerAmps}
                      onChange={(e) => setReadings({ ...readings, blowerAmps: e.target.value })}
                      placeholder="Enter reading"
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                {/* Additional repairs text area */}
                <div className="mt-6">
                  <label className="block text-sm text-gray-300 mb-2">Any additional recommended repairs?</label>
                  <textarea
                    value={readings.additionalRepairs}
                    onChange={(e) => setReadings({ ...readings, additionalRepairs: e.target.value })}
                    placeholder="Enter any additional repairs or notes..."
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    rows={4}
                  />
                </div>
              </>
            ) : (
              /* Normal checklist items */
              <div className="space-y-3">
                {currentSectionData.items.map((item) => (
                  <div key={item.id} className="border-b border-gray-700 pb-3 last:border-b-0">
                    <div className="flex items-start space-x-3">
                      <button
                        onClick={() => toggleItem(currentSectionData.id, item.id)}
                        className={`flex-shrink-0 w-6 h-6 rounded border-2 flex items-center justify-center transition-colors ${
                          item.checked
                            ? 'bg-blue-600 border-blue-600 text-white'
                            : 'border-gray-600 hover:border-gray-500'
                        }`}
                      >
                        {item.checked && (
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                            <polyline points="20 6 9 17 4 12"/>
                          </svg>
                        )}
                      </button>
                      <div className="flex-1">
                        <label
                          className="text-gray-200 cursor-pointer block"
                          onClick={() => toggleItem(currentSectionData.id, item.id)}
                        >
                          {item.text}
                        </label>
                        {item.checked && (
                          <textarea
                            value={item.notes || ''}
                            onChange={(e) => updateNotes(currentSectionData.id, item.id, e.target.value)}
                            placeholder="Add notes..."
                            className="mt-2 w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none"
                            rows={2}
                          />
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="sticky bottom-0 bg-gray-900 border-t border-gray-700 py-4 mt-6">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex justify-between items-center">
            {/* Previous Button */}
            <button
              onClick={goToPreviousSection}
              disabled={currentSection === 1}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors font-medium"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="15 18 9 12 15 6"/>
              </svg>
              <span>Previous</span>
            </button>

            {/* Save Button */}
            <button
              onClick={() => {
                // Save to localStorage and navigate back
                const dataToSave = {
                  sections: checklist.sections,
                  readings: readings
                };
                localStorage.setItem(`pm-checklist-${params.unitId}`, JSON.stringify(dataToSave));
                router.back();
              }}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
            >
              Save & Return
            </button>

            {/* Next Button */}
            <button
              onClick={goToNextSection}
              disabled={currentSection === checklist.sections.length}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors font-medium"
            >
              <span>Next</span>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="9 18 15 12 9 6"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper function to generate checklist data based on unit ID
function getDefaultChecklist(unitId: string): PMChecklist {
  const unitName = parseUnitName(unitId);
  const unitType = parseUnitType(unitId);
  
  // Get the appropriate checklist based on unit type
  const checklists: Record<string, ChecklistItem[]> = {
    rtu: getRTUChecklist(),
    splitUnit: getSplitUnitChecklist(),
    reachIn: getReachInChecklist(),
    walkIn: getWalkInChecklist(),
    iceMachine: getIceMachineChecklist(),
  };

  return {
    unitType,
    unitName,
    sections: checklists[unitType] || getRTUChecklist(),
  };
}

function parseUnitId(unitId: string): { type: string; number: number } {
  const parts = unitId.split('-');
  return {
    type: parts[0],
    number: parseInt(parts[1]) || 1,
  };
}

function parseUnitName(unitId: string): string {
  const { type, number } = parseUnitId(unitId);
  const typeNames: Record<string, string> = {
    rtu: 'RTU',
    splitUnit: 'Split Unit',
    reachIn: 'Reach-in',
    walkIn: 'Walk-in',
    iceMachine: 'Ice Machine',
  };
  return `${typeNames[type] || type} ${number}`;
}

function parseUnitType(unitId: string): string {
  return parseUnitId(unitId).type;
}

function getRTUChecklist(): ChecklistItem[] {
  return [
    {
      id: '1',
      title: 'Safety / Prep',
      items: [
        { id: '1-1', text: 'Disconnect power & lockout', checked: false },
        { id: '1-2', text: 'Inspect panels, wiring, and overall unit condition', checked: false },
        { id: '1-3', text: 'Clear debris around unit', checked: false },
      ],
    },
    {
      id: '2',
      title: 'Airflow',
      items: [
        { id: '2-1', text: 'Replace/clean filters', checked: false },
        { id: '2-2', text: 'Inspect blower wheel, belts, and bearings', checked: false },
        { id: '2-3', text: 'Check damper & economizer operation', checked: false },
        { id: '2-4', text: 'Verify blower amps vs nameplate', checked: false },
      ],
    },
    {
      id: '3',
      title: 'Gas Heat Section',
      items: [
        { id: '3-1', text: 'Inspect gas piping & connections for leaks', checked: false },
        { id: '3-2', text: 'Check burners, orifices, and heat exchanger', checked: false },
        { id: '3-3', text: 'Inspect ignitor & flame sensor (clean if needed)', checked: false },
        { id: '3-4', text: 'Verify inducer & pressure switch operation', checked: false },
        { id: '3-5', text: 'Check flame quality (steady blue)', checked: false },
        { id: '3-6', text: 'Record manifold gas pressure & temperature rise', checked: false },
        { id: '3-7', text: 'Verify limit & rollout switch operation', checked: false },
        { id: '3-8', text: 'Inspect flue/vent for corrosion or blockage', checked: false },
      ],
    },
    {
      id: '4',
      title: 'Controls / Sensors',
      items: [
        { id: '4-1', text: 'Test thermostat or BAS heat call', checked: false },
        { id: '4-2', text: 'Verify staging & sequence of operation', checked: false },
        { id: '4-3', text: 'Check high/low pressure controls (as equipped)', checked: false },
        { id: '4-4', text: 'Verify safety controls cut out/reset properly', checked: false },
        { id: '4-5', text: 'Confirm supply/return sensors reading accurately', checked: false },
      ],
    },
    {
      id: '5',
      title: 'Electrical',
      items: [
        { id: '5-1', text: 'Inspect contactors, wiring, and connections', checked: false },
        { id: '5-2', text: 'Check control voltage (24V)', checked: false },
        { id: '5-3', text: 'Verify crankcase heater operation (warm shell or 0.1–0.5A draw)', checked: false },
        { id: '5-4', text: 'Check motor capacitors (µF) & record', checked: false },
      ],
    },
    {
      id: '6',
      title: 'Coils / Drain / Housekeeping',
      items: [
        { id: '6-1', text: 'Inspect condenser & evap coils; clean if needed', checked: false },
        { id: '6-2', text: 'Verify drain pan & line clear', checked: false },
        { id: '6-3', text: 'Confirm all panels secured', checked: false },
      ],
    },
    {
      id: '7',
      title: 'Operational Test',
      items: [
        { id: '7-1', text: 'Restore power/gas and run full heating cycle', checked: false },
        { id: '7-2', text: 'Verify proper ignition, flame proving, fan operation', checked: false },
        { id: '7-3', text: 'Check for abnormal noise/vibration', checked: false },
      ],
    },
    {
      id: '8',
      title: 'Notes & Recommended Repairs',
      items: [], // Empty array - will be rendered with input fields instead
    },
  ];
}

function getSplitUnitChecklist(): ChecklistItem[] {
  return [
    {
      id: '1',
      title: 'Safety / Prep',
      items: [
        { id: '1-1', text: 'Disconnect power & lockout', checked: false },
        { id: '1-2', text: 'Inspect outdoor and indoor unit condition', checked: false },
        { id: '1-3', text: 'Clear debris around units', checked: false },
      ],
    },
    {
      id: '2',
      title: 'Airflow',
      items: [
        { id: '2-1', text: 'Replace/clean indoor unit filters', checked: false },
        { id: '2-2', text: 'Inspect evaporator coil for debris', checked: false },
        { id: '2-3', text: 'Verify indoor fan operation', checked: false },
      ],
    },
    {
      id: '3',
      title: 'Refrigerant System',
      items: [
        { id: '3-1', text: 'Check refrigerant pressures', checked: false },
        { id: '3-2', text: 'Inspect refrigerant lines for leaks', checked: false },
        { id: '3-3', text: 'Verify superheat and subcooling', checked: false },
        { id: '3-4', text: 'Check compressor operation', checked: false },
      ],
    },
  ];
}

function getReachInChecklist(): ChecklistItem[] {
  return [
    {
      id: '1',
      title: 'Safety / Prep',
      items: [
        { id: '1-1', text: 'Disconnect power & lockout', checked: false },
        { id: '1-2', text: 'Remove contents safely', checked: false },
        { id: '1-3', text: 'Inspect door seals', checked: false },
      ],
    },
    {
      id: '2',
      title: 'Temperature Control',
      items: [
        { id: '2-1', text: 'Verify thermostat calibration', checked: false },
        { id: '2-2', text: 'Check temperature sensor accuracy', checked: false },
        { id: '2-3', text: 'Inspect defrost timer/heater', checked: false },
      ],
    },
    {
      id: '3',
      title: 'Refrigeration',
      items: [
        { id: '3-1', text: 'Check evaporator coil condition', checked: false },
        { id: '3-2', text: 'Verify condenser coil is clean', checked: false },
        { id: '3-3', text: 'Inspect refrigerant levels', checked: false },
      ],
    },
  ];
}

function getWalkInChecklist(): ChecklistItem[] {
  return [
    {
      id: '1',
      title: 'Safety / Prep',
      items: [
        { id: '1-1', text: 'Disconnect power & lockout', checked: false },
        { id: '1-2', text: 'Clear area around unit', checked: false },
        { id: '1-3', text: 'Inspect door seals and gaskets', checked: false },
      ],
    },
    {
      id: '2',
      title: 'Evaporator',
      items: [
        { id: '2-1', text: 'Clean evaporator coils', checked: false },
        { id: '2-2', text: 'Check evaporator fan motors', checked: false },
        { id: '2-3', text: 'Inspect defrost system', checked: false },
      ],
    },
    {
      id: '3',
      title: 'Condensing Unit',
      items: [
        { id: '3-1', text: 'Clean condenser coils', checked: false },
        { id: '3-2', text: 'Check compressor operation', checked: false },
        { id: '3-3', text: 'Verify refrigerant levels', checked: false },
      ],
    },
  ];
}

function getIceMachineChecklist(): ChecklistItem[] {
  return [
    {
      id: '1',
      title: 'Safety / Prep',
      items: [
        { id: '1-1', text: 'Disconnect power & lockout', checked: false },
        { id: '1-2', text: 'Inspect overall unit condition', checked: false },
        { id: '1-3', text: 'Clear area around unit', checked: false },
      ],
    },
    {
      id: '2',
      title: 'Water System',
      items: [
        { id: '2-1', text: 'Check water filter', checked: false },
        { id: '2-2', text: 'Inspect water lines for leaks', checked: false },
        { id: '2-3', text: 'Verify water pressure', checked: false },
      ],
    },
    {
      id: '3',
      title: 'Refrigeration',
      items: [
        { id: '3-1', text: 'Clean evaporator plate', checked: false },
        { id: '3-2', text: 'Check condenser coils', checked: false },
        { id: '3-3', text: 'Verify refrigerant levels', checked: false },
      ],
    },
  ];
}

