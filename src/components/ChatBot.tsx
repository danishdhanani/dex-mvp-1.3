'use client';

import { useState, useRef, useEffect } from 'react';
import TroubleshootingChecklist from './TroubleshootingChecklist';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  isComplete?: boolean; // Track if the message is fully loaded
}

export default function ChatBot() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Unit selection state
  const [selectedUnit, setSelectedUnit] = useState<{
    brand: string;
    model: string;
    series?: string;
    yearRange?: string;
    unitType: string;
  } | null>(null);
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
      text: 'Generating unit-specific recommendations...',
      isUser: false,
      timestamp: new Date(),
      isComplete: false
    };

    setMessages(prev => [...prev, botMessage]);

    try {
      const response = await fetch('/api/chat/stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          message: messageText,
          unitInfo: selectedUnit // Include unit information
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

      // Update the bot message with the complete response
      setMessages(prev => prev.map(msg => 
        msg.id === botMessageId 
          ? { ...msg, text: fullResponse || 'Sorry, I couldn\'t find relevant information.', isComplete: true }
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
      <div className="bg-gray-800 border-b border-gray-700 px-4 py-3">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-blue-400">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                <line x1="16" y1="2" x2="16" y2="6"/>
                <line x1="8" y1="2" x2="8" y2="6"/>
                <line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
              <span className="text-white font-medium">Unit Information</span>
            </div>
            {selectedUnit ? (
              <div className="flex flex-col space-y-2">
                <div className="flex items-center space-x-2 text-sm text-gray-300">
                  <span className="bg-blue-600 px-2 py-1 rounded text-white text-xs">
                    {selectedUnit.brand} {selectedUnit.model}
                  </span>
                  <span className="text-gray-400">•</span>
                  <span>{selectedUnit.unitType}</span>
                  {selectedUnit.series && (
                    <>
                      <span className="text-gray-400">•</span>
                      <span>{selectedUnit.series}</span>
                    </>
                  )}
                </div>
                {manualAvailability && (
                  <div className={`text-xs px-2 py-1 rounded ${
                    manualAvailability.hasManual 
                      ? 'bg-green-900/30 text-green-300 border border-green-700' 
                      : 'bg-yellow-900/30 text-yellow-300 border border-yellow-700'
                  }`}>
                    {manualAvailability.message}
                  </div>
                )}
              </div>
            ) : (
              <span className="text-gray-400 text-sm">Enter unit make/model info to get unit-specific recommendations</span>
            )}
          </div>
          <button
            onClick={() => {
              if (!showUnitSelector) {
                // Opening modal - ensure unit type is initialized
                if (!selectedUnit?.unitType) {
                  setSelectedUnit(prev => ({ 
                    brand: prev?.brand || '', 
                    model: prev?.model || '', 
                    series: prev?.series || '', 
                    yearRange: prev?.yearRange || '', 
                    unitType: 'Ice Machine' 
                  }));
                }
                // Clear manual availability when opening to change unit
                setManualAvailability(null);
              }
              setShowUnitSelector(!showUnitSelector);
            }}
            className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors"
          >
            {selectedUnit ? 'Change Unit' : 'Select Unit'}
          </button>
        </div>
      </div>

      {/* Unit Selection Modal */}
      {showUnitSelector && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Select Unit</h3>
              <button
                onClick={closeUnitSelector}
                className="text-gray-400 hover:text-white"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
            
            {/* Input Mode Toggle */}
            <div className="mb-6">
              <div className="flex bg-gray-700 rounded-lg p-1">
                <button
                  onClick={() => {
                    setInputMode('manual');
                    // Ensure unit type is set when switching modes
                    if (!selectedUnit?.unitType) {
                      setSelectedUnit(prev => ({ 
                        brand: prev?.brand || '', 
                        model: prev?.model || '', 
                        series: prev?.series || '', 
                        yearRange: prev?.yearRange || '', 
                        unitType: 'Ice Machine' 
                      }));
                    }
                  }}
                  className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
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
                  className="flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors text-gray-400 cursor-not-allowed"
                  disabled
                >
                  Nameplate Scan - Coming Soon
                </button>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Brand *</label>
                <input
                  type="text"
                  value={selectedUnit?.brand || ''}
                  onChange={(e) => setSelectedUnit(prev => ({ ...prev, brand: e.target.value || '', model: '', series: '', yearRange: '', unitType: prev?.unitType || 'Ice Machine' }))}
                  placeholder="e.g., Hoshizaki, Manitowoc, Scotsman"
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Model *</label>
                <input
                  type="text"
                  value={selectedUnit?.model || ''}
                  onChange={(e) => setSelectedUnit(prev => ({ ...prev, model: e.target.value || '' }))}
                  placeholder="e.g., KM-1200 SRE, iT1200 Indigo"
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Series</label>
                <input
                  type="text"
                  value={selectedUnit?.series || ''}
                  onChange={(e) => setSelectedUnit(prev => ({ ...prev, series: e.target.value || '' }))}
                  placeholder="e.g., SRE Series, Indigo Series"
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Year Range</label>
                <input
                  type="text"
                  value={selectedUnit?.yearRange || ''}
                  onChange={(e) => setSelectedUnit(prev => ({ ...prev, yearRange: e.target.value || '' }))}
                  placeholder="e.g., 2020-2024, 2018+"
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Unit Type *</label>
                <select
                  value={selectedUnit?.unitType || 'Ice Machine'}
                  onChange={(e) => setSelectedUnit(prev => ({ ...prev, unitType: e.target.value || 'Ice Machine' }))}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Ice Machine">Ice Machine</option>
                  <option value="Refrigerator">Refrigerator</option>
                  <option value="Freezer">Freezer</option>
                  <option value="Walk-in Cooler">Walk-in Cooler</option>
                  <option value="Walk-in Freezer">Walk-in Freezer</option>
                  <option value="HVAC System">HVAC System</option>
                  <option value="Heat Pump">Heat Pump</option>
                  <option value="Air Handler">Air Handler</option>
                  <option value="Condensing Unit">Condensing Unit</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={closeUnitSelector}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
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
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
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
          <div className="max-w-3xl mx-auto px-4 py-8 space-y-8">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] ${
                    message.isUser ? 'bg-gray-700 text-white' : 'bg-gray-800 text-gray-100'
                  } rounded-lg px-4 py-3`}
                >
                  {message.isUser ? (
                    <p className="text-sm whitespace-pre-wrap leading-relaxed">
                      {message.text}
                    </p>
                  ) : message.isComplete ? (
                    <TroubleshootingChecklist response={message.text} />
                  ) : (
                    <div className="flex items-center space-x-3">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                      <span className="text-sm text-gray-300">{message.text}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-800 text-gray-100 rounded-lg px-4 py-3">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
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
        <div className="flex-1 flex flex-col items-center justify-center px-4">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
              Ice Machine Troubleshooter
            </h1>
            <h2 className="text-xl md:text-2xl text-gray-300 mb-8">
              What issue are you facing? Select an option below or type in a question
            </h2>
            
            {/* Quick Issue Selector */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto mb-8">
              <button
                onClick={() => sendMessage("Ice machine not turning on - what do I do?")}
                className="p-4 bg-gray-800 hover:bg-gray-700 border border-gray-600 rounded-lg text-left transition-colors group"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10"/>
                      <line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-white font-medium group-hover:text-blue-300">Not Turning On</h3>
                    <p className="text-gray-400 text-sm">Power and startup issues</p>
                  </div>
                </div>
              </button>

              <button
                onClick={() => sendMessage("Ice machine runs but makes no ice - troubleshooting steps")}
                className="p-4 bg-gray-800 hover:bg-gray-700 border border-gray-600 rounded-lg text-left transition-colors group"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-white font-medium group-hover:text-blue-300">No Ice Production</h3>
                    <p className="text-gray-400 text-sm">Running but not making ice</p>
                  </div>
                </div>
              </button>

              <button
                onClick={() => sendMessage("Ice machine makes ice but won't harvest - what's wrong?")}
                className="p-4 bg-gray-800 hover:bg-gray-700 border border-gray-600 rounded-lg text-left transition-colors group"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-yellow-600 rounded-full flex items-center justify-center">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-white font-medium group-hover:text-blue-300">Won't Harvest</h3>
                    <p className="text-gray-400 text-sm">Ice stuck, not dispensing</p>
                  </div>
                </div>
              </button>

              <button
                onClick={() => sendMessage("Ice tastes or smells bad - how to fix?")}
                className="p-4 bg-gray-800 hover:bg-gray-700 border border-gray-600 rounded-lg text-left transition-colors group"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M9 12l2 2 4-4"/>
                      <path d="M21 12c-1 0-3-1-3-3s2-3 3-3 3 1 3 3-2 3-3 3"/>
                      <path d="M3 12c1 0 3-1 3-3s-2-3-3-3-3 1-3 3 2 3 3 3"/>
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-white font-medium group-hover:text-blue-300">Bad Taste/Smell</h3>
                    <p className="text-gray-400 text-sm">Water quality issues</p>
                  </div>
                </div>
              </button>

              <button
                onClick={() => sendMessage("Ice machine leaking water - troubleshooting")}
                className="p-4 bg-gray-800 hover:bg-gray-700 border border-gray-600 rounded-lg text-left transition-colors group"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-cyan-600 rounded-full flex items-center justify-center">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-white font-medium group-hover:text-blue-300">Water Leak</h3>
                    <p className="text-gray-400 text-sm">Leaking or pooling water</p>
                  </div>
                </div>
              </button>

              <button
                onClick={() => sendMessage("Ice machine maintenance schedule and cleaning")}
                className="p-4 bg-gray-800 hover:bg-gray-700 border border-gray-600 rounded-lg text-left transition-colors group"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-white font-medium group-hover:text-blue-300">Maintenance</h3>
                    <p className="text-gray-400 text-sm">Cleaning and upkeep</p>
                  </div>
                </div>
              </button>
            </div>

            <p className="text-gray-500 text-sm">
              Or type your specific question below
            </p>
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="border-t border-gray-700 bg-gray-900">
        <div className="max-w-3xl mx-auto px-4 py-6">
          <form onSubmit={handleSubmit} className="relative">
            <div className="flex items-end space-x-3">
              <div className="flex-1 relative">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Describe your ice machine issue..."
                  className="w-full bg-gray-700 text-white placeholder-gray-400 rounded-lg px-4 py-3 pr-12 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 border border-gray-600 min-h-[52px] max-h-32"
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
                  className="absolute right-3 top-3 p-1 text-gray-400 hover:text-white transition-colors"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 5v14M5 12h14"/>
                  </svg>
                </button>
              </div>
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed text-white p-3 rounded-lg transition-colors"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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


