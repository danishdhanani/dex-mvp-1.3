/**
 * Centralized Checklist Configuration
 * 
 * This file imports all checklists from individual unit type files and registers them.
 * 
 * TO ADD A NEW CHECKLIST:
 * 1. Add the checklist to the appropriate unit type file in ./checklists/
 *    (e.g., walkIn.ts, rtu.ts, splitUnit.ts, etc.)
 * 2. Import it at the top of this file
 * 3. Register it in the CHECKLISTS object below with key: `${unitType}-${issueId}`
 * 
 * Example:
 * 1. In ./checklists/rtu.ts:
 *    export const noHeat: ChecklistItem[] = [ ... ];
 * 
 * 2. In this file:
 *    import { noHeat } from './checklists/rtu';
 *    CHECKLISTS['rtu-no-heat'] = noHeat;
 */

import type { ChecklistItem } from './types';

// Import checklists from individual unit type files
import { iceFrostBuildUp } from './checklists/walkIn';
// Import other unit types as they're added:
// import { ... } from './checklists/rtu';
// import { ... } from './checklists/splitUnit';
// import { ... } from './checklists/reachIn';
// import { ... } from './checklists/iceMachine';

// Legacy exports for backward compatibility (can be removed later if nothing depends on them)
export const walkInIceFrostBuildUp = iceFrostBuildUp;

/**
 * Default checklist template for combinations that don't have a custom checklist yet
 */
export const defaultChecklist: ChecklistItem[] = [
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

/**
 * Central registry of all custom checklists
 * Key format: `${unitType}-${issueId}`
 * 
 * To add a new checklist:
 * 1. Add the checklist to the appropriate file in ./checklists/[unitType].ts
 * 2. Import it at the top of this file
 * 3. Add an entry here: CHECKLISTS['unitType-issueId'] = yourChecklistExport
 * 
 * Example:
 * import { noHeat } from './checklists/rtu';
 * CHECKLISTS['rtu-no-heat'] = noHeat;
 */
export const CHECKLISTS: Record<string, ChecklistItem[]> = {
  // Walk-in checklists
  'walkIn-ice-frost-build-up': iceFrostBuildUp,
  
  // Add more checklists here as you create them:
  // RTU checklists:
  // 'rtu-no-heat': noHeat,  // import { noHeat } from './checklists/rtu';
  // 'rtu-no-cooling': noCooling,
  
  // Split Unit checklists:
  // 'splitUnit-poor-airflow': poorAirflow,  // import { poorAirflow } from './checklists/splitUnit';
  
  // Reach-in checklists:
  // 'reachIn-not-cooling': notCooling,  // import { notCooling } from './checklists/reachIn';
  
  // Ice Machine checklists:
  // 'iceMachine-no-ice-production': noIceProduction,  // import { noIceProduction } from './checklists/iceMachine';
};

/**
 * Get checklist for a specific unit type + issue combination
 * Returns the custom checklist if available, otherwise returns the default checklist
 */
export function getChecklistFor(unitType: string, issueId: string): ChecklistItem[] {
  const key = `${unitType}-${issueId}`;
  return CHECKLISTS[key] || defaultChecklist;
}

/**
 * Check if a custom checklist exists for a unit type + issue combination
 */
export function hasCustomChecklist(unitType: string, issueId: string): boolean {
  const key = `${unitType}-${issueId}`;
  return key in CHECKLISTS;
}

/**
 * Get all available unit types that have custom checklists
 */
export function getUnitTypesWithChecklists(): string[] {
  const unitTypes = new Set<string>();
  Object.keys(CHECKLISTS).forEach(key => {
    const [unitType] = key.split('-');
    unitTypes.add(unitType);
  });
  return Array.from(unitTypes);
}

/**
 * Get all available issues for a unit type that have custom checklists
 */
export function getIssuesWithChecklists(unitType: string): string[] {
  return Object.keys(CHECKLISTS)
    .filter(key => key.startsWith(`${unitType}-`))
    .map(key => key.replace(`${unitType}-`, ''));
}

