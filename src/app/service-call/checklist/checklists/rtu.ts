/**
 * RTU (Roof Top Unit) Service Call Checklists
 * 
 * This file contains all checklists for RTU units.
 * Each checklist is organized by issue type.
 * 
 * TO ADD A NEW CHECKLIST:
 * 1. Create a new export const with the issue name (e.g., 'noHeat')
 * 2. Follow the structure below
 * 3. Register it in config.ts
 * 
 * FIELD TYPES:
 * - options: Array of strings for button selection (e.g., ['yes', 'no', 'unsure'])
 * - numericInputs: Array for multiple number inputs (e.g., suction/discharge pressure)
 * - numericValue: Single number input with optional unit
 * - checked: Always start as false
 */

import type { ChecklistItem } from '../types';

// Add your RTU checklists here:
// Example structure:
// export const noHeat: ChecklistItem[] = [
//   {
//     id: '1',
//     title: 'Section Title',
//     items: [
//       {
//         id: '1-1',
//         text: 'Checklist item text',
//         checked: false,
//         options: ['option1', 'option2'], // Optional: for button selection
//         selectedOptions: []
//       },
//       {
//         id: '1-2',
//         text: 'Another item',
//         checked: false
//       }
//     ]
//   }
// ];


