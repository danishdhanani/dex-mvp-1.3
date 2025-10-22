'use client';

import { useState, useRef, useEffect } from 'react';
import TroubleshootingChecklist from './TroubleshootingChecklist';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  isComplete?: boolean; // Track if the message is fully loaded
  sourceContent?: string; // Source material used for the response
}

interface ChatBotProps {
  unitType?: string;
}

export default function ChatBot({ unitType }: ChatBotProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Get equipment type display name
  const getEquipmentTypeName = (type: string) => {
    const equipmentNames: { [key: string]: string } = {
      'rtu': 'RTU (Roof Top Unit)',
      'split-unit': 'Split Unit',
      'reach-in': 'Reach-in Cooler/Freezer',
      'walk-in': 'Walk-in Cooler/Freezer',
      'ice-machine': 'Ice Machine'
    };
    return equipmentNames[type] || 'HVAC/R Equipment';
  };

  // Get equipment-specific preset options
  const getPresetOptions = (type: string) => {
    const presetOptions: { [key: string]: Array<{question: string, title: string, description: string, icon: string}> } = {
      'rtu': [
        {
          question: "RTU not turning on - what do I do?",
          title: "Not Turning On",
          description: "Power and startup issues",
          icon: "power"
        },
        {
          question: "RTU not cooling properly - troubleshooting steps",
          title: "Not Cooling",
          description: "Temperature and refrigerant issues",
          icon: "temperature"
        },
        {
          question: "RTU making loud noises - what's wrong?",
          title: "Loud Noises",
          description: "Fan motor and bearing issues",
          icon: "sound"
        },
        {
          question: "RTU economizer not working - diagnostic steps",
          title: "Economizer Issues",
          description: "Outside air damper problems",
          icon: "air"
        },
        {
          question: "RTU gas heating not working - troubleshooting",
          title: "Heating Problems",
          description: "Gas valve and ignition issues",
          icon: "fire"
        },
        {
          question: "RTU error codes and fault diagnostics",
          title: "Error Codes",
          description: "Control board and sensor faults",
          icon: "warning"
        }
      ],
      'split-unit': [
        {
          question: "Split unit not turning on - what do I do?",
          title: "Not Turning On",
          description: "Power and thermostat issues",
          icon: "power"
        },
        {
          question: "Split unit not cooling properly - troubleshooting steps",
          title: "Not Cooling",
          description: "Refrigerant and airflow issues",
          icon: "temperature"
        },
        {
          question: "Split unit making loud noises - what's wrong?",
          title: "Loud Noises",
          description: "Compressor and fan motor issues",
          icon: "sound"
        },
        {
          question: "Split unit indoor/outdoor communication problems",
          title: "Communication Issues",
          description: "Wiring and control board problems",
          icon: "network"
        },
        {
          question: "Split unit refrigerant leak diagnosis",
          title: "Refrigerant Leaks",
          description: "Leak detection and repair steps",
          icon: "leak"
        },
        {
          question: "Split unit error codes and fault diagnostics",
          title: "Error Codes",
          description: "Control board and sensor faults",
          icon: "warning"
        }
      ],
      'reach-in': [
        {
          question: "Reach-in cooler not cooling properly - troubleshooting",
          title: "Not Cooling",
          description: "Temperature and refrigerant issues",
          icon: "temperature"
        },
        {
          question: "Reach-in cooler not turning on - what do I do?",
          title: "Not Turning On",
          description: "Power and control issues",
          icon: "power"
        },
        {
          question: "Reach-in cooler defrost problems - diagnostic steps",
          title: "Defrost Issues",
          description: "Timer and heater problems",
          icon: "defrost"
        },
        {
          question: "Reach-in cooler door seal problems - troubleshooting",
          title: "Door Seal Issues",
          description: "Gasket and door alignment problems",
          icon: "door"
        },
        {
          question: "Reach-in cooler making loud noises - what's wrong?",
          title: "Loud Noises",
          description: "Evaporator fan and compressor issues",
          icon: "sound"
        },
        {
          question: "Reach-in cooler error codes and fault diagnostics",
          title: "Error Codes",
          description: "Control board and sensor faults",
          icon: "warning"
        }
      ],
      'walk-in': [
        {
          question: "Walk-in cooler not cooling properly - troubleshooting",
          title: "Not Cooling",
          description: "Temperature and refrigerant issues",
          icon: "temperature"
        },
        {
          question: "Walk-in cooler evaporator fan problems - diagnostic steps",
          title: "Fan Issues",
          description: "Motor and blade problems",
          icon: "fan"
        },
        {
          question: "Walk-in cooler defrost problems - troubleshooting",
          title: "Defrost Issues",
          description: "Timer and heater problems",
          icon: "defrost"
        },
        {
          question: "Walk-in cooler door heater problems - what's wrong?",
          title: "Door Heater Issues",
          description: "Heater element and wiring problems",
          icon: "heater"
        },
        {
          question: "Walk-in cooler insulation problems - diagnostic steps",
          title: "Insulation Issues",
          description: "Moisture and energy efficiency problems",
          icon: "insulation"
        },
        {
          question: "Walk-in cooler error codes and fault diagnostics",
          title: "Error Codes",
          description: "Control board and sensor faults",
          icon: "warning"
        }
      ],
      'ice-machine': [
        {
          question: "Ice machine not turning on - what do I do?",
          title: "Not Turning On",
          description: "Power and startup issues",
          icon: "power"
        },
        {
          question: "Ice machine runs but makes no ice - troubleshooting steps",
          title: "No Ice Production",
          description: "Water flow and refrigeration issues",
          icon: "production"
        },
        {
          question: "Ice machine won't harvest ice - diagnostic steps",
          title: "Won't Harvest",
          description: "Harvest valve and timing issues",
          icon: "harvest"
        },
        {
          question: "Ice machine making bad tasting ice - troubleshooting",
          title: "Bad Taste",
          description: "Water quality and filter issues",
          icon: "taste"
        },
        {
          question: "Ice machine making loud noises - what's wrong?",
          title: "Loud Noises",
          description: "Compressor and fan motor issues",
          icon: "sound"
        },
        {
          question: "Ice machine error codes and fault diagnostics",
          title: "Error Codes",
          description: "Control board and sensor faults",
          icon: "warning"
        }
      ]
    };
    return presetOptions[type] || presetOptions['ice-machine'];
  };

  // Get icon component for preset options
  const getPresetIcon = (iconType: string) => {
    const iconMap: { [key: string]: React.ReactElement } = {
      power: (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="sm:w-4 sm:h-4">
          <circle cx="12" cy="12" r="10"/>
          <line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>
        </svg>
      ),
      temperature: (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="sm:w-4 sm:h-4">
          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
        </svg>
      ),
      sound: (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="sm:w-4 sm:h-4">
          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
          <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/>
        </svg>
      ),
      air: (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="sm:w-4 sm:h-4">
          <path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2-3v-3l3.5 3.5c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z"/>
        </svg>
      ),
      fire: (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="sm:w-4 sm:h-4">
          <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>
        </svg>
      ),
      warning: (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="sm:w-4 sm:h-4">
          <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
          <line x1="12" y1="9" x2="12" y2="13"/>
          <line x1="12" y1="17" x2="12.01" y2="17"/>
        </svg>
      ),
      network: (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="sm:w-4 sm:h-4">
          <circle cx="18" cy="5" r="3"/>
          <circle cx="6" cy="12" r="3"/>
          <circle cx="18" cy="19" r="3"/>
          <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
          <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
        </svg>
      ),
      leak: (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="sm:w-4 sm:h-4">
          <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/>
          <circle cx="12" cy="12" r="2"/>
        </svg>
      ),
      defrost: (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="sm:w-4 sm:h-4">
          <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
        </svg>
      ),
      door: (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="sm:w-4 sm:h-4">
          <path d="M3 21h18"/>
          <path d="M5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16"/>
          <path d="M9 21v-4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v4"/>
        </svg>
      ),
      fan: (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="sm:w-4 sm:h-4">
          <path d="M12 12v9"/>
          <path d="M12 12L9 9"/>
          <path d="M12 12l3-3"/>
          <path d="M12 12L9 15"/>
          <path d="M12 12l3 3"/>
          <path d="M12 12v-9"/>
          <path d="M12 12h9"/>
          <path d="M12 12H3"/>
          <path d="M12 12h9"/>
          <path d="M12 12H3"/>
        </svg>
      ),
      heater: (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="sm:w-4 sm:h-4">
          <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>
        </svg>
      ),
      insulation: (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="sm:w-4 sm:h-4">
          <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/>
          <path d="M21 3v5h-5"/>
          <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/>
          <path d="M8 16H3v5"/>
        </svg>
      ),
      production: (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="sm:w-4 sm:h-4">
          <path d="M12 2L2 7L12 12L22 7L12 2Z"/>
          <path d="M2 17L12 22L22 17"/>
          <path d="M2 12L12 17L22 12"/>
          <circle cx="12" cy="12" r="3"/>
        </svg>
      ),
      harvest: (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="sm:w-4 sm:h-4">
          <path d="M12 2L2 7L12 12L22 7L12 2Z"/>
          <path d="M2 17L12 22L22 17"/>
          <path d="M2 12L12 17L22 12"/>
          <path d="M12 1v2"/>
          <path d="M12 21v2"/>
        </svg>
      ),
      taste: (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="sm:w-4 sm:h-4">
          <path d="M9 11H5a2 2 0 0 0-2 2v3c0 1.1.9 2 2 2h4"/>
          <path d="M15 11h4a2 2 0 0 1 2 2v3c0 1.1-.9 2-2 2h-4"/>
          <path d="M9 11v-1a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v1"/>
        </svg>
      )
    };
    return iconMap[iconType] || iconMap.warning;
  };
  
  // Update selectedUnit when unitType prop changes
  useEffect(() => {
    if (unitType) {
      setSelectedUnit(prev => ({
        brand: prev?.brand || '',
        model: prev?.model || '',
        series: prev?.series || '',
        yearRange: prev?.yearRange || '',
        unitType: unitType
      }));
    }
  }, [unitType]);
  
  // Unit selection state
  const [selectedUnit, setSelectedUnit] = useState<{
    brand: string;
    model: string;
    series?: string;
    yearRange?: string;
    unitType: string;
  } | null>(unitType ? { brand: '', model: '', unitType: unitType } : null);
  const [showUnitSelector, setShowUnitSelector] = useState(false);
  
  // Input mode state (simplified for now)
  const [inputMode, setInputMode] = useState<'manual'>('manual');
  
  // Manual availability state
  const [manualAvailability, setManualAvailability] = useState<{
    hasManual: boolean;
    message: string;
  } | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const closeUnitSelector = () => {
    setShowUnitSelector(false);
    setInputMode('manual');
    setManualAvailability(null);
  };

  const checkManualAvailability = async (unitInfo: any) => {
    try {
      // Check if we have manuals for this specific unit
      const response = await fetch('/api/admin/manuals', {
        method: 'GET',
      });
      
      if (response.ok) {
        const data = await response.json();
        const manuals = data.manuals || []; // Extract manuals array from response
        
        console.log('Checking manual availability for:', unitInfo);
        console.log('Available manuals:', manuals.map((m: any) => ({ 
          brand: m.unitInfo?.brand, 
          model: m.unitInfo?.model, 
          type: m.unitInfo?.unitType 
        })));
        
        // Look for manuals that match the unit info
        const matchingManuals = manuals.filter((manual: any) => {
          const brandMatch = manual.unitInfo?.brand?.toLowerCase() === unitInfo.brand.toLowerCase();
          const modelMatch = manual.unitInfo?.model?.toLowerCase() === unitInfo.model.toLowerCase();
          const typeMatch = manual.unitInfo?.unitType?.toLowerCase() === unitInfo.unitType.toLowerCase();
          
          return brandMatch && modelMatch && typeMatch;
        });
        
        console.log('Matching manuals found:', matchingManuals.length);
        
        if (matchingManuals.length > 0) {
          setManualAvailability({
            hasManual: true,
            message: "Manual found, chat will now provide unit-specific information"
          });
        } else {
          setManualAvailability({
            hasManual: false,
            message: "This manual is not yet in our library, we will get it added soon. In the meantime you will see general results for ice machines."
          });
        }
      } else {
        // Fallback if API fails
        setManualAvailability({
          hasManual: false,
          message: "This manual is not yet in our library, we will get it added soon. In the meantime you will see general results for ice machines."
        });
      }
    } catch (error) {
      console.error('Error checking manual availability:', error);
      setManualAvailability({
        hasManual: false,
        message: "This manual is not yet in our library, we will get it added soon. In the meantime you will see general results for ice machines."
      });
    }
  };

  const sendMessage = async (messageText: string) => {
    if (!messageText.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: messageText.trim(),
      isUser: true,
      timestamp: new Date()
    };

    // Add the user message to the chat
    setMessages(prev => [...prev, userMessage]);

    // Add placeholder bot message that we'll update
    const botMessageId = (Date.now() + 1).toString();
    const botMessage: Message = {
      id: botMessageId,
      text: (selectedUnit && selectedUnit.brand && selectedUnit.model && selectedUnit.brand.trim() !== '' && selectedUnit.model.trim() !== '') 
        ? 'Generating unit-specific recommendations...' 
        : 'Gathering general HVAC/R recommendations...',
      isUser: false,
      timestamp: new Date(),
      isComplete: false
    };

    setMessages(prev => [...prev, botMessage]);

    try {
      // Include conversation history for context (last 4 messages)
      const conversationHistory = messages.slice(-4).map(msg => ({
        role: msg.isUser ? 'user' : 'assistant',
        content: msg.text
      }));

      const response = await fetch('/api/chat/stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          message: messageText,
          unitInfo: selectedUnit, // Include unit information
          conversationHistory: conversationHistory // Include conversation context
        }),
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response body');
      }

      let fullResponse = '';
      
      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;
        
        const chunk = new TextDecoder().decode(value);
        fullResponse += chunk;
      }

      // Parse source content from response
      const sourceContentMatch = fullResponse.match(/---SOURCE_CONTENT_START---\n([\s\S]*?)\n---SOURCE_CONTENT_END---/);
      const sourceContent = sourceContentMatch ? sourceContentMatch[1] : undefined;
      const cleanResponse = fullResponse.replace(/---SOURCE_CONTENT_START---\n[\s\S]*?\n---SOURCE_CONTENT_END---/, '').trim();

      // Update the bot message with the complete response
      setMessages(prev => prev.map(msg => 
        msg.id === botMessageId 
          ? { ...msg, text: cleanResponse || 'Sorry, I couldn\'t find relevant information.', isComplete: true, sourceContent }
          : msg
      ));

    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => prev.map(msg => 
        msg.id === botMessageId 
          ? { ...msg, text: 'Sorry, I encountered an error. Please try again.', isComplete: true }
          : msg
      ));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const currentInput = input.trim();
    setInput('');
    await sendMessage(currentInput);
  };

  return (
    <div className="flex-1 flex flex-col bg-gray-900">
      {/* Unit Selection Header */}
      <div className={`border-b border-gray-700 px-3 py-3 sm:px-4 sm:py-4 ${
        !selectedUnit ? 'bg-red-900/20 border-red-800/30' : 'bg-gray-800'
      }`}>
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center justify-between mb-2 sm:mb-0">
            <div className="flex items-center space-x-2 sm:space-x-4">
              <div className="flex items-center space-x-2 sm:space-x-3">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`sm:w-5 sm:h-5 ${!selectedUnit ? 'text-red-400' : 'text-blue-400'}`}>
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                  <line x1="16" y1="2" x2="16" y2="6"/>
                  <line x1="8" y1="2" x2="8" y2="6"/>
                  <line x1="3" y1="10" x2="21" y2="10"/>
                </svg>
                <span className={`font-medium text-sm sm:text-base ${!selectedUnit ? 'text-red-200' : 'text-white'}`}>
                  Unit Information
                </span>
              </div>
            </div>
            <button
              onClick={() => {
                if (!showUnitSelector) {
                  // Opening modal - ensure unit type is initialized based on current troubleshooter
                  setSelectedUnit(prev => ({ 
                    brand: prev?.brand || '', 
                    model: prev?.model || '', 
                    series: prev?.series || '', 
                    yearRange: prev?.yearRange || '', 
                    unitType: unitType || prev?.unitType || 'ice-machine' 
                  }));
                  // Clear manual availability when opening to change unit
                  setManualAvailability(null);
                }
                setShowUnitSelector(!showUnitSelector);
              }}
              className={`px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm rounded-lg transition-colors ${
                !selectedUnit 
                  ? 'bg-gray-600 hover:bg-gray-700 text-white border border-gray-500' 
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              {selectedUnit ? 'Change Unit' : 'Select Unit'}
            </button>
          </div>
          
          {selectedUnit ? (
            <div className="flex flex-col space-y-2">
              <div className="flex items-center space-x-2 sm:space-x-3 text-xs sm:text-sm text-gray-300">
                <span className="bg-blue-600 px-2 py-1 sm:px-3 sm:py-1.5 rounded text-white text-xs sm:text-sm font-medium">
                  {selectedUnit.brand} {selectedUnit.model}
                </span>
                <span className="text-gray-400 hidden sm:inline">•</span>
                <span className="hidden sm:inline text-gray-300">{selectedUnit.unitType}</span>
                {selectedUnit.series && (
                  <>
                    <span className="text-gray-400 hidden sm:inline">•</span>
                    <span className="hidden sm:inline text-gray-300">{selectedUnit.series}</span>
                  </>
                )}
              </div>
              {manualAvailability && (
                <div className={`text-xs sm:text-sm px-2 py-1 sm:px-3 sm:py-1.5 rounded ${
                  manualAvailability.hasManual 
                    ? 'bg-green-900/30 text-green-300 border border-green-700' 
                    : 'bg-yellow-900/30 text-yellow-300 border border-yellow-700'
                }`}>
                  {manualAvailability.message}
                </div>
              )}
            </div>
          ) : (
            <div className="mt-2">
              <p className="text-red-200 text-sm sm:text-base font-medium">
                ⚠️ No unit selected
              </p>
              <p className="text-red-300/80 text-xs sm:text-sm mt-1">
                Enter unit make/model info to get unit-specific recommendations
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Unit Selection Modal */}
      {showUnitSelector && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-gray-800 rounded-lg max-w-md w-full p-4 sm:p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <h3 className="text-base sm:text-lg font-semibold text-white">Select Unit</h3>
              <button
                onClick={closeUnitSelector}
                className="text-gray-400 hover:text-white"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="sm:w-6 sm:h-6">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
            
            {/* Input Mode Toggle */}
            <div className="mb-4 sm:mb-6">
              <div className="flex bg-gray-700 rounded-lg p-1">
                <button
                  onClick={() => {
                    setInputMode('manual');
                    // Ensure unit type is set when switching modes based on current troubleshooter
                    setSelectedUnit(prev => ({ 
                      brand: prev?.brand || '', 
                      model: prev?.model || '', 
                      series: prev?.series || '', 
                      yearRange: prev?.yearRange || '', 
                      unitType: unitType || prev?.unitType || 'ice-machine' 
                    }));
                  }}
                  className={`flex-1 py-1.5 px-2 sm:py-2 sm:px-4 rounded-md text-xs sm:text-sm font-medium transition-colors ${
                    inputMode === 'manual'
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-300 hover:text-white'
                  }`}
                >
                  Manual Input
                </button>
                <button
                  onClick={() => {
                    alert('Nameplate Scan feature coming soon! For now, please use Manual Input.');
                  }}
                  className="flex-1 py-1.5 px-2 sm:py-2 sm:px-4 rounded-md text-xs sm:text-sm font-medium transition-colors text-gray-400 cursor-not-allowed"
                  disabled
                >
                  <div className="text-center">
                    <div>Nameplate Scan</div>
                    <div className="italic text-xs">(Coming Soon)</div>
                  </div>
                </button>
              </div>
            </div>

            <div className="space-y-3 sm:space-y-4">
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-1 sm:mb-2">Brand *</label>
                <input
                  type="text"
                  value={selectedUnit?.brand || ''}
                  onChange={(e) => setSelectedUnit(prev => ({ 
                    brand: e.target.value || '', 
                    model: '', 
                    series: '', 
                    yearRange: '', 
                    unitType: prev?.unitType || 'Ice Machine' 
                  }))}
                  placeholder="e.g., Hoshizaki, Manitowoc, Scotsman"
                  className="w-full px-2 py-1.5 sm:px-3 sm:py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
                />
              </div>
              
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-1 sm:mb-2">Model *</label>
                <input
                  type="text"
                  value={selectedUnit?.model || ''}
                  onChange={(e) => setSelectedUnit(prev => ({ 
                    brand: prev?.brand || '', 
                    model: e.target.value || '', 
                    series: prev?.series || '', 
                    yearRange: prev?.yearRange || '', 
                    unitType: prev?.unitType || 'Ice Machine' 
                  }))}
                  placeholder="e.g., KM-1200 SRE, iT1200 Indigo"
                  className="w-full px-2 py-1.5 sm:px-3 sm:py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
                />
              </div>
              
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-1 sm:mb-2">Series</label>
                <input
                  type="text"
                  value={selectedUnit?.series || ''}
                  onChange={(e) => setSelectedUnit(prev => ({ 
                    brand: prev?.brand || '', 
                    model: prev?.model || '', 
                    series: e.target.value || '', 
                    yearRange: prev?.yearRange || '', 
                    unitType: prev?.unitType || 'Ice Machine' 
                  }))}
                  placeholder="e.g., SRE Series, Indigo Series"
                  className="w-full px-2 py-1.5 sm:px-3 sm:py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
                />
              </div>
              
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-1 sm:mb-2">Year Range</label>
                <input
                  type="text"
                  value={selectedUnit?.yearRange || ''}
                  onChange={(e) => setSelectedUnit(prev => ({ 
                    brand: prev?.brand || '', 
                    model: prev?.model || '', 
                    series: prev?.series || '', 
                    yearRange: e.target.value || '', 
                    unitType: prev?.unitType || 'Ice Machine' 
                  }))}
                  placeholder="e.g., 2020-2024, 2018+"
                  className="w-full px-2 py-1.5 sm:px-3 sm:py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
                />
              </div>
              
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-1 sm:mb-2">
                  Unit Type {unitType ? '(Pre-selected)' : '*'}
                </label>
                {unitType ? (
                  // Show read-only unit type when on specific troubleshooter page
                  <div className="w-full px-2 py-1.5 sm:px-3 sm:py-2 bg-gray-600 border border-gray-500 rounded-lg text-gray-300 text-sm sm:text-base flex items-center">
                    <span className="flex-1">{getEquipmentTypeName(unitType)}</span>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-blue-400">
                      <path d="M9 12l2 2 4-4"/>
                      <path d="M21 12c-1 0-3-1-3-3s2-3 3-3 3 1 3 3-2 3-3 3"/>
                      <path d="M3 12c1 0 3-1 3-3s-2-3-3-3-3 1-3 3 2 3 3 3"/>
                    </svg>
                  </div>
                ) : (
                  // Show dropdown when on general page
                  <select
                    value={selectedUnit?.unitType || 'ice-machine'}
                    onChange={(e) => setSelectedUnit(prev => ({ 
                      brand: prev?.brand || '', 
                      model: prev?.model || '', 
                      series: prev?.series || '', 
                      yearRange: prev?.yearRange || '', 
                      unitType: e.target.value || 'ice-machine' 
                    }))}
                    className="w-full px-2 py-1.5 sm:px-3 sm:py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
                  >
                    <option value="ice-machine">Ice Machine</option>
                    <option value="rtu">RTU (Roof Top Unit)</option>
                    <option value="split-unit">Split Unit</option>
                    <option value="reach-in">Reach-in Cooler/Freezer</option>
                    <option value="walk-in">Walk-in Cooler/Freezer</option>
                  </select>
                )}
              </div>
            </div>
            
            <div className="flex justify-end space-x-2 sm:space-x-3 mt-4 sm:mt-6">
              <button
                onClick={closeUnitSelector}
                className="px-3 py-1.5 sm:px-4 sm:py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors text-sm sm:text-base"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  // Manual input validation
                  if (selectedUnit?.brand && selectedUnit?.model && selectedUnit?.unitType) {
                    // Check manual availability before saving
                    await checkManualAvailability(selectedUnit);
                    setShowUnitSelector(false);
                  } else {
                    alert('Please fill in Brand, Model, and Unit Type');
                  }
                }}
                className="px-3 py-1.5 sm:px-4 sm:py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm sm:text-base"
              >
                Save Unit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Messages Area */}
      {messages.length > 0 && (
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-3xl mx-auto px-2 sm:px-4 py-4 sm:py-8 space-y-4 sm:space-y-8">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] sm:max-w-[80%] ${
                    message.isUser ? 'bg-gray-700 text-white' : 'bg-gray-800 text-gray-100'
                  } rounded-lg px-3 py-2 sm:px-4 sm:py-3`}
                >
                  {message.isUser ? (
                    <p className="text-xs sm:text-sm whitespace-pre-wrap leading-relaxed">
                      {message.text}
                    </p>
                  ) : message.isComplete ? (
                    <TroubleshootingChecklist response={message.text} sourceContent={message.sourceContent} />
                  ) : (
                    <div className="flex items-center space-x-2 sm:space-x-3">
                      <div className="flex space-x-1">
                        <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-blue-400 rounded-full animate-bounce"></div>
                        <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                      <span className="text-xs sm:text-sm text-gray-300">{message.text}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-800 text-gray-100 rounded-lg px-4 py-3">
                  <div className="flex items-center space-x-3">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                    <span className="text-sm text-gray-300">
                      {selectedUnit && selectedUnit.brand && selectedUnit.model && selectedUnit.brand.trim() !== '' && selectedUnit.model.trim() !== ''
                        ? 'Generating unit-specific recommendations...'
                        : 'Gathering general HVAC/R recommendations...'
                      }
                    </span>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        </div>
      )}

      {/* Welcome Message */}
      {messages.length === 0 && (
        <div className="flex-1 flex flex-col items-center justify-center px-2 sm:px-4">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-3 sm:mb-6">
              {getEquipmentTypeName(unitType || 'ice-machine')} Troubleshooter
            </h1>
            <h2 className="text-sm sm:text-lg md:text-xl lg:text-2xl text-gray-300 mb-4 sm:mb-8">
              What issue are you facing? Select an option below or type in a question
            </h2>
            
            {/* Quick Issue Selector */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-4 max-w-4xl mx-auto mb-4 sm:mb-8">
              {getPresetOptions(unitType || 'ice-machine').map((option, index) => {
                const colors = ['red', 'blue', 'yellow', 'green', 'cyan', 'purple'];
                const color = colors[index % colors.length];
                
                return (
                  <button
                    key={index}
                    onClick={() => sendMessage(option.question)}
                    className="p-2 sm:p-4 bg-gray-800 hover:bg-gray-700 border border-gray-600 rounded-lg text-left transition-colors group"
                  >
                    <div className="flex items-center space-x-2 sm:space-x-3">
                      <div className={`w-6 h-6 sm:w-8 sm:h-8 bg-${color}-600 rounded-full flex items-center justify-center`}>
                        {getPresetIcon(option.icon)}
                      </div>
                      <div>
                        <h3 className="text-white font-medium group-hover:text-blue-300 text-sm sm:text-base">{option.title}</h3>
                        <p className="text-gray-400 text-xs sm:text-sm">{option.description}</p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            <p className="text-gray-500 text-xs sm:text-sm">
              Or type your specific question below
            </p>
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="border-t border-gray-700 bg-gray-900">
        <div className="max-w-3xl mx-auto px-2 sm:px-4 py-3 sm:py-6">
          <form onSubmit={handleSubmit} className="relative">
            <div className="flex items-end space-x-2 sm:space-x-3">
              <div className="flex-1 relative">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Describe your ice machine issue..."
                  className="w-full bg-gray-700 text-white placeholder-gray-400 rounded-lg px-3 py-2 sm:px-4 sm:py-3 pr-10 sm:pr-12 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 border border-gray-600 min-h-[44px] sm:min-h-[52px] max-h-32 text-sm sm:text-base"
                  rows={1}
                  disabled={isLoading}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSubmit(e);
                    }
                  }}
                />
                <button
                  type="button"
                  className="absolute right-2 top-2 sm:right-3 sm:top-3 p-1 text-gray-400 hover:text-white transition-colors"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="sm:w-5 sm:h-5">
                    <path d="M12 5v14M5 12h14"/>
                  </svg>
                </button>
              </div>
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed text-white p-2 sm:p-3 rounded-lg transition-colors"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="sm:w-5 sm:h-5">
                  <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/>
                </svg>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}


