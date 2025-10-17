import React, { useState } from 'react';

interface ChecklistItem {
  id: string;
  title: string;
  description: string;
  completed: boolean;
}

interface TroubleshootingChecklistProps {
  response: string;
}

export default function TroubleshootingChecklist({ response }: TroubleshootingChecklistProps) {
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [completedItems, setCompletedItems] = useState<Set<string>>(new Set());

  // Parse the response to extract steps
  const parseResponse = (text: string): ChecklistItem[] => {
    // Parse response text into checklist items
    const items: ChecklistItem[] = [];
    
    // First, try to detect if this looks like a multi-step response
    const hasMultipleSteps = /(\d+\.|\n\s*[-•]|\n\s*\*|\n\s*Step|\n\s*Check|\n\s*Verify)/i.test(text);
    
    if (!hasMultipleSteps) {
      // If it doesn't look like multiple steps, return as single item
      return [{
        id: 'single-response',
        title: 'Response',
        description: text,
        completed: false
      }];
    }

    // Look for numbered steps (1., 2., 3., etc.) - simpler approach
    const lines = text.split('\n');
    let currentStep = null;
    let stepId = 1;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Check if this line starts a new numbered step
      const stepMatch = line.match(/^(\d+)\.\s*(.+)$/);
      if (stepMatch) {
        // Save previous step if exists
        if (currentStep) {
          items.push(currentStep);
        }
        
        // Start new step
        currentStep = {
          id: `step-${stepId}`,
          title: `${stepMatch[1]}. ${stepMatch[2]}`,
          description: '',
          completed: false
        };
        stepId++;
      } else if (currentStep && line.length > 0) {
        // Add content to current step's description
        if (currentStep.description) {
          currentStep.description += '\n' + line;
        } else {
          currentStep.description = line;
        }
      }
    }
    
    // Add the last step
    if (currentStep) {
      items.push(currentStep);
    }

    // If no numbered steps found, try to parse bullet points
    if (items.length === 0) {
      let currentBullet = null;
      let bulletId = 1;

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        
        // Check if this line starts with a bullet point
        const bulletMatch = line.match(/^[-•*]\s*(.+)$/);
        if (bulletMatch) {
          // Save previous bullet if exists
          if (currentBullet) {
            items.push(currentBullet);
          }
          
          // Start new bullet
          currentBullet = {
            id: `bullet-${bulletId}`,
            title: bulletMatch[1],
            description: '',
            completed: false
          };
          bulletId++;
        } else if (currentBullet && line.length > 0) {
          // Add content to current bullet's description
          if (currentBullet.description) {
            currentBullet.description += '\n' + line;
          } else {
            currentBullet.description = line;
          }
        }
      }
      
      // Add the last bullet
      if (currentBullet) {
        items.push(currentBullet);
      }
    }

    // Try to parse "Step X:" format
    if (items.length === 0) {
      const lines = text.split('\n');
      let currentStep = null;
      let stepFormatId = 1;

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        
        // Check if this line starts with "Step X:"
        const stepMatch = line.match(/^Step\s*(\d+):\s*(.+)$/);
        if (stepMatch) {
          // Save previous step if exists
          if (currentStep) {
            items.push(currentStep);
          }
          
          // Start new step
          currentStep = {
            id: `step-format-${stepFormatId}`,
            title: `Step ${stepMatch[1]}: ${stepMatch[2]}`,
            description: '',
            completed: false
          };
          stepFormatId++;
        } else if (currentStep && line.length > 0) {
          // Add content to current step's description
          if (currentStep.description) {
            currentStep.description += '\n' + line;
          } else {
            currentStep.description = line;
          }
        }
      }
      
      // Add the last step
      if (currentStep) {
        items.push(currentStep);
      }
    }

    // Try to parse "Check/Verify X:" format
    if (items.length === 0) {
      const lines = text.split('\n');
      let currentCheck = null;
      let checkId = 1;

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        
        // Check if this line starts with "Check X:" or "Verify X:"
        const checkMatch = line.match(/^(Check|Verify)\s*(\d+):\s*(.+)$/);
        if (checkMatch) {
          // Save previous check if exists
          if (currentCheck) {
            items.push(currentCheck);
          }
          
          // Start new check
          currentCheck = {
            id: `check-${checkId}`,
            title: `${checkMatch[1]} ${checkMatch[2]}: ${checkMatch[3]}`,
            description: '',
            completed: false
          };
          checkId++;
        } else if (currentCheck && line.length > 0) {
          // Add content to current check's description
          if (currentCheck.description) {
            currentCheck.description += '\n' + line;
          } else {
            currentCheck.description = line;
          }
        }
      }
      
      // Add the last check
      if (currentCheck) {
        items.push(currentCheck);
      }
    }

    // If still no items found, try to split by double newlines and create items
    if (items.length === 0) {
      const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim().length > 0);
      if (paragraphs.length > 1) {
        paragraphs.forEach((paragraph, index) => {
          const lines = paragraph.trim().split('\n');
          const title = lines[0].trim();
          const description = lines.slice(1).join('\n').trim();
          
          items.push({
            id: `paragraph-${index + 1}`,
            title: title,
            description: description,
            completed: false
          });
        });
      }
    }

    // If still no items found, create a single item with the full response
    if (items.length === 0) {
      items.push({
        id: 'single-response',
        title: 'Troubleshooting Information',
        description: text,
        completed: false
      });
    }

    return items;
  };

  const toggleExpanded = (itemId: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(itemId)) {
      newExpanded.delete(itemId);
    } else {
      newExpanded.add(itemId);
    }
    setExpandedItems(newExpanded);
  };

  const toggleCompleted = (itemId: string) => {
    const newCompleted = new Set(completedItems);
    if (newCompleted.has(itemId)) {
      newCompleted.delete(itemId);
    } else {
      newCompleted.add(itemId);
    }
    setCompletedItems(newCompleted);
  };

  const checklistItems = parseResponse(response);

  return (
    <div className="space-y-3">
      {checklistItems.map((item) => (
        <div
          key={item.id}
          className={`bg-gray-800 border border-gray-600 rounded-lg p-4 transition-all duration-200 ${
            completedItems.has(item.id) ? 'opacity-75 bg-gray-700' : ''
          }`}
        >
          <div className="flex items-start space-x-3">
            {/* Checkbox */}
            <button
              onClick={() => toggleCompleted(item.id)}
              className={`mt-1 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                completedItems.has(item.id)
                  ? 'bg-green-600 border-green-600 text-white'
                  : 'border-gray-400 hover:border-green-500'
              }`}
            >
              {completedItems.has(item.id) && (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <polyline points="20,6 9,17 4,12"></polyline>
                </svg>
              )}
            </button>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h3 className={`text-white font-medium text-xs sm:text-sm ${
                  completedItems.has(item.id) ? 'line-through text-gray-400' : ''
                }`}>
                  {item.title}
                </h3>
                
                {(item.description && item.description.trim()) && (
                  <button
                    onClick={() => toggleExpanded(item.id)}
                    className="text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors"
                  >
                    {expandedItems.has(item.id) ? 'Collapse' : 'Expand'}
                  </button>
                )}
              </div>

              {/* Expanded description */}
              {expandedItems.has(item.id) && item.description && (
                <div className="mt-3 text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">
                  {item.description}
                </div>
              )}
            </div>
          </div>
        </div>
      ))}

      {/* Progress indicator */}
      {checklistItems.length > 1 && (
        <div className="mt-4 p-3 bg-gray-800 border border-gray-600 rounded-lg">
          <div className="flex items-center justify-between text-sm text-gray-300 mb-2">
            <span>Progress</span>
            <span>{completedItems.size} of {checklistItems.length} completed</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div
              className="bg-green-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(completedItems.size / checklistItems.length) * 100}%` }}
            ></div>
          </div>
        </div>
      )}
    </div>
  );
}
