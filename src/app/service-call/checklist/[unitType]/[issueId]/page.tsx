'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import HypothesisPopup from '@/components/HypothesisPopup';
import { generateHypotheses, type DiagnosticContext, type Hypothesis } from '@/app/service-call/checklist/rules';

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
    options?: string[];
    selectedOption?: string;
    selectedOptions?: string[]; // For multiple selections
    numericInputs?: { label: string; value: string; placeholder?: string; unit?: string }[];
    numericValue?: string;
    unit?: string;
    refrigerantType?: string;
    pressureValidation?: {
      suction: string;
      discharge: string;
    };
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

// Specific checklist for Ice / Frost Build Up
const walkInIceFrostBuildUpChecklist: ChecklistItem[] = [
  {
    id: '1',
    title: 'box check',
    items: [
      {
        id: '1-1',
        text: 'Where is the ice buildup?',
        checked: false,
        options: ['door', 'evap fans', 'walls near piping', 'product', 'other'],
        selectedOptions: []
      },
      {
        id: '1-2',
        text: 'What is the box temperature?',
        checked: false,
        options: ['around setpoint', '10+ above setpoint', '10+ below setpoint'],
        selectedOptions: []
      },
      {
        id: '1-8',
        text: 'Is there any product blocking airflow?',
        checked: false,
        options: ['clear airflow', 'partially blocked', 'overloaded'],
        selectedOptions: []
      },
      {
        id: '1-3',
        text: 'Are all evaporator fans running?',
        checked: false,
        options: ['yes', 'no', 'unsure'],
        selectedOptions: []
      },
      {
        id: '1-4',
        text: 'Is coil area visibly iced over?',
        checked: false,
        options: ['clear', 'light frost', 'heavy ice'],
        selectedOptions: []
      },
      {
        id: '1-5',
        text: 'Is there standing water or ice on floor or drain pan?',
        checked: false,
        options: ['dry', 'some water', 'ice buildup'],
        selectedOptions: []
      },
      {
        id: '1-6',
        text: 'Is the door sealing properly?',
        checked: false,
        options: ['fully sealed', 'partially sealed', 'held open'],
        selectedOptions: []
      },
      {
        id: '1-7',
        text: 'Are the door frame heaters and/or window heaters operating properly?',
        checked: false,
        options: ['warm to touch (normal)', 'cold to touch (not heating)', 'not sure / no frame heaters present'],
        selectedOptions: []
      },
      {
        id: '1-10',
        text: '[Optional] Upload overall box photos',
        checked: false
      }
    ],
  },
  {
    id: '2',
    title: 'Condenser check',
    items: [
      {
        id: '2-1',
        text: 'Is the condenser fan running?',
        checked: false,
        options: ['Yes', 'No', 'Intermittent'],
        selectedOptions: []
      },
      {
        id: '2-2',
        text: 'Is the compressor running or attempting to start?',
        checked: false,
        options: ['Yes', 'No', 'Short-cycling'],
        selectedOptions: []
      },
      {
        id: '2-3',
        text: 'Any unusual noises, vibration, or burnt smell at the unit?',
        checked: false,
        options: ['None', 'Noise', 'Vibration', 'Burnt smell'],
        selectedOptions: []
      },
      {
        id: '2-4',
        text: 'Are condenser coils visibly dirty or restricted?',
        checked: false,
        options: ['Clean', 'Moderate debris', 'Heavily clogged'],
        selectedOptions: []
      },
      {
        id: '2-5',
        text: 'Record suction and discharge pressures (if gauges available)',
        checked: false,
        numericInputs: [
          { label: 'Suction', value: '', placeholder: 'Enter pressure', unit: 'psig' },
          { label: 'Discharge', value: '', placeholder: 'Enter pressure', unit: 'psig' }
        ],
        refrigerantType: '',
        pressureValidation: {
          suction: '',
          discharge: ''
        }
      },
      {
        id: '2-6',
        text: 'Record ambient air temperature near condenser',
        checked: false,
        numericValue: '',
        unit: '°F'
      }
    ],
  },
  {
    id: '3',
    title: 'Defrost diagnostics',
    items: [
      { id: '3-1', text: 'Check defrost timer/control operation', checked: false },
      { id: '3-2', text: 'Verify defrost heaters energize during defrost', checked: false },
      { id: '3-3', text: 'Inspect termination/defrost sensors', checked: false }
    ],
  },
  {
    id: '4',
    title: 'Door / infiltration checks',
    items: [
      { id: '4-1', text: 'Inspect frame/window heaters for power and warmth', checked: false },
      { id: '4-2', text: 'Check door alignment and gasket seal', checked: false },
      { id: '4-3', text: 'Look for frost trails at penetrations', checked: false }
    ],
  },
  {
    id: '5',
    title: 'Evaporator fan checks',
    items: [
      { id: '5-1', text: 'Verify all fans powered and spinning freely', checked: false },
      { id: '5-2', text: 'Clear ice from blades/guards if present', checked: false },
      { id: '5-3', text: 'Check fan interlocks/door switches', checked: false }
    ],
  },
  {
    id: '6',
    title: 'Condenser airflow checks',
    items: [
      { id: '6-1', text: 'Clean condenser coil and verify airflow path', checked: false },
      { id: '6-2', text: 'Verify condenser fan operation and rotation', checked: false },
      { id: '6-3', text: 'Check for obstructions/recirculation', checked: false }
    ],
  },
  {
    id: '8',
    title: 'Evap drain tracing',
    items: [
      { id: '8-1', text: 'Open evaporator compartment access panels', checked: false },
      { id: '8-2', text: 'Pour warm water over iced areas in evaporator case', checked: false },
      { id: '8-3', text: 'Trace melt path and follow water flow toward drain', checked: false },
      { id: '8-4', text: 'Did you find a fault?', checked: false, options: ['yes', 'no'], selectedOptions: [] },
      { id: '8-5', text: 'Describe fault found (optional)', checked: false },
    ],
  },
  {
    id: '9',
    title: 'Suction line humidity checks',
    items: [
      { id: '9-1', text: 'Inspect suction line insulation for gaps/tears', checked: false },
      { id: '9-2', text: 'Look for moisture sources near suction line', checked: false },
      { id: '9-3', text: 'Seal/repair insulation as needed', checked: false },
    ],
  },
  {
    id: '7',
    title: 'General diagnostics',
    items: [
      { id: '7-1', text: 'Perform broad system checks as needed', checked: false },
      { id: '7-2', text: 'Document observations and plan', checked: false }
    ],
  },
  {
    id: '10',
    title: 'Wrap up',
    items: [
      { id: '10-1', text: 'Restore power and disconnects', checked: false },
      { id: '10-2', text: 'Verify all ice melted and area dried', checked: false },
      { id: '10-3', text: 'Reinstall panels/guards and clean workspace', checked: false },
      { id: '10-4', text: 'Confirm unit trending to setpoint', checked: false }
    ],
  },
];

