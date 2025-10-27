'use client';

import { useState } from 'react';
import Link from 'next/link';

// Types for our troubleshooting flow
interface PresetIssue {
  id: string;
  title: string;
  description: string;
  icon: string;
  assessmentQuestions: AssessmentQuestion[];
}

interface AssessmentQuestion {
  id: string;
  question: string;
  options: {
    value: string;
    label: string;
    icon: string;
    nextPhase?: string;
  }[];
}

interface TroubleshootingStep {
  id: string;
  title: string;
  instructions: string[];
  status: 'pending' | 'in-progress' | 'completed' | 'needs-help' | 'failed';
  subSteps?: TroubleshootingStep[];
}

interface ResolutionStep {
  id: string;
  title: string;
  description: string;
  tools: string[];
  parts: string[];
  instructions: string[];
  status: 'pending' | 'in-progress' | 'completed';
  manualReference?: string;
  estimatedCost?: string;
  estimatedTime?: string;
}

type TroubleshootingPhase = 'presets' | 'assessment' | 'detailed' | 'resolution' | 'chat';

export default function TroubleshootingPage() {
  const [currentPhase, setCurrentPhase] = useState<TroubleshootingPhase>('presets');
  const [selectedIssue, setSelectedIssue] = useState<PresetIssue | null>(null);
  const [assessmentAnswers, setAssessmentAnswers] = useState<Record<string, string>>({});
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [problemArea, setProblemArea] = useState<string>('');
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<Array<{id: string, text: string, isUser: boolean}>>([]);

  // Preset issues with their specific assessment questions
  const presetIssues: PresetIssue[] = [
    {
      id: 'temperature-issues',
      title: 'Temperature Problems',
      description: 'Unit not maintaining proper temperature',
      icon: '🌡️',
      assessmentQuestions: [
        {
          id: 'current-temp',
          question: 'What is the current temperature reading?',
          options: [
            { value: 'normal', label: 'Normal (32-40°F)', icon: '✅' },
            { value: 'warm', label: 'Too warm (>45°F)', icon: '🔥' },
            { value: 'cold', label: 'Too cold (<28°F)', icon: '❄️' },
            { value: 'fluctuating', label: 'Fluctuating', icon: '📈' }
          ]
        },
        {
          id: 'temp-display',
          question: 'Is the temperature display working correctly?',
          options: [
            { value: 'yes', label: 'Yes, showing correctly', icon: '✅' },
            { value: 'no', label: 'No, display issues', icon: '❌' },
            { value: 'blank', label: 'Blank display', icon: '⬛' }
          ]
        },
        {
          id: 'door-seals',
          question: 'How do the door seals look?',
          options: [
            { value: 'good', label: 'Good condition', icon: '✅' },
            { value: 'worn', label: 'Worn/damaged', icon: '⚠️' },
            { value: 'missing', label: 'Missing/broken', icon: '❌' }
          ]
        }
      ]
    },
    {
      id: 'power-issues',
      title: 'Power & Electrical',
      description: 'Unit not powering on or electrical problems',
      icon: '⚡',
      assessmentQuestions: [
        {
          id: 'power-status',
          question: 'Is the unit receiving power?',
          options: [
            { value: 'yes', label: 'Yes, power LED on', icon: '✅' },
            { value: 'no', label: 'No power at all', icon: '❌' },
            { value: 'intermittent', label: 'Intermittent power', icon: '⚡' }
          ]
        },
        {
          id: 'display-status',
          question: 'What do you see on the display?',
          options: [
            { value: 'normal', label: 'Normal display', icon: '✅' },
            { value: 'error-code', label: 'Error code showing', icon: '⚠️' },
            { value: 'blank', label: 'Blank display', icon: '⬛' },
            { value: 'dim', label: 'Dim/flickering', icon: '💡' }
          ]
        },
        {
          id: 'recent-power',
          question: 'Any recent power issues?',
          options: [
            { value: 'none', label: 'No issues', icon: '✅' },
            { value: 'outage', label: 'Power outage', icon: '⚡' },
            { value: 'maintenance', label: 'Recent electrical work', icon: '🔧' }
          ]
        }
      ]
    },
    {
      id: 'ice-buildup',
      title: 'Ice Buildup',
      description: 'Excessive ice formation or defrost problems',
      icon: '🧊',
      assessmentQuestions: [
        {
          id: 'ice-location',
          question: 'Where is the ice buildup occurring?',
          options: [
            { value: 'evaporator', label: 'On evaporator coils', icon: '🌀' },
            { value: 'door', label: 'Around door seals', icon: '🚪' },
            { value: 'drain', label: 'In drain area', icon: '💧' },
            { value: 'multiple', label: 'Multiple locations', icon: '🧊' }
          ]
        },
        {
          id: 'ice-severity',
          question: 'How severe is the ice buildup?',
          options: [
            { value: 'light', label: 'Light coating', icon: '❄️' },
            { value: 'moderate', label: 'Moderate buildup', icon: '🧊' },
            { value: 'heavy', label: 'Heavy ice formation', icon: '🏔️' }
          ]
        },
        {
          id: 'defrost-cycle',
          question: 'Is the defrost cycle working?',
          options: [
            { value: 'yes', label: 'Yes, working normally', icon: '✅' },
            { value: 'no', label: 'No defrost cycle', icon: '❌' },
            { value: 'short', label: 'Short defrost cycles', icon: '⏱️' }
          ]
        }
      ]
    },
    {
      id: 'noise-issues',
      title: 'Unusual Noises',
      description: 'Strange sounds or vibrations from the unit',
      icon: '🔊',
      assessmentQuestions: [
        {
          id: 'noise-type',
          question: 'What type of noise are you hearing?',
          options: [
            { value: 'grinding', label: 'Grinding/scraping', icon: '⚙️' },
            { value: 'clicking', label: 'Clicking sounds', icon: '🔘' },
            { value: 'humming', label: 'Loud humming', icon: '🔊' },
            { value: 'rattling', label: 'Rattling/vibration', icon: '📳' }
          ]
        },
        {
          id: 'noise-timing',
          question: 'When does the noise occur?',
          options: [
            { value: 'constant', label: 'Constant noise', icon: '🔄' },
            { value: 'startup', label: 'During startup', icon: '🚀' },
            { value: 'cycling', label: 'During cycling', icon: '🔄' },
            { value: 'intermittent', label: 'Intermittent', icon: '⏰' }
          ]
        },
        {
          id: 'noise-severity',
          question: 'How loud is the noise?',
          options: [
            { value: 'quiet', label: 'Quiet but noticeable', icon: '🔇' },
            { value: 'moderate', label: 'Moderately loud', icon: '🔊' },
            { value: 'loud', label: 'Very loud', icon: '📢' }
          ]
        }
      ]
    }
  ];

  const troubleshootingSteps: TroubleshootingStep[] = [
    {
      id: 'evaporator-fan',
      title: 'Check Evaporator Fan',
      instructions: [
        'Open the unit door',
        'Locate the evaporator fan (back wall)',
        'Check if fan is running'
      ],
      status: 'pending',
      subSteps: [
        {
          id: 'access-fan',
          title: 'How to access evaporator fan',
          instructions: ['Remove evaporator cover', 'Check for obstructions'],
          status: 'pending'
        },
        {
          id: 'test-fan-motor',
          title: 'Testing fan motor with multimeter',
          instructions: ['Disconnect power', 'Test motor windings', 'Check for continuity'],
          status: 'pending'
        }
      ]
    },
    {
      id: 'temperature-sensor',
      title: 'Check Temperature Sensor',
      instructions: [
        'Locate temperature sensor',
        'Test sensor readings',
        'Check sensor connections'
      ],
      status: 'pending'
    },
    {
      id: 'compressor',
      title: 'Check Compressor Operation',
      instructions: [
        'Listen for compressor operation',
        'Check compressor temperature',
        'Test electrical connections'
      ],
      status: 'pending'
    }
  ];

  const resolutionSteps: ResolutionStep[] = [
    {
      id: 'replace-fan-motor',
      title: 'Replace Evaporator Fan Motor',
      description: 'Issue Identified: Evaporator fan motor failure',
      tools: ['Phillips screwdriver', 'Multimeter', 'Replacement fan motor'],
      parts: ['Part #: TF-49-FAN-001'],
      instructions: [
        'Unplug unit from power',
        'Allow 5 minutes for capacitors to discharge',
        'Remove evaporator cover (4 screws)',
        'Disconnect electrical connections',
        'Remove fan blade (1 set screw)',
        'Install new motor',
        'Reassemble in reverse order'
      ],
      status: 'pending',
      manualReference: 'Page 45-47, Section 4.2',
      estimatedCost: '$85-120 (parts only)',
      estimatedTime: '30-45 minutes'
    }
  ];

  const handlePresetIssueSelect = (issue: PresetIssue) => {
    setSelectedIssue(issue);
    setCurrentPhase('assessment');
    setAssessmentAnswers({});
    setCurrentStepIndex(0);
  };

  const handleAssessmentAnswer = (questionId: string, answer: string) => {
    setAssessmentAnswers(prev => ({ ...prev, [questionId]: answer }));
  };

  const proceedToDetailedTroubleshooting = () => {
    setCurrentPhase('detailed');
    setCurrentStepIndex(0);
  };

  const proceedToResolution = () => {
    setCurrentPhase('resolution');
    setCurrentStepIndex(0);
  };

  const openChat = () => {
    setCurrentPhase('chat');
  };

  const closeChat = () => {
    setCurrentPhase('assessment');
  };

  const sendChatMessage = () => {
    if (!chatInput.trim()) return;
    
    const userMessage = {
      id: Date.now().toString(),
      text: chatInput,
      isUser: true
    };
    
    setChatMessages(prev => [...prev, userMessage]);
    setChatInput('');
    
    // Simulate AI response (in real implementation, this would call your chat API)
    setTimeout(() => {
      const aiMessage = {
        id: (Date.now() + 1).toString(),
        text: "I understand your question about the current step. Let me help you with that specific issue. Would you like me to provide more detailed instructions for this troubleshooting step?",
        isUser: false
      };
      setChatMessages(prev => [...prev, aiMessage]);
    }, 1000);
  };

  const updateStepStatus = (stepId: string, status: TroubleshootingStep['status']) => {
    // This would update the step status in a real implementation
    console.log(`Step ${stepId} status updated to: ${status}`);
  };

  const renderPresetsPhase = () => (
    <div className="max-w-4xl mx-auto p-4 sm:p-6">
      <div className="bg-gray-800 rounded-lg p-6 mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
          🔧 Troubleshooting Assistant - True T-49
        </h1>
        <p className="text-gray-300 mb-6">
          Select the issue category that best describes your problem:
        </p>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {presetIssues.map((issue) => (
            <button
              key={issue.id}
              onClick={() => handlePresetIssueSelect(issue)}
              className="p-6 bg-gray-700 hover:bg-gray-600 border border-gray-600 rounded-lg text-left transition-colors group"
            >
              <div className="flex items-center space-x-4">
                <div className="text-4xl">{issue.icon}</div>
                <div>
                  <h3 className="text-white font-semibold text-lg group-hover:text-blue-300 transition-colors">
                    {issue.title}
                  </h3>
                  <p className="text-gray-400 text-sm mt-1">
                    {issue.description}
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>
        
        <div className="flex justify-center mt-8">
          <Link 
            href="/" 
            className="text-blue-400 hover:text-blue-300 transition-colors"
          >
            ← Back to Chatbot
          </Link>
        </div>
      </div>
    </div>
  );

  const renderAssessmentPhase = () => (
    <div className="max-w-4xl mx-auto p-4 sm:p-6">
      <div className="bg-gray-800 rounded-lg p-6 mb-6">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
              🔍 Quick Assessment - {selectedIssue?.title}
            </h1>
            <p className="text-gray-300 mb-6">
              Let's quickly identify the specific problem:
            </p>
          </div>
          <button
            onClick={openChat}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm"
          >
            💬 Ask Question
          </button>
        </div>
        
        {selectedIssue?.assessmentQuestions.map((question, index) => (
          <div key={question.id} className="mb-8">
            <h3 className="text-lg font-semibold text-white mb-4">
              {index + 1}. {question.question}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {question.options.map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleAssessmentAnswer(question.id, option.value)}
                  className={`p-4 rounded-lg border-2 transition-colors ${
                    assessmentAnswers[question.id] === option.value
                      ? 'border-blue-500 bg-blue-900 text-white'
                      : 'border-gray-600 bg-gray-700 text-gray-300 hover:border-gray-500'
                  }`}
                >
                  <div className="text-2xl mb-2">{option.icon}</div>
                  <div className="font-medium">{option.label}</div>
                </button>
              ))}
            </div>
          </div>
        ))}
        
        <div className="flex justify-between items-center mt-8">
          <button
            onClick={() => setCurrentPhase('presets')}
            className="text-blue-400 hover:text-blue-300 transition-colors"
          >
            ← Back to Issue Categories
          </button>
          <button
            onClick={proceedToDetailedTroubleshooting}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            Continue to Detailed Troubleshooting
          </button>
        </div>
      </div>
    </div>
  );

  const renderChatPhase = () => (
    <div className="max-w-4xl mx-auto p-4 sm:p-6">
      <div className="bg-gray-800 rounded-lg p-6 mb-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-white">
            💬 Ask a Question
          </h1>
          <button
            onClick={closeChat}
            className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors text-sm"
          >
            ← Back to Assessment
          </button>
        </div>
        
        <div className="mb-6">
          <p className="text-gray-300 mb-4">
            Ask any specific question about the current troubleshooting step or issue:
          </p>
          <div className="bg-gray-700 rounded-lg p-4 mb-4">
            <p className="text-sm text-gray-400 mb-2">Current Issue:</p>
            <p className="text-white font-medium">{selectedIssue?.title}</p>
          </div>
        </div>
        
        {/* Chat Messages */}
        <div className="bg-gray-700 rounded-lg p-4 mb-4 h-64 overflow-y-auto">
          {chatMessages.length === 0 ? (
            <p className="text-gray-400 text-center py-8">
              Ask your question below to get started...
            </p>
          ) : (
            <div className="space-y-4">
              {chatMessages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                      message.isUser
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-600 text-gray-100'
                    }`}
                  >
                    <p className="text-sm">{message.text}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* Chat Input */}
        <div className="flex space-x-3">
          <input
            type="text"
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            placeholder="Ask your question here..."
            className="flex-1 bg-gray-700 text-white placeholder-gray-400 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 border border-gray-600"
            onKeyPress={(e) => e.key === 'Enter' && sendChatMessage()}
          />
          <button
            onClick={sendChatMessage}
            disabled={!chatInput.trim()}
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg transition-colors"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );

  const renderDetailedPhase = () => (
    <div className="max-w-4xl mx-auto p-4 sm:p-6">
      <div className="bg-gray-800 rounded-lg p-6 mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
          🔧 Detailed Troubleshooting - {problemArea.charAt(0).toUpperCase() + problemArea.slice(1)} Issues
        </h1>
        <p className="text-gray-300 mb-6">
          Based on your assessment, let's focus on {problemArea}:
        </p>
        
        <div className="bg-gray-700 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-white mb-4">
            Current Step: {troubleshootingSteps[currentStepIndex]?.title}
          </h2>
          
          <div className="mb-4">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-900 text-blue-200">
              🔄 In Progress
            </span>
          </div>
          
          <div className="mb-6">
            <h3 className="text-lg font-medium text-white mb-3">Instructions:</h3>
            <ol className="list-decimal list-inside space-y-2 text-gray-300">
              {troubleshootingSteps[currentStepIndex]?.instructions.map((instruction, index) => (
                <li key={index}>{instruction}</li>
              ))}
            </ol>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
            <button className="p-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors">
              ✅ Working normally
            </button>
            <button className="p-3 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg transition-colors">
              ⚠️ Need help with this step
            </button>
            <button className="p-3 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors">
              ❌ This step failed
            </button>
            <button className="p-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors">
              ❓ I need help finding this
            </button>
          </div>
          
          {troubleshootingSteps[currentStepIndex]?.subSteps && (
            <div className="mb-6">
              <h3 className="text-lg font-medium text-white mb-3">📋 Sub-steps available:</h3>
              <ul className="space-y-2 text-gray-300">
                {troubleshootingSteps[currentStepIndex]?.subSteps.map((subStep) => (
                  <li key={subStep.id} className="flex items-center">
                    <span className="mr-2">•</span>
                    {subStep.title}
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          <div className="mb-6">
            <div className="flex justify-between text-sm text-gray-400 mb-2">
              <span>Progress</span>
              <span>{currentStepIndex + 1} of {troubleshootingSteps.length} steps</span>
            </div>
            <div className="w-full bg-gray-600 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${((currentStepIndex + 1) / troubleshootingSteps.length) * 100}%` }}
              ></div>
            </div>
          </div>
          
          <div className="flex justify-between">
            <button 
              onClick={() => setCurrentStepIndex(Math.max(0, currentStepIndex - 1))}
              disabled={currentStepIndex === 0}
              className="px-4 py-2 bg-gray-600 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
            >
              ← Back to Previous Step
            </button>
            <button 
              onClick={() => setCurrentStepIndex(Math.min(troubleshootingSteps.length - 1, currentStepIndex + 1))}
              disabled={currentStepIndex === troubleshootingSteps.length - 1}
              className="px-4 py-2 bg-gray-600 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
            >
              Skip to Next Step →
            </button>
          </div>
        </div>
        
        <div className="flex justify-between items-center">
          <Link 
            href="/" 
            className="text-blue-400 hover:text-blue-300 transition-colors"
          >
            ← Back to Chatbot
          </Link>
          <button
            onClick={proceedToResolution}
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            Proceed to Resolution
          </button>
        </div>
      </div>
    </div>
  );

  const renderResolutionPhase = () => (
    <div className="max-w-4xl mx-auto p-4 sm:p-6">
      <div className="bg-gray-800 rounded-lg p-6 mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
          🛠️ Resolution Path - Replace Evaporator Fan Motor
        </h1>
        
        <div className="bg-gray-700 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-white mb-4">
            {resolutionSteps[0].title}
          </h2>
          
          <p className="text-gray-300 mb-6">
            {resolutionSteps[0].description}
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <h3 className="text-lg font-medium text-white mb-3">⚠️ Safety First:</h3>
              <ul className="space-y-2 text-gray-300">
                <li>• Unplug unit from power</li>
                <li>• Allow 5 minutes for capacitors to discharge</li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-medium text-white mb-3">🔧 Required Tools:</h3>
              <ul className="space-y-2 text-gray-300">
                {resolutionSteps[0].tools.map((tool, index) => (
                  <li key={index}>• {tool}</li>
                ))}
              </ul>
            </div>
          </div>
          
          <div className="mb-6">
            <h3 className="text-lg font-medium text-white mb-3">📋 Step-by-Step Instructions:</h3>
            <ol className="list-decimal list-inside space-y-2 text-gray-300">
              {resolutionSteps[0].instructions.map((instruction, index) => (
                <li key={index}>{instruction}</li>
              ))}
            </ol>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div className="bg-gray-600 p-4 rounded-lg">
              <h4 className="font-medium text-white mb-2">📖 Manual Reference:</h4>
              <p className="text-gray-300 text-sm">{resolutionSteps[0].manualReference}</p>
            </div>
            <div className="bg-gray-600 p-4 rounded-lg">
              <h4 className="font-medium text-white mb-2">💰 Estimated Cost:</h4>
              <p className="text-gray-300 text-sm">{resolutionSteps[0].estimatedCost}</p>
            </div>
            <div className="bg-gray-600 p-4 rounded-lg">
              <h4 className="font-medium text-white mb-2">⏱️ Estimated Time:</h4>
              <p className="text-gray-300 text-sm">{resolutionSteps[0].estimatedTime}</p>
            </div>
          </div>
          
          <div className="flex justify-between">
            <button className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg transition-colors">
              Need Help with This Step
            </button>
            <button className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors">
              Mark as Complete
            </button>
          </div>
        </div>
        
        <div className="flex justify-between items-center">
          <Link 
            href="/" 
            className="text-blue-400 hover:text-blue-300 transition-colors"
          >
            ← Back to Chatbot
          </Link>
          <button
            onClick={() => setCurrentPhase('assessment')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            Start New Troubleshooting
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-900">
      <div className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-white">Dex - Troubleshooting Assistant</h1>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-400">
                Phase: {currentPhase.charAt(0).toUpperCase() + currentPhase.slice(1)}
              </span>
              <Link 
                href="/" 
                className="text-blue-400 hover:text-blue-300 transition-colors"
              >
                Back to Chatbot
              </Link>
            </div>
          </div>
        </div>
      </div>
      
      {currentPhase === 'presets' && renderPresetsPhase()}
      {currentPhase === 'assessment' && renderAssessmentPhase()}
      {currentPhase === 'chat' && renderChatPhase()}
      {currentPhase === 'detailed' && renderDetailedPhase()}
      {currentPhase === 'resolution' && renderResolutionPhase()}
    </div>
  );
}
