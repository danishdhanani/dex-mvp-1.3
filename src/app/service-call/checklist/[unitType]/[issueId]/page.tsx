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
    status?: 'red' | 'yellow' | 'green' | 'na' | 'unchecked';
    notes?: string;
    images?: string[];
  }[];
}

interface ServiceCallChecklist {
  unitType: string;
  issueType: string;
  sections: ChecklistItem[];
}

// Specific checklist data for different unit type and issue combinations
const walkInExcessiveFrostChecklist: ChecklistItem[] = [
  {
    id: '1',
    title: 'Safety / Prep',
    items: [
      { id: '1-1', text: 'Disconnect power & lockout', checked: false },
      { id: '1-2', text: 'Inspect unit condition and safety', checked: false },
      { id: '1-3', text: 'Clear work area / access', checked: false },
      { id: '1-4', text: 'Note ice location (coil / pan / ceiling / door)', checked: false },
      { id: '1-5', text: 'Record box temp and setpoint', checked: false },
    ],
  },
  {
    id: '2',
    title: 'Airflow / Fans',
    items: [
      { id: '2-1', text: 'Check evaporator coil for heavy frost / ice block', checked: false },
      { id: '2-2', text: 'Verify all evaporator fans running, correct rotation', checked: false },
      { id: '2-3', text: 'Check fan blades for ice buildup or damage', checked: false },
      { id: '2-4', text: 'Confirm airflow not blocked by product', checked: false },
      { id: '2-5', text: 'Check door switch / fan interlock', checked: false },
    ],
  },
  {
    id: '3',
    title: 'Defrost / Drain',
    items: [
      { id: '3-1', text: 'Start manual defrost: heaters energize?', checked: false },
      { id: '3-2', text: 'During defrost, do evap fans stop?', checked: false },
      { id: '3-3', text: 'Coil starts to clear / melt?', checked: false },
      { id: '3-4', text: 'Drain pan / drain line iced or blocked?', checked: false },
      { id: '3-5', text: 'Drain line heat tape working?', checked: false },
    ],
  },
  {
    id: '4',
    title: 'Door / Infiltration',
    items: [
      { id: '4-1', text: 'Inspect door gaskets for gaps / tears', checked: false },
      { id: '4-2', text: 'Door self-closes and seals fully', checked: false },
      { id: '4-3', text: 'Frame / jamb heaters warm and intact', checked: false },
      { id: '4-4', text: 'Frost trails at seams / conduit penetrations', checked: false },
      { id: '4-5', text: 'Door held open during use / loading?', checked: false },
    ],
  },
  {
    id: '5',
    title: 'Final Test & Notes',
    items: [
      { id: '5-1', text: 'Return system to normal operation', checked: false },
      { id: '5-2', text: 'Verify fans running, coil no longer choking in ice', checked: false },
      { id: '5-3', text: 'Verify drain flowing and no standing water', checked: false },
      { id: '5-4', text: 'Box temp trending toward setpoint', checked: false },
      { id: '5-5', text: 'Document corrective action / parts needed', checked: false },
      { id: '5-6', text: 'Capture final photos', checked: false },
    ],
  },
];

// Helper function to generate service call checklist data
function getServiceCallChecklist(unitType: string, issueId: string): ServiceCallChecklist {
  // Return specific checklist based on unit type and issue combination
  if (unitType === 'walkIn' && issueId === 'excessive-frost') {
    return {
      unitType,
      issueType: issueId,
      sections: walkInExcessiveFrostChecklist,
    };
  }

  // Default placeholder for other combinations
  const defaultChecklist: ChecklistItem[] = [
    {
      id: '1',
      title: 'Safety / Prep',
      items: [
        { id: '1-1', text: 'Disconnect power & lockout', checked: false },
        { id: '1-2', text: 'Inspect unit condition and safety', checked: false },
        { id: '1-3', text: 'Clear work area', checked: false },
      ],
    },
    {
      id: '2',
      title: 'Initial Diagnosis',
      items: [
        { id: '2-1', text: 'Check power supply and connections', checked: false },
        { id: '2-2', text: 'Verify control settings', checked: false },
        { id: '2-3', text: 'Test basic operation', checked: false },
      ],
    },
    {
      id: '3',
      title: 'System Check',
      items: [
        { id: '3-1', text: 'Inspect components for visible issues', checked: false },
        { id: '3-2', text: 'Check for leaks or damage', checked: false },
        { id: '3-3', text: 'Test system response', checked: false },
      ],
    },
    {
      id: '4',
      title: 'Repair Actions',
      items: [
        { id: '4-1', text: 'Perform necessary repairs', checked: false },
        { id: '4-2', text: 'Replace faulty components', checked: false },
        { id: '4-3', text: 'Clean and adjust as needed', checked: false },
      ],
    },
    {
      id: '5',
      title: 'Testing & Verification',
      items: [
        { id: '5-1', text: 'Test system operation', checked: false },
        { id: '5-2', text: 'Verify issue resolution', checked: false },
        { id: '5-3', text: 'Check for proper cycling', checked: false },
      ],
    },
    {
      id: '6',
      title: 'Notes & Recommended Repairs',
      items: [], // No checklist items, handled by separate inputs
    },
  ];

  return {
    unitType,
    issueType: issueId,
    sections: defaultChecklist,
  };
}

