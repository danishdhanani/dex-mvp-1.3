'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

interface UnitCounts {
  rtu: number;
  splitUnit: number;
  reachIn: number;
  walkIn: number;
  iceMachine: number;
}

interface Unit {
  id: string;
  type: keyof UnitCounts;
  name: string;
  completedSteps?: number;
  totalSteps?: number;
}

export default function PMSummaryPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [jobNumber, setJobNumber] = useState('');
  const [units, setUnits] = useState<Unit[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);

  // Initialize job number from URL or localStorage
  useEffect(() => {
    const jobNum = searchParams.get('jobNumber') || '';
    
    if (jobNum) {
      setJobNumber(jobNum);
      localStorage.setItem('pm-current-job-number', jobNum);
    } else {
      const storedJobNumber = localStorage.getItem('pm-current-job-number');
      if (storedJobNumber) {
        setJobNumber(storedJobNumber);
      } else {
        const newJobNumber = Math.floor(1000 + Math.random() * 9000).toString();
        setJobNumber(newJobNumber);
        localStorage.setItem('pm-current-job-number', newJobNumber);
      }
    }
  }, [searchParams]);

  // Load or generate units
  useEffect(() => {
    if (!jobNumber) return; // Wait for jobNumber to be set
    
    const unitCountsJson = searchParams.get('unitCounts') || '{}';
    
    try {
      const unitCounts: UnitCounts = JSON.parse(decodeURIComponent(unitCountsJson));
      
      // Generate units array from counts
      const generatedUnits: Unit[] = [];
      
      Object.entries(unitCounts).forEach(([type, count]) => {
        for (let i = 1; i <= count; i++) {
          generatedUnits.push({
            id: `${type}-${i}`,
            type: type as keyof UnitCounts,
            name: formatUnitName(type, i)
          });
        }
      });
      
      // If we have units from URL, use them, otherwise check localStorage
      if (generatedUnits.length > 0) {
        setUnits(generatedUnits);
        localStorage.setItem(`pm-units-${jobNumber}`, JSON.stringify(generatedUnits));
      } else {
        // Try to load from localStorage
        const storedUnits = localStorage.getItem(`pm-units-${jobNumber}`);
        if (storedUnits) {
          setUnits(JSON.parse(storedUnits));
        }
      }
    } catch (error) {
      // If parsing fails, try to load from localStorage
      const storedUnits = localStorage.getItem(`pm-units-${jobNumber}`);
      if (storedUnits) {
        try {
          setUnits(JSON.parse(storedUnits));
        } catch (e) {
          console.error('Error loading units:', e);
          setUnits([]);
        }
      } else {
        setUnits([]);
      }
    }
  }, [searchParams, jobNumber, refreshKey]);

  // Listen for storage events to refresh progress
  useEffect(() => {
    const handleStorageChange = () => {
      setRefreshKey(prev => prev + 1);
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const formatUnitName = (type: string, index: number): string => {
    const typeNames: Record<string, string> = {
      'rtu': 'RTU',
      'splitUnit': 'Split Unit',
      'reachIn': 'Reach-in',
      'walkIn': 'Walk-in',
      'iceMachine': 'Ice Machine'
    };
    return `${typeNames[type] || type} ${index}`;
  };

  const getUnitsByType = (type: string) => {
    return units.filter(u => u.type === type);
  };

  const getTotalSteps = (type: string): number => {
    // Total number of sections (not checklist items) for each type
    const steps: Record<string, number> = {
      'rtu': 8, // 8 sections (Safety, Airflow, Gas, Controls, Electrical, Coils, Operational Test, Notes)
      'splitUnit': 3, // 3 sections (Safety, Airflow, Refrigerant)
      'reachIn': 3, // 3 sections (Safety, Temperature, Refrigeration)
      'walkIn': 3, // 3 sections (Safety, Evaporator, Condensing)
      'iceMachine': 3 // 3 sections (Safety, Water, Refrigeration)
    };
    return steps[type] || 0;
  };

  const getCompletedSteps = (unit: Unit): number => {
    // Load completed steps from localStorage
    try {
      const savedData = localStorage.getItem(`pm-checklist-${unit.id}`);
      if (savedData) {
        const parsed = JSON.parse(savedData);
        if (parsed.sections) {
          // Count how many sections have all items checked
          const completedSections = parsed.sections.filter((section: any) => {
            if (section.items.length === 0) {
              // For the "Notes & Recommended Repairs" section, check if any input has content
              if (parsed.readings) {
                return parsed.readings.gasPressure.trim() !== '' || 
                       parsed.readings.tempRise.trim() !== '' || 
                       parsed.readings.blowerAmps.trim() !== '' || 
                       parsed.readings.additionalRepairs.trim() !== '';
              }
              return false;
            }
            return section.items.every((item: any) => item.checked);
          });
          return completedSections.length;
        }
      }
    } catch (error) {
      console.error('Error loading progress:', error);
    }
    return 0;
  };

  const deleteUnit = (id: string) => {
    setUnits(prev => {
      const updated = prev.filter(u => u.id !== id);
      // Save to localStorage
      localStorage.setItem(`pm-units-${jobNumber}`, JSON.stringify(updated));
      return updated;
    });
  };

  const addUnit = (type: keyof UnitCounts) => {
    const existingUnits = getUnitsByType(type);
    const newIndex = existingUnits.length + 1;
    const newUnit: Unit = {
      id: `${type}-${newIndex}`,
      type,
      name: formatUnitName(type, newIndex)
    };
    setUnits(prev => {
      const updated = [...prev, newUnit];
      // Save to localStorage
      localStorage.setItem(`pm-units-${jobNumber}`, JSON.stringify(updated));
      return updated;
    });
  };

  const unitTypeInfo = [
    { key: 'rtu', label: 'RTU(S)', color: 'blue' },
    { key: 'splitUnit', label: 'SPLIT UNIT(S)', color: 'green' },
    { key: 'reachIn', label: 'REACH-IN(S)', color: 'yellow' },
    { key: 'walkIn', label: 'WALK-IN(S)', color: 'cyan' },
    { key: 'iceMachine', label: 'ICE MACHINE(S)', color: 'purple' },
  ];

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <div className="border-b border-gray-700 bg-gray-800">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
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
                  Job #{jobNumber}
                </h1>
                <p className="text-sm text-gray-400 mt-1">Preventive Maintenance</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-400">Total Units</div>
              <div className="text-2xl font-bold text-white">{units.length}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        {unitTypeInfo.map((typeInfo) => {
          const typeUnits = getUnitsByType(typeInfo.key);
          
          // Count how many units of this type have been completed (all sections done)
          const completedUnits = typeUnits.filter(unit => {
            const totalSteps = getTotalSteps(unit.type);
            const completedSteps = getCompletedSteps(unit);
            return completedSteps === totalSteps && totalSteps > 0;
          }).length;
          
          return (
            <div key={typeInfo.key} className="mb-6">
              {/* Section Header */}
              <div className="flex items-center justify-between mb-3 px-4">
                <div className="flex items-center space-x-3">
                  <h2 className="text-lg font-semibold text-white uppercase">
                    {typeInfo.label}
                  </h2>
                  <span className="bg-gray-700 text-gray-300 px-3 py-1 rounded-full text-sm font-medium">
                    {completedUnits}/{typeUnits.length}
                  </span>
                </div>
              </div>

              {/* Units List */}
              {typeUnits.map((unit) => {
                const totalSteps = getTotalSteps(unit.type);
                const completedSteps = getCompletedSteps(unit);
                
                return (
                  <div
                    key={`${unit.id}-${refreshKey}`}
                    onClick={() => router.push(`/pm/${unit.id}`)}
                    className="bg-gray-800 border border-gray-700 rounded-lg p-4 mb-3 hover:border-blue-600 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3 flex-1">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <h3 className="text-white font-medium">{unit.name}</h3>
                            <span className="bg-gray-700 text-gray-300 px-2 py-0.5 rounded-full text-xs font-medium">
                              {completedSteps}/{totalSteps} steps
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => deleteUnit(unit.id)}
                          className="p-2 hover:bg-red-900/20 text-gray-400 hover:text-red-400 rounded-lg transition-colors"
                          title="Delete unit"
                        >
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="3 6 5 6 21 6"/>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                            <line x1="10" y1="11" x2="10" y2="17"/>
                            <line x1="14" y1="11" x2="14" y2="17"/>
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Add Another Button */}
              <button
                onClick={() => addUnit(typeInfo.key as keyof UnitCounts)}
                className="w-full border-2 border-dashed border-gray-700 hover:border-gray-600 rounded-lg p-4 text-center transition-colors group"
              >
                <div className="flex items-center justify-center space-x-2">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-500 group-hover:text-gray-400">
                    <line x1="12" y1="5" x2="12" y2="19"/>
                    <line x1="5" y1="12" x2="19" y2="12"/>
                  </svg>
                  <span className="text-gray-500 group-hover:text-gray-400 font-medium">
                    Add Another
                  </span>
                </div>
              </button>
            </div>
          );
        })}

        {/* Empty state when no units */}
        {units.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mx-auto opacity-50">
                <path d="M12 2L2 7L12 12L22 7L12 2Z"/>
                <path d="M2 17L12 22L22 17"/>
                <path d="M2 12L12 17L22 12"/>
              </svg>
            </div>
            <p className="text-gray-500">No units added yet</p>
          </div>
        )}
      </div>
    </div>
  );
}
