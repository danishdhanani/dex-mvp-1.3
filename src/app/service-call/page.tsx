'use client';

import { useState } from 'react';
import ChatBot from '@/components/ChatBot';
import UnitTypeSelector from '@/components/UnitTypeSelector';
import { useRouter } from 'next/navigation';

export default function ServiceCallPage() {
  const router = useRouter();
  const [selectedUnitType, setSelectedUnitType] = useState<string | null>(null);

  const handleUnitTypeSelect = (unitType: string) => {
    setSelectedUnitType(unitType);
  };

  const handleBackToUnitSelection = () => {
    setSelectedUnitType(null);
  };

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-2 sm:p-4 border-b border-gray-700">
        <div className="flex items-center space-x-2 sm:space-x-3">
          <button
            onClick={() => router.push('/job-type')}
            className="p-1 hover:bg-gray-700 rounded transition-colors"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-400">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
          </button>
          <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gray-600 rounded-full flex items-center justify-center">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-white sm:w-5 sm:h-5">
              <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h1 className="text-sm sm:text-lg lg:text-xl font-semibold text-white">
            {selectedUnitType ? (
              <span className="hidden sm:inline">Dex - HVAC/R Troubleshooter</span>
            ) : (
              <span className="hidden sm:inline">Dex Service Copilot</span>
            )}
            <span className="sm:hidden">Dex</span>
          </h1>
        </div>
        <div className="flex items-center space-x-1 sm:space-x-2">
          {selectedUnitType && (
            <button
              onClick={handleBackToUnitSelection}
              className="px-2 py-1 sm:px-3 bg-gray-600 hover:bg-gray-700 text-white text-xs sm:text-sm rounded-lg transition-colors"
            >
              <span className="hidden sm:inline">Home Page</span>
              <span className="sm:hidden">Home</span>
            </button>
          )}
          <a 
            href="/troubleshooting"
            className="px-2 py-1 sm:px-3 bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm rounded-lg transition-colors"
            title="New Troubleshooting UI"
          >
            <span className="hidden sm:inline">New Troubleshooting</span>
            <span className="sm:hidden">Troubleshoot</span>
          </a>
          <a 
            href="/admin"
            className="p-1.5 sm:p-2 text-gray-400 hover:text-white transition-colors"
            title="Admin Portal"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="sm:w-5 sm:h-5">
              <path d="M12 2L2 7L12 12L22 7L12 2Z"/>
              <path d="M2 17L12 22L22 17"/>
              <path d="M2 12L12 17L22 12"/>
            </svg>
          </a>
        </div>
      </div>
      
      {/* Main Content */}
      {selectedUnitType ? (
        <ChatBot unitType={selectedUnitType} />
      ) : (
        <UnitTypeSelector onUnitTypeSelect={handleUnitTypeSelect} />
      )}
    </div>
  );
}


