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

/**
 * RTU: Not Cooling
 * Issue ID: 'not-cooling'
 */
export const notCooling: ChecklistItem[] = [
  {
    id: '1',
    title: 'Thermostat',
    items: [
      {
        id: '1-1',
        text: 'Thermostat type',
        checked: false,
        options: ['Digital (touch screen)', 'Digital (battery-powered)', 'Mechanical / Analog'],
        selectedOptions: []
      },
      {
        id: '1-2',
        text: 'Is tstat receiving power? Set tstat to Cool and check for 24V between R-C.',
        checked: false,
        options: ['Yes', 'No', 'Partial'],
        selectedOptions: []
      }
    ]
  },
  {
    id: '2',
    title: 'Unit Power',
    items: [
      {
        id: '2-1',
        text: 'Is the disconnect switch ON?',
        checked: false,
        options: ['Yes', 'No'],
        selectedOptions: []
      },
      {
        id: '2-1a',
        text: 'Turn on & recheck cooling call',
        checked: false,
        conditionalOn: { itemId: '2-1', option: 'No' },
        isBlockingMessage: true
      },
      {
        id: '2-2',
        text: 'Is the unit running?',
        checked: false,
        options: ['Yes', 'No', 'Intermittent'],
        selectedOptions: []
      },
      {
        id: '2-2a',
        text: 'Is line power present on primary side of transformer (typically 208-240V)?',
        checked: false,
        options: ['Yes', 'No'],
        selectedOptions: [],
        conditionalOn: { itemId: '2-2', option: 'No' }
      },
      {
        id: '2-2a-blocking',
        text: 'This is an upstream breaker / disconnect / fuse problem.',
        checked: false,
        conditionalOn: { itemId: '2-2a', option: 'No' },
        isBlockingMessage: true
      },
      {
        id: '2-2b',
        text: 'Is control transformer putting out 24 V?',
        checked: false,
        options: ['Yes', 'No'],
        selectedOptions: [],
        conditionalOn: { itemId: '2-2', option: 'No' }
      },
      {
        id: '2-2b-blocking',
        text: 'This is either a blown transformer, or inline fuse open.',
        checked: false,
        conditionalOn: { itemId: '2-2b', option: 'No' },
        isBlockingMessage: true
      },
      {
        id: '2-2c',
        text: 'Is control voltage reaching contactor coil? I.e., is 24V present across R-C or directly across contactor coil?',
        checked: false,
        options: ['Yes', 'No'],
        selectedOptions: [],
        conditionalOn: { itemId: '2-2', option: 'No' }
      },
      {
        id: '2-2c-blocking',
        text: 'This control circuit is open somewhere upstream (safety switch, pressure switch, freezestat, limit, or board).',
        checked: false,
        conditionalOn: { itemId: '2-2c', option: 'No' },
        isBlockingMessage: true
      },
      {
        id: '2-3',
        text: 'Are all fuses on the control board and/or transformers intact?',
        checked: false,
        options: ['Yes', 'No', 'N/A'],
        selectedOptions: [],
        conditionalOn: { itemId: '2-2', option: 'No' }
      },
      {
        id: '2-3-blocking',
        text: 'Please correct for blown fuses.',
        checked: false,
        conditionalOn: { itemId: '2-3', option: 'No' },
        isBlockingMessage: true
      },
      {
        id: '2-4',
        text: 'Are there any LED fault codes on the control board?',
        checked: false,
        options: ['No', 'Solid LED', 'Flashing LED'],
        selectedOptions: []
      },
      {
        id: '2-4-blocking',
        text: 'A flashing LED may indicate that safety is open or circuit is locked out. Please reference unit manual to confirm.',
        checked: false,
        conditionalOn: { itemId: '2-4', option: 'Flashing LED' },
        isBlockingMessage: true
      }
    ]
  }
];


