'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function JobTypePage() {
  const router = useRouter();
  const [selectedJobType, setSelectedJobType] = useState<string | null>(null);

  const handleJobTypeSelect = (jobType: string) => {
    setSelectedJobType(jobType);
    
    if (jobType === 'PM') {
      router.push('/pm');
    } else if (jobType === 'service') {
      router.push('/service-call');
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gray-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" className="text-white">
              <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
            Dex Service Copilot
          </h1>
          <p className="text-gray-400 text-lg">
            What type of job are you on today?
          </p>
        </div>

        {/* Job Type Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* PM Job Type */}
          <button
            onClick={() => handleJobTypeSelect('PM')}
            className="group relative bg-gray-800 hover:bg-gray-700 border-2 border-gray-700 hover:border-blue-600 rounded-lg p-8 transition-all duration-200"
          >
            <div className="text-center">
              <div className="w-20 h-20 bg-blue-600 group-hover:bg-blue-700 rounded-full flex items-center justify-center mx-auto mb-4 transition-colors">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-white">
                  <path d="M9 11l3 3L22 4"/>
                  <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-white mb-2 group-hover:text-blue-400 transition-colors">
                Preventive Maintenance
              </h2>
              <p className="text-gray-400 text-sm mb-4">
                Schedule and track maintenance for multiple units
              </p>
              <div className="text-blue-400 text-sm font-medium">
                Get Started →
              </div>
            </div>
          </button>

          {/* Service Call Job Type */}
          <button
            onClick={() => handleJobTypeSelect('service')}
            className="group relative bg-gray-800 hover:bg-gray-700 border-2 border-gray-700 hover:border-green-600 rounded-lg p-8 transition-all duration-200"
          >
            <div className="text-center">
              <div className="w-20 h-20 bg-green-600 group-hover:bg-green-700 rounded-full flex items-center justify-center mx-auto mb-4 transition-colors">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-white">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-white mb-2 group-hover:text-green-400 transition-colors">
                Service Call
              </h2>
              <p className="text-gray-400 text-sm mb-4">
                Troubleshoot and fix a specific unit issue
              </p>
              <div className="text-green-400 text-sm font-medium">
                Get Started →
              </div>
            </div>
          </button>
        </div>

        {/* Footer Note */}
        <div className="mt-8 text-center">
          <p className="text-gray-500 text-sm">
            Select the type of job to access the right tools and resources
          </p>
        </div>
      </div>
    </div>
  );
}