// Helper function to generate service call checklist data
function getServiceCallChecklist(unitType: string, issueId: string): ServiceCallChecklist {
  // Return specific checklist based on unit type and issue combination
  if (unitType === 'walkIn' && issueId === 'ice-frost-build-up') {
    return {
      unitType,
      issueType: issueId,
      sections: walkInIceFrostBuildUpChecklist,
    };
  }
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
  const [hypothesesOpen, setHypothesesOpen] = useState(false);
  const [hypotheses, setHypotheses] = useState<Hypothesis[]>([]);
  const [chosenPathTitle, setChosenPathTitle] = useState<string | null>(null);
  const [wrapUpNotes, setWrapUpNotes] = useState<string>('');
  const [chosenWrapUp, setChosenWrapUp] = useState<boolean>(false);
  const [customIssueDescription, setCustomIssueDescription] = useState<string>('');
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
      const newChecklist = getServiceCallChecklist(resolved.unitType, resolved.issueId);
      setChecklist(newChecklist);
      
      // For ice-frost-build-up, check if old localStorage data exists and clear it if structure is different
      if (resolved.unitType === 'walkIn' && resolved.issueId === 'ice-frost-build-up') {
        const savedData = localStorage.getItem(`service-checklist-${resolved.unitType}-${resolved.issueId}`);
        if (savedData) {
          try {
            const parsed = JSON.parse(savedData);
            // Check if first section is "box check" - if not, clear old data from prior structure
            if (!parsed.sections || !parsed.sections[0] || parsed.sections[0].title !== 'box check') {
              localStorage.removeItem(`service-checklist-${resolved.unitType}-${resolved.issueId}`);
            }
          } catch (e) {
            // Clear corrupted data
            localStorage.removeItem(`service-checklist-${resolved.unitType}-${resolved.issueId}`);
          }
        }
      }
      
      // Clear any old data for ice-frost-build-up to ensure clean state
      if (resolved.unitType === 'walkIn' && resolved.issueId === 'ice-frost-build-up') {
        localStorage.removeItem(`service-checklist-${resolved.unitType}-${resolved.issueId}`);
      }
      
      // Load custom issue description if it's a custom issue
      if (resolved.issueId === 'custom-issue') {
        const customDesc = localStorage.getItem(`service-issue-${resolved.unitType}-custom-issue`);
        if (customDesc) {
          setCustomIssueDescription(customDesc);
        }
      }
    });
  }, [params]);

  // Load saved progress from localStorage on mount (only once when checklist is first set)
  const hasMergedFromStorageRef = useRef(false);

  useEffect(() => {
    if (!unitType || !issueId || !checklist) return;
    // Only merge once per mount
    if (hasMergedFromStorageRef.current) return;
    const savedData = localStorage.getItem(`service-checklist-${unitType}-${issueId}`);
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        // Merge saved item states into current checklist structure instead of replacing
        if (parsed.sections && checklist.sections) {
          // Check if saved structure matches current structure (same number of sections and titles)
          const structureMatches = parsed.sections.length === checklist.sections.length &&
            parsed.sections.every((s: ChecklistItem, idx: number) => 
              s.id === checklist.sections[idx]?.id && s.title === checklist.sections[idx]?.title
            );
          
          if (structureMatches) {
            setChecklist(prev => {
              if (!prev) return prev;
              const mergedSections = prev.sections.map((section, sectionIdx) => {
                const savedSection = parsed.sections[sectionIdx];
                if (savedSection) {
                  return {
                    ...section,
                    items: section.items.map(item => {
                      const savedItem = savedSection.items.find((i: any) => i.id === item.id);
                      if (savedItem) {
                        // Merge saved state: selectedOption, selectedOptions, notes, images, status, checked, numericValue, numericInputs, refrigerantType, pressureValidation
                        // For pressure recording item, clear any old options
                        const cleanedItem = item.id === '2-5' 
                          ? { ...item, options: undefined, selectedOption: undefined, selectedOptions: undefined }
                          : item;
                        
                        return {
                          ...cleanedItem,
                          selectedOption: item.id === '2-5' ? undefined : savedItem.selectedOption,
                          selectedOptions: item.id === '2-5' ? undefined : savedItem.selectedOptions,
                          notes: savedItem.notes,
                          images: savedItem.images,
                          status: savedItem.status,
                          numericValue: savedItem.numericValue,
                          numericInputs: savedItem.numericInputs || item.numericInputs,
                          refrigerantType: savedItem.refrigerantType,
                          pressureValidation: savedItem.pressureValidation,
                          checked: savedItem.checked !== undefined ? savedItem.checked : item.checked
                        };
                      }
                      return item;
                    })
                  };
                }
                return section;
              });
              return {
                ...prev,
                sections: mergedSections
              };
            });
          }
          // If structure doesn't match, ignore saved data and use fresh structure
          // Clear old localStorage data if structure doesn't match
          else {
            localStorage.removeItem(`service-checklist-${unitType}-${issueId}`);
          }
        }
        if (parsed.readings) {
          setReadings(parsed.readings);
        }
      } catch (error) {
        console.error('Error loading saved progress:', error);
        // Clear corrupted data
        localStorage.removeItem(`service-checklist-${unitType}-${issueId}`);
      }
    }
    // Mark as merged to avoid re-merging repeatedly during this mount
    hasMergedFromStorageRef.current = true;
  }, [unitType, issueId, checklist]); // Wait for checklist to be set before merging

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

  const setItemChecked = (sectionId: string, itemId: string, isChecked: boolean) => {
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
                    ? { ...item, checked: isChecked, status: isChecked ? (item.status ?? 'green') : undefined }
                    : item
                )
              }
            : section
        )
      };
    });
  };

  const updateSelectedOption = (sectionId: string, itemId: string, option: string) => {
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
                    // Support both single and multiple selections
                    // If selectedOption exists (single), convert to array and use that
                    // Otherwise use selectedOptions array
                    const currentSelections = item.selectedOptions || (item.selectedOption ? [item.selectedOption] : []);
                    const isSelected = currentSelections.includes(option);
                    
                    // Toggle: if selected, remove it; if not selected, add it
                    const newSelectedOptions = isSelected
                      ? currentSelections.filter(opt => opt !== option)
                      : [...currentSelections, option];
                    
                    return {
                      ...item,
                      selectedOptions: newSelectedOptions,
                      selectedOption: newSelectedOptions.length === 1 ? newSelectedOptions[0] : undefined, // Keep single for backward compat
                      checked: newSelectedOptions.length > 0
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

  const updateNumericValue = (sectionId: string, itemId: string, value: string) => {
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
                        numericValue: value,
                        checked: value.trim() !== ''
                      }
                    : item
                )
              }
            : section
        )
      };
    });
  };

  const updateNumericInputs = (sectionId: string, itemId: string, inputIndex: number, value: string) => {
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
                    const newInputs = item.numericInputs?.map((input, idx) =>
                      idx === inputIndex ? { ...input, value } : input
                    );
                    
                    // Auto-validate pressures if this is the pressure recording item
                    let newPressureValidation = item.pressureValidation || { suction: '', discharge: '' };
                    if (item.id === '2-5' && item.refrigerantType && newInputs && newInputs.length >= 2) {
                      newPressureValidation = validatePressures(item.refrigerantType, newInputs[0]?.value || '', newInputs[1]?.value || '');
                    }
                    
                    return {
                      ...item,
                      numericInputs: newInputs,
                      pressureValidation: newPressureValidation,
                      checked: newInputs?.some((input, idx) => 
                        idx === inputIndex ? value.trim() !== '' : input.value.trim() !== ''
                      ) || false
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

  const updateRefrigerantType = (sectionId: string, itemId: string, refrigerantType: string) => {
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
                    // Auto-validate pressures when refrigerant type changes
                    let newPressureValidation = item.pressureValidation || { suction: '', discharge: '' };
                    if (item.numericInputs && item.numericInputs.length >= 2) {
                      newPressureValidation = validatePressures(refrigerantType, item.numericInputs[0]?.value || '', item.numericInputs[1]?.value || '');
                    }
                    
                    return {
                      ...item,
                      refrigerantType,
                      pressureValidation: newPressureValidation
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

  // Pressure validation function based on the provided table
  const validatePressures = (refrigerantType: string, suctionValue: string, dischargeValue: string) => {
    const suction = parseFloat(suctionValue);
    const discharge = parseFloat(dischargeValue);
    
    if (!refrigerantType || isNaN(suction) || isNaN(discharge)) {
      return { suction: '', discharge: '' };
    }

    // Pressure ranges based on the table (assuming walk-in cooler at ~35°F)
    const pressureRanges: Record<string, { suction: [number, number], discharge: [number, number] }> = {
      'R-404A': { suction: [30, 40], discharge: [220, 260] },
      'R-448A/R-449A': { suction: [28, 38], discharge: [200, 250] },
      'R-134a': { suction: [18, 28], discharge: [120, 160] }
    };

    const range = pressureRanges[refrigerantType];
    if (!range) return { suction: '', discharge: '' };

    const getValidation = (value: number, [min, max]: [number, number]) => {
      if (value < min) return 'seems low';
      if (value > max) return 'seems high';
      return 'seems normal';
    };

    return {
      suction: getValidation(suction, range.suction),
      discharge: getValidation(discharge, range.discharge)
    };
  };

  const handleImageUpload = (sectionId: string, itemId: string, event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || !checklist || files.length === 0) return;

    const fileArray = Array.from(files);
    const validFiles: File[] = [];
    const invalidFiles: string[] = [];

    // Validate all files
    fileArray.forEach(file => {
      if (file.size > 5 * 1024 * 1024) {
        invalidFiles.push(`${file.name} (file too large)`);
      } else if (!file.type.startsWith('image/')) {
        invalidFiles.push(`${file.name} (not an image)`);
      } else {
        validFiles.push(file);
      }
    });

    if (invalidFiles.length > 0) {
      alert(`Some files were rejected:\n${invalidFiles.join('\n')}`);
    }

    if (validFiles.length === 0) return;

    // Read all valid files
    const readers = validFiles.map(file => {
      return new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          resolve(e.target?.result as string);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    });

    Promise.all(readers).then(base64Strings => {
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
                          images: [...(item.images || []), ...base64Strings] 
                        } 
                      : item
                  )
                }
              : section
          )
        };
      });
    });
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

  const sectionIdByKey: Record<string, string> = {
    defrostDiagnostics: 'Defrost diagnostics',
    doorInfiltrationChecks: 'Door / infiltration checks',
    evapFanChecks: 'Evaporator fan checks',
    condenserAirflowChecks: 'Condenser airflow checks',
    generalDiagnostics: 'General diagnostics',
    evapDrainTracingDemo: 'Evap drain tracing',
    suctionLineHumidityChecks: 'Suction line humidity checks'
  };

  const navigateToNextSectionId = (nextSectionId: string) => {
    if (!checklist) return;
    const title = sectionIdByKey[nextSectionId];
    if (!title) return;
    setChosenPathTitle(title);
    const index = checklist.sections.findIndex(s => s.title === title);
    if (index >= 0) {
      setCurrentSection(index + 1);
    }
  };

  const buildDiagnosticContext = (): DiagnosticContext | null => {
    if (!checklist) return null;
    // Section 1 (box check)
    const s1 = checklist.sections[0];
    const getSel = (id: string) => s1.items.find(i => i.id === id);
    const visual = {
      iceLocation: getSel('1-1')?.selectedOptions?.[0] || getSel('1-1')?.selectedOption,
      boxTempBand: getSel('1-2')?.selectedOptions?.[0] || getSel('1-2')?.selectedOption,
      allEvapFansRunning: getSel('1-3')?.selectedOptions?.[0] || getSel('1-3')?.selectedOption,
      coilIced: getSel('1-4')?.selectedOptions?.[0] || getSel('1-4')?.selectedOption,
      standingWater: getSel('1-5')?.selectedOptions?.[0] || getSel('1-5')?.selectedOption,
      doorSeal: getSel('1-6')?.selectedOptions?.[0] || getSel('1-6')?.selectedOption,
      frameHeaterStatus: getSel('1-7')?.selectedOptions?.[0] || getSel('1-7')?.selectedOption,
    };
    // Section 2 (Condenser)
    const s2 = checklist.sections[1];
    const suctionStr = s2.items.find(i => i.id === '2-5')?.numericInputs?.[0]?.value || '';
    const dischargeStr = s2.items.find(i => i.id === '2-5')?.numericInputs?.[1]?.value || '';
    const refrigerant = s2.items.find(i => i.id === '2-5')?.refrigerantType;
    const condenser = {
      suctionPsig: suctionStr ? parseFloat(suctionStr) : undefined,
      dischargePsig: dischargeStr ? parseFloat(dischargeStr) : undefined,
      condenserFan: s2.items.find(i => i.id === '2-1')?.selectedOptions?.[0] || s2.items.find(i => i.id === '2-1')?.selectedOption,
      compressor: s2.items.find(i => i.id === '2-2')?.selectedOptions?.[0] || s2.items.find(i => i.id === '2-2')?.selectedOption,
      noises: s2.items.find(i => i.id === '2-3')?.selectedOptions?.[0] || s2.items.find(i => i.id === '2-3')?.selectedOption,
      coilDirty: s2.items.find(i => i.id === '2-4')?.selectedOptions?.[0] || s2.items.find(i => i.id === '2-4')?.selectedOption,
      refrigerant
    };
    return { visual, condenser };
  };

  const goToNextSection = () => {
    if (!checklist) return;
    // After Section 2, run hypothesis selection
    if (currentSection === 2) {
      // DEMO: hard-coded suggestions
      const list: Hypothesis[] = [
        { id: 'demo-evap-drain', label: 'Trace icing near evap for drain issues', reason: 'Demo suggested next step', confidence: 0.95, nextSectionId: 'evapDrainTracingDemo' },
        { id: 'demo-defrost', label: 'Check defrost operation', reason: 'Demo suggested next step', confidence: 0.9, nextSectionId: 'defrostDiagnostics' },
        { id: 'demo-humidity', label: 'Check for excess humidity sources near suction line', reason: 'Demo suggested next step', confidence: 0.85, nextSectionId: 'suctionLineHumidityChecks' },
      ];
      // Auto navigate only if exactly one with >= 0.9 (not the case here since we have 2) else popup
      const strong = list.filter(h => h.confidence >= 0.9);
      if (strong.length === 1) {
        navigateToNextSectionId(strong[0].nextSectionId);
        return;
      }
      setHypotheses(list);
      setHypothesesOpen(true);
      return;
    }
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
  const displayCurrentSectionNumber = () => {
    if (!checklist) return currentSection;
    if (chosenPathTitle) {
      const chosenIdx = checklist.sections.findIndex(s => s.title === chosenPathTitle);
      if (currentSection === chosenIdx + 1) return 3;
      if (chosenWrapUp) {
        const wrapIdx = checklist.sections.findIndex(s => s.title === 'Wrap up');
        if (currentSection === wrapIdx + 1) return 4;
      }
    }
    return currentSection;
  };

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
    // If it's a custom issue, return the custom description
    if (issueId === 'custom-issue' && customIssueDescription) {
      return customIssueDescription;
    }

    const names: Record<string, string> = {
      'no-heat': 'No Heat',
      'no-cooling': 'No Cooling',
      'poor-airflow': 'Poor Airflow',
      'noisy-operation': 'Noisy Operation',
      'short-cycling': 'Short Cycling',
      'high-energy-usage': 'High Energy Usage',
      'not-cooling': 'Not Cooling',
      'excessive-frost': 'Excessive Frost',
      'ice-frost-build-up': 'Ice / Frost Build Up',
      'running-warm': 'Running Warm',
      'water-leaking': 'Water Leaking',
      'box-too-cold': 'Box Too Cold',
      'door-seal-issue': 'Door Seal Issue',
      'fan-not-working': 'Fan Not Working',
      'temperature-fluctuation': 'Temperature Fluctuation',
      'defrost-issue': 'Defrost Issue',
      'no-ice-production': 'No Ice Production',
      'poor-ice-quality': 'Poor Ice Quality',
      'water-leak': 'Water Leak',
      'machine-not-cycling': 'Machine Not Cycling',
      'water-quality-issue': 'Water Quality Issue',
      'custom-issue': 'Custom Issue'
    };
    return names[issueId] || issueId;
  };

  return (
    <div className="min-h-screen bg-gray-900">
      <HypothesisPopup
        open={hypothesesOpen}
        hypotheses={hypotheses}
        onClose={() => setHypothesesOpen(false)}
        onChoose={(h) => {
          setHypothesesOpen(false);
          navigateToNextSectionId(h.nextSectionId);
        }}
      />
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
                  style={{ paddingLeft: '10px', paddingRight: '10px', gap: '24px' }}
                >
                  {(!chosenPathTitle && !chosenWrapUp) ? (
                    <>
                      {[0,1].map((idx) => {
                        const section = checklist.sections[idx];
                        const sectionNumber = idx + 1;
                        const isActive = sectionNumber === currentSection;
                        const isCompleted = section.items.every(item => {
                          if (item.text.toLowerCase().includes('optional') && item.text.toLowerCase().includes('photo')) return true;
                          if (item.numericInputs && item.numericInputs.length > 0) {
                            if (item.id === '2-5') {
                              return item.numericInputs.some(input => input.value.trim() !== '') && section.items.find(i=>i.id==='2-5')?.refrigerantType && section.items.find(i=>i.id==='2-5')?.refrigerantType!.trim() !== '';
                            }
                            return item.numericInputs.some(input => input.value.trim() !== '');
                          }
                          if (item.numericValue !== undefined) return item.numericValue.trim() !== '';
                          if (item.options) return (item.selectedOptions && item.selectedOptions.length > 0) || (item.selectedOption && item.selectedOption.trim() !== '');
                          return item.status && item.status !== 'unchecked';
                        });
                        const getDescriptor = (title: string) => ({ 'box check': 'Box', 'Condenser check': 'Condenser', 'Safety / Prep': 'Safety' } as Record<string,string>)[title] || 'Step';
                        return (
                          <div key={sectionNumber} className="flex flex-col items-center space-y-1" style={{ minWidth: '50px', flexShrink: 0 }}>
                            <button onClick={() => goToSection(sectionNumber)} className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-colors ${isActive ? 'bg-blue-600 text-white' : isCompleted ? 'bg-green-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}>{sectionNumber}</button>
                            <span className="text-xs text-gray-400 text-center whitespace-nowrap">{getDescriptor(section.title)}</span>
                          </div>
                        );
                      })}
                      <div className="flex flex-col items-center space-y-1" style={{ minWidth: '50px', flexShrink: 0 }}>
                        <div className="relative z-10 w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm bg-gray-700 text-gray-300">→</div>
                        <span className="text-xs text-gray-400 text-center whitespace-nowrap">Specific troubleshooting based on diag inputs</span>
                      </div>
                    </>
                  ) : (!chosenWrapUp) ? (
                    <>
                      {[0,1].map((idx) => {
                        const section = checklist.sections[idx];
                        const sectionNumber = idx + 1;
                        const isActive = sectionNumber === currentSection;
                        const isCompleted = section.items.every(item => {
                          if (item.numericInputs && item.numericInputs.length > 0) {
                            if (item.id === '2-5') {
                              return item.numericInputs.some(input => input.value.trim() !== '') && section.items.find(i=>i.id==='2-5')?.refrigerantType && section.items.find(i=>i.id==='2-5')?.refrigerantType!.trim() !== '';
                            }
                            return item.numericInputs.some(input => input.value.trim() !== '');
                          }
                          if (item.numericValue !== undefined) return item.numericValue.trim() !== '';
                          if (item.options) return (item.selectedOptions && item.selectedOptions.length > 0) || (item.selectedOption && item.selectedOption.trim() !== '');
                          return item.status && item.status !== 'unchecked';
                        });
                        const getDescriptor = (title: string) => ({ 'box check': 'Box', 'Condenser check': 'Condenser', 'Safety / Prep': 'Safety' } as Record<string,string>)[title] || 'Step';
                        return (
                          <div key={sectionNumber} className="flex flex-col items-center space-y-1" style={{ minWidth: '50px', flexShrink: 0 }}>
                            <button onClick={() => goToSection(sectionNumber)} className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-colors ${isActive ? 'bg-blue-600 text-white' : isCompleted ? 'bg-green-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}>{sectionNumber}</button>
                            <span className="text-xs text-gray-400 text-center whitespace-nowrap">{getDescriptor(section.title)}</span>
                          </div>
                        );
                      })}
                      {(() => {
                        const title = chosenPathTitle!;
                        const idx = checklist.sections.findIndex(s => s.title === title);
                        const isActive = currentSection === (idx + 1);
                        const isCompleted = idx >= 0 ? checklist.sections[idx].items.every(item => {
                          if (item.numericInputs && item.numericInputs.length > 0) return item.numericInputs.some(input => input.value.trim() !== '');
                          if (item.numericValue !== undefined) return item.numericValue.trim() !== '';
                          if (item.options) return (item.selectedOptions && item.selectedOptions.length > 0) || (item.selectedOption && item.selectedOption.trim() !== '');
                          return item.status && item.status !== 'unchecked';
                        }) : false;
                        const label = title === 'Evap drain tracing' ? 'Trace evap icing' : title;
                        return (
                          <div className="flex flex-col items-center space-y-1" style={{ minWidth: '50px', flexShrink: 0 }}>
                            <button onClick={() => idx >= 0 && setCurrentSection(idx + 1)} className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-colors ${isActive ? 'bg-blue-600 text-white' : isCompleted ? 'bg-green-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}>3</button>
                            <span className="text-xs text-gray-400 text-center whitespace-nowrap">{label}</span>
                          </div>
                        );
                      })()}
                    </>
                  ) : (
                    // With wrap up chosen: show 1,2, chosen path (3), and wrap up (4)
                    <>
                      {[0,1].map((idx) => {
                        const section = checklist.sections[idx];
                        const sectionNumber = idx + 1;
                        const isActive = sectionNumber === currentSection;
                        const isCompleted = section.items.every(item => {
                          if (item.numericInputs && item.numericInputs.length > 0) {
                            if (item.id === '2-5') {
                              return item.numericInputs.some(input => input.value.trim() !== '') && section.items.find(i=>i.id==='2-5')?.refrigerantType && section.items.find(i=>i.id==='2-5')?.refrigerantType!.trim() !== '';
                            }
                            return item.numericInputs.some(input => input.value.trim() !== '');
                          }
                          if (item.numericValue !== undefined) return item.numericValue.trim() !== '';
                          if (item.options) return (item.selectedOptions && item.selectedOptions.length > 0) || (item.selectedOption && item.selectedOption.trim() !== '');
                          return item.status && item.status !== 'unchecked';
                        });
                        const getDescriptor = (title: string) => ({ 'box check': 'Box', 'Condenser check': 'Condenser', 'Safety / Prep': 'Safety' } as Record<string,string>)[title] || 'Step';
                        return (
                          <div key={sectionNumber} className="flex flex-col items-center space-y-1" style={{ minWidth: '50px', flexShrink: 0 }}>
                            <button onClick={() => goToSection(sectionNumber)} className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-colors ${isActive ? 'bg-blue-600 text-white' : isCompleted ? 'bg-green-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}>{sectionNumber}</button>
                            <span className="text-xs text-gray-400 text-center whitespace-nowrap">{getDescriptor(section.title)}</span>
                          </div>
                        );
                      })}
                      {(() => {
                        const title = chosenPathTitle!;
                        const idx = checklist.sections.findIndex(s => s.title === title);
                        const isActive = currentSection === (idx + 1);
                        const isCompleted = idx >= 0 ? checklist.sections[idx].items.every(item => {
                          if (item.numericInputs && item.numericInputs.length > 0) return item.numericInputs.some(input => input.value.trim() !== '');
                          if (item.numericValue !== undefined) return item.numericValue.trim() !== '';
                          if (item.options) return (item.selectedOptions && item.selectedOptions.length > 0) || (item.selectedOption && item.selectedOption.trim() !== '');
                          return item.status && item.status !== 'unchecked';
                        }) : false;
                        const label = title === 'Evap drain tracing' ? 'Trace evap icing' : title;
                        return (
                          <div className="flex flex-col items-center space-y-1" style={{ minWidth: '50px', flexShrink: 0 }}>
                            <button onClick={() => idx >= 0 && setCurrentSection(idx + 1)} className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-colors ${isActive ? 'bg-blue-600 text-white' : isCompleted ? 'bg-green-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}>3</button>
                            <span className="text-xs text-gray-400 text-center whitespace-nowrap">{label}</span>
                          </div>
                        );
                      })()}
                      {(() => {
                        const idx = checklist.sections.findIndex(s => s.title === 'Wrap up');
                        const isActive = currentSection === (idx + 1);
                        const isCompleted = idx >= 0 ? checklist.sections[idx].items.every(item => !!item.status && item.status !== 'unchecked') : false;
                        return (
                          <div className="flex flex-col items-center space-y-1" style={{ minWidth: '50px', flexShrink: 0 }}>
                            <button onClick={() => idx >= 0 && setCurrentSection(idx + 1)} className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-colors ${isActive ? 'bg-blue-600 text-white' : isCompleted ? 'bg-green-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}>4</button>
                            <span className="text-xs text-gray-400 text-center whitespace-nowrap">Wrap up</span>
                          </div>
                        );
                      })()}
                    </>
                  )}
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
                {displayCurrentSectionNumber()}
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
                        {/* Only show status toggle if item doesn't have options, numericValue, or is optional photo */}
                        {(!item.options && item.numericValue === undefined && !item.text.toLowerCase().includes('optional') && item.id !== '2-5' && item.id !== '2-6') && (
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
                        )}
                        <div className="flex-1">
                          <label
                            className={`text-gray-200 block ${(!item.options && item.numericValue === undefined && !item.text.toLowerCase().includes('optional') && item.id !== '2-5' && item.id !== '2-6') ? 'cursor-pointer' : ''}`}
                            onClick={(!item.options && item.numericValue === undefined && !item.text.toLowerCase().includes('optional') && item.id !== '2-5' && item.id !== '2-6') ? () => toggleItem(currentSectionData.id, item.id) : undefined}
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
                        {/* Only show status toggle if item doesn't have options, numericValue, or is optional photo */}
                        {(!item.options && item.numericValue === undefined && !item.text.toLowerCase().includes('optional') && item.id !== '2-5' && item.id !== '2-6') && (
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
                        )}
                        <div className="flex-1">
                          <label
                            className={`text-gray-200 block ${(!item.options && item.numericValue === undefined && !item.text.toLowerCase().includes('optional')) ? 'cursor-pointer' : ''}`}
                            onClick={(!item.options && item.numericValue === undefined && !item.text.toLowerCase().includes('optional')) ? () => toggleItem(currentSectionData.id, item.id) : undefined}
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
            ) : currentSectionData.title === 'Evap drain tracing' ? (
              <>
                <div className="space-y-4">
                  {/* Steps 8-1, 8-2, 8-3 as simple checkboxes with optional comments */}
                  {currentSectionData.items.slice(0,3).map((item) => (
                    <div key={item.id} className="border-b border-gray-700 pb-4 last:border-b-0">
                      <div className="flex items-start gap-3">
                        <input
                          type="checkbox"
                          checked={!!item.checked}
                          onChange={(e) => setItemChecked(currentSectionData.id, item.id, e.target.checked)}
                          className="mt-0.5 w-5 h-5 accent-blue-600"
                        />
                        <div className="flex-1">
                          <label className="text-gray-200 block mb-2">{item.text}</label>
                          <textarea
                            value={item.notes || ''}
                            onChange={(e) => updateNotes(currentSectionData.id, item.id, e.target.value)}
                            placeholder="Optional comment..."
                            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-sm"
                            rows={2}
                          />
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* 8-4: Found fault? */}
                  {(() => {
                    const item = currentSectionData.items.find(i => i.id === '8-4');
                    if (!item) return null;
                    const isSelected = (opt: string) => item.selectedOptions?.includes(opt) || item.selectedOption === opt;
                    return (
                      <div className="border-b border-gray-700 pb-3">
                        <label className="text-gray-200 block mb-2">{item.text}</label>
                        <div className="flex flex-wrap gap-2">
                          {['yes','no'].map(opt => (
                            <button
                              key={opt}
                              onClick={() => updateSelectedOption(currentSectionData.id, item.id, opt)}
                              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                isSelected(opt) ? 'bg-green-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                              }`}
                            >
                              {opt}
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })()}

                  {/* 8-5: Describe fault found (notes) */}
                  {(() => {
                    const item = currentSectionData.items.find(i => i.id === '8-5');
                    if (!item) return null;
                    return (
                      <div>
                        <label className="block text-sm text-gray-300 mb-2">Describe fault found (optional)</label>
                        <textarea
                          value={item.notes || ''}
                          onChange={(e) => updateNotes(currentSectionData.id, item.id, e.target.value)}
                          placeholder="e.g., Crack in drain line near pan, water leaking onto coil"
                          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                          rows={4}
                        />
                      </div>
                    );
                  })()}

                  <div className="pt-2 flex gap-3">
                    <button
                      onClick={() => {
                        // Go to Wrap up; header should add it as step 4
                        const idx = checklist.sections.findIndex(s => s.title === 'Wrap up');
                        if (idx >= 0) {
                          setChosenWrapUp(true);
                          setCurrentSection(idx + 1);
                        }
                      }}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg"
                    >
                      Wrap up
                    </button>
                  </div>
                </div>
              </>
            ) : currentSectionData.title === 'Wrap up' ? (
              <>
                <div className="space-y-4">
                  {currentSectionData.items.map((item) => (
                    <div key={item.id} className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={!!item.status && item.status !== 'unchecked'}
                        onChange={() => toggleItem(currentSectionData.id, item.id)}
                        className="w-5 h-5 accent-blue-600"
                      />
                      <label className="text-gray-200">{item.text}</label>
                    </div>
                  ))}
                </div>
                <div className="mt-6 space-y-3">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => {
                        // Draft notes on demand using prior inputs and wrap-up checks
                        const s1 = checklist.sections[0];
                        const iceLoc = s1.items.find(i=>i.id==='1-1')?.selectedOptions?.[0] || s1.items.find(i=>i.id==='1-1')?.selectedOption;
                        const s2 = checklist.sections[1];
                        const suction = s2.items.find(i=>i.id==='2-5')?.numericInputs?.[0]?.value || '';
                        const discharge = s2.items.find(i=>i.id==='2-5')?.numericInputs?.[1]?.value || '';
                        const evapFault = checklist.sections.find(s=>s.title==='Evap drain tracing')?.items.find(i=>i.id==='8-5')?.notes || '';
                        const wrap = checklist.sections.find(s=>s.title==='Wrap up');
                        const done = wrap ? wrap.items.filter(i => !!i.status && i.status !== 'unchecked').map(i => i.text.toLowerCase()) : [];
                        const actions = done.length ? `Wrap-up actions: ${done.join(', ')}.` : '';
                        const summary = `Performed box and condenser checks. Observed icing near ${iceLoc || 'the evaporator'}. Traced melt path and ${evapFault ? `identified ${evapFault}` : 'addressed suspected drain restriction'}. Recorded pressures: suction ${suction || '—'} psig, discharge ${discharge || '—'} psig. ${actions}`;
                        setWrapUpNotes(summary.trim());
                      }}
                      className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm"
                    >
                      Draft my job notes
                    </button>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-300 mb-2">Job completion notes</label>
                    <textarea
                      value={wrapUpNotes}
                      onChange={(e) => setWrapUpNotes(e.target.value)}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                      rows={4}
                    />
                  </div>
                  <div className="flex justify-end">
                    <button
                      onClick={() => {
                        navigator.clipboard?.writeText(wrapUpNotes || '');
                      }}
                      className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg"
                    >
                      Copy notes
                    </button>
                  </div>
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
                            {/* Only show status toggle if item doesn't have options, numericValue, or is optional photo */}
                            {(!item.options && item.numericValue === undefined && !item.text.toLowerCase().includes('optional') && item.id !== '2-5' && item.id !== '2-6') && (
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
                             )}
                             <div className="flex-1">
                               <label className="text-gray-200 block mb-2">
                                 {item.text}
                               </label>
                               {/* Show button options if item has options */}
                               {item.options ? (
                                 <div className="flex flex-wrap gap-2 mb-3">
                                   {item.options.map((option) => {
                                     const isSelected = item.selectedOptions?.includes(option) || item.selectedOption === option;
                                     return (
                                       <button
                                         key={option}
                                         onClick={() => updateSelectedOption(currentSectionData.id, item.id, option)}
                                         className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                           isSelected
                                             ? 'bg-green-600 text-white'
                                             : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                         }`}
                                       >
                                         {option}
                                       </button>
                                     );
                                   })}
                                 </div>
                               ) : null}
                               {/* Show numeric inputs if item has numericInputs (multiple inputs) */}
                               {item.numericInputs && item.numericInputs.length > 0 ? (
                                 <div className="space-y-3 mb-3">
                                   {/* Refrigerant type dropdown for pressure recording */}
                                   {item.id === '2-5' ? (
                                     <div className="mb-4">
                                       <label className="block text-sm text-gray-300 mb-2">
                                         Refrigerant Type
                                       </label>
                                       <select
                                         value={item.refrigerantType || ''}
                                         onChange={(e) => updateRefrigerantType(currentSectionData.id, item.id, e.target.value)}
                                         className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                       >
                                         <option value="">Select refrigerant type</option>
                                         <option value="R-404A">R-404A</option>
                                         <option value="R-448A/R-449A">R-448A/R-449A</option>
                                         <option value="R-134a">R-134a</option>
                                       </select>
                                     </div>
                                   ) : null}
                                   
                                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                     {item.numericInputs.map((input, idx) => (
                                       <div key={idx}>
                                         <label className="block text-sm text-gray-300 mb-2">
                                           {input.label} {input.unit && `(${input.unit})`}
                                         </label>
                                         <div className="relative">
                                           <input
                                             type="number"
                                             value={input.value}
                                             onChange={(e) => updateNumericInputs(currentSectionData.id, item.id, idx, e.target.value)}
                                             placeholder={input.placeholder || `Enter ${input.label.toLowerCase()}`}
                                             className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                           />
                                           {/* Pressure validation indicator */}
                                           {item.id === '2-5' && item.pressureValidation && item.refrigerantType && (
                                             <div className="absolute -right-2 -top-1">
                                               <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                                 item.pressureValidation[input.label.toLowerCase() as keyof typeof item.pressureValidation] === 'seems normal'
                                                   ? 'bg-green-600 text-white'
                                                   : item.pressureValidation[input.label.toLowerCase() as keyof typeof item.pressureValidation] === 'seems low'
                                                   ? 'bg-yellow-600 text-white'
                                                   : item.pressureValidation[input.label.toLowerCase() as keyof typeof item.pressureValidation] === 'seems high'
                                                   ? 'bg-red-600 text-white'
                                                   : 'bg-gray-600 text-gray-300'
                                               }`}>
                                                 {item.pressureValidation[input.label.toLowerCase() as keyof typeof item.pressureValidation] || ''}
                                               </span>
                                             </div>
                                           )}
                                         </div>
                                       </div>
                                     ))}
                                   </div>
                                 </div>
                               ) : null}
                               {/* Show single numeric input if item has numericValue */}
                               {item.numericValue !== undefined && !item.numericInputs ? (
                                 <div className="mb-3">
                                   <div className="flex items-center gap-2">
                                     <input
                                       type="number"
                                       value={item.numericValue || ''}
                                       onChange={(e) => updateNumericValue(currentSectionData.id, item.id, e.target.value)}
                                       placeholder={`Enter value ${item.unit ? `(${item.unit})` : ''}`}
                                       className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                     />
                                     {item.unit && (
                                       <span className="text-sm text-gray-400 whitespace-nowrap">{item.unit}</span>
                                     )}
                                   </div>
                                 </div>
                               ) : null}
                               {/* Show photo upload for optional photo items */}
                               {item.text.toLowerCase().includes('optional') && item.text.toLowerCase().includes('photo') ? (
                                 <div className="space-y-2">
                                   <div className="flex items-center space-x-2">
                                     <input
                                       type="file"
                                       accept="image/*"
                                       onChange={(e) => handleImageUpload(currentSectionData.id, item.id, e)}
                                       className="hidden"
                                       id={`image-upload-${item.id}`}
                                       multiple
                                     />
                                     <label
                                       htmlFor={`image-upload-${item.id}`}
                                       className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded cursor-pointer transition-colors"
                                     >
                                       + Upload Photos
                                     </label>
                                   </div>
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
                               ) : null}
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
