import React, { useState } from 'react';

interface ChecklistItem {
  id: string;
  title: string;
  description: string;
  completed: boolean;
}

interface TroubleshootingChecklistProps {
  response: string;
  sourceContent?: string; // Optional source content to display
}

interface SourceSnippet {
  text: string;
  source: string;
  page?: string;
}

export default function TroubleshootingChecklist({ response, sourceContent }: TroubleshootingChecklistProps) {
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [completedItems, setCompletedItems] = useState<Set<string>>(new Set());
  const [showSource, setShowSource] = useState(false);

  // Extract source snippets from the response
  const extractSourceSnippets = (text: string): SourceSnippet[] => {
    const snippets: SourceSnippet[] = [];
    
    // Find all source references in the text
    const sourceMatches = text.match(/\*Source:([^*]+)\*/g);
    const inferredMatches = text.match(/\*Inferred from ([^*]+)\*/g);
    const generalMatches = text.match(/\*General HVAC troubleshooting guidance\*/g);
    
    if (sourceMatches) {
      sourceMatches.forEach(match => {
        const sourceText = match.replace(/\*Source:|\*/g, '').trim();
        const [source, page] = sourceText.split(' - ');
        
        // Try to find the actual text snippet in the source content
        if (sourceContent) {
          const lines = sourceContent.split('\n');
          const relevantLines = lines.filter(line => 
            line.toLowerCase().includes('115vac') || 
            line.toLowerCase().includes('voltage') ||
            line.toLowerCase().includes('power') ||
            line.toLowerCase().includes('supply')
          );
          
          if (relevantLines.length > 0) {
            snippets.push({
              text: relevantLines.slice(0, 3).join('\n'),
              source: source,
              page: page
            });
          }
        }
      });
    }
    
    return snippets;
  };

  const sourceSnippets = extractSourceSnippets(response);

  // Parse the response to extract steps
  const parseResponse = (text: string): ChecklistItem[] => {
    // Parse response text into checklist items
    const items: ChecklistItem[] = [];
    
    // Check if this is a direct answer (contains "Reference:", "According to", or "Source:")
    const hasReference = text.includes('Reference:') || text.includes('According to') || text.includes('Source:');
    
    // Check for multi-step indicators
    const hasNumberedSteps = /\d+\.\s+/.test(text); // Pattern like "1. " or "2. " (any numbered list)
    const hasStepWords = /\b(Step|Check|Verify)\s+\d+/i.test(text); // Pattern like "Step 1" or "Check 2"
    const hasBulletPoints = /^\s*[-•*]\s+/m.test(text); // Bullet points at start of lines
    
    const isDirectAnswer = hasReference && !hasNumberedSteps && !hasStepWords && !hasBulletPoints;
    
    // Debug logging
    console.log('Response analysis:', {
      hasReference,
      hasNumberedSteps,
      hasStepWords,
      hasBulletPoints,
      isDirectAnswer,
      textLength: text.length,
      textPreview: text.substring(0, 100)
    });
    
    if (isDirectAnswer) {
      // Return empty array to indicate this should be displayed as plain text
      return [];
    }
    
    // If it's not a direct answer and doesn't have clear multi-step indicators, treat as single item
    if (!hasNumberedSteps && !hasStepWords && !hasBulletPoints) {
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

  // Process the response to style source citations
  const processResponse = (text: string) => {
    // Convert markdown italic to HTML italic for source citations
    const processedText = text
      .replace(/\*Source:([^*]+)\*/g, '<em class="text-gray-400 text-xs">Source:$1</em>')
      .replace(/\*Inferred from ([^*]+)\*/g, '<em class="text-gray-400 text-xs">Inferred from $1</em>')
      .replace(/\*General HVAC troubleshooting guidance\*/g, '<em class="text-blue-400 text-xs">General HVAC troubleshooting guidance</em>')
      .replace(/\*([^*]+)\*/g, '<em>$1</em>');
    
    return processedText;
  };

  // If no checklist items (direct answer), render as plain text
  if (checklistItems.length === 0) {

    return (
      <div className="text-xs sm:text-sm whitespace-pre-wrap leading-relaxed">
        <div className="flex justify-between items-center mb-2">
          <div className="text-green-400 text-xs">✓ Direct Answer (No Checklist)</div>
          {sourceSnippets.length > 0 && (
            <button
              onClick={() => setShowSource(!showSource)}
              className="text-xs text-blue-400 hover:text-blue-300 underline"
            >
              {showSource ? 'Hide Sources' : 'View Sources'}
            </button>
          )}
        </div>
        
        {showSource && sourceSnippets.length > 0 && (
          <div className="bg-gray-800 border border-gray-600 rounded-lg p-3 text-xs mb-3">
            <div className="text-gray-400 mb-2">📖 Source Snippets Used:</div>
            {sourceSnippets.map((snippet, index) => (
              <div key={index} className="mb-3 last:mb-0">
                <div className="text-gray-300 font-medium mb-1">
                  {snippet.source}{snippet.page && ` - ${snippet.page}`}
                </div>
                <pre className="whitespace-pre-wrap text-gray-300 font-mono text-xs leading-relaxed bg-gray-900 p-2 rounded border">
                  {snippet.text}
                </pre>
              </div>
            ))}
          </div>
        )}
        
        <div dangerouslySetInnerHTML={{ __html: processResponse(response) }} />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <div className="text-blue-400 text-xs">📋 Checklist Format</div>
        {sourceSnippets.length > 0 && (
          <button
            onClick={() => setShowSource(!showSource)}
            className="text-xs text-blue-400 hover:text-blue-300 underline"
          >
            {showSource ? 'Hide Sources' : 'View Sources'}
          </button>
        )}
      </div>
      
      {showSource && sourceSnippets.length > 0 && (
        <div className="bg-gray-800 border border-gray-600 rounded-lg p-3 text-xs">
          <div className="text-gray-400 mb-2">📖 Source Snippets Used:</div>
          {sourceSnippets.map((snippet, index) => (
            <div key={index} className="mb-3 last:mb-0">
              <div className="text-gray-300 font-medium mb-1">
                {snippet.source}{snippet.page && ` - ${snippet.page}`}
              </div>
              <pre className="whitespace-pre-wrap text-gray-300 font-mono text-xs leading-relaxed bg-gray-900 p-2 rounded border">
                {snippet.text}
              </pre>
            </div>
          ))}
        </div>
      )}
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
                  <div dangerouslySetInnerHTML={{ __html: processResponse(item.description) }} />
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
