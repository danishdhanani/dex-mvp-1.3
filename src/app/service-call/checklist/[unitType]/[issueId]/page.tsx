'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import HypothesisPopup from '@/components/HypothesisPopup';
import { generateHypotheses, generateRTUCoolingHypotheses, generateRTUHeatingHypotheses, generateNextStepSuggestions, type DiagnosticContext, type Hypothesis, type RTUCoolingChecksContext, type RTUHeatingChecksContext } from '@/app/service-call/checklist/rules';
import { getChecklistFor } from '@/app/service-call/checklist/config';
import type { ChecklistItem, ServiceCallChecklist } from '@/app/service-call/checklist/types';

// Helper function to generate service call checklist data
// Now uses centralized configuration from config.ts
function getServiceCallChecklist(unitType: string, issueId: string): ServiceCallChecklist {
  const sections = getChecklistFor(unitType, issueId);
  return {
    unitType,
    issueType: issueId,
    sections,
  };
}

export default function ServiceCallChecklistPage({ params }: { params: Promise<{ unitType: string; issueId: string }> }) {
  const router = useRouter();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const timelineContainerRef = useRef<HTMLDivElement>(null);
  const timelineItemsRef = useRef<HTMLDivElement>(null);
  const [timelineWidth, setTimelineWidth] = useState(0);
  const [unitType, setUnitType] = useState<string>('');
  const [issueId, setIssueId] = useState<string>('');
  const [checklist, setChecklist] = useState<ServiceCallChecklist | null>(null);
  const [currentSection, setCurrentSection] = useState(1);
  const [hypothesesOpen, setHypothesesOpen] = useState(false);
  const [hypotheses, setHypotheses] = useState<Hypothesis[]>([]);
  const [chosenPathTitle, setChosenPathTitle] = useState<string | null>(null);
  const [wrapUpNotes, setWrapUpNotes] = useState<string>('');
  const [chosenWrapUp, setChosenWrapUp] = useState<boolean>(false);
  const [blockingMessageResolutions, setBlockingMessageResolutions] = useState<Record<string, 'resolved' | 'acknowledged'>>({});
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
      
      // For RTU not-cooling, clear old localStorage data to ensure fresh state with conditionalOn properties
      if (resolved.unitType === 'rtu' && resolved.issueId === 'not-cooling') {
        localStorage.removeItem(`service-checklist-${resolved.unitType}-${resolved.issueId}`);
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
                          checked: savedItem.checked !== undefined ? savedItem.checked : item.checked,
                          conditionalOn: item.conditionalOn, // Preserve conditionalOn from original item
                          isBlockingMessage: item.isBlockingMessage // Preserve isBlockingMessage from original item
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

  // Scroll to top when section changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentSection]);

  // Calculate timeline width - measure actual rendered elements
  useEffect(() => {
    const updateWidth = () => {
      if (!timelineItemsRef.current || !checklist) {
        // Fallback calculation
        let itemCount = 0;
        const isRTUWithChecks = unitType === 'rtu' && (issueId === 'not-cooling' || issueId === 'not-heating');
        if (!chosenPathTitle && !chosenWrapUp) {
          itemCount = isRTUWithChecks ? 4 : 3;
        } else if (!chosenWrapUp) {
          itemCount = isRTUWithChecks ? 4 : 3;
        } else {
          itemCount = isRTUWithChecks 
            ? (chosenPathTitle ? 5 : 4)
            : (chosenPathTitle ? 4 : 3);
        }
        if (itemCount > 1) {
          const lastItemCenter = (itemCount - 1) * 66 + 25;
          const baseWidth = lastItemCenter - 25;
          setTimelineWidth(Math.max(baseWidth + 50, 0));
        } else {
          setTimelineWidth(0);
        }
        return;
      }
      
      const items = timelineItemsRef.current.children;
      if (items.length < 2) {
        setTimelineWidth(0);
        return;
      }
      
      const firstItem = items[0] as HTMLElement;
      const lastItem = items[items.length - 1] as HTMLElement;
      
      if (!firstItem || !lastItem) {
        setTimelineWidth(0);
        return;
      }
      
      // Measure actual positions
      const firstRect = firstItem.getBoundingClientRect();
      const lastRect = lastItem.getBoundingClientRect();
      const containerRect = timelineItemsRef.current.getBoundingClientRect();
      
      const firstCenter = firstRect.left - containerRect.left + firstRect.width / 2;
      const lastCenter = lastRect.left - containerRect.left + lastRect.width / 2;
      
      // Line starts at 25px (center of first bubble), extend to center of last item
      const lineStart = 25;
      let width = lastCenter - lineStart;
      
      // For RTU flows with arrows (when no path chosen yet), extend line to fully cover the arrow
      const isRTUWithChecks = unitType === 'rtu' && (issueId === 'not-cooling' || issueId === 'not-heating');
      if (isRTUWithChecks && !chosenPathTitle && !chosenWrapUp) {
        // Extend to the right edge of the arrow element, not just its center
        const lastRight = lastRect.right - containerRect.left;
        width = lastRight - lineStart + 10; // Add small buffer past the arrow
      } else {
        // Add small buffer to ensure connection
        width = width + 10;
      }
      
      setTimelineWidth(Math.max(width, 0));
    };
    
    // Use multiple requestAnimationFrame calls to ensure DOM is ready
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setTimeout(updateWidth, 50);
      });
    });
  }, [currentSection, chosenPathTitle, chosenWrapUp, checklist, unitType, issueId]);

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
                    
                    // For Yes/No questions (2 options) OR questions in diagnostic sections, make it single-select
                    // Default to single-select for all new sections going forward
                    // If selecting a new option, clear all others
                    // If deselecting the current option, clear it
                    let newSelectedOptions: string[];
                    const isUnitPowerSection = section.title === 'Unit Power';
                    const isThermostatSection = section.title === 'Thermostat';
                    const isCoolingChecksSection = section.title === 'Cooling Checks';
                    const isHeatingChecksSection = section.title === 'Heating Checks';
                    const isAirflowDiagnosticsSection = section.title === 'Airflow diagnostics';
                    // Single-select for: 2-option questions, Unit Power, Thermostat, Cooling Checks, Heating Checks, Airflow diagnostics, and all diagnostic sections
                    const isDiagnosticSection = section.title.includes('diagnostics') || section.title.includes('Diagnostics');
                    if ((item.options && item.options.length === 2) || isUnitPowerSection || isThermostatSection || isCoolingChecksSection || isHeatingChecksSection || isAirflowDiagnosticsSection || isDiagnosticSection) {
                      // Single-select: if clicking the selected option, deselect it; otherwise, select only this option
                      newSelectedOptions = isSelected ? [] : [option];
                    } else {
                      // Multi-select: toggle behavior (only for older sections that aren't diagnostic)
                      newSelectedOptions = isSelected
                        ? currentSelections.filter(opt => opt !== option)
                        : [...currentSelections, option];
                    }
                    
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
    
    // Clear blocking message resolutions for any blocking messages that depend on this item
    // This ensures the message resets when the answer changes
    setBlockingMessageResolutions(prev => {
      const updated = { ...prev };
      // Find all blocking messages that depend on this item
      checklist?.sections.forEach(section => {
        section.items.forEach(item => {
          if (item.isBlockingMessage && item.conditionalOn?.itemId === itemId) {
            // Clear the resolution state so the message can reappear fresh
            delete updated[item.id];
          }
        });
      });
      return updated;
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
                    )
                    
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
    suctionLineHumidityChecks: 'Suction line humidity checks',
    rtuAirflowDiagnostics: 'Airflow diagnostics',
    rtuCondenserDiagnostics: 'Condenser diagnostics',
    rtuCompressorCircuitDiagnostics: 'Compressor circuit diagnostics',
    rtuRefrigerantDiagnostics: 'Refrigerant diagnostics',
    rtuControlEconomizerDiagnostics: 'Control / economizer diagnostics'
  };

  const navigateToNextSectionId = (nextSectionId: string) => {
    if (!checklist) {
      console.error('navigateToNextSectionId: No checklist available');
      return;
    }
    
    // Check if it's a numeric section ID (for heating diagnostics)
    const numericId = parseInt(nextSectionId);
    if (!isNaN(numericId)) {
      const index = checklist.sections.findIndex(s => s.id === nextSectionId);
      if (index >= 0) {
        const section = checklist.sections[index];
        setChosenPathTitle(section.title);
        setCurrentSection(index + 1);
        return;
      }
    }
    
    const title = sectionIdByKey[nextSectionId];
    if (!title) {
      console.error('navigateToNextSectionId: No title found for nextSectionId:', nextSectionId);
      return;
    }
    setChosenPathTitle(title);
    
    // First try to find by title
    let index = checklist.sections.findIndex(s => s.title === title);
    
    // If not found by title, try to find by ID (fallback)
    if (index < 0) {
      index = checklist.sections.findIndex(s => s.id === nextSectionId);
    }
    
    if (index >= 0) {
      setCurrentSection(index + 1);
    } else {
      console.error('navigateToNextSectionId: Section not found with title:', title, 'or ID:', nextSectionId);
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
    // Section 2 (Condenser) - only if it exists
    const s2 = checklist.sections[1];
    const suctionStr = s2?.items.find(i => i.id === '2-5')?.numericInputs?.[0]?.value || '';
    const dischargeStr = s2?.items.find(i => i.id === '2-5')?.numericInputs?.[1]?.value || '';
    const refrigerant = s2?.items.find(i => i.id === '2-5')?.refrigerantType;
    const condenser = {
      suctionPsig: suctionStr ? parseFloat(suctionStr) : undefined,
      dischargePsig: dischargeStr ? parseFloat(dischargeStr) : undefined,
      condenserFan: s2?.items.find(i => i.id === '2-1')?.selectedOptions?.[0] || s2?.items.find(i => i.id === '2-1')?.selectedOption,
      compressor: s2?.items.find(i => i.id === '2-2')?.selectedOptions?.[0] || s2?.items.find(i => i.id === '2-2')?.selectedOption,
      noises: s2?.items.find(i => i.id === '2-3')?.selectedOptions?.[0] || s2?.items.find(i => i.id === '2-3')?.selectedOption,
      coilDirty: s2?.items.find(i => i.id === '2-4')?.selectedOptions?.[0] || s2?.items.find(i => i.id === '2-4')?.selectedOption,
      refrigerant
    };
    return { visual, condenser };
  };

  // Check if there's an active blocking message in the current section
  const hasActiveBlockingMessage = (): boolean => {
    if (!checklist) return false;
    const currentSectionData = checklist.sections[currentSection - 1];
    if (!currentSectionData) return false;
    
    // Check standard conditional blocking messages
    const hasStandardBlocking = currentSectionData.items.some((item) => {
      if (item.conditionalOn && item.isBlockingMessage) {
        // Skip if this blocking message has been resolved or acknowledged
        const resolution = blockingMessageResolutions[item.id];
        if (resolution === 'resolved' || resolution === 'acknowledged') {
          return false;
        }
        const referencedItem = currentSectionData.items.find(i => i.id === item.conditionalOn!.itemId);
        if (referencedItem) {
          const selectedValue = referencedItem.selectedOptions?.[0] || referencedItem.selectedOption;
          return selectedValue !== undefined && selectedValue === item.conditionalOn!.option;
        }
      }
      return false;
    });
    
    if (hasStandardBlocking) return true;
    
    // Check custom blocking message for Unit Power section
    if (currentSectionData.title === 'Unit Power' && unitType === 'rtu' && (issueId === 'not-cooling' || issueId === 'not-heating')) {
      const customBlockingItem = currentSectionData.items.find(item => item.id === '2-5-blocking');
      if (customBlockingItem) {
        const resolution = blockingMessageResolutions[customBlockingItem.id];
        if (resolution === 'resolved' || resolution === 'acknowledged') {
          return false;
        }
        
        // Check all conditions for custom blocking message
        const thermostatSection = checklist.sections.find(s => s.title === 'Thermostat');
        const thermostatPowerItem = thermostatSection?.items.find(i => i.id === '1-2');
        const thermostatPowerValue = thermostatPowerItem?.selectedOptions?.[0] || thermostatPowerItem?.selectedOption;
        const thermostatNoPower = thermostatPowerValue === 'No';
        
        const disconnectItem = currentSectionData.items.find(i => i.id === '2-1');
        const disconnectValue = disconnectItem?.selectedOptions?.[0] || disconnectItem?.selectedOption;
        const disconnectOn = disconnectValue === 'Yes';
        
        const unitRunningItem = currentSectionData.items.find(i => i.id === '2-2');
        const unitRunningValue = unitRunningItem?.selectedOptions?.[0] || unitRunningItem?.selectedOption;
        const unitRunning = unitRunningValue === 'Yes';
        
        const faultCodesItem = currentSectionData.items.find(i => i.id === '2-4');
        const faultCodesValue = faultCodesItem?.selectedOptions?.[0] || faultCodesItem?.selectedOption;
        const noFaultCodesOrSolidLED = faultCodesValue === 'No' || faultCodesValue === 'Solid LED';
        
        if (thermostatNoPower && disconnectOn && unitRunning && noFaultCodesOrSolidLED) {
          return true;
        }
      }
    }
    
    return false;
  };

  const buildRTUCoolingChecksContext = (): RTUCoolingChecksContext | null => {
    if (!checklist) return null;
    const coolingChecksSection = checklist.sections.find(s => s.title === 'Cooling Checks');
    if (!coolingChecksSection) return null;
    
    const getValue = (itemId: string) => {
      const item = coolingChecksSection.items.find(i => i.id === itemId);
      return item?.selectedOptions?.[0] || item?.selectedOption;
    };
    
    const getNumericValue = (itemId: string): number | undefined => {
      const item = coolingChecksSection.items.find(i => i.id === itemId);
      if (item?.numericValue) {
        const num = parseFloat(item.numericValue);
        return isNaN(num) ? undefined : num;
      }
      return undefined;
    };
    
    return {
      supplyFanRunning: getValue('supplyFanRunning'),
      supplyAirflowStrength: getValue('supplyAirflowStrength'),
      filtersCondition: getValue('filtersCondition'),
      evapCoilCondition: getValue('evapCoilCondition'),
      condenserFanStatus: getValue('condenserFanStatus'),
      condenserCoilCondition: getValue('condenserCoilCondition'),
      compressorStatus: getValue('compressorStatus'),
      noiseVibration: getValue('noiseVibration'),
      returnAirTemp: getNumericValue('returnAirTemp'),
      supplyAirTemp: getNumericValue('supplyAirTemp')
    };
  };

  const buildRTUHeatingChecksContext = (): RTUHeatingChecksContext | null => {
    if (!checklist) return null;
    const heatingChecksSection = checklist.sections.find(s => s.title === 'Heating Checks');
    if (!heatingChecksSection) return null;
    
    const getValue = (itemId: string) => {
      const item = heatingChecksSection.items.find(i => i.id === itemId);
      return item?.selectedOption || item?.selectedOptions?.[0];
    };
    
    const getNumericValue = (itemId: string): number | undefined => {
      const item = heatingChecksSection.items.find(i => i.id === itemId);
      if (item?.numericValue) {
        const num = parseFloat(item.numericValue);
        return isNaN(num) ? undefined : num;
      }
      return undefined;
    };
    
    return {
      heatingSystemType: getValue('heatingSystemType'),
      supplyFanRunning: getValue('supplyFanRunning'),
      supplyAirflowStrength: getValue('supplyAirflowStrength'),
      filtersCondition: getValue('filtersCondition'),
      heatingElementStatus: getValue('heatingElementStatus'),
      gasValveEnergized: getValue('gasValveEnergized'),
      burnersLit: getValue('burnersLit'),
      electricHeatOn: getValue('electricHeatOn'),
      heatPumpRunning: getValue('heatPumpRunning'),
      noiseVibration: getValue('noiseVibration'),
      returnAirTemp: getNumericValue('returnAirTemp'),
      supplyAirTemp: getNumericValue('supplyAirTemp')
    };
  };

  const goToNextSection = () => {
    if (!checklist) return;
    // After Section 2, run hypothesis selection for walk-in
    if (currentSection === 2) {
      // Demo flow for walk-in ice build up: show specific demo options
      if (unitType === 'walkIn' && issueId === 'ice-frost-build-up') {
        const demoHypotheses: Hypothesis[] = [
          {
            id: 'drainLineDemo',
            label: 'Check drain line for leaks',
            reason: 'Trace drain path to identify potential leaks or blockages',
            confidence: 0.9,
            nextSectionId: 'evapDrainTracingDemo'
          },
          {
            id: 'defrostCycleDemo',
            label: 'Defrost cycle',
            reason: 'Verify defrost system is operating correctly',
            confidence: 0.85,
            nextSectionId: 'defrostDiagnostics'
          }
        ];
        setHypotheses(demoHypotheses);
        setHypothesesOpen(true);
        return;
      }

      // For RTU not-cooling, go directly to section 3 (Cooling Checks) after section 2
      if (unitType === 'rtu' && issueId === 'not-cooling') {
        if (currentSection < checklist.sections.length) {
          setCurrentSection(currentSection + 1);
        }
        return;
      }

      // For RTU not-heating, go directly to section 3 (Heating Checks) after section 2
      if (unitType === 'rtu' && issueId === 'not-heating') {
        if (currentSection < checklist.sections.length) {
          setCurrentSection(currentSection + 1);
        }
        return;
      }

      const ctx = buildDiagnosticContext();
      const list = ctx ? generateHypotheses(ctx) : [];

      if (list.length === 0) {
        if (currentSection < checklist.sections.length) {
          setCurrentSection(currentSection + 1);
        }
        return;
      }

      const sorted = [...list].sort((a, b) => b.confidence - a.confidence);
      setHypotheses(sorted);
      setHypothesesOpen(true);
      return;
    }
    
    // After Section 3 (Cooling Checks) for RTU not-cooling, run hypothesis selection
    if (currentSection === 3 && unitType === 'rtu' && issueId === 'not-cooling') {
      const ctx = buildRTUCoolingChecksContext();
      const list = ctx ? generateRTUCoolingHypotheses(ctx) : [];

      if (list.length === 0) {
        if (currentSection < checklist.sections.length) {
          setCurrentSection(currentSection + 1);
        }
        return;
      }

      const sorted = [...list].sort((a, b) => b.confidence - a.confidence);
      setHypotheses(sorted);
      setHypothesesOpen(true);
      return;
    }

    // After Section 3 (Heating Checks) for RTU not-heating, run hypothesis selection
    if (currentSection === 3 && unitType === 'rtu' && issueId === 'not-heating') {
      const ctx = buildRTUHeatingChecksContext();
      const list = ctx ? generateRTUHeatingHypotheses(ctx) : [];

      if (list.length === 0) {
        if (currentSection < checklist.sections.length) {
          setCurrentSection(currentSection + 1);
        }
        return;
      }

      const sorted = [...list].sort((a, b) => b.confidence - a.confidence);
      setHypotheses(sorted);
      setHypothesesOpen(true);
      return;
    }
    
    // For RTU diagnostic sections, show suggested next steps instead of arbitrary navigation
    if (unitType === 'rtu' && issueId === 'not-cooling') {
      const currentSectionData = checklist.sections[currentSection - 1];
      const diagnosticSections = [
        'Airflow diagnostics',
        'Condenser diagnostics',
        'Compressor circuit diagnostics',
        'Refrigerant diagnostics',
        'Control / economizer diagnostics'
      ];
      
      if (currentSectionData && diagnosticSections.includes(currentSectionData.title)) {
        // Check if primary cause is "Yes" for Airflow diagnostics
        const primaryCauseFound = currentSectionData.title === 'Airflow diagnostics' 
          ? currentSectionData.items.find(i => i.id === 'af-primary-cause-found')?.selectedOptions?.[0] || currentSectionData.items.find(i => i.id === 'af-primary-cause-found')?.selectedOption
          : null;
        
        // Generate next-step suggestions and show popup
        const coolingChecksSection = checklist.sections.find(s => s.title === 'Cooling Checks');
        const coolingChecksData = coolingChecksSection ? buildRTUCoolingChecksContext() : undefined;
        const suggestions = generateNextStepSuggestions(
          currentSectionData.title,
          currentSectionData,
          coolingChecksData || undefined
        );
        
        // If primary cause is "Yes" in Airflow diagnostics, prepend wrap-up option
        if (primaryCauseFound === 'Yes' && currentSectionData.title === 'Airflow diagnostics') {
          const wrapUpHypothesis: Hypothesis = {
            id: 'wrap-up-primary-cause',
            label: 'Wrap up if you think you\'ve resolved the root cause',
            reason: 'You indicated you found the primary cause. Proceed to wrap up to finalize your notes.',
            confidence: 1,
            nextSectionId: 'wrap-up' // Special ID to indicate wrap-up
          };
          setHypotheses([wrapUpHypothesis, ...suggestions]);
          setHypothesesOpen(true);
          return;
        }
        
        if (suggestions.length > 0) {
          setHypotheses(suggestions);
          setHypothesesOpen(true);
          return;
        }
      }
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

  const getIssueName = (issueId: string, unitType?: string): string => {
    // If it's a custom issue, return the custom description
    if (issueId === 'custom-issue' && customIssueDescription) {
      return customIssueDescription;
    }

    // Special case for short-cycling: different names for RTU vs Split Unit
    if (issueId === 'short-cycling') {
      if (unitType === 'splitUnit') {
        return 'Cycle / Noise';
      }
      return 'Cycle / Noise Issue';
    }

    // Special case for running-constantly: different name for reach-ins and walk-ins
    if (issueId === 'running-constantly') {
      if (unitType === 'reachIn' || unitType === 'walkIn') {
        return 'Cycle Issues';
      }
      return 'Constant Run / Short Cycle';
    }

    // Special case for ice machine shared issues
    if (issueId === 'water-leaking' && unitType === 'iceMachine') {
      return 'Leaking';
    }
    if (issueId === 'noisy-operation' && unitType === 'iceMachine') {
      return 'Noisy';
    }
    if (issueId === 'other-alarm' && unitType === 'iceMachine') {
      return 'Other';
    }

    const names: Record<string, string> = {
      'not-cooling': 'Not Cooling',
      'not-heating': 'Not Heating',
      'poor-airflow': 'Poor Airflow',
      'unit-not-running': 'Not Running',
      'unit-not-running-display': 'Not Running',
      'unit-leaking': 'Water Leaking',
      'zoning-issues': 'Zoning Issues',
      'running-warm': 'Running Warm',
      'excessive-frost': 'Excessive Frost',
      'ice-frost-build-up': 'Ice Build Up',
      'water-leaking': 'Water Leaking',

      'noisy-operation': 'Noisy Operation',
      'door-gasket-issue': 'Door Issue',
      'other-alarm': 'Other / Alarm',
      'box-too-cold': 'Box Too Cold',
      'door-seal-issue': 'Door Seal Issue',
      'fan-not-working': 'Fan Not Working',
      'temperature-fluctuation': 'Temperature Fluctuation',
      'defrost-issue': 'Defrost Issue',
      'no-ice-production': 'No/slow Ice',
      'poor-ice-quality': 'Poor Quality',
      'water-leak': 'Water Leaking',
      'machine-not-cycling': 'Cycle Issue',
      'machine-icing-up': 'Icing Up',
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
          // Handle wrap-up case
          if (h.nextSectionId === 'wrap-up') {
            // Auto-import completed action items into wrap-up notes
            const airflowSection = checklist?.sections.find(s => s.title === 'Airflow diagnostics');
            if (airflowSection) {
              const completedActionItems = airflowSection.items
                .filter(item => item.isActionItem && item.checked)
                .map(item => item.text);
              
              if (completedActionItems.length > 0) {
                const actionItemsText = completedActionItems.map(item => `• ${item}`).join('\n');
                setWrapUpNotes(prev => {
                  const existing = prev.trim();
                  return existing 
                    ? `${existing}\n\nCompleted Actions:\n${actionItemsText}`
                    : `Completed Actions:\n${actionItemsText}`;
                });
              }
            }
            
            // Navigate to wrap-up
            const wrapUpSection = checklist?.sections.find(s => s.title === 'Wrap up');
            if (wrapUpSection) {
              const index = checklist?.sections.findIndex(s => s.id === wrapUpSection.id);
              if (index !== undefined && index >= 0) {
                setCurrentSection(index + 1);
                setChosenWrapUp(true);
              }
            }
            return;
          }
          
          // Use setTimeout to ensure state updates complete before navigation
          setTimeout(() => {
            navigateToNextSectionId(h.nextSectionId);
          }, 100);
        }}
      />
      {/* Header */}
      <div className="border-b border-gray-700 bg-gray-800 sticky top-0 z-10">
        <div className="px-4 py-4">
          <div className="flex flex-wrap items-center justify-between mb-4 gap-3">
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
                <h1 className="text-2xl font-bold text-white">{`${getUnitTypeName(unitType)}: ${getIssueName(issueId, unitType)}`}</h1>
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
              <div className="relative" ref={timelineContainerRef}>
                {/* Timeline background line */}
                <div
                  className="absolute top-5 h-0.5 bg-gray-600 z-0"
                  style={{ 
                    left: '25px', 
                    width: `${Math.max(timelineWidth, 0)}px`
                  }}
                ></div>

                <div
                  ref={timelineItemsRef}
                  className="flex items-start justify-start relative z-10 gap-4"
                >
                  {(!chosenPathTitle && !chosenWrapUp) ? (
                    <>
                      {checklist.sections.slice(0, 2).map((section, idx) => {
                        const sectionNumber = idx + 1;
                        const isActive = sectionNumber === currentSection;
                        const isCompleted = section.items.every(item => {
                          // Skip blocking messages and info messages - they don't need to be "completed"
                          if (item.isBlockingMessage || item.isInfoMessage) return true;
                          // Skip conditionally hidden items - they don't need to be "completed" if not shown
                          if (item.conditionalOn) {
                            const referencedItem = section.items.find(i => i.id === item.conditionalOn!.itemId);
                            if (referencedItem) {
                              const selectedValue = referencedItem.selectedOptions?.[0] || referencedItem.selectedOption;
                              if (selectedValue !== item.conditionalOn!.option) {
                                return true; // Item is conditionally hidden, so it's "complete" (doesn't need to be filled)
                              }
                            }
                          }
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
                        const getDescriptor = (title: string) => ({ 'box check': 'Box', 'Condenser check': 'Condenser', 'Safety / Prep': 'Safety' } as Record<string,string>)[title] || title;
                        return (
                          <div key={sectionNumber} className="flex flex-col items-center space-y-1" style={{ minWidth: '50px', flexShrink: 0 }}>
                            <button onClick={() => goToSection(sectionNumber)} className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-colors ${isActive ? 'bg-blue-600 text-white' : isCompleted ? 'bg-green-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}>{sectionNumber}</button>
                            <span className="text-xs text-gray-400 text-center whitespace-nowrap">{getDescriptor(section.title)}</span>
                          </div>
                        )
                      })}
                      {/* For RTU, show section 3 (Cooling Checks or Heating Checks) directly */}
                      {checklist && unitType === 'rtu' && (issueId === 'not-cooling' || issueId === 'not-heating') && checklist.sections && checklist.sections.length > 2 ? (
                        (() => {
                          const section3 = checklist.sections[2];
                          const sectionNumber = 3;
                          const isActive = sectionNumber === currentSection;
                          const isCompleted = section3.items.every(item => {
                            // Skip blocking messages and info messages - they don't need to be "completed"
                            if (item.isBlockingMessage || item.isInfoMessage) return true;
                            // Skip conditionally hidden items - they don't need to be "completed" if not shown
                            if (item.conditionalOn) {
                              const referencedItem = section3.items.find(i => i.id === item.conditionalOn!.itemId);
                              if (referencedItem) {
                                const selectedValue = referencedItem.selectedOptions?.[0] || referencedItem.selectedOption;
                                if (selectedValue !== item.conditionalOn!.option) {
                                  return true; // Item is conditionally hidden, so it's "complete" (doesn't need to be filled)
                                }
                              }
                            }
                            if (item.numericValue !== undefined) {
                              // For delta T items, don't require completion
                              if (item.id === 'deltaTInterpretation' || item.id === 'temperatureRiseInterpretation' || item.id === 'af-deltat-after-interpretation') return true;
                              return item.numericValue.trim() !== '';
                            }
                            if (item.options) return (item.selectedOptions && item.selectedOptions.length > 0) || (item.selectedOption && item.selectedOption.trim() !== '');
                            return item.status && item.status !== 'unchecked';
                          });
                          return (
                            <>
                              <div className="flex flex-col items-center space-y-1" style={{ minWidth: '50px', flexShrink: 0 }}>
                                <button onClick={() => goToSection(sectionNumber)} className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-colors ${isActive ? 'bg-blue-600 text-white' : isCompleted ? 'bg-green-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}>{sectionNumber}</button>
                                <span className="text-xs text-gray-400 text-center whitespace-nowrap">{section3.title}</span>
                              </div>
                              <div className="flex flex-col items-center space-y-1" style={{ minWidth: '50px', flexShrink: 0 }}>
                                <div className="relative z-10 w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm bg-gray-700 text-gray-300">→</div>
                                <span className="text-xs text-gray-400 text-center whitespace-nowrap">Next steps based on inputs</span>
                              </div>
                            </>
                          );
                        })()
                      ) : (
                        <div className="flex flex-col items-center space-y-1" style={{ minWidth: '50px', flexShrink: 0 }}>
                          <div className="relative z-10 w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm bg-gray-700 text-gray-300">→</div>
                          <span className="text-xs text-gray-400 text-center whitespace-nowrap">Next steps based on inputs</span>
                        </div>
                      )}
                    </>
                  ) : (!chosenWrapUp) ? (
                    <>
                      {checklist.sections.slice(0, 2).map((section, idx) => {
                        const sectionNumber = idx + 1;
                        const isActive = sectionNumber === currentSection;
                        const isCompleted = section.items.every(item => {
                          // Skip blocking messages and info messages - they don't need to be "completed"
                          if (item.isBlockingMessage || item.isInfoMessage) return true;
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
                        const getDescriptor = (title: string) => ({ 'box check': 'Box', 'Condenser check': 'Condenser', 'Safety / Prep': 'Safety' } as Record<string,string>)[title] || title;
                        return (
                          <div key={sectionNumber} className="flex flex-col items-center space-y-1" style={{ minWidth: '50px', flexShrink: 0 }}>
                            <button onClick={() => goToSection(sectionNumber)} className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-colors ${isActive ? 'bg-blue-600 text-white' : isCompleted ? 'bg-green-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}>{sectionNumber}</button>
                            <span className="text-xs text-gray-400 text-center whitespace-nowrap">{getDescriptor(section.title)}</span>
                          </div>
                        )
                      })}
                      {/* For RTU, show section 3 (Cooling Checks or Heating Checks) before chosen path */}
                      {checklist && unitType === 'rtu' && (issueId === 'not-cooling' || issueId === 'not-heating') && checklist.sections && checklist.sections.length > 2 ? (
                        (() => {
                          const section3 = checklist.sections[2];
                          const sectionNumber = 3;
                          const isActive = sectionNumber === currentSection;
                          const isCompleted = section3.items.every(item => {
                            // Skip blocking messages and info messages - they don't need to be "completed"
                            if (item.isBlockingMessage || item.isInfoMessage) return true;
                            // Skip conditionally hidden items - they don't need to be "completed" if not shown
                            if (item.conditionalOn) {
                              const referencedItem = section3.items.find(i => i.id === item.conditionalOn!.itemId);
                              if (referencedItem) {
                                const selectedValue = referencedItem.selectedOptions?.[0] || referencedItem.selectedOption;
                                if (selectedValue !== item.conditionalOn!.option) {
                                  return true; // Item is conditionally hidden, so it's "complete" (doesn't need to be filled)
                                }
                              }
                            }
                            if (item.numericValue !== undefined) {
                              if (item.id === 'deltaTInterpretation' || item.id === 'temperatureRiseInterpretation') return true;
                              return item.numericValue.trim() !== '';
                            }
                            if (item.options) return (item.selectedOptions && item.selectedOptions.length > 0) || (item.selectedOption && item.selectedOption.trim() !== '');
                            return item.status && item.status !== 'unchecked';
                          });
                          return (
                            <div className="flex flex-col items-center space-y-1" style={{ minWidth: '50px', flexShrink: 0 }}>
                              <button onClick={() => goToSection(sectionNumber)} className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-colors ${isActive ? 'bg-blue-600 text-white' : isCompleted ? 'bg-green-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}>{sectionNumber}</button>
                              <span className="text-xs text-gray-400 text-center whitespace-nowrap">{section3.title}</span>
                            </div>
                          );
                        })()
                      ) : null}
                      {chosenPathTitle && (() => {
                        const title = chosenPathTitle;
                        const idx = checklist.sections.findIndex(s => s.title === title);
                        const isActive = currentSection === (idx + 1);
                        const isCompleted = idx >= 0 ? checklist.sections[idx].items.every(item => {
                          // Skip blocking messages and info messages - they don't need to be "completed"
                          if (item.isBlockingMessage || item.isInfoMessage) return true;
                          // Skip conditionally hidden items - they don't need to be "completed" if not shown
                          if (item.conditionalOn) {
                            const section = checklist.sections[idx];
                            const referencedItem = section.items.find(i => i.id === item.conditionalOn!.itemId);
                            if (referencedItem) {
                              const selectedValue = referencedItem.selectedOptions?.[0] || referencedItem.selectedOption;
                              if (selectedValue !== item.conditionalOn!.option) {
                                return true; // Item is conditionally hidden, so it's "complete" (doesn't need to be filled)
                              }
                            }
                          }
                          if (item.numericInputs && item.numericInputs.length > 0) return item.numericInputs.some(input => input.value.trim() !== '');
                          if (item.numericValue !== undefined) return item.numericValue.trim() !== '';
                          if (item.options) return (item.selectedOptions && item.selectedOptions.length > 0) || (item.selectedOption && item.selectedOption.trim() !== '');
                          return item.status && item.status !== 'unchecked';
                        }) : false;
                        const label = title === 'Evap drain tracing' ? 'Trace evap icing' : title;
                        const pathNumber = (unitType === 'rtu' && (issueId === 'not-cooling' || issueId === 'not-heating')) ? '4' : '3';
                        return (
                          <div className="flex flex-col items-center space-y-1" style={{ minWidth: '50px', flexShrink: 0 }}>
                            <button onClick={() => idx >= 0 && setCurrentSection(idx + 1)} className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-colors ${isActive ? 'bg-blue-600 text-white' : isCompleted ? 'bg-green-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}>{pathNumber}</button>
                            <span className="text-xs text-gray-400 text-center whitespace-nowrap">{label}</span>
                          </div>
                        )
                      })()}
                    </>
                  ) : (
                    // With wrap up chosen: show 1,2, section 3 (if RTU), chosen path (if exists), and wrap up
                    <>
                      {checklist.sections.slice(0, 2).map((section, idx) => {
                        const sectionNumber = idx + 1;
                        const isActive = sectionNumber === currentSection;
                        const isCompleted = section.items.every(item => {
                          // Skip blocking messages and info messages - they don't need to be "completed"
                          if (item.isBlockingMessage || item.isInfoMessage) return true;
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
                        const getDescriptor = (title: string) => ({ 'box check': 'Box', 'Condenser check': 'Condenser', 'Safety / Prep': 'Safety' } as Record<string,string>)[title] || title;
                        return (
                          <div key={sectionNumber} className="flex flex-col items-center space-y-1" style={{ minWidth: '50px', flexShrink: 0 }}>
                            <button onClick={() => goToSection(sectionNumber)} className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-colors ${isActive ? 'bg-blue-600 text-white' : isCompleted ? 'bg-green-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}>{sectionNumber}</button>
                            <span className="text-xs text-gray-400 text-center whitespace-nowrap">{getDescriptor(section.title)}</span>
                          </div>
                        )
                      })}
                      {/* For RTU, show section 3 (Cooling Checks or Heating Checks) before chosen path */}
                      {checklist && unitType === 'rtu' && (issueId === 'not-cooling' || issueId === 'not-heating') && checklist.sections && checklist.sections.length > 2 ? (
                        (() => {
                          const section3 = checklist.sections[2];
                          const sectionNumber = 3;
                          const isActive = sectionNumber === currentSection;
                          const isCompleted = section3.items.every(item => {
                            // Skip blocking messages and info messages - they don't need to be "completed"
                            if (item.isBlockingMessage || item.isInfoMessage) return true;
                            // Skip conditionally hidden items - they don't need to be "completed" if not shown
                            if (item.conditionalOn) {
                              const referencedItem = section3.items.find(i => i.id === item.conditionalOn!.itemId);
                              if (referencedItem) {
                                const selectedValue = referencedItem.selectedOptions?.[0] || referencedItem.selectedOption;
                                if (selectedValue !== item.conditionalOn!.option) {
                                  return true; // Item is conditionally hidden, so it's "complete" (doesn't need to be filled)
                                }
                              }
                            }
                            if (item.numericValue !== undefined) {
                              if (item.id === 'deltaTInterpretation' || item.id === 'temperatureRiseInterpretation') return true;
                              return item.numericValue.trim() !== '';
                            }
                            if (item.options) return (item.selectedOptions && item.selectedOptions.length > 0) || (item.selectedOption && item.selectedOption.trim() !== '');
                            return item.status && item.status !== 'unchecked';
                          });
                          return (
                            <div className="flex flex-col items-center space-y-1" style={{ minWidth: '50px', flexShrink: 0 }}>
                              <button onClick={() => goToSection(sectionNumber)} className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-colors ${isActive ? 'bg-blue-600 text-white' : isCompleted ? 'bg-green-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}>{sectionNumber}</button>
                              <span className="text-xs text-gray-400 text-center whitespace-nowrap">{section3.title}</span>
                            </div>
                          );
                        })()
                      ) : null}
                      {chosenPathTitle && (() => {
                        const title = chosenPathTitle!;
                        const idx = checklist.sections.findIndex(s => s.title === title);
                        const isActive = currentSection === (idx + 1);
                        const isCompleted = idx >= 0 ? checklist.sections[idx].items.every(item => {
                          // Skip interpretation items - they're auto-calculated
                          if (item.id === 'deltaTInterpretation' || item.id === 'temperatureRiseInterpretation' || item.id === 'staticPressureInterpretation' || item.id === 'af-deltat-after-interpretation') return true;
                          if (item.numericInputs && item.numericInputs.length > 0) return item.numericInputs.some(input => input.value.trim() !== '');
                          if (item.numericValue !== undefined) return item.numericValue.trim() !== '';
                          if (item.options) return (item.selectedOptions && item.selectedOptions.length > 0) || (item.selectedOption && item.selectedOption.trim() !== '');
                          return item.status && item.status !== 'unchecked';
                        }) : false;
                        const label = title === 'Evap drain tracing' ? 'Trace evap icing' : title;
                        const pathNumber = (unitType === 'rtu' && (issueId === 'not-cooling' || issueId === 'not-heating')) ? '4' : '3';
                        return (
                          <div className="flex flex-col items-center space-y-1" style={{ minWidth: '50px', flexShrink: 0 }}>
                            <button onClick={() => idx >= 0 && setCurrentSection(idx + 1)} className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-colors ${isActive ? 'bg-blue-600 text-white' : isCompleted ? 'bg-green-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}>{pathNumber}</button>
                            <span className="text-xs text-gray-400 text-center whitespace-nowrap">{label}</span>
                          </div>
                        )
                      })()}
                      {(() => {
                        const idx = checklist.sections.findIndex(s => s.title === 'Wrap up');
                        const isActive = currentSection === (idx + 1);
                        const isCompleted = idx >= 0 ? checklist.sections[idx].items.every(item => !!item.status && item.status !== 'unchecked') : false;
                        let wrapUpNumber = '3';
                        if (unitType === 'rtu' && (issueId === 'not-cooling' || issueId === 'not-heating')) {
                          wrapUpNumber = chosenPathTitle ? '5' : '4';
                        } else {
                          wrapUpNumber = chosenPathTitle ? '4' : '3';
                        }
                        return (
                          <div className="flex flex-col items-center space-y-1" style={{ minWidth: '50px', flexShrink: 0 }}>
                            <button onClick={() => idx >= 0 && setCurrentSection(idx + 1)} className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-colors ${isActive ? 'bg-blue-600 text-white' : isCompleted ? 'bg-green-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}>{wrapUpNumber}</button>
                            <span className="text-xs text-gray-400 text-center whitespace-nowrap">Wrap up</span>
                          </div>
                        )
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
                {/* Info messages */}
                {currentSectionData.items.filter(item => item.isInfoMessage).map((item) => (
                  <div key={item.id} className="mb-4 p-3 bg-blue-900/30 border border-blue-700 rounded-lg">
                    <p className="text-sm text-blue-200">{item.text}</p>
                  </div>
                ))}
                
                {/* Normal checklist items */}
                <div className="space-y-3">
                  {currentSectionData.items.filter((item) => {
                    // Exclude blocking messages and info messages from regular items
                    if (item.isBlockingMessage || item.isInfoMessage) return false;
                    // Show conditional items only if their condition is met
                    if (item.conditionalOn) {
                      const referencedItem = currentSectionData.items.find(i => i.id === item.conditionalOn!.itemId);
                      if (referencedItem) {
                        const selectedValue = referencedItem.selectedOptions?.[0] || referencedItem.selectedOption;
                        // Only show if a value is selected AND it matches the condition
                        return selectedValue !== undefined && selectedValue === item.conditionalOn!.option;
                      }
                      return false;
                    }
                    return true; // Show non-conditional items
                  }).map((item) => (
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
                      {/* Render blocking messages inline if this item triggers them */}
                      {currentSectionData.items
                        .filter((blockingItem) => {
                          if (blockingItem.isBlockingMessage && blockingItem.conditionalOn) {
                            return blockingItem.conditionalOn.itemId === item.id;
                          }
                          return false;
                        })
                        .map((blockingItem) => {
                          const selectedValue = item.selectedOptions?.[0] || item.selectedOption;
                          const shouldShow = selectedValue !== undefined && selectedValue === blockingItem.conditionalOn!.option;
                          if (!shouldShow) return null;
                          const resolution = blockingMessageResolutions[blockingItem.id];
                          const isResolved = resolution === 'resolved';
                          const isAcknowledged = resolution === 'acknowledged';
                          const bgColor = isAcknowledged ? 'bg-orange-900/30' : 'bg-red-900/30';
                          const borderColor = isAcknowledged ? 'border-orange-600' : 'border-red-600';
                          const iconColor = isAcknowledged ? 'text-orange-500' : 'text-red-500';
                          const textColor = isAcknowledged ? 'text-orange-200' : 'text-red-200';
                          const subtextColor = isAcknowledged ? 'text-orange-300' : 'text-red-300';
                          const getAcknowledgedText = (originalText: string): string => {
                            // Handle specific messages first - check for LED fault codes message
                            if (blockingItem.id === '2-4-blocking') {
                              return 'Checked control board fault codes but that still did not resolve the issue.';
                            }
                            // Handle custom blocking message for wiring issues
                            if (blockingItem.id === '2-5-blocking') {
                              return 'Checked for broken wiring / open splice / tripped float switch / conduit inside control wiring run but that still did not resolve the issue.';
                            }
                            // Handle specific messages first - check for disconnect switch message
                            const lowerText = originalText.toLowerCase();
                            if ((lowerText.includes('turn on') && lowerText.includes('recheck')) || lowerText.includes('turn on & recheck')) {
                              return 'Checked disconnect but that still did not resolve the issue.';
                            }
                            // Handle fuses message
                            if (lowerText.includes('please correct for blown fuses') || lowerText.includes('correct for blown fuses')) {
                              return 'Checked for blown fuses but that still did not resolve the issue.';
                            }
                            // Remove "This is" or "This is a/an" prefix and make it past tense
                            let text = originalText.replace(/^This is (a |an )?/i, '').replace(/\.$/, '');
                            // Convert to past tense and add context
                            if (text.includes('upstream breaker') || (text.includes('disconnect') && !text.includes('Turn on'))) {
                              return 'Checked upstream breaker / disconnect / fuse issues but that still did not resolve the issue.';
                            }
                            if (text.includes('transformer') || text.includes('fuse open')) {
                              return 'Checked transformer and fuse issues but that still did not resolve the issue.';
                            }
                            if (text.includes('control circuit') || text.includes('safety switch') || text.includes('pressure switch') || text.includes('limit') || text.includes('board')) {
                              return 'Checked control circuit and safety components but that still did not resolve the issue.';
                            }
                            // Generic fallback
                            return `Checked ${text.toLowerCase()} but that still did not resolve the issue.`;
                          };
                          const displayText = isAcknowledged ? getAcknowledgedText(blockingItem.text) : blockingItem.text;
                          return (
                            <div key={blockingItem.id} className={`mt-3 p-4 ${bgColor} border-2 ${borderColor} rounded-lg`}>
                              <div className="flex items-start space-x-3">
                                <svg className={`w-6 h-6 ${iconColor} flex-shrink-0 mt-0.5`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                                <div className="flex-1">
                                  <p className={`${textColor} font-semibold`}>
                                    {blockingItem.id === '2-2a-blocking' && !isAcknowledged ? 'Likely an upstream breaker, disconnect, or fuse problem.' : displayText}
                                  </p>
                                  {!isAcknowledged && !isResolved && (
                                    <>
                                      {blockingItem.id === '2-2a-blocking' ? (
                                        <ul className={`${subtextColor} text-sm mt-2 space-y-1 list-disc list-inside`}>
                                          <li>Open disconnect cover and inspect for blown fuses (confirm 0 V).</li>
                                          <li>Check if breaker was tripped. Reset once if safe to do so.</li>
                                          <li>If it immediately trips again, check for a short downstream (compressor, contactor, wiring).</li>
                                        </ul>
                                      ) : (
                                        <p className={`${subtextColor} text-sm mt-1`}>Please resolve this issue before continuing.</p>
                                      )}
                                    </>
                                  )}
                                  {!isResolved && !isAcknowledged && (
                                    <div className="mt-3 flex gap-2">
                                      <button
                                        onClick={() => {
                                          const idx = checklist.sections.findIndex(s => s.title === 'Wrap up');
                                          if (idx >= 0) {
                                            setBlockingMessageResolutions(prev => ({ ...prev, [blockingItem.id]: 'resolved' }));
                                            setChosenWrapUp(true);
                                            setCurrentSection(idx + 1);
                                          }
                                        }}
                                        className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium"
                                      >
                                        {blockingItem.id === '2-1a' ? 'Turning on disconnect resolved issue - wrap up' : blockingItem.id === '2-2a-blocking' ? 'Found root cause of issue, wrap up' : blockingItem.id === '2-2b-blocking' ? 'Found root cause, wrap up' : blockingItem.id === '2-2c-blocking' ? 'Found root cause, wrap up' : blockingItem.id === '2-3-blocking' ? 'Found root cause, wrap up' : blockingItem.id === '2-4-blocking' ? 'Found root cause, wrap up' : 'Issue resolved - Wrap up'}
                                      </button>
                                      <button
                                        onClick={() => {
                                          setBlockingMessageResolutions(prev => ({ ...prev, [blockingItem.id]: 'acknowledged' }));
                                        }}
                                        className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg text-sm font-medium"
                                      >
                                        {blockingItem.id === '2-1a' ? 'Turning on disconnect did not resolve issue - keep troubleshooting' : blockingItem.id === '2-2a-blocking' ? 'Restored line power but issue still not resolved, keep troubleshooting' : blockingItem.id === '2-2b-blocking' ? 'Continue troubleshooting' : blockingItem.id === '2-2c-blocking' ? 'Continue troubleshooting' : blockingItem.id === '2-3-blocking' ? 'Continue troubleshooting' : blockingItem.id === '2-4-blocking' ? 'Continue troubleshooting' : 'Continue troubleshooting'}
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
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
                {/* Info messages */}
                {currentSectionData.items.filter(item => item.isInfoMessage).map((item) => (
                  <div key={item.id} className="mb-4 p-3 bg-blue-900/30 border border-blue-700 rounded-lg">
                    <p className="text-sm text-blue-200">{item.text}</p>
                  </div>
                ))}
                
                {/* Normal checklist items */}
                <div className="space-y-3">
                  {currentSectionData.items.filter((item) => {
                    // Exclude blocking messages and info messages from regular items
                    if (item.isBlockingMessage || item.isInfoMessage) return false;
                    // Show conditional items only if their condition is met
                    if (item.conditionalOn) {
                      const referencedItem = currentSectionData.items.find(i => i.id === item.conditionalOn!.itemId);
                      if (referencedItem) {
                        const selectedValue = referencedItem.selectedOptions?.[0] || referencedItem.selectedOption;
                        // Only show if a value is selected AND it matches the condition
                        return selectedValue !== undefined && selectedValue === item.conditionalOn!.option;
                      }
                      return false;
                    }
                    return true; // Show non-conditional items
                  }).map((item) => (
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
                    )
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
                    )
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
            ) : currentSectionData.title === 'Cooling Checks' ? (
              <>
                {/* Blower / Supply Air Movement */}
                <div className="mb-6">
                  <h3 className="text-md font-semibold text-gray-300 mb-4">Blower / Supply Air Movement</h3>
                  <div className="space-y-4">
                    {['supplyFanRunning', 'supplyAirflowStrength', 'filtersCondition', 'evapCoilCondition'].map((itemId) => {
                      const item = currentSectionData.items.find(i => i.id === itemId);
                      if (!item) return null;
                      return (
                        <div key={item.id} className="border-b border-gray-700 pb-4 last:border-b-0">
                          <div className="flex items-start space-x-3">
                            <div className="flex-1">
                              <label className="text-gray-200 block mb-2">{item.text}</label>
                              {item.options && (
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
                                    )
                                  })}
                                </div>
                              )}
                              {/* Photo upload for items that need it */}
                              {(item.id === 'filtersCondition' || item.id === 'evapCoilCondition') && (
                                <div className="mt-3 space-y-2">
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
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Condenser */}
                <div className="mb-6">
                  <h3 className="text-md font-semibold text-gray-300 mb-4">Condenser</h3>
                  <div className="space-y-4">
                    {['condenserFanStatus', 'condenserCoilCondition'].map((itemId) => {
                      const item = currentSectionData.items.find(i => i.id === itemId);
                      if (!item) return null;
                      return (
                        <div key={item.id} className="border-b border-gray-700 pb-4 last:border-b-0">
                          <div className="flex items-start space-x-3">
                            <div className="flex-1">
                              <label className="text-gray-200 block mb-2">{item.text}</label>
                              {item.options && (
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
                                    )
                                  })}
                                </div>
                              )}
                              {/* Photo upload */}
                              <div className="mt-3 space-y-2">
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
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Compressor Operation */}
                <div className="mb-6">
                  <h3 className="text-md font-semibold text-gray-300 mb-4">Compressor Operation</h3>
                  <div className="space-y-4">
                    {['compressorStatus', 'noiseVibration'].map((itemId) => {
                      const item = currentSectionData.items.find(i => i.id === itemId);
                      if (!item) return null;
                      return (
                        <div key={item.id} className="border-b border-gray-700 pb-4 last:border-b-0">
                          <div className="flex items-start space-x-3">
                            <div className="flex-1">
                              <label className="text-gray-200 block mb-2">{item.text}</label>
                              {item.options && (
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
                                    )
                                  })}
                                </div>
                              )}
                              {/* Notes for noiseVibration */}
                              {item.id === 'noiseVibration' && (
                                <div className="mt-3">
                                  <textarea
                                    value={item.notes || ''}
                                    onChange={(e) => updateNotes(currentSectionData.id, item.id, e.target.value)}
                                    placeholder="Add notes about noise or vibration..."
                                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-sm"
                                    rows={3}
                                  />
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Cooling Performance (ΔT) */}
                <div className="mb-6">
                  <h3 className="text-md font-semibold text-gray-300 mb-4">Cooling Performance (ΔT)</h3>
                  <div className="space-y-4">
                    {(() => {
                      const returnAirItem = currentSectionData.items.find(i => i.id === 'returnAirTemp');
                      const supplyAirItem = currentSectionData.items.find(i => i.id === 'supplyAirTemp');
                      const deltaTItem = currentSectionData.items.find(i => i.id === 'deltaTInterpretation');
                      
                      const returnTemp = returnAirItem?.numericValue ? parseFloat(returnAirItem.numericValue) : null;
                      const supplyTemp = supplyAirItem?.numericValue ? parseFloat(supplyAirItem.numericValue) : null;
                      const deltaT = (returnTemp !== null && supplyTemp !== null) ? returnTemp - supplyTemp : null;
                      
                      let deltaTLabel = '';
                      let deltaTColor = 'text-gray-400';
                      if (deltaT !== null) {
                        if (deltaT < 10) {
                          deltaTLabel = 'Low ΔT — possible refrigerant or airflow issue';
                          deltaTColor = 'text-yellow-400';
                        } else if (deltaT >= 10 && deltaT <= 25) {
                          deltaTLabel = 'Normal cooling ΔT';
                          deltaTColor = 'text-green-400';
                        } else if (deltaT > 25) {
                          deltaTLabel = 'High ΔT — likely airflow restriction';
                          deltaTColor = 'text-orange-400';
                        }
                      }
                      
                      return (
                        <>
                          {/* Return Air Temperature */}
                          {returnAirItem && (
                            <div className="border-b border-gray-700 pb-4">
                              <label className="block text-sm text-gray-300 mb-2">{returnAirItem.text}</label>
                              <input
                                type="number"
                                value={returnAirItem.numericValue || ''}
                                onChange={(e) => {
                                  if (!checklist) return;
                                  setChecklist(prev => {
                                    if (!prev) return prev;
                                    return {
                                      ...prev,
                                      sections: prev.sections.map(section =>
                                        section.id === currentSectionData.id
                                          ? {
                                              ...section,
                                              items: section.items.map(item =>
                                                item.id === 'returnAirTemp'
                                                  ? { ...item, numericValue: e.target.value }
                                                  : item
                                              )
                                            }
                                          : section
                                      )
                                    };
                                  });
                                }}
                                placeholder="Enter temperature"
                                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                            </div>
                          )}
                          
                          {/* Supply Air Temperature */}
                          {supplyAirItem && (
                            <div className="border-b border-gray-700 pb-4">
                              <label className="block text-sm text-gray-300 mb-2">{supplyAirItem.text}</label>
                              <input
                                type="number"
                                value={supplyAirItem.numericValue || ''}
                                onChange={(e) => {
                                  if (!checklist) return;
                                  setChecklist(prev => {
                                    if (!prev) return prev;
                                    return {
                                      ...prev,
                                      sections: prev.sections.map(section =>
                                        section.id === currentSectionData.id
                                          ? {
                                              ...section,
                                              items: section.items.map(item =>
                                                item.id === 'supplyAirTemp'
                                                  ? { ...item, numericValue: e.target.value }
                                                  : item
                                              )
                                            }
                                          : section
                                      )
                                    };
                                  });
                                }}
                                placeholder="Enter temperature"
                                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                            </div>
                          )}
                          
                          {/* Delta T Display */}
                          {deltaTItem && (
                            <div className="border-b border-gray-700 pb-4">
                              <label className="block text-sm text-gray-300 mb-2">{deltaTItem.text}</label>
                              {deltaT !== null ? (
                                <div className="p-3 bg-gray-800 rounded-lg border border-gray-700">
                                  <div className="text-sm text-gray-400 mb-1">
                                    ΔT = {returnTemp}°F - {supplyTemp}°F = <span className="text-white font-semibold">{deltaT.toFixed(1)}°F</span>
                                  </div>
                                  <div className={`text-sm font-medium ${deltaTColor}`}>
                                    {deltaTLabel}
                                  </div>
                                </div>
                              ) : (
                                <div className="text-sm text-gray-500 italic">
                                  Enter both return and supply air temperatures to calculate ΔT
                                </div>
                              )}
                            </div>
                          )}
                        </>
                      );
                    })()}
                  </div>
                </div>
              </>
            ) : currentSectionData.title === 'Heating Checks' ? (
              <>
                {/* Heating System Type */}
                <div className="mb-6">
                  <h3 className="text-md font-semibold text-gray-300 mb-4">Heating System</h3>
                  <div className="space-y-4">
                    {(() => {
                      const item = currentSectionData.items.find(i => i.id === 'heatingSystemType');
                      if (!item) return null;
                      return (
                        <div className="border-b border-gray-700 pb-4">
                          <label className="text-gray-200 block mb-2">{item.text}</label>
                          {item.options && (
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
                                )
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                </div>

                {/* Airflow & Filters */}
                <div className="mb-6">
                  <h3 className="text-md font-semibold text-gray-300 mb-4">Airflow & Filters</h3>
                  <div className="space-y-4">
                    {['supplyFanRunning', 'supplyAirflowStrength', 'filtersCondition'].map((itemId) => {
                      const item = currentSectionData.items.find(i => i.id === itemId);
                      if (!item) return null;
                      return (
                        <div key={item.id} className="border-b border-gray-700 pb-4 last:border-b-0">
                          <div className="flex items-start space-x-3">
                            <div className="flex-1">
                              <label className="text-gray-200 block mb-2">{item.text}</label>
                              {item.options && (
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
                                    )
                                  })}
                                </div>
                              )}
                              {/* Photo upload for filters */}
                              {item.id === 'filtersCondition' && (
                                <div className="mt-3 space-y-2">
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
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Heating Element Status */}
                <div className="mb-6">
                  <h3 className="text-md font-semibold text-gray-300 mb-4">Heating Element Status</h3>
                  <div className="space-y-4">
                    {['heatingElementStatus', 'gasValveEnergized', 'burnersLit', 'electricHeatOn', 'heatPumpRunning'].map((itemId) => {
                      const item = currentSectionData.items.find(i => i.id === itemId);
                      if (!item) return null;
                      // Check if item should be shown based on conditionalOn
                      if (item.conditionalOn) {
                        const referencedItem = currentSectionData.items.find(i => i.id === item.conditionalOn!.itemId);
                        if (referencedItem) {
                          const selectedValue = referencedItem.selectedOptions?.[0] || referencedItem.selectedOption;
                          if (!selectedValue || selectedValue !== item.conditionalOn!.option) {
                            return null;
                          }
                        } else {
                          return null;
                        }
                      }
                      return (
                        <div key={item.id} className="border-b border-gray-700 pb-4 last:border-b-0">
                          <div className="flex items-start space-x-3">
                            <div className="flex-1">
                              <label className="text-gray-200 block mb-2">{item.text}</label>
                              {item.options && (
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
                                    )
                                  })}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Noise & Vibration */}
                <div className="mb-6">
                  <h3 className="text-md font-semibold text-gray-300 mb-4">Noise & Vibration</h3>
                  <div className="space-y-4">
                    {(() => {
                      const item = currentSectionData.items.find(i => i.id === 'noiseVibration');
                      if (!item) return null;
                      return (
                        <div className="border-b border-gray-700 pb-4">
                          <label className="text-gray-200 block mb-2">{item.text}</label>
                          {item.options && (
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
                                )
                              })}
                            </div>
                          )}
                          {item.notes !== undefined && (
                            <textarea
                              value={item.notes || ''}
                              onChange={(e) => updateNotes(currentSectionData.id, item.id, e.target.value)}
                              placeholder="Add notes about noise/vibration..."
                              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none mt-2"
                              rows={2}
                            />
                          )}
                        </div>
                      );
                    })()}
                  </div>
                </div>

                {/* Temperature Rise (Heating Performance) */}
                <div className="mb-6">
                  <h3 className="text-md font-semibold text-gray-300 mb-4">Heating Performance (Temperature Rise)</h3>
                  <div className="space-y-4">
                    {(() => {
                      const returnAirItem = currentSectionData.items.find(i => i.id === 'returnAirTemp');
                      const supplyAirItem = currentSectionData.items.find(i => i.id === 'supplyAirTemp');
                      const tempRiseItem = currentSectionData.items.find(i => i.id === 'temperatureRiseInterpretation');
                      
                      const returnTemp = returnAirItem?.numericValue ? parseFloat(returnAirItem.numericValue) : null;
                      const supplyTemp = supplyAirItem?.numericValue ? parseFloat(supplyAirItem.numericValue) : null;
                      const tempRise = (returnTemp !== null && supplyTemp !== null) ? supplyTemp - returnTemp : null;
                      
                      let tempRiseLabel = '';
                      let tempRiseColor = 'text-gray-400';
                      if (tempRise !== null) {
                        if (tempRise < 15) {
                          tempRiseLabel = 'Low temperature rise — possible airflow or heating element issue';
                          tempRiseColor = 'text-yellow-400';
                        } else if (tempRise >= 15 && tempRise <= 50) {
                          tempRiseLabel = 'Normal heating temperature rise';
                          tempRiseColor = 'text-green-400';
                        } else if (tempRise > 50) {
                          tempRiseLabel = 'High temperature rise — possible airflow restriction';
                          tempRiseColor = 'text-orange-400';
                        }
                      }
                      
                      return (
                        <>
                          {/* Return Air Temperature */}
                          {returnAirItem && (
                            <div className="border-b border-gray-700 pb-4">
                              <label className="block text-sm text-gray-300 mb-2">{returnAirItem.text}</label>
                              <input
                                type="number"
                                value={returnAirItem.numericValue || ''}
                                onChange={(e) => {
                                  if (!checklist) return;
                                  setChecklist(prev => {
                                    if (!prev) return prev;
                                    return {
                                      ...prev,
                                      sections: prev.sections.map(section =>
                                        section.id === currentSectionData.id
                                          ? {
                                              ...section,
                                              items: section.items.map(item =>
                                                item.id === 'returnAirTemp'
                                                  ? { ...item, numericValue: e.target.value }
                                                  : item
                                              )
                                            }
                                          : section
                                      )
                                    };
                                  });
                                }}
                                placeholder="Enter temperature"
                                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                            </div>
                          )}
                          
                          {/* Supply Air Temperature */}
                          {supplyAirItem && (
                            <div className="border-b border-gray-700 pb-4">
                              <label className="block text-sm text-gray-300 mb-2">{supplyAirItem.text}</label>
                              <input
                                type="number"
                                value={supplyAirItem.numericValue || ''}
                                onChange={(e) => {
                                  if (!checklist) return;
                                  setChecklist(prev => {
                                    if (!prev) return prev;
                                    return {
                                      ...prev,
                                      sections: prev.sections.map(section =>
                                        section.id === currentSectionData.id
                                          ? {
                                              ...section,
                                              items: section.items.map(item =>
                                                item.id === 'supplyAirTemp'
                                                  ? { ...item, numericValue: e.target.value }
                                                  : item
                                              )
                                            }
                                          : section
                                      )
                                    };
                                  });
                                }}
                                placeholder="Enter temperature"
                                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                            </div>
                          )}
                          
                          {/* Temperature Rise Display */}
                          {tempRiseItem && (
                            <div className="border-b border-gray-700 pb-4">
                              <label className="block text-sm text-gray-300 mb-2">{tempRiseItem.text}</label>
                              {tempRise !== null ? (
                                <div className={`${tempRiseColor} font-medium`}>
                                  {tempRise.toFixed(1)}°F — {tempRiseLabel}
                                </div>
                              ) : (
                                <div className="text-sm text-gray-500 italic">
                                  Enter both return and supply air temperatures to calculate temperature rise
                                </div>
                              )}
                            </div>
                          )}
                        </>
                      );
                    })()}
                  </div>
                </div>
              </>
            ) : currentSectionData.title === 'Airflow diagnostics' ? (
              <>
                {/* Info messages */}
                {currentSectionData.items.filter(item => item.isInfoMessage).map((item) => (
                  <div key={item.id} className="mb-4 p-3 bg-blue-900/30 border border-blue-700 rounded-lg">
                    <p className="text-sm text-blue-200">{item.text}</p>
                  </div>
                ))}
                
                {/* Normal checklist items */}
                <div className="space-y-3">
                  {currentSectionData.items.filter((item) => {
                    if (item.isBlockingMessage || item.isInfoMessage) return false;
                    if (item.id === 'staticPressureInterpretation' || item.id === 'af-deltat-after-interpretation') return false; // Don't render the interpretation items in the normal list
                    if (item.isActionItem) return false; // Action items are rendered separately
                    if (item.conditionalOn) {
                      const referencedItem = currentSectionData.items.find(i => i.id === item.conditionalOn!.itemId);
                      if (referencedItem) {
                        const selectedValue = referencedItem.selectedOptions?.[0] || referencedItem.selectedOption;
                        return selectedValue !== undefined && selectedValue === item.conditionalOn!.option;
                      }
                      return false;
                    }
                    return true;
                  }).map((item) => (
                    <div key={item.id} className="border-b border-gray-700 pb-3 last:border-b-0">
                      <div className="flex items-start space-x-3">
                        <div className="flex-1">
                          <label className="text-gray-200 block mb-2">{item.text}</label>
                          {item.options && (
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
                                )
                              })}
                            </div>
                          )}
                          {item.numericValue !== undefined && (
                            <>
                              <input
                                type="number"
                                value={item.numericValue || ''}
                                onChange={(e) => {
                                  if (!checklist) return;
                                  setChecklist(prev => {
                                    if (!prev) return prev;
                                    return {
                                      ...prev,
                                      sections: prev.sections.map(section =>
                                        section.id === currentSectionData.id
                                          ? {
                                              ...section,
                                              items: section.items.map(i =>
                                                i.id === item.id
                                                  ? { ...i, numericValue: e.target.value }
                                                  : i
                                              )
                                            }
                                          : section
                                      )
                                    };
                                  });
                                }}
                                placeholder={`Enter ${item.unit || 'value'}`}
                                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                              {/* Show delta T after fixes interpretation right after supply air input */}
                              {item.id === 'af-deltat-after-supply' && (() => {
                                const returnAirItem = currentSectionData.items.find(i => i.id === 'af-deltat-after-return');
                                const supplyAirItem = currentSectionData.items.find(i => i.id === 'af-deltat-after-supply');
                                const deltaTItem = currentSectionData.items.find(i => i.id === 'af-deltat-after-interpretation');
                                
                                if (!deltaTItem || !returnAirItem || !supplyAirItem) return null;
                                
                                const returnTemp = returnAirItem?.numericValue ? parseFloat(returnAirItem.numericValue) : null;
                                const supplyTemp = supplyAirItem?.numericValue ? parseFloat(supplyAirItem.numericValue) : null;
                                const deltaT = (returnTemp !== null && supplyTemp !== null) ? returnTemp - supplyTemp : null;
                                
                                let deltaTLabel = '';
                                let deltaTColor = 'text-gray-400';
                                if (deltaT !== null) {
                                  if (deltaT < 10) {
                                    deltaTLabel = 'Low ΔT — possible refrigerant or airflow issue';
                                    deltaTColor = 'text-yellow-400';
                                  } else if (deltaT >= 10 && deltaT <= 25) {
                                    deltaTLabel = 'Normal cooling ΔT';
                                    deltaTColor = 'text-green-400';
                                  } else if (deltaT > 25) {
                                    deltaTLabel = 'High ΔT — likely airflow restriction';
                                    deltaTColor = 'text-orange-400';
                                  }
                                }
                                
                                return (
                                  <div className="mt-4 border-t border-gray-700 pt-4">
                                    <label className="block text-sm text-gray-300 mb-2">{deltaTItem.text}</label>
                                    {deltaT !== null ? (
                                      <div className="p-3 bg-gray-800 rounded-lg border border-gray-700">
                                        <div className="text-sm text-gray-400 mb-1">
                                          ΔT = {returnTemp}°F - {supplyTemp}°F = <span className="text-white font-semibold">{deltaT.toFixed(1)}°F</span>
                                        </div>
                                        <div className={`text-sm font-medium ${deltaTColor}`}>
                                          {deltaTLabel}
                                        </div>
                                      </div>
                                    ) : (
                                      <div className="text-sm text-gray-500 italic">
                                        Enter both return and supply air temperatures to calculate ΔT
                                      </div>
                                    )}
                                  </div>
                                );
                              })()}
                              
                              {/* Show static pressure interpretation right after supply static pressure input */}
                              {item.id === 'af-supply-static' && (() => {
                                const returnStaticItem = currentSectionData.items.find(i => i.id === 'af-return-static');
                                const supplyStaticItem = currentSectionData.items.find(i => i.id === 'af-supply-static');
                                const staticPressureItem = currentSectionData.items.find(i => i.id === 'staticPressureInterpretation');
                                const staticActionItem = currentSectionData.items.find(i => i.id === 'af-static-action');
                                
                                if (!staticPressureItem || !returnStaticItem || !supplyStaticItem) return null;
                                
                                const returnStatic = returnStaticItem?.numericValue ? parseFloat(returnStaticItem.numericValue) : null;
                                const supplyStatic = supplyStaticItem?.numericValue ? parseFloat(supplyStaticItem.numericValue) : null;
                                const totalStatic = (returnStatic !== null && supplyStatic !== null) ? returnStatic + supplyStatic : null;
                                
                                let staticLabel = '';
                                let staticColor = 'text-gray-400';
                                const hasHighStatic = totalStatic !== null && totalStatic > 1.0;
                                if (totalStatic !== null) {
                                  if (hasHighStatic) {
                                    staticLabel = 'High static pressure — possible airflow restriction';
                                    staticColor = 'text-orange-400';
                                  } else {
                                    staticLabel = 'Normal static pressure';
                                    staticColor = 'text-green-400';
                                  }
                                }
                                
                                return (
                                  <>
                                    <div className="mt-4 border-t border-gray-700 pt-4">
                                      <label className="block text-sm text-gray-300 mb-2">{staticPressureItem.text}</label>
                                      {totalStatic !== null ? (
                                        <div className="p-3 bg-gray-800 rounded-lg border border-gray-700">
                                          <div className="text-sm text-gray-400 mb-1">
                                            Total Static = {returnStatic} in wc + {supplyStatic} in wc = <span className="text-white font-semibold">{totalStatic.toFixed(2)} in wc</span>
                                          </div>
                                          <div className={`text-sm font-medium ${staticColor}`}>
                                            {staticLabel}
                                          </div>
                                        </div>
                                      ) : (
                                        <div className="text-sm text-gray-500 italic">
                                          Enter both return and supply static pressures to calculate total static pressure
                                        </div>
                                      )}
                                    </div>
                                    {/* Show static pressure action item if high static */}
                                    {hasHighStatic && staticActionItem && (
                                      <div className="mt-4 p-3 bg-orange-900/20 border border-orange-700/50 rounded-lg">
                                        <div className="flex items-start space-x-3">
                                          <input
                                            type="checkbox"
                                            checked={staticActionItem.checked || false}
                                            onChange={(e) => {
                                              if (!checklist) return;
                                              setChecklist(prev => {
                                                if (!prev) return prev;
                                                return {
                                                  ...prev,
                                                  sections: prev.sections.map(section =>
                                                    section.id === currentSectionData.id
                                                      ? {
                                                          ...section,
                                                          items: section.items.map(i =>
                                                            i.id === staticActionItem.id
                                                              ? { ...i, checked: e.target.checked }
                                                              : i
                                                          )
                                                        }
                                                      : section
                                                  )
                                                };
                                              });
                                            }}
                                            className="mt-1 w-5 h-5 text-orange-600 bg-gray-700 border-gray-600 rounded focus:ring-orange-500 focus:ring-2"
                                          />
                                          <div className="flex-1">
                                            <label className="text-gray-200 font-medium block mb-2">{staticActionItem.text}</label>
                                            <div className="mt-2 space-y-2">
                                              <div className="flex items-center space-x-2">
                                                <label className="text-xs text-gray-400">[Optional] Attach Photos:</label>
                                                <input
                                                  type="file"
                                                  accept="image/*"
                                                  onChange={(e) => handleImageUpload(currentSectionData.id, staticActionItem.id, e)}
                                                  className="hidden"
                                                  id={`image-upload-action-${staticActionItem.id}`}
                                                />
                                                <label
                                                  htmlFor={`image-upload-action-${staticActionItem.id}`}
                                                  className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded cursor-pointer transition-colors"
                                                >
                                                  + Add Photo
                                                </label>
                                              </div>
                                              {staticActionItem.images && staticActionItem.images.length > 0 && (
                                                <div className="flex flex-wrap gap-2 mt-2">
                                                  {staticActionItem.images.map((image, index) => (
                                                    <div key={index} className="relative group">
                                                      <img
                                                        src={image}
                                                        alt={`Attachment ${index + 1}`}
                                                        className="w-20 h-20 object-cover rounded border border-gray-600"
                                                      />
                                                      <button
                                                        onClick={() => removeImage(currentSectionData.id, staticActionItem.id, index)}
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
                                        </div>
                                      </div>
                                    )}
                                  </>
                                );
                              })()}
                            </>
                          )}
                          {(item.id === 'af-blower-wheel' || item.id === 'af-filters-recheck' || item.id === 'af-evap-recheck') && (
                            <div className="mt-3 space-y-2">
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
                          )}
                          
                          {/* Render action items inline after the triggering question */}
                          {(() => {
                            // Skip static pressure action - it's handled separately after the interpretation
                            if (item.id === 'af-supply-static') return null;
                            
                            const relatedActionItems = currentSectionData.items.filter((actionItem) => {
                              if (!actionItem.isActionItem) return false;
                              // Skip static pressure action - handled separately
                              if (actionItem.id === 'af-static-action') return false;
                              // Check if this action item is triggered by the current item
                              if (actionItem.conditionalOn && actionItem.conditionalOn.itemId === item.id) {
                                const selectedValue = item.selectedOptions?.[0] || item.selectedOption;
                                return selectedValue !== undefined && selectedValue === actionItem.conditionalOn.option;
                              }
                              return false;
                            });
                            
                            if (relatedActionItems.length === 0) return null;
                            
                            return (
                              <div className="mt-4 space-y-3">
                                {relatedActionItems.map((actionItem) => (
                                  <div key={actionItem.id} className="p-3 bg-orange-900/20 border border-orange-700/50 rounded-lg">
                                    <div className="flex items-start space-x-3">
                                      <input
                                        type="checkbox"
                                        checked={actionItem.checked || false}
                                        onChange={(e) => {
                                          if (!checklist) return;
                                          setChecklist(prev => {
                                            if (!prev) return prev;
                                            return {
                                              ...prev,
                                              sections: prev.sections.map(section =>
                                                section.id === currentSectionData.id
                                                  ? {
                                                      ...section,
                                                      items: section.items.map(i =>
                                                        i.id === actionItem.id
                                                          ? { ...i, checked: e.target.checked }
                                                          : i
                                                      )
                                                    }
                                                  : section
                                              )
                                            };
                                          });
                                        }}
                                        className="mt-1 w-5 h-5 text-orange-600 bg-gray-700 border-gray-600 rounded focus:ring-orange-500 focus:ring-2"
                                      />
                                      <div className="flex-1">
                                            <label className="text-gray-200 font-medium block mb-2">{actionItem.text}</label>
                                            <div className="mt-2 space-y-2">
                                              <div className="flex items-center space-x-2">
                                                <label className="text-xs text-gray-400">[Optional] Attach Photos:</label>
                                            <input
                                              type="file"
                                              accept="image/*"
                                              onChange={(e) => handleImageUpload(currentSectionData.id, actionItem.id, e)}
                                              className="hidden"
                                              id={`image-upload-action-${actionItem.id}`}
                                            />
                                            <label
                                              htmlFor={`image-upload-action-${actionItem.id}`}
                                              className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded cursor-pointer transition-colors"
                                            >
                                              + Add Photo
                                            </label>
                                          </div>
                                          {actionItem.images && actionItem.images.length > 0 && (
                                            <div className="flex flex-wrap gap-2 mt-2">
                                              {actionItem.images.map((image, index) => (
                                                <div key={index} className="relative group">
                                                  <img
                                                    src={image}
                                                    alt={`Attachment ${index + 1}`}
                                                    className="w-20 h-20 object-cover rounded border border-gray-600"
                                                  />
                                                  <button
                                                    onClick={() => removeImage(currentSectionData.id, actionItem.id, index)}
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
                                    </div>
                                  </div>
                                ))}
                              </div>
                            );
                          })()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Evaluation and outcome message */}
                {(() => {
                  if (!checklist) return null;
                  
                  const getValue = (itemId: string) => {
                    const item = currentSectionData.items.find(i => i.id === itemId);
                    return item?.selectedOptions?.[0] || item?.selectedOption;
                  };
                  
                  const getNumericValue = (itemId: string): number | null => {
                    const item = currentSectionData.items.find(i => i.id === itemId);
                    if (item?.numericValue) {
                      const num = parseFloat(item.numericValue);
                      return isNaN(num) ? null : num;
                    }
                    return null;
                  };
                  
                  const beltCondition = getValue('af-belt-condition');
                  const beltTension = getValue('af-belt-tension');
                  const blowerWheel = getValue('af-blower-wheel');
                  const returnStatic = getNumericValue('af-return-static');
                  const supplyStatic = getNumericValue('af-supply-static');
                  const filtersRecheck = getValue('af-filters-recheck');
                  const evapRecheck = getValue('af-evap-recheck');
                  const airflowImproved = getValue('af-airflow-improved');
                  const deltatAfterReturn = getNumericValue('af-deltat-after-return');
                  const deltatAfterSupply = getNumericValue('af-deltat-after-supply');
                  const deltatAfter = (deltatAfterReturn !== null && deltatAfterSupply !== null) ? deltatAfterReturn - deltatAfterSupply : null;
                  const deltatImproved = deltatAfter !== null && deltatAfter >= 10 && deltatAfter <= 25; // Normal range
                  
                  // Check for airflow issues found
                  const hasBeltIssue = beltCondition === 'Broken' || beltCondition === 'Frayed' || beltTension === 'Loose';
                  const hasBlowerIssue = blowerWheel === 'Dust-matted / very dirty';
                  const totalStatic = (returnStatic !== null && supplyStatic !== null) ? returnStatic + supplyStatic : null;
                  const hasHighStatic = totalStatic !== null && totalStatic > 1.0;
                  const hasFilterIssue = filtersRecheck === 'Clogged';
                  const hasEvapIssue = evapRecheck === 'Heavily iced' || evapRecheck === 'Plugged';
                  
                  const hasAirflowIssue = hasBeltIssue || hasBlowerIssue || hasHighStatic || hasFilterIssue || hasEvapIssue;
                  
                  // Check if everything looks normal but airflow still weak
                  const allNormal = 
                    beltCondition === 'Intact' && 
                    beltTension === 'Proper' && 
                    blowerWheel !== 'Dust-matted / very dirty' &&
                    (totalStatic === null || totalStatic <= 1.0) &&
                    filtersRecheck !== 'Clogged' &&
                    evapRecheck !== 'Heavily iced' && evapRecheck !== 'Plugged';
                  
                  const airflowStillWeak = airflowImproved === 'No' && allNormal;
                  
                  if (airflowStillWeak) {
                    return (
                      <div className="mt-6 p-4 bg-yellow-900/30 border border-yellow-700 rounded-lg">
                        <p className="text-sm font-medium text-yellow-200 mb-1">⚠ Consider further investigation</p>
                        <p className="text-xs text-yellow-300 mb-2">Blower, belts, filters, coil, and static pressure all appear normal, but airflow is still weak.</p>
                        <p className="text-xs text-yellow-300">Consider checking duct issues beyond the unit, or moving to Refrigerant or Control/Economizer diagnostics depending on ΔT.</p>
                      </div>
                    );
                  } else if (hasAirflowIssue && (airflowImproved === 'No' || (deltatAfter !== null && !deltatImproved))) {
                    return (
                      <div className="mt-6 p-4 bg-orange-900/30 border border-orange-700 rounded-lg">
                        <p className="text-sm font-medium text-orange-200 mb-1">Airflow issues found</p>
                        <p className="text-xs text-orange-300">Issues detected but not yet resolved. Continue troubleshooting or apply fixes.</p>
                      </div>
                    );
                  }
                  
                  return null;
                })()}
                
                {/* Primary cause found question logic */}
                {(() => {
                  if (!checklist) return null;
                  const getValue = (itemId: string) => {
                    const item = currentSectionData.items.find(i => i.id === itemId);
                    return item?.selectedOptions?.[0] || item?.selectedOption;
                  };
                  
                  const primaryCauseFound = getValue('af-primary-cause-found');
                  if (primaryCauseFound === 'Yes') {
                    // Collect completed action items for auto-import into wrap-up notes
                    const completedActionItems = currentSectionData.items
                      .filter(item => item.isActionItem && item.checked)
                      .map(item => item.text);
                    
                    return (
                      <div className="mt-6 p-4 bg-green-900/30 border border-green-700 rounded-lg">
                        <p className="text-sm font-medium text-green-200 mb-1">✓ Primary cause identified</p>
                        <p className="text-xs text-green-300 mb-3">Root cause: Airflow issue. You can proceed to wrap up or continue with additional checks if needed.</p>
                        {completedActionItems.length > 0 && (
                          <p className="text-xs text-green-300 mb-3">
                            Completed actions will be auto-imported into wrap-up notes: {completedActionItems.join(', ')}
                          </p>
                        )}
                        <button
                          onClick={() => {
                            // Auto-import completed action items into wrap-up notes
                            if (completedActionItems.length > 0) {
                              const actionItemsText = completedActionItems.map(item => `• ${item}`).join('\n');
                              setWrapUpNotes(prev => {
                                const existing = prev.trim();
                                return existing 
                                  ? `${existing}\n\nCompleted Actions:\n${actionItemsText}`
                                  : `Completed Actions:\n${actionItemsText}`;
                              });
                            }
                            
                            const wrapUpSection = checklist.sections.find(s => s.title === 'Wrap up');
                            if (wrapUpSection) {
                              const index = checklist.sections.findIndex(s => s.id === wrapUpSection.id);
                              setCurrentSection(index + 1);
                              setChosenWrapUp(true);
                            }
                          }}
                          className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm rounded-lg transition-colors"
                        >
                          Go to Wrap up
                        </button>
                      </div>
                    );
                  } else if (primaryCauseFound === 'No') {
                    // Generate next-step suggestions and show popup
                    const coolingChecksSection = checklist.sections.find(s => s.title === 'Cooling Checks');
                    const coolingChecksData = coolingChecksSection ? buildRTUCoolingChecksContext() : undefined;
                    const suggestions = generateNextStepSuggestions(
                      currentSectionData.title,
                      currentSectionData,
                      coolingChecksData || undefined
                    );
                    
                    if (suggestions.length > 0) {
                      return (
                        <div className="mt-6 p-4 bg-blue-900/30 border border-blue-700 rounded-lg">
                          <p className="text-sm font-medium text-blue-200 mb-3">Continue troubleshooting</p>
                          <button
                            onClick={() => {
                              setHypotheses(suggestions);
                              setHypothesesOpen(true);
                            }}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors"
                          >
                            View suggested next steps
                          </button>
                        </div>
                      );
                    }
                  }
                  
                  return null;
                })()}
              </>
            ) : currentSectionData.title === 'Condenser diagnostics' ? (
              <>
                {/* Info messages */}
                {currentSectionData.items.filter(item => item.isInfoMessage).map((item) => (
                  <div key={item.id} className="mb-4 p-3 bg-blue-900/30 border border-blue-700 rounded-lg">
                    <p className="text-sm text-blue-200">{item.text}</p>
                  </div>
                ))}
                
                {/* Normal checklist items */}
                <div className="space-y-3">
                  {currentSectionData.items.filter((item) => {
                    if (item.isBlockingMessage || item.isInfoMessage) return false;
                    // Show voltage/capacitor checks only if any fan is not running
                    if (item.id === 'cd-fan-voltage' || item.id === 'cd-capacitor') {
                      const fan1Status = currentSectionData.items.find(i => i.id === 'cd-fan-1-status')?.selectedOptions?.[0] || currentSectionData.items.find(i => i.id === 'cd-fan-1-status')?.selectedOption;
                      const fan2Status = currentSectionData.items.find(i => i.id === 'cd-fan-2-status')?.selectedOptions?.[0] || currentSectionData.items.find(i => i.id === 'cd-fan-2-status')?.selectedOption;
                      const fan3Status = currentSectionData.items.find(i => i.id === 'cd-fan-3-status')?.selectedOptions?.[0] || currentSectionData.items.find(i => i.id === 'cd-fan-3-status')?.selectedOption;
                      const hasFanNotRunning = fan1Status === 'Not running' || fan2Status === 'Not running' || fan3Status === 'Not running';
                      return hasFanNotRunning;
                    }
                    return true;
                  }).map((item) => (
                    <div key={item.id} className="border-b border-gray-700 pb-3 last:border-b-0">
                      <div className="flex items-start space-x-3">
                        <div className="flex-1">
                          <label className="text-gray-200 block mb-2">{item.text}</label>
                          {item.options && (
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
                                )
                              })}
                            </div>
                          )}
                          {item.numericValue !== undefined && (
                            <input
                              type="number"
                              value={item.numericValue || ''}
                              onChange={(e) => {
                                if (!checklist) return;
                                setChecklist(prev => {
                                  if (!prev) return prev;
                                  return {
                                    ...prev,
                                    sections: prev.sections.map(section =>
                                      section.id === currentSectionData.id
                                        ? {
                                            ...section,
                                            items: section.items.map(i =>
                                              i.id === item.id
                                                ? { ...i, numericValue: e.target.value }
                                                : i
                                            )
                                          }
                                        : section
                                    )
                                  };
                                });
                              }}
                              placeholder={`Enter ${item.unit || 'value'}`}
                              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          )}
                          {item.id === 'cd-coil-visual' && (
                            <div className="mt-3 space-y-2">
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
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Evaluation and outcome message */}
                {(() => {
                  if (!checklist) return null;
                  
                  const getValue = (itemId: string) => {
                    const item = currentSectionData.items.find(i => i.id === itemId);
                    return item?.selectedOptions?.[0] || item?.selectedOption;
                  };
                  
                  const fan1Status = getValue('cd-fan-1-status');
                  const fan2Status = getValue('cd-fan-2-status');
                  const fan3Status = getValue('cd-fan-3-status');
                  const coilVisual = getValue('cd-coil-visual');
                  const coilCleaned = getValue('cd-coil-cleaned');
                  const fansRunning = getValue('cd-fans-running');
                  const coilClear = getValue('cd-coil-clear');
                  const headPressure = getValue('cd-head-pressure');
                  
                  // Check for condenser issues found
                  const hasFanIssue = fan1Status === 'Not running' || fan2Status === 'Not running' || fan3Status === 'Not running' ||
                                    fan1Status === 'Noisy' || fan2Status === 'Noisy' || fan3Status === 'Noisy' ||
                                    fan1Status === 'Intermittent' || fan2Status === 'Intermittent' || fan3Status === 'Intermittent';
                  const hasCoilIssue = coilVisual === 'Heavily clogged' || coilVisual === 'Blocked by debris';
                  
                  const hasCondenserIssue = hasFanIssue || hasCoilIssue;
                  
                  // Check if issue is resolved
                  const issueResolved = (fansRunning === 'Yes' && coilClear === 'Yes') && hasCondenserIssue;
                  
                  // Check if everything looks good
                  const allGood = 
                    (fan1Status === 'Running' || !fan1Status) &&
                    (fan2Status === 'Running' || fan2Status === 'N/A (single fan unit)' || !fan2Status) &&
                    (fan3Status === 'Running' || fan3Status === 'N/A' || !fan3Status) &&
                    (coilVisual === 'Clean' || coilVisual === 'Dusty') &&
                    coilCleaned === 'No';
                  
                  // Get deltaT from Cooling Checks section to suggest next steps
                  const coolingChecksSection = checklist.sections.find(s => s.title === 'Cooling Checks');
                  const returnAirItem = coolingChecksSection?.items.find(i => i.id === 'returnAirTemp');
                  const supplyAirItem = coolingChecksSection?.items.find(i => i.id === 'supplyAirTemp');
                  const returnTemp = returnAirItem?.numericValue ? parseFloat(returnAirItem.numericValue) : null;
                  const supplyTemp = supplyAirItem?.numericValue ? parseFloat(supplyAirItem.numericValue) : null;
                  const deltaT = (returnTemp !== null && supplyTemp !== null) ? returnTemp - supplyTemp : null;
                  
                  if (issueResolved) {
                    return (
                      <div className="mt-6 p-4 bg-green-900/30 border border-green-700 rounded-lg">
                        <p className="text-sm font-medium text-green-200 mb-1">✓ Condenser issue confirmed and resolved</p>
                        <p className="text-xs text-green-300">The condenser problem has been identified and fixed. System should now be operating normally.</p>
                      </div>
                    );
                  } else if (allGood && hasCondenserIssue === false) {
                    // Everything looks good, suggest next steps based on deltaT
                    let suggestion = '';
                    if (deltaT !== null && deltaT < 10) {
                      suggestion = 'Consider moving to Refrigerant Diagnostics since ΔT is low.';
                    } else if (deltaT !== null && deltaT >= 10 && deltaT <= 25) {
                      suggestion = 'Consider moving to Control/Economizer Diagnostics since ΔT is normal.';
                    } else {
                      suggestion = 'Consider moving to Refrigerant or Control/Economizer Diagnostics depending on ΔT.';
                    }
                    
                    return (
                      <div className="mt-6 p-4 bg-blue-900/30 border border-blue-700 rounded-lg">
                        <p className="text-sm font-medium text-blue-200 mb-1">Condenser appears normal</p>
                        <p className="text-xs text-blue-300">All condenser fans are running and coil is clean. {suggestion}</p>
                      </div>
                    );
                  } else if (hasCondenserIssue && (fansRunning === 'No' || coilClear === 'No')) {
                    return (
                      <div className="mt-6 p-4 bg-orange-900/30 border border-orange-700 rounded-lg">
                        <p className="text-sm font-medium text-orange-200 mb-1">Condenser issues found</p>
                        <p className="text-xs text-orange-300">Issues detected but not yet resolved. Continue troubleshooting or apply fixes.</p>
                      </div>
                    );
                  }
                  
                  return null;
                })()}
                
                {/* Primary cause found question logic */}
                {(() => {
                  if (!checklist) return null;
                  const getValue = (itemId: string) => {
                    const item = currentSectionData.items.find(i => i.id === itemId);
                    return item?.selectedOptions?.[0] || item?.selectedOption;
                  };
                  
                  const primaryCauseFound = getValue('cd-primary-cause-found');
                  if (primaryCauseFound === 'Yes') {
                    return (
                      <div className="mt-6 p-4 bg-green-900/30 border border-green-700 rounded-lg">
                        <p className="text-sm font-medium text-green-200 mb-1">✓ Primary cause identified</p>
                        <p className="text-xs text-green-300 mb-3">Root cause: Condenser issue. You can proceed to wrap up or continue with additional checks if needed.</p>
                        <button
                          onClick={() => {
                            const wrapUpSection = checklist.sections.find(s => s.title === 'Wrap up');
                            if (wrapUpSection) {
                              const index = checklist.sections.findIndex(s => s.id === wrapUpSection.id);
                              setCurrentSection(index + 1);
                              setChosenWrapUp(true);
                            }
                          }}
                          className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm rounded-lg transition-colors"
                        >
                          Go to Wrap up
                        </button>
                      </div>
                    );
                  } else if (primaryCauseFound === 'No') {
                    // Generate next-step suggestions and show popup
                    const coolingChecksSection = checklist.sections.find(s => s.title === 'Cooling Checks');
                    const coolingChecksData = coolingChecksSection ? buildRTUCoolingChecksContext() : undefined;
                    const suggestions = generateNextStepSuggestions(
                      currentSectionData.title,
                      currentSectionData,
                      coolingChecksData || undefined
                    );
                    
                    if (suggestions.length > 0) {
                      return (
                        <div className="mt-6 p-4 bg-blue-900/30 border border-blue-700 rounded-lg">
                          <p className="text-sm font-medium text-blue-200 mb-3">Continue troubleshooting</p>
                          <button
                            onClick={() => {
                              setHypotheses(suggestions);
                              setHypothesesOpen(true);
                            }}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors"
                          >
                            View suggested next steps
                          </button>
                        </div>
                      );
                    }
                  }
                  
                  return null;
                })()}
              </>
            ) : currentSectionData.title === 'Compressor circuit diagnostics' ? (
              <>
                {/* Info messages */}
                {currentSectionData.items.filter(item => item.isInfoMessage).map((item) => (
                  <div key={item.id} className="mb-4 p-3 bg-blue-900/30 border border-blue-700 rounded-lg">
                    <p className="text-sm text-blue-200">{item.text}</p>
                  </div>
                ))}
                
                {/* Normal checklist items */}
                <div className="space-y-3">
                  {currentSectionData.items.filter((item) => {
                    if (item.isBlockingMessage || item.isInfoMessage) return false;
                    return true;
                  }).map((item) => (
                    <div key={item.id} className="border-b border-gray-700 pb-3 last:border-b-0">
                      <div className="flex items-start space-x-3">
                        <div className="flex-1">
                          <label className="text-gray-200 block mb-2">{item.text}</label>
                          {item.options && (
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
                                )
                              })}
                            </div>
                          )}
                          {item.numericValue !== undefined && (
                            <input
                              type="number"
                              value={item.numericValue || ''}
                              onChange={(e) => {
                                if (!checklist) return;
                                setChecklist(prev => {
                                  if (!prev) return prev;
                                  return {
                                    ...prev,
                                    sections: prev.sections.map(section =>
                                      section.id === currentSectionData.id
                                        ? {
                                            ...section,
                                            items: section.items.map(i =>
                                              i.id === item.id
                                                ? { ...i, numericValue: e.target.value }
                                                : i
                                            )
                                          }
                                        : section
                                    )
                                  };
                                });
                              }}
                              placeholder={`Enter ${item.unit || 'value'}`}
                              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Evaluation and outcome message */}
                {(() => {
                  if (!checklist) return null;
                  
                  const getValue = (itemId: string) => {
                    const item = currentSectionData.items.find(i => i.id === itemId);
                    return item?.selectedOptions?.[0] || item?.selectedOption;
                  };
                  
                  const contactorEnergized = getValue('cc-contactor-energized');
                  const contactorContacts = getValue('cc-contactor-contacts');
                  const lineVoltage = getValue('cc-line-voltage');
                  const loadVoltage = getValue('cc-load-voltage');
                  const capacitorCondition = getValue('cc-capacitor-condition');
                  const compressorBuzzing = getValue('cc-compressor-buzzing');
                  const compressorHot = getValue('cc-compressor-hot');
                  const overloadOpen = getValue('cc-overload-open');
                  const pressureSwitches = getValue('cc-pressure-switches');
                  const compressorRunning = getValue('cc-compressor-running');
                  const replacementNeeded = getValue('cc-replacement-needed');
                  
                  // Logic evaluation
                  let diagnosis = '';
                  let severity = 'info'; // 'info', 'warning', 'error', 'success'
                  
                  // Coil not energized → control/safety issue
                  if (contactorEnergized === 'No') {
                    diagnosis = 'Contactor coil not energized. This indicates a control or safety issue. Check thermostat call, control board, or safety switches (pressure switches, float switches, etc.).';
                    severity = 'warning';
                  }
                  // Coil energized but no load voltage → bad contactor
                  else if (contactorEnergized === 'Yes' && loadVoltage === 'No' && lineVoltage === 'Yes') {
                    diagnosis = 'Contactor coil is energized but load side has no voltage. This indicates a bad contactor - contacts may be pitted/burned or contactor is faulty.';
                    severity = 'error';
                  }
                  // Coil energized, load voltage present, compressor not starting + bad capacitor → start component failure
                  else if (contactorEnergized === 'Yes' && loadVoltage === 'Yes' && 
                           (capacitorCondition === 'Bulged' || capacitorCondition === 'Leaking' || capacitorCondition === 'Replaced') &&
                           (compressorBuzzing === 'Yes' || compressorRunning === 'No')) {
                    diagnosis = 'Start component failure confirmed. Contactor and voltage are good, but capacitor is faulty and compressor is not starting. Replace capacitor.';
                    severity = 'error';
                  }
                  // All of the above okay, but compressor locked / drawing high amps → compressor failure
                  else if (contactorEnergized === 'Yes' && loadVoltage === 'Yes' && 
                           (capacitorCondition === 'Normal' || !capacitorCondition) &&
                           (compressorHot === 'Yes' || overloadOpen === 'Yes' || compressorBuzzing === 'Yes') &&
                           compressorRunning === 'No') {
                    diagnosis = 'Compressor failure likely. Electrical circuit appears normal, but compressor is not starting and shows signs of mechanical failure (hot, overload open, or buzzing). Replacement likely required.';
                    severity = 'error';
                  }
                  // Compressor running after repair
                  else if (compressorRunning === 'Yes') {
                    diagnosis = 'Compressor is now running after repair. Issue resolved.';
                    severity = 'success';
                  }
                  // Contactor contacts pitted/burned
                  else if (contactorContacts === 'Yes') {
                    diagnosis = 'Contactor contacts are pitted/burned. Replace contactor.';
                    severity = 'warning';
                  }
                  // Pressure switches open
                  else if (pressureSwitches === 'Yes') {
                    diagnosis = 'High-pressure or low-pressure switch is open. Check system pressures and safety conditions before proceeding.';
                    severity = 'warning';
                  }
                  // Default: continue troubleshooting
                  else if (contactorEnergized === 'Yes' && loadVoltage === 'Yes') {
                    diagnosis = 'Electrical circuit appears normal. Continue troubleshooting compressor mechanical issues or check refrigerant system.';
                    severity = 'info';
                  }
                  
                  if (diagnosis) {
                    const bgColor = severity === 'success' ? 'bg-green-900/30 border-green-700' :
                                   severity === 'error' ? 'bg-red-900/30 border-red-700' :
                                   severity === 'warning' ? 'bg-orange-900/30 border-orange-700' :
                                   'bg-blue-900/30 border-blue-700';
                    const textColor = severity === 'success' ? 'text-green-200' :
                                    severity === 'error' ? 'text-red-200' :
                                    severity === 'warning' ? 'text-orange-200' :
                                    'text-blue-200';
                    const textColorLight = severity === 'success' ? 'text-green-300' :
                                          severity === 'error' ? 'text-red-300' :
                                          severity === 'warning' ? 'text-orange-300' :
                                          'text-blue-300';
                    
                    return (
                      <div className={`mt-6 p-4 ${bgColor} border rounded-lg`}>
                        <p className={`text-sm font-medium ${textColor} mb-1`}>
                          {severity === 'success' ? '✓ ' : severity === 'error' ? '⚠ ' : severity === 'warning' ? '⚠ ' : 'ℹ '}
                          {severity === 'success' ? 'Issue resolved' : severity === 'error' ? 'Compressor issue identified' : severity === 'warning' ? 'Action required' : 'Diagnostic information'}
                        </p>
                        <p className={`text-xs ${textColorLight}`}>{diagnosis}</p>
                      </div>
                    );
                  }
                  
                  return null;
                })()}
                
                {/* Primary cause found question logic */}
                {(() => {
                  if (!checklist) return null;
                  const getValue = (itemId: string) => {
                    const item = currentSectionData.items.find(i => i.id === itemId);
                    return item?.selectedOptions?.[0] || item?.selectedOption;
                  };
                  
                  const primaryCauseFound = getValue('cc-primary-cause-found');
                  if (primaryCauseFound === 'Yes') {
                    return (
                      <div className="mt-6 p-4 bg-green-900/30 border border-green-700 rounded-lg">
                        <p className="text-sm font-medium text-green-200 mb-1">✓ Primary cause identified</p>
                        <p className="text-xs text-green-300 mb-3">Root cause: Compressor circuit issue. You can proceed to wrap up or continue with additional checks if needed.</p>
                        <button
                          onClick={() => {
                            const wrapUpSection = checklist.sections.find(s => s.title === 'Wrap up');
                            if (wrapUpSection) {
                              const index = checklist.sections.findIndex(s => s.id === wrapUpSection.id);
                              setCurrentSection(index + 1);
                              setChosenWrapUp(true);
                            }
                          }}
                          className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm rounded-lg transition-colors"
                        >
                          Go to Wrap up
                        </button>
                      </div>
                    );
                  } else if (primaryCauseFound === 'No') {
                    // Generate next-step suggestions and show popup
                    const coolingChecksSection = checklist.sections.find(s => s.title === 'Cooling Checks');
                    const coolingChecksData = coolingChecksSection ? buildRTUCoolingChecksContext() : undefined;
                    const suggestions = generateNextStepSuggestions(
                      currentSectionData.title,
                      currentSectionData,
                      coolingChecksData || undefined
                    );
                    
                    if (suggestions.length > 0) {
                      return (
                        <div className="mt-6 p-4 bg-blue-900/30 border border-blue-700 rounded-lg">
                          <p className="text-sm font-medium text-blue-200 mb-3">Continue troubleshooting</p>
                          <button
                            onClick={() => {
                              setHypotheses(suggestions);
                              setHypothesesOpen(true);
                            }}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors"
                          >
                            View suggested next steps
                          </button>
                        </div>
                      );
                    }
                  }
                  
                  return null;
                })()}
              </>
            ) : currentSectionData.title === 'Refrigerant diagnostics' ? (
              <>
                {/* Info messages */}
                {currentSectionData.items.filter(item => item.isInfoMessage).map((item) => (
                  <div key={item.id} className="mb-4 p-3 bg-blue-900/30 border border-blue-700 rounded-lg">
                    <p className="text-sm text-blue-200">{item.text}</p>
                  </div>
                ))}
                
                {/* Normal checklist items */}
                <div className="space-y-3">
                  {currentSectionData.items.filter((item) => {
                    if (item.isBlockingMessage || item.isInfoMessage) return false;
                    return true;
                  }).map((item) => (
                    <div key={item.id} className="border-b border-gray-700 pb-3 last:border-b-0">
                      <div className="flex items-start space-x-3">
                        <div className="flex-1">
                          <label className="text-gray-200 block mb-2">{item.text}</label>
                          {item.options && (
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
                                )
                              })}
                            </div>
                          )}
                          {item.numericValue !== undefined && (
                            <input
                              type="number"
                              value={item.numericValue || ''}
                              onChange={(e) => {
                                if (!checklist) return;
                                setChecklist(prev => {
                                  if (!prev) return prev;
                                  return {
                                    ...prev,
                                    sections: prev.sections.map(section =>
                                      section.id === currentSectionData.id
                                        ? {
                                            ...section,
                                            items: section.items.map(i =>
                                              i.id === item.id
                                                ? { ...i, numericValue: e.target.value }
                                                : i
                                            )
                                          }
                                        : section
                                    )
                                  };
                                });
                              }}
                              placeholder={`Enter ${item.unit || 'value'}`}
                              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Auto-calculate and display superheat/subcool if temps are provided */}
                {(() => {
                  if (!checklist) return null;
                  
                  const suctionPressureItem = currentSectionData.items.find(i => i.id === 'rf-suction-pressure');
                  const suctionLineTempItem = currentSectionData.items.find(i => i.id === 'rf-suction-line-temp');
                  const liquidLineTempItem = currentSectionData.items.find(i => i.id === 'rf-liquid-line-temp');
                  const dischargePressureItem = currentSectionData.items.find(i => i.id === 'rf-discharge-pressure');
                  
                  const suctionPressure = suctionPressureItem?.numericValue ? parseFloat(suctionPressureItem.numericValue) : null;
                  const suctionLineTemp = suctionLineTempItem?.numericValue ? parseFloat(suctionLineTempItem.numericValue) : null;
                  const liquidLineTemp = liquidLineTempItem?.numericValue ? parseFloat(liquidLineTempItem.numericValue) : null;
                  const dischargePressure = dischargePressureItem?.numericValue ? parseFloat(dischargePressureItem.numericValue) : null;
                  
                  // Rough saturation temp conversion (simplified - R410A typical)
                  // This is a rough approximation: PSIG to saturation temp
                  // For R410A: ~40 PSIG ≈ 40°F, ~120 PSIG ≈ 100°F, etc.
                  const getSaturationTemp = (pressure: number): number => {
                    // Rough linear approximation for R410A in typical operating range
                    // More accurate would require refrigerant-specific tables
                    if (pressure < 20) return pressure * 0.8;
                    if (pressure < 100) return 20 + (pressure - 20) * 0.6;
                    return 68 + (pressure - 100) * 0.5;
                  };
                  
                  let superheat: number | null = null;
                  let subcool: number | null = null;
                  
                  if (suctionPressure !== null && suctionLineTemp !== null) {
                    const saturationTemp = getSaturationTemp(suctionPressure);
                    superheat = suctionLineTemp - saturationTemp;
                  }
                  
                  if (dischargePressure !== null && liquidLineTemp !== null) {
                    const condensingTemp = getSaturationTemp(dischargePressure);
                    subcool = condensingTemp - liquidLineTemp;
                  }
                  
                  if (superheat !== null || subcool !== null) {
                    return (
                      <div className="mt-4 p-4 bg-gray-800 border border-gray-700 rounded-lg">
                        <p className="text-sm font-medium text-gray-200 mb-2">Calculated Values:</p>
                        <div className="space-y-1 text-xs text-gray-300">
                          {superheat !== null && (
                            <p>Superheat: {superheat.toFixed(1)}°F</p>
                          )}
                          {subcool !== null && (
                            <p>Subcooling: {subcool.toFixed(1)}°F</p>
                          )}
                          <p className="text-gray-500 mt-2">Note: Calculations are approximate based on typical R410A properties.</p>
                        </div>
                      </div>
                    );
                  }
                  
                  return null;
                })()}
                
                {/* Evaluation and conclusion */}
                {(() => {
                  if (!checklist) return null;
                  
                  const getValue = (itemId: string) => {
                    const item = currentSectionData.items.find(i => i.id === itemId);
                    return item?.selectedOptions?.[0] || item?.selectedOption;
                  };
                  
                  const getNumericValue = (itemId: string): number | null => {
                    const item = currentSectionData.items.find(i => i.id === itemId);
                    if (item?.numericValue) {
                      const num = parseFloat(item.numericValue);
                      return isNaN(num) ? null : num;
                    }
                    return null;
                  };
                  
                  const suctionInterpretation = getValue('rf-suction-interpretation');
                  const headInterpretation = getValue('rf-head-interpretation');
                  const superheatInterpretation = getValue('rf-superheat-interpretation');
                  const subcoolInterpretation = getValue('rf-subcool-interpretation');
                  
                  // Only show conclusion if at least suction and head interpretations are provided
                  if (!suctionInterpretation || !headInterpretation) {
                    return null;
                  }
                  
                  let conclusion = '';
                  let severity = 'info'; // 'info', 'warning', 'error'
                  
                  // Low suction + low head → likely low charge or low load
                  if (suctionInterpretation === 'Low' && headInterpretation === 'Low') {
                    conclusion = 'Likely low charge or low load. Check for leaks, verify charge level, and confirm system is under proper load conditions.';
                    severity = 'warning';
                  }
                  // Low suction + normal/high head → possible restriction (TXV, filter drier) or iced evaporator
                  else if (suctionInterpretation === 'Low' && (headInterpretation === 'Normal' || headInterpretation === 'High')) {
                    conclusion = 'Possible restriction (TXV, filter drier) or iced evaporator. Check metering device, filter drier, and verify evaporator coil is not iced.';
                    severity = 'warning';
                  }
                  // Normal suction + high head → condenser airflow or overcharge
                  else if (suctionInterpretation === 'Normal' && headInterpretation === 'High') {
                    conclusion = 'Likely condenser issue (even if previously cleared, re-check) or overcharge. Verify condenser fans are running, coil is clean, and check for overcharge.';
                    severity = 'warning';
                  }
                  // High suction + low head → weak compressor or bypassing valves
                  else if (suctionInterpretation === 'High' && headInterpretation === 'Low') {
                    conclusion = 'Compressor possibly weak — recommend further testing or replacement evaluation. Check compressor performance and valve condition.';
                    severity = 'error';
                  }
                  // Normal suction + normal head → system appears normal
                  else if (suctionInterpretation === 'Normal' && headInterpretation === 'Normal') {
                    // Check superheat/subcool for additional clues
                    if (superheatInterpretation === 'Low' || subcoolInterpretation === 'Low') {
                      conclusion = 'Pressures appear normal but superheat/subcooling suggests possible issue. Review metering device operation or charge level.';
                      severity = 'info';
                    } else if (superheatInterpretation === 'High' || subcoolInterpretation === 'High') {
                      conclusion = 'Pressures appear normal but superheat/subcooling suggests possible restriction or overcharge. Review system operation.';
                      severity = 'info';
                    } else {
                      conclusion = 'System pressures appear normal. If cooling capacity is still low, consider control/economizer issues or verify airflow is adequate.';
                      severity = 'info';
                    }
                  }
                  // High suction + normal/high head → possible overcharge or high load
                  else if (suctionInterpretation === 'High' && (headInterpretation === 'Normal' || headInterpretation === 'High')) {
                    conclusion = 'Possible overcharge or high load condition. Verify charge level and confirm load conditions are appropriate.';
                    severity = 'warning';
                  }
                  
                  if (conclusion) {
                    const bgColor = severity === 'error' ? 'bg-red-900/30 border-red-700' :
                                   severity === 'warning' ? 'bg-orange-900/30 border-orange-700' :
                                   'bg-blue-900/30 border-blue-700';
                    const textColor = severity === 'error' ? 'text-red-200' :
                                    severity === 'warning' ? 'text-orange-200' :
                                    'text-blue-200';
                    const textColorLight = severity === 'error' ? 'text-red-300' :
                                          severity === 'warning' ? 'text-orange-300' :
                                          'text-blue-300';
                    
                    return (
                      <div className={`mt-6 p-4 ${bgColor} border rounded-lg`}>
                        <p className={`text-sm font-medium ${textColor} mb-1`}>
                          {severity === 'error' ? '⚠ ' : severity === 'warning' ? '⚠ ' : 'ℹ '}
                          Diagnostic Conclusion
                        </p>
                        <p className={`text-xs ${textColorLight}`}>{conclusion}</p>
                      </div>
                    );
                  }
                  
                  return null;
                })()}
                
                {/* Primary cause found question logic */}
                {(() => {
                  if (!checklist) return null;
                  const getValue = (itemId: string) => {
                    const item = currentSectionData.items.find(i => i.id === itemId);
                    return item?.selectedOptions?.[0] || item?.selectedOption;
                  };
                  
                  const primaryCauseFound = getValue('rf-primary-cause-found');
                  if (primaryCauseFound === 'Yes') {
                    return (
                      <div className="mt-6 p-4 bg-green-900/30 border border-green-700 rounded-lg">
                        <p className="text-sm font-medium text-green-200 mb-1">✓ Primary cause identified</p>
                        <p className="text-xs text-green-300 mb-3">Root cause: Refrigerant issue. You can proceed to wrap up or continue with additional checks if needed.</p>
                        <button
                          onClick={() => {
                            const wrapUpSection = checklist.sections.find(s => s.title === 'Wrap up');
                            if (wrapUpSection) {
                              const index = checklist.sections.findIndex(s => s.id === wrapUpSection.id);
                              setCurrentSection(index + 1);
                              setChosenWrapUp(true);
                            }
                          }}
                          className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm rounded-lg transition-colors"
                        >
                          Go to Wrap up
                        </button>
                      </div>
                    );
                  } else if (primaryCauseFound === 'No') {
                    // Generate next-step suggestions and show popup
                    const coolingChecksSection = checklist.sections.find(s => s.title === 'Cooling Checks');
                    const coolingChecksData = coolingChecksSection ? buildRTUCoolingChecksContext() : undefined;
                    const suggestions = generateNextStepSuggestions(
                      currentSectionData.title,
                      currentSectionData,
                      coolingChecksData || undefined
                    );
                    
                    if (suggestions.length > 0) {
                      return (
                        <div className="mt-6 p-4 bg-blue-900/30 border border-blue-700 rounded-lg">
                          <p className="text-sm font-medium text-blue-200 mb-3">Continue troubleshooting</p>
                          <button
                            onClick={() => {
                              setHypotheses(suggestions);
                              setHypothesesOpen(true);
                            }}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors"
                          >
                            View suggested next steps
                          </button>
                        </div>
                      );
                    }
                  }
                  
                  return null;
                })()}
              </>
            ) : currentSectionData.title === 'Control / economizer diagnostics' ? (
              <>
                {/* Info messages */}
                {currentSectionData.items.filter(item => item.isInfoMessage).map((item) => (
                  <div key={item.id} className="mb-4 p-3 bg-blue-900/30 border border-blue-700 rounded-lg">
                    <p className="text-sm text-blue-200">{item.text}</p>
                  </div>
                ))}
                
                {/* Normal checklist items */}
                <div className="space-y-3">
                  {currentSectionData.items.filter((item) => {
                    if (item.isBlockingMessage || item.isInfoMessage) return false;
                    return true;
                  }).map((item) => (
                    <div key={item.id} className="border-b border-gray-700 pb-3 last:border-b-0">
                      <div className="flex items-start space-x-3">
                        <div className="flex-1">
                          <label className="text-gray-200 block mb-2">{item.text}</label>
                          {item.options && (
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
                                )
                              })}
                            </div>
                          )}
                          {item.notes !== undefined && (
                            <textarea
                              value={item.notes || ''}
                              onChange={(e) => {
                                if (!checklist) return;
                                setChecklist(prev => {
                                  if (!prev) return prev;
                                  return {
                                    ...prev,
                                    sections: prev.sections.map(section =>
                                      section.id === currentSectionData.id
                                        ? {
                                            ...section,
                                            items: section.items.map(i =>
                                              i.id === item.id
                                                ? { ...i, notes: e.target.value }
                                                : i
                                            )
                                          }
                                        : section
                                    )
                                  };
                                });
                              }}
                              placeholder="Enter notes about what was changed..."
                              rows={3}
                              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                            />
                          )}
                          {item.numericValue !== undefined && (
                            <input
                              type="number"
                              value={item.numericValue || ''}
                              onChange={(e) => {
                                if (!checklist) return;
                                setChecklist(prev => {
                                  if (!prev) return prev;
                                  return {
                                    ...prev,
                                    sections: prev.sections.map(section =>
                                      section.id === currentSectionData.id
                                        ? {
                                            ...section,
                                            items: section.items.map(i =>
                                              i.id === item.id
                                                ? { ...i, numericValue: e.target.value }
                                                : i
                                            )
                                          }
                                        : section
                                    )
                                  };
                                });
                              }}
                              placeholder={`Enter ${item.unit || 'value'}`}
                              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Evaluation and conclusion */}
                {(() => {
                  if (!checklist) return null;
                  
                  const getValue = (itemId: string) => {
                    const item = currentSectionData.items.find(i => i.id === itemId);
                    return item?.selectedOptions?.[0] || item?.selectedOption;
                  };
                  
                  const coolingSetpoint = getValue('ce-cooling-setpoint');
                  const occupiedMode = getValue('ce-occupied-mode');
                  const lockoutsOverrides = getValue('ce-lockouts-overrides');
                  const sensorPlacement = getValue('ce-sensor-placement');
                  const sensorCalibration = getValue('ce-sensor-calibration');
                  const damperPosition = getValue('ce-damper-position');
                  const damperStuckOpen = getValue('ce-damper-stuck-open');
                  const mixedAirTemp = getValue('ce-mixed-air-temp');
                  const multiZone = getValue('ce-multi-zone');
                  const zoneDampers = getValue('ce-zone-dampers');
                  const issueFound = getValue('ce-issue-found');
                  
                  // Get deltaT from Cooling Checks section to verify mechanical system is normal
                  const coolingChecksSection = checklist.sections.find(s => s.title === 'Cooling Checks');
                  const returnAirItem = coolingChecksSection?.items.find(i => i.id === 'returnAirTemp');
                  const supplyAirItem = coolingChecksSection?.items.find(i => i.id === 'supplyAirTemp');
                  const returnTemp = returnAirItem?.numericValue ? parseFloat(returnAirItem.numericValue) : null;
                  const supplyTemp = supplyAirItem?.numericValue ? parseFloat(supplyAirItem.numericValue) : null;
                  const deltaT = (returnTemp !== null && supplyTemp !== null) ? returnTemp - supplyTemp : null;
                  
                  // Check if mechanical system appears normal (deltaT between 10-25°F)
                  const mechanicalNormal = deltaT !== null && deltaT >= 10 && deltaT <= 25;
                  
                  // Check for control/economizer issues
                  const hasControlIssue = 
                    coolingSetpoint === 'Setpoint too high' ||
                    coolingSetpoint === 'Schedule issue' ||
                    occupiedMode === 'No' ||
                    lockoutsOverrides === 'Lockout active' ||
                    lockoutsOverrides === 'Setback active' ||
                    lockoutsOverrides === 'Override active';
                  
                  const hasSensorIssue = 
                    sensorPlacement?.startsWith('No') ||
                    sensorCalibration === 'Off by > 5°F';
                  
                  const hasEconomizerIssue = 
                    damperPosition === 'No - stuck open' ||
                    damperStuckOpen === 'Yes' ||
                    mixedAirTemp === 'Yes';
                  
                  const hasZoningIssue = 
                    multiZone === 'No - some zones not calling' ||
                    zoneDampers?.startsWith('Yes');
                  
                  const hasControlEconomizerIssue = hasControlIssue || hasSensorIssue || hasEconomizerIssue || hasZoningIssue;
                  
                  let conclusion = '';
                  let severity = 'info';
                  
                  // If mechanical checks are normal and ΔT is normal, and economizer damper is stuck open or controls are misconfigured
                  if (mechanicalNormal && hasControlEconomizerIssue && issueFound === 'Yes') {
                    conclusion = 'Controls/economizer root cause confirmed. Mechanical system is fine (ΔT normal), but control/air mix was wrong. Issue has been identified and addressed.';
                    severity = 'success';
                  } else if (mechanicalNormal && hasControlEconomizerIssue && issueFound !== 'Yes') {
                    conclusion = 'Controls/economizer issue likely. Mechanical system appears normal (ΔT normal), but control/economizer problems detected. Review and address control settings, economizer damper position, or sensor issues.';
                    severity = 'warning';
                  } else if (hasControlEconomizerIssue && issueFound === 'Yes') {
                    conclusion = 'Control/economizer issue found and addressed. Verify system operation after changes.';
                    severity = 'success';
                  } else if (hasControlEconomizerIssue) {
                    conclusion = 'Control/economizer issues detected. Review setpoints, schedules, economizer damper position, sensor placement, or zoning issues.';
                    severity = 'warning';
                  } else if (issueFound === 'No' && mechanicalNormal) {
                    conclusion = 'No control/economizer issues found and mechanical system appears normal. Consider other factors or verify all checks were completed.';
                    severity = 'info';
                  } else if (issueFound === 'Yes') {
                    conclusion = 'Control/economizer issue found and addressed. System should now operate correctly.';
                    severity = 'success';
                  }
                  
                  if (conclusion) {
                    const bgColor = severity === 'success' ? 'bg-green-900/30 border-green-700' :
                                   severity === 'warning' ? 'bg-orange-900/30 border-orange-700' :
                                   'bg-blue-900/30 border-blue-700';
                    const textColor = severity === 'success' ? 'text-green-200' :
                                    severity === 'warning' ? 'text-orange-200' :
                                    'text-blue-200';
                    const textColorLight = severity === 'success' ? 'text-green-300' :
                                          severity === 'warning' ? 'text-orange-300' :
                                          'text-blue-300';
                    
                    return (
                      <div className={`mt-6 p-4 ${bgColor} border rounded-lg`}>
                        <p className={`text-sm font-medium ${textColor} mb-1`}>
                          {severity === 'success' ? '✓ ' : severity === 'warning' ? '⚠ ' : 'ℹ '}
                          {severity === 'success' ? 'Issue resolved' : severity === 'warning' ? 'Action required' : 'Diagnostic information'}
                        </p>
                        <p className={`text-xs ${textColorLight}`}>{conclusion}</p>
                      </div>
                    );
                  }
                  
                  return null;
                })()}
                
                {/* Primary cause found question logic */}
                {(() => {
                  if (!checklist) return null;
                  const getValue = (itemId: string) => {
                    const item = currentSectionData.items.find(i => i.id === itemId);
                    return item?.selectedOptions?.[0] || item?.selectedOption;
                  };
                  
                  const primaryCauseFound = getValue('ce-primary-cause-found');
                  if (primaryCauseFound === 'Yes') {
                    return (
                      <div className="mt-6 p-4 bg-green-900/30 border border-green-700 rounded-lg">
                        <p className="text-sm font-medium text-green-200 mb-1">✓ Primary cause identified</p>
                        <p className="text-xs text-green-300 mb-3">Root cause: Control/Economizer issue. You can proceed to wrap up or continue with additional checks if needed.</p>
                        <button
                          onClick={() => {
                            const wrapUpSection = checklist.sections.find(s => s.title === 'Wrap up');
                            if (wrapUpSection) {
                              const index = checklist.sections.findIndex(s => s.id === wrapUpSection.id);
                              setCurrentSection(index + 1);
                              setChosenWrapUp(true);
                            }
                          }}
                          className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm rounded-lg transition-colors"
                        >
                          Go to Wrap up
                        </button>
                      </div>
                    );
                  } else if (primaryCauseFound === 'No') {
                    // Generate next-step suggestions and show popup
                    const coolingChecksSection = checklist.sections.find(s => s.title === 'Cooling Checks');
                    const coolingChecksData = coolingChecksSection ? buildRTUCoolingChecksContext() : undefined;
                    const suggestions = generateNextStepSuggestions(
                      currentSectionData.title,
                      currentSectionData,
                      coolingChecksData || undefined
                    );
                    
                    if (suggestions.length > 0) {
                      return (
                        <div className="mt-6 p-4 bg-blue-900/30 border border-blue-700 rounded-lg">
                          <p className="text-sm font-medium text-blue-200 mb-3">Continue troubleshooting</p>
                          <button
                            onClick={() => {
                              setHypotheses(suggestions);
                              setHypothesesOpen(true);
                            }}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors"
                          >
                            View suggested next steps
                          </button>
                        </div>
                      );
                    }
                  }
                  
                  return null;
                })()}
              </>
            ) : currentSectionData.title === 'Wrap up' ? (
              <>
                <div className="space-y-4">
                  {currentSectionData.items.filter((item) => {
                    // Show conditional items only if their condition is met
                    if (item.conditionalOn) {
                      const referencedItem = currentSectionData.items.find(i => i.id === item.conditionalOn!.itemId);
                      if (referencedItem) {
                        const selectedValue = referencedItem.selectedOptions?.[0] || referencedItem.selectedOption;
                        return selectedValue !== undefined && selectedValue === item.conditionalOn!.option;
                      }
                      return false;
                    }
                    return true; // Show non-conditional items
                  }).map((item) => (
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
                        const wrap = checklist.sections.find(s=>s.title==='Wrap up');
                        const done = wrap ? wrap.items.filter(i => !!i.status && i.status !== 'unchecked').map(i => i.text.toLowerCase()) : [];
                        const actions = done.length ? `Wrap-up actions: ${done.join(', ')}.` : '';
                        
                        let summary = '';
                        if (unitType === 'walkIn' && issueId === 'ice-frost-build-up') {
                          // Walk-in ice build up specific notes
                          const s1 = checklist.sections[0];
                          const iceLoc = s1.items.find(i=>i.id==='1-1')?.selectedOptions?.[0] || s1.items.find(i=>i.id==='1-1')?.selectedOption;
                          const s2 = checklist.sections[1];
                          const suction = s2?.items.find(i=>i.id==='2-5')?.numericInputs?.[0]?.value || '';
                          const discharge = s2?.items.find(i=>i.id==='2-5')?.numericInputs?.[1]?.value || '';
                          const evapFault = checklist.sections.find(s=>s.title==='Evap drain tracing')?.items.find(i=>i.id==='8-5')?.notes || '';
                          summary = `Performed box and condenser checks. Observed icing near ${iceLoc || 'the evaporator'}. Traced melt path and ${evapFault ? `identified ${evapFault}` : 'addressed suspected drain restriction'}. Recorded pressures: suction ${suction || '—'} psig, discharge ${discharge || '—'} psig. ${actions}`;
                        } else if (unitType === 'rtu' && issueId === 'not-cooling') {
                          // RTU not cooling specific notes
                          const thermostatSection = checklist.sections.find(s => s.title === 'Thermostat');
                          const thermostatType = thermostatSection?.items.find(i=>i.id==='1-1')?.selectedOptions?.[0] || thermostatSection?.items.find(i=>i.id==='1-1')?.selectedOption;
                          const thermostatPower = thermostatSection?.items.find(i=>i.id==='1-2')?.selectedOptions?.[0] || thermostatSection?.items.find(i=>i.id==='1-2')?.selectedOption;
                          const unitPowerSection = checklist.sections.find(s => s.title === 'Unit Power');
                          const disconnect = unitPowerSection?.items.find(i=>i.id==='2-1')?.selectedOptions?.[0] || unitPowerSection?.items.find(i=>i.id==='2-1')?.selectedOption;
                          const unitRunning = unitPowerSection?.items.find(i=>i.id==='2-2')?.selectedOptions?.[0] || unitPowerSection?.items.find(i=>i.id==='2-2')?.selectedOption;
                          const faultCodes = unitPowerSection?.items.find(i=>i.id==='2-4')?.selectedOptions?.[0] || unitPowerSection?.items.find(i=>i.id==='2-4')?.selectedOption;
                          
                          const findings = [];
                          if (thermostatType) findings.push(`Thermostat type: ${thermostatType}`);
                          if (thermostatPower) findings.push(`Thermostat power: ${thermostatPower}`);
                          if (disconnect) findings.push(`Disconnect switch: ${disconnect}`);
                          if (unitRunning) findings.push(`Unit running: ${unitRunning}`);
                          if (faultCodes) findings.push(`Fault codes: ${faultCodes}`);
                          
                          summary = `Performed RTU troubleshooting. ${findings.length ? findings.join('. ') + '. ' : ''}${actions}`;
                        } else {
                          // Generic fallback
                          summary = `Performed service call troubleshooting. ${actions}`;
                        }
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
                     <>
                     <div className="space-y-3">
                       {currentSectionData.items.filter((item) => {
                         // Exclude blocking messages from regular items
                         if (item.isBlockingMessage) return false;
                         // Show conditional items only if their condition is met
                         if (item.conditionalOn) {
                           const referencedItem = currentSectionData.items.find(i => i.id === item.conditionalOn!.itemId);
                           if (referencedItem) {
                             const selectedValue = referencedItem.selectedOptions?.[0] || referencedItem.selectedOption;
                             return selectedValue !== undefined && selectedValue === item.conditionalOn!.option;
                           }
                           return false;
                         }
                         return true; // Show non-conditional items
                       }).map((item) => (
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
                                     )
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
                    {/* Render blocking messages inline if this item triggers them */}
                    {currentSectionData.items
                      .filter((blockingItem) => {
                        if (blockingItem.isBlockingMessage && blockingItem.conditionalOn) {
                          return blockingItem.conditionalOn.itemId === item.id;
                        }
                        return false;
                      })
                      .map((blockingItem) => {
                        const selectedValue = item.selectedOptions?.[0] || item.selectedOption;
                        const shouldShow = selectedValue !== undefined && selectedValue === blockingItem.conditionalOn!.option;
                        if (!shouldShow) return null;
                        const resolution = blockingMessageResolutions[blockingItem.id];
                        const isResolved = resolution === 'resolved';
                        const isAcknowledged = resolution === 'acknowledged';
                        const bgColor = isAcknowledged ? 'bg-orange-900/30' : 'bg-red-900/30';
                        const borderColor = isAcknowledged ? 'border-orange-600' : 'border-red-600';
                        const iconColor = isAcknowledged ? 'text-orange-500' : 'text-red-500';
                        const textColor = isAcknowledged ? 'text-orange-200' : 'text-red-200';
                        const subtextColor = isAcknowledged ? 'text-orange-300' : 'text-red-300';
                        const getAcknowledgedText = (originalText: string): string => {
                          // Handle specific messages first - check for LED fault codes message
                          if (blockingItem.id === '2-4-blocking') {
                            return 'Checked control board fault codes but that still did not resolve the issue.';
                          }
                          // Handle custom blocking message for wiring issues
                          if (blockingItem.id === '2-5-blocking') {
                            return 'Checked for broken wiring / open splice / tripped float switch / conduit inside control wiring run but that still did not resolve the issue.';
                          }
                          // Handle specific messages first - check for disconnect switch message
                          const lowerText = originalText.toLowerCase();
                          if ((lowerText.includes('turn on') && lowerText.includes('recheck')) || lowerText.includes('turn on & recheck')) {
                            return 'Checked disconnect but that still did not resolve the issue.';
                          }
                          // Handle fuses message
                          if (lowerText.includes('please correct for blown fuses') || lowerText.includes('correct for blown fuses')) {
                            return 'Checked for blown fuses but that still did not resolve the issue.';
                          }
                          // Remove "This is" or "This is a/an" prefix and make it past tense
                          let text = originalText.replace(/^This is (a |an )?/i, '').replace(/\.$/, '');
                          // Convert to past tense and add context
                          if (text.includes('upstream breaker') || (text.includes('disconnect') && !text.includes('Turn on'))) {
                            return 'Checked upstream breaker / disconnect / fuse issues but that still did not resolve the issue.';
                          }
                          if (text.includes('transformer') || text.includes('fuse open')) {
                            return 'Checked transformer and fuse issues but that still did not resolve the issue.';
                          }
                          if (text.includes('control circuit') || text.includes('safety switch') || text.includes('pressure switch') || text.includes('limit') || text.includes('board')) {
                            return 'Checked control circuit and safety components but that still did not resolve the issue.';
                          }
                          // Generic fallback
                          return `Checked ${text.toLowerCase()} but that still did not resolve the issue.`;
                        };
                        const displayText = isAcknowledged ? getAcknowledgedText(blockingItem.text) : blockingItem.text;
                        return (
                          <div key={blockingItem.id} className={`mt-3 p-4 ${bgColor} border-2 ${borderColor} rounded-lg`}>
                            <div className="flex items-start space-x-3">
                              <svg className={`w-6 h-6 ${iconColor} flex-shrink-0 mt-0.5`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                              </svg>
                              <div className="flex-1">
                                <p className={`${textColor} font-semibold`}>
                                  {blockingItem.id === '2-2a-blocking' && !isAcknowledged ? 'Likely an upstream breaker, disconnect, or fuse problem.' : displayText}
                                </p>
                                {!isAcknowledged && !isResolved && (
                                  <>
                                    {blockingItem.id === '2-2a-blocking' ? (
                                      <ul className={`${subtextColor} text-sm mt-2 space-y-1 list-disc list-inside`}>
                                        <li>Open disconnect cover and inspect for blown fuses (confirm 0 V).</li>
                                        <li>Check if breaker was tripped. Reset once if safe to do so.</li>
                                        <li>If it immediately trips again, check for a short downstream (compressor, contactor, wiring).</li>
                                      </ul>
                                    ) : (
                                      <p className={`${subtextColor} text-sm mt-1`}>Please resolve this issue before continuing.</p>
                                    )}
                                  </>
                                )}
                                {!isResolved && !isAcknowledged && (
                                  <div className="mt-3 flex gap-2">
                                    <button
                                      onClick={() => {
                                        const idx = checklist.sections.findIndex(s => s.title === 'Wrap up');
                                        if (idx >= 0) {
                                          setBlockingMessageResolutions(prev => ({ ...prev, [blockingItem.id]: 'resolved' }));
                                          setChosenWrapUp(true);
                                          setCurrentSection(idx + 1);
                                        }
                                      }}
                                      className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium"
                                    >
                                      {blockingItem.id === '2-1a' ? 'Turning on disconnect resolved issue - wrap up' : blockingItem.id === '2-2a-blocking' ? 'Found root cause of issue, wrap up' : blockingItem.id === '2-2b-blocking' ? 'Found root cause, wrap up' : blockingItem.id === '2-2c-blocking' ? 'Found root cause, wrap up' : blockingItem.id === '2-3-blocking' ? 'Found root cause, wrap up' : blockingItem.id === '2-4-blocking' ? 'Found root cause, wrap up' : 'Issue resolved - Wrap up'}
                                    </button>
                                    <button
                                      onClick={() => {
                                        setBlockingMessageResolutions(prev => ({ ...prev, [blockingItem.id]: 'acknowledged' }));
                                      }}
                                      className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg text-sm font-medium"
                                    >
                                      {blockingItem.id === '2-1a' ? 'Turning on disconnect did not resolve issue - keep troubleshooting' : blockingItem.id === '2-2a-blocking' ? 'Restored line power but issue still not resolved, keep troubleshooting' : blockingItem.id === '2-2b-blocking' ? 'Continue troubleshooting' : blockingItem.id === '2-2c-blocking' ? 'Continue troubleshooting' : blockingItem.id === '2-3-blocking' ? 'Continue troubleshooting' : blockingItem.id === '2-4-blocking' ? 'Continue troubleshooting' : 'Continue troubleshooting'}
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                ))}
              </div>
              {/* Custom blocking message for Unit Power section - check multiple conditions */}
              {currentSectionData.title === 'Unit Power' && unitType === 'rtu' && (issueId === 'not-cooling' || issueId === 'not-heating') && (() => {
                if (!checklist) return null;
                // Find the custom blocking message - check in original checklist structure
                const unitPowerSection = checklist.sections.find(s => s.title === 'Unit Power');
                const customBlockingItem = unitPowerSection?.items.find(item => item.id === '2-5-blocking' && item.isBlockingMessage);
                if (!customBlockingItem) return null;
                
                // Check conditions across sections (checklist.sections has the updated state):
                // 1. Thermostat section (1-2) = 'No'
                const thermostatSection = checklist.sections.find(s => s.title === 'Thermostat');
                const thermostatPowerItem = thermostatSection?.items.find(i => i.id === '1-2');
                const thermostatPowerValue = thermostatPowerItem?.selectedOptions?.[0] || thermostatPowerItem?.selectedOption;
                const thermostatNoPower = thermostatPowerValue === 'No';
                
                // 2. Unit Power section conditions:
                // - 2-1 (disconnect switch) = 'Yes'
                const disconnectItem = currentSectionData.items.find(i => i.id === '2-1');
                const disconnectValue = disconnectItem?.selectedOptions?.[0] || disconnectItem?.selectedOption;
                const disconnectOn = disconnectValue === 'Yes';
                
                // - 2-2 (unit running) = 'Yes'
                const unitRunningItem = currentSectionData.items.find(i => i.id === '2-2');
                const unitRunningValue = unitRunningItem?.selectedOptions?.[0] || unitRunningItem?.selectedOption;
                const unitRunning = unitRunningValue === 'Yes';
                
                // - 2-4 (LED fault codes) = 'No' or 'Solid LED'
                const faultCodesItem = currentSectionData.items.find(i => i.id === '2-4');
                const faultCodesValue = faultCodesItem?.selectedOptions?.[0] || faultCodesItem?.selectedOption;
                const noFaultCodesOrSolidLED = faultCodesValue === 'No' || faultCodesValue === 'Solid LED';
                
                // Show message if all conditions are met
                const shouldShow = thermostatNoPower && disconnectOn && unitRunning && noFaultCodesOrSolidLED;
                
                // Debug: uncomment to see condition values
                // console.log('Custom blocking message conditions:', {
                //   thermostatNoPower,
                //   disconnectOn,
                //   unitRunning,
                //   noFaultCodesOrSolidLED,
                //   shouldShow,
                //   thermostatPowerValue,
                //   disconnectValue,
                //   unitRunningValue,
                //   faultCodesValue
                // });
                
                if (!shouldShow) return null;
                
                const resolution = blockingMessageResolutions[customBlockingItem.id];
                const isResolved = resolution === 'resolved';
                const isAcknowledged = resolution === 'acknowledged';
                const bgColor = isAcknowledged ? 'bg-orange-900/30' : 'bg-red-900/30';
                const borderColor = isAcknowledged ? 'border-orange-600' : 'border-red-600';
                const iconColor = isAcknowledged ? 'text-orange-500' : 'text-red-500';
                const textColor = isAcknowledged ? 'text-orange-200' : 'text-red-200';
                const subtextColor = isAcknowledged ? 'text-orange-300' : 'text-red-300';
                
                // Get acknowledged text if acknowledged
                const getAcknowledgedText = (originalText: string): string => {
                  if (customBlockingItem.id === '2-5-blocking') {
                    return 'Checked for broken wiring / open splice / tripped float switch / conduit inside control wiring run but that still did not resolve the issue.';
                  }
                  return originalText;
                };
                const displayText = isAcknowledged ? getAcknowledgedText(customBlockingItem.text) : customBlockingItem.text;
                
                return (
                  <div className={`mt-4 p-4 ${bgColor} border-2 ${borderColor} rounded-lg`}>
                    <div className="flex items-start space-x-3">
                      <svg className={`w-6 h-6 ${iconColor} flex-shrink-0 mt-0.5`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      <div className="flex-1">
                        <p className={`${textColor} font-semibold`}>
                          {displayText}
                        </p>
                        {!isAcknowledged && !isResolved && (
                          <p className={`${subtextColor} text-sm mt-1`}>Please resolve this issue before continuing.</p>
                        )}
                        {!isResolved && !isAcknowledged && (
                          <div className="mt-3 flex gap-2">
                            <button
                              onClick={() => {
                                const idx = checklist.sections.findIndex(s => s.title === 'Wrap up');
                                if (idx >= 0) {
                                  setBlockingMessageResolutions(prev => ({ ...prev, [customBlockingItem.id]: 'resolved' }));
                                  setChosenWrapUp(true);
                                  setCurrentSection(idx + 1);
                                }
                              }}
                              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium"
                            >
                              Found root cause, wrap up
                            </button>
                            <button
                              onClick={() => {
                                setBlockingMessageResolutions(prev => ({ ...prev, [customBlockingItem.id]: 'acknowledged' }));
                              }}
                              className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg text-sm font-medium"
                            >
                              Continue troubleshooting
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })()}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="sticky bottom-0 bg-gray-900/95 backdrop-blur border-t border-gray-700/80 py-4 mt-6">
        <div className="max-w-4xl mx-auto px-4 space-y-3">
          <div className="flex gap-3">
            <button
              onClick={goToPreviousSection}
              disabled={currentSection === 1}
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-full border border-gray-600/70 bg-gray-800 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="15 18 9 12 15 6"/>
              </svg>
              <span>Previous</span>
            </button>
            <button
              onClick={goToNextSection}
              disabled={!checklist || (currentSection === checklist.sections.length && currentSection !== 2) || hasActiveBlockingMessage()}
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-full border border-blue-500/60 bg-blue-500/10 px-4 py-2.5 text-sm font-medium text-blue-100 shadow-sm transition-colors hover:bg-blue-500/20 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <span>Next</span>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="9 18 15 12 9 6"/>
              </svg>
            </button>
          </div>

          <button
            onClick={() => {
              if (checklist) {
                const dataToSave = {
                  sections: checklist.sections,
                  readings: readings
                };
                localStorage.setItem(`service-checklist-${unitType}-${issueId}`, JSON.stringify(dataToSave));
              }
              router.back();
            }}
            className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-blue-500 px-6 py-3 text-sm font-semibold text-white shadow-md transition-colors hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-0"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="opacity-80">
              <path d="M7 3h10l2 2v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z"/>
              <path d="M7 3h10v6H7z"/>
              <path d="M9 13h6v6H9z"/>
            </svg>
            <span>Save & Return</span>
          </button>

          {hypotheses.length > 0 && currentSection > 2 && (
            <button
              onClick={() => setHypothesesOpen(true)}
              className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-amber-500/70 px-6 py-3 text-sm font-semibold text-white shadow-md transition-colors hover:bg-amber-500/80"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="opacity-80">
                <path d="M21 12a9 9 0 1 1-2.64-6.36"/>
                <polyline points="21 3 21 9 15 9"/>
              </svg>
              <span>Revisit suggested next steps</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