export default function ServiceCallChecklistPage({ params }: { params: Promise<{ unitType: string; issueId: string }> }) {
  const router = useRouter();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [unitType, setUnitType] = useState<string>('');
  const [issueId, setIssueId] = useState<string>('');
  const [checklist, setChecklist] = useState<ServiceCallChecklist | null>(null);
  const [currentSection, setCurrentSection] = useState(1);
  const [readings, setReadings] = useState({
    gasPressure: '',
    tempRise: '',
    blowerAmps: '',
    additionalRepairs: '',
    boxTemp: '',
    setpoint: '',
  });

  // Resolve params promise
  useEffect(() => {
    params.then((resolved) => {
      setUnitType(resolved.unitType);
      setIssueId(resolved.issueId);
      setChecklist(getServiceCallChecklist(resolved.unitType, resolved.issueId));
    });
  }, [params]);

  // Load saved progress from localStorage on mount
  useEffect(() => {
    if (!unitType || !issueId) return;
    const savedData = localStorage.getItem(`service-checklist-${unitType}-${issueId}`);
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
  }, [unitType, issueId]);

  // Save progress to localStorage whenever checklist or readings change
  useEffect(() => {
    if (!unitType || !issueId || !checklist) return;
    const dataToSave = {
      sections: checklist.sections,
      readings: readings
    };
    localStorage.setItem(`service-checklist-${unitType}-${issueId}`, JSON.stringify(dataToSave));
  }, [checklist, readings, unitType, issueId]);

  const toggleItem = (sectionId: string, itemId: string) => {
    if (!checklist) return;
    setChecklist(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        sections: prev.sections.map(section =>
          section.id === sectionId
            ? {
                ...section,
                items: section.items.map(item => {
                  if (item.id === itemId) {
                    // Cycle through: unchecked -> red -> yellow -> green -> na -> unchecked
                    const currentStatus = item.status || 'unchecked';
                    const statusOrder = ['unchecked', 'red', 'yellow', 'green', 'na'];
                    const currentIndex = statusOrder.indexOf(currentStatus);
                    const nextIndex = (currentIndex + 1) % statusOrder.length;
                    const nextStatus = statusOrder[nextIndex];
                    
                    return {
                      ...item,
                      checked: nextStatus !== 'unchecked',
                      status: nextStatus === 'unchecked' ? undefined : nextStatus as 'red' | 'yellow' | 'green' | 'na'
                    };
                  }
                  return item;
                })
              }
            : section
        )
      };
    });
  };

  const updateNotes = (sectionId: string, itemId: string, notes: string) => {
    if (!checklist) return;
    setChecklist(prev => {
      if (!prev) return prev;
      return {
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
      };
    });
  };

  const handleImageUpload = (sectionId: string, itemId: string, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !checklist) return;

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image size must be less than 5MB');
      return;
    }

    // Check file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const base64String = e.target?.result as string;
      setChecklist(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          sections: prev.sections.map(section =>
            section.id === sectionId
              ? {
                  ...section,
                  items: section.items.map(item =>
                    item.id === itemId 
                      ? { 
                          ...item, 
                          images: [...(item.images || []), base64String] 
                        } 
                      : item
                  )
                }
              : section
          )
        };
      });
    };
    reader.readAsDataURL(file);
  };

  const removeImage = (sectionId: string, itemId: string, imageIndex: number) => {
    if (!checklist) return;
    setChecklist(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        sections: prev.sections.map(section =>
          section.id === sectionId
            ? {
                ...section,
                items: section.items.map(item =>
                  item.id === itemId 
                    ? { 
                        ...item, 
                        images: item.images?.filter((_, index) => index !== imageIndex) || []
                      } 
                    : item
                )
              }
            : section
        )
      };
    });
  };

  const goToSection = (sectionNumber: number) => {
    if (!checklist) return;
    if (sectionNumber >= 1 && sectionNumber <= checklist.sections.length) {
      setCurrentSection(sectionNumber);
    }
  };

  const goToNextSection = () => {
    if (!checklist) return;
    if (currentSection < checklist.sections.length) {
      setCurrentSection(currentSection + 1);
    }
  };

  const goToPreviousSection = () => {
    if (currentSection > 1) {
      setCurrentSection(currentSection - 1);
    }
  };

  // Auto-scroll to active section
  useEffect(() => {
    if (scrollContainerRef.current && checklist) {
      const activeButton = scrollContainerRef.current.querySelector(`[data-section="${currentSection}"]`);
      if (activeButton) {
        activeButton.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    }
  }, [currentSection, checklist]);

  const currentSectionData = checklist?.sections[currentSection - 1];

  // Show loading state while params are resolving
  if (!checklist || !currentSectionData) {
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

  // Calculate total timeline width
  const timelineWidth = (checklist.sections.length * 50) + ((checklist.sections.length - 1) * 24) + 20;

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

  const getIssueName = (issueId: string): string => {
    const names: Record<string, string> = {
      'no-heat': 'No Heat',
      'no-cooling': 'No Cooling',
      'poor-airflow': 'Poor Airflow',
      'noisy-operation': 'Noisy Operation',
      'short-cycling': 'Short Cycling',
      'high-energy-usage': 'High Energy Usage',
      'not-cooling': 'Not Cooling',
      'excessive-frost': 'Excessive Frost',
      'door-seal-issue': 'Door Seal Issue',
      'fan-not-working': 'Fan Not Working',
      'temperature-fluctuation': 'Temperature Fluctuation',
      'defrost-issue': 'Defrost Issue',
      'no-ice-production': 'No Ice Production',
      'poor-ice-quality': 'Poor Ice Quality',
      'water-leak': 'Water Leak',
      'machine-not-cycling': 'Machine Not Cycling',
      'water-quality-issue': 'Water Quality Issue'
    };
    return names[issueId] || issueId;
  };

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
                <h1 className="text-2xl font-bold text-white">{getUnitTypeName(unitType)} - {getIssueName(issueId)}</h1>
                <p className="text-sm text-gray-400">Service Call Checklist</p>
              </div>
            </div>
          </div>

          {/* Section Navigation - Scrollable */}
          <div className="relative">
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
                {/* Timeline background line */}
                <div className="absolute top-5 h-0.5 bg-gray-600 z-0" style={{
                  left: '10px',
                  width: `${timelineWidth}px`
                }}></div>

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
                    : section.title === 'Safety / Prep' || section.title === 'Final Test & Notes'
                    ? (readings.boxTemp.trim() !== '' || readings.setpoint.trim() !== '') && section.items.every(item => item.status && item.status !== 'unchecked')
                    : section.items.every(item => item.status && item.status !== 'unchecked');

                  const getDescriptor = (title: string) => {
                    const descriptors: Record<string, string> = {
                      'Safety / Prep': 'Safety',
                      'Airflow / Fans': 'Airflow',
                      'Defrost / Drain': 'Defrost',
                      'Door / Infiltration': 'Door',
                      'Final Test & Notes': 'Final',
                      'Initial Diagnosis': 'Diagnosis',
                      'System Check': 'System',
                      'Repair Actions': 'Repair',
                      'Testing & Verification': 'Testing',
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
            {/* Special rendering for sections with numeric fields */}
            {currentSectionData.title === 'Safety / Prep' ? (
              <>
                {/* Box temp and setpoint inputs for Safety / Prep */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div>
                    <label className="block text-sm text-gray-300 mb-2">Box temp (°F)</label>
                    <input
                      type="number"
                      value={readings.boxTemp}
                      onChange={(e) => setReadings({ ...readings, boxTemp: e.target.value })}
                      placeholder="Enter temperature"
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-300 mb-2">Setpoint (°F)</label>
                    <input
                      type="number"
                      value={readings.setpoint}
                      onChange={(e) => setReadings({ ...readings, setpoint: e.target.value })}
                      placeholder="Enter setpoint"
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                {/* Normal checklist items */}
                <div className="space-y-3">
                  {currentSectionData.items.map((item) => (
                    <div key={item.id} className="border-b border-gray-700 pb-3 last:border-b-0">
                      <div className="flex items-start space-x-3">
                        <button
                          onClick={() => toggleItem(currentSectionData.id, item.id)}
                          className={`flex-shrink-0 px-3 py-2 rounded-lg flex items-center justify-center transition-colors font-bold text-xs border-2 ${
                            item.status === 'green'
                              ? 'bg-green-600 border-green-500 text-white'
                              : item.status === 'yellow'
                              ? 'bg-yellow-600 border-yellow-500 text-white'
                              : item.status === 'red'
                              ? 'bg-red-600 border-red-500 text-white'
                              : item.status === 'na'
                              ? 'bg-gray-500 border-gray-400 text-gray-200'
                              : 'bg-gray-700 border-gray-600 text-gray-400'
                          }`}
                        >
                          {item.status === 'green' && 'Good'}
                          {item.status === 'yellow' && 'Ok'}
                          {item.status === 'red' && 'Bad'}
                          {item.status === 'na' && 'N/A'}
                          {!item.status && '○'}
                        </button>
                        <div className="flex-1">
                          <label
                            className="text-gray-200 cursor-pointer block"
                            onClick={() => toggleItem(currentSectionData.id, item.id)}
                          >
                            {item.text}
                          </label>
                          {item.status && (
                            <div className="mt-2 space-y-3">
                              <textarea
                                value={item.notes || ''}
                                onChange={(e) => updateNotes(currentSectionData.id, item.id, e.target.value)}
                                placeholder="Add notes..."
                                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none"
                                rows={2}
                              />
                              
                              {/* Image Upload Section */}
                              <div className="space-y-2">
                                <div className="flex items-center space-x-2">
                                  <label className="text-xs text-gray-400">Attach Photos:</label>
                                  <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => handleImageUpload(currentSectionData.id, item.id, e)}
                                    className="hidden"
                                    id={`image-upload-${item.id}`}
                                  />
                                  <label
                                    htmlFor={`image-upload-${item.id}`}
                                    className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded cursor-pointer transition-colors"
                                  >
                                    + Add Photo
                                  </label>
                                </div>
                                
                                {/* Display uploaded images */}
                                {item.images && item.images.length > 0 && (
                                  <div className="flex flex-wrap gap-2">
                                    {item.images.map((image, index) => (
                                      <div key={index} className="relative group">
                                        <img
                                          src={image}
                                          alt={`Attachment ${index + 1}`}
                                          className="w-20 h-20 object-cover rounded border border-gray-600"
                                        />
                                        <button
                                          onClick={() => removeImage(currentSectionData.id, item.id, index)}
                                          className="absolute -top-1 -right-1 w-5 h-5 bg-red-600 hover:bg-red-700 text-white rounded-full flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                                          title="Remove image"
                                        >
                                          ×
                                        </button>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : currentSectionData.title === 'Final Test & Notes' ? (
              <>
                {/* Box temp and setpoint inputs for Final Test & Notes */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div>
                    <label className="block text-sm text-gray-300 mb-2">Box temp (°F)</label>
                    <input
                      type="number"
                      value={readings.boxTemp}
                      onChange={(e) => setReadings({ ...readings, boxTemp: e.target.value })}
                      placeholder="Enter temperature"
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-300 mb-2">Setpoint (°F)</label>
                    <input
                      type="number"
                      value={readings.setpoint}
                      onChange={(e) => setReadings({ ...readings, setpoint: e.target.value })}
                      placeholder="Enter setpoint"
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                {/* Normal checklist items */}
                <div className="space-y-3">
                  {currentSectionData.items.map((item) => (
                    <div key={item.id} className="border-b border-gray-700 pb-3 last:border-b-0">
                      <div className="flex items-start space-x-3">
                        <button
                          onClick={() => toggleItem(currentSectionData.id, item.id)}
                          className={`flex-shrink-0 px-3 py-2 rounded-lg flex items-center justify-center transition-colors font-bold text-xs border-2 ${
                            item.status === 'green'
                              ? 'bg-green-600 border-green-500 text-white'
                              : item.status === 'yellow'
                              ? 'bg-yellow-600 border-yellow-500 text-white'
                              : item.status === 'red'
                              ? 'bg-red-600 border-red-500 text-white'
                              : item.status === 'na'
                              ? 'bg-gray-500 border-gray-400 text-gray-200'
                              : 'bg-gray-700 border-gray-600 text-gray-400'
                          }`}
                        >
                          {item.status === 'green' && 'Good'}
                          {item.status === 'yellow' && 'Ok'}
                          {item.status === 'red' && 'Bad'}
                          {item.status === 'na' && 'N/A'}
                          {!item.status && '○'}
                        </button>
                        <div className="flex-1">
                          <label
                            className="text-gray-200 cursor-pointer block"
                            onClick={() => toggleItem(currentSectionData.id, item.id)}
                          >
                            {item.text}
                          </label>
                          {item.status && (
                            <div className="mt-2 space-y-3">
                              <textarea
                                value={item.notes || ''}
                                onChange={(e) => updateNotes(currentSectionData.id, item.id, e.target.value)}
                                placeholder="Add notes..."
                                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none"
                                rows={2}
                              />
                              
                              {/* Image Upload Section */}
                              <div className="space-y-2">
                                <div className="flex items-center space-x-2">
                                  <label className="text-xs text-gray-400">Attach Photos:</label>
                                  <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => handleImageUpload(currentSectionData.id, item.id, e)}
                                    className="hidden"
                                    id={`image-upload-${item.id}`}
                                  />
                                  <label
                                    htmlFor={`image-upload-${item.id}`}
                                    className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded cursor-pointer transition-colors"
                                  >
                                    + Add Photo
                                  </label>
                                </div>
                                
                                {/* Display uploaded images */}
                                {item.images && item.images.length > 0 && (
                                  <div className="flex flex-wrap gap-2">
                                    {item.images.map((image, index) => (
                                      <div key={index} className="relative group">
                                        <img
                                          src={image}
                                          alt={`Attachment ${index + 1}`}
                                          className="w-20 h-20 object-cover rounded border border-gray-600"
                                        />
                                        <button
                                          onClick={() => removeImage(currentSectionData.id, item.id, index)}
                                          className="absolute -top-1 -right-1 w-5 h-5 bg-red-600 hover:bg-red-700 text-white rounded-full flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                                          title="Remove image"
                                        >
                                          ×
                                        </button>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : currentSectionData.title === 'Notes & Recommended Repairs' ? (
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
                        className={`flex-shrink-0 px-3 py-2 rounded-lg flex items-center justify-center transition-colors font-bold text-xs border-2 ${
                          item.status === 'green'
                            ? 'bg-green-600 border-green-500 text-white'
                            : item.status === 'yellow'
                            ? 'bg-yellow-600 border-yellow-500 text-white'
                            : item.status === 'red'
                            ? 'bg-red-600 border-red-500 text-white'
                            : item.status === 'na'
                            ? 'bg-gray-500 border-gray-400 text-gray-200'
                            : 'bg-gray-700 border-gray-600 text-gray-400'
                        }`}
                      >
                        {item.status === 'green' && 'Good'}
                        {item.status === 'yellow' && 'Ok'}
                        {item.status === 'red' && 'Bad'}
                        {item.status === 'na' && 'N/A'}
                        {!item.status && '○'}
                      </button>
                      <div className="flex-1">
                        <label
                          className="text-gray-200 cursor-pointer block"
                          onClick={() => toggleItem(currentSectionData.id, item.id)}
                        >
                          {item.text}
                        </label>
                        {item.status && (
                          <div className="mt-2 space-y-3">
                            <textarea
                              value={item.notes || ''}
                              onChange={(e) => updateNotes(currentSectionData.id, item.id, e.target.value)}
                              placeholder="Add notes..."
                              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none"
                              rows={2}
                            />
                            
                            {/* Image Upload Section */}
                            <div className="space-y-2">
                              <div className="flex items-center space-x-2">
                                <label className="text-xs text-gray-400">Attach Photos:</label>
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={(e) => handleImageUpload(currentSectionData.id, item.id, e)}
                                  className="hidden"
                                  id={`image-upload-${item.id}`}
                                />
                                <label
                                  htmlFor={`image-upload-${item.id}`}
                                  className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded cursor-pointer transition-colors"
                                >
                                  + Add Photo
                                </label>
                              </div>
                              
                              {/* Display uploaded images */}
                              {item.images && item.images.length > 0 && (
                                <div className="flex flex-wrap gap-2">
                                  {item.images.map((image, index) => (
                                    <div key={index} className="relative group">
                                      <img
                                        src={image}
                                        alt={`Attachment ${index + 1}`}
                                        className="w-20 h-20 object-cover rounded border border-gray-600"
                                      />
                                      <button
                                        onClick={() => removeImage(currentSectionData.id, item.id, index)}
                                        className="absolute -top-1 -right-1 w-5 h-5 bg-red-600 hover:bg-red-700 text-white rounded-full flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                                        title="Remove image"
                                      >
                                        ×
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
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
                if (checklist) {
                  const dataToSave = {
                    sections: checklist.sections,
                    readings: readings
                  };
                  localStorage.setItem(`service-checklist-${unitType}-${issueId}`, JSON.stringify(dataToSave));
                }
                router.back();
              }}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
            >
              Save & Return
            </button>

            {/* Next Button */}
            <button
              onClick={goToNextSection}
              disabled={!checklist || currentSection === checklist.sections.length}
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
