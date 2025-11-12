# Checklist Creation Guide

This guide explains how to create custom checklists for each unit type and issue category combination.

## Overview

All checklists are centralized in `config.ts`. The system automatically loads the appropriate checklist based on the unit type and issue ID.

## File Structure

- `config.ts` - Central registry of all checklists
- `types.ts` - TypeScript type definitions
- `[unitType]/[issueId]/page.tsx` - The checklist page component (uses config.ts)

## How to Add a New Checklist

### Step 1: Define Your Checklist

In `config.ts`, create a new constant with your checklist data. Each checklist is an array of sections, and each section contains items.

```typescript
export const myUnitTypeMyIssueChecklist: ChecklistItem[] = [
  {
    id: '1',
    title: 'Section Title',
    items: [
      {
        id: '1-1',
        text: 'Checklist item text',
        checked: false
      },
      {
        id: '1-2',
        text: 'Item with options',
        checked: false,
        options: ['Option 1', 'Option 2', 'Option 3'],
        selectedOptions: []
      },
      {
        id: '1-3',
        text: 'Item with numeric input',
        checked: false,
        numericValue: '',
        unit: '°F'
      }
    ]
  },
  {
    id: '2',
    title: 'Another Section',
    items: [
      // ... more items
    ]
  }
];
```

### Step 2: Register Your Checklist

Add your checklist to the `CHECKLISTS` object in `config.ts`:

```typescript
export const CHECKLISTS: Record<string, ChecklistItem[]> = {
  'walkIn-ice-frost-build-up': walkInIceFrostBuildUp,
  'walkIn-excessive-frost': walkInExcessiveFrost,
  'myUnitType-myIssueId': myUnitTypeMyIssueChecklist, // Add your new checklist here
};
```

The key format is: `${unitType}-${issueId}`

### Step 3: Test Your Checklist

1. Navigate to `/service-call/unit-selection`
2. Select your unit type
3. Select your issue
4. Your custom checklist should now appear!

## Available Item Types

### Simple Status Toggle
```typescript
{
  id: '1-1',
  text: 'Check power supply',
  checked: false
}
```
User clicks to cycle through: unchecked → red → yellow → green → na → unchecked

### Multiple Choice Options
```typescript
{
  id: '1-2',
  text: 'What is the status?',
  checked: false,
  options: ['Option 1', 'Option 2', 'Option 3'],
  selectedOptions: [] // Can select multiple options
}
```

### Single Numeric Input
```typescript
{
  id: '1-3',
  text: 'Record temperature',
  checked: false,
  numericValue: '',
  unit: '°F'
}
```

### Multiple Numeric Inputs (e.g., Pressure Recording)
```typescript
{
  id: '2-5',
  text: 'Record suction and discharge pressures',
  checked: false,
  numericInputs: [
    { label: 'Suction', value: '', placeholder: 'Enter pressure', unit: 'psig' },
    { label: 'Discharge', value: '', placeholder: 'Enter pressure', unit: 'psig' }
  ],
  refrigerantType: '', // For pressure validation
  pressureValidation: {
    suction: '',
    discharge: ''
  }
}
```

### Optional Photo Upload
```typescript
{
  id: '1-10',
  text: '[Optional] Upload overall box photos',
  checked: false
}
```

## Unit Types and Issue IDs

### Unit Types
- `rtu` - RTU
- `splitUnit` - Split AC Unit
- `reachIn` - Reach-in
- `walkIn` - Walk-in
- `iceMachine` - Ice Machine

### Issue IDs (varies by unit type)

**Walk-in:**
- `running-warm`
- `ice-frost-build-up`
- `water-leaking`
- `box-too-cold`
- `something-else` (custom issue)

**RTU:**
- `no-heat`
- `no-cooling`
- `poor-airflow`
- `noisy-operation`
- `short-cycling`
- `high-energy-usage`

**Split Unit:**
- `no-cooling`
- `poor-airflow`
- `noisy-operation`
- `short-cycling`
- `water-leak`

**Reach-in:**
- `not-cooling`
- `excessive-frost`
- `door-seal-issue`
- `fan-not-working`
- `temperature-fluctuation`

**Ice Machine:**
- `no-ice-production`
- `poor-ice-quality`
- `water-leak`
- `machine-not-cycling`
- `water-quality-issue`

## Example: Creating a Checklist for RTU "No Heat"

```typescript
// In config.ts

export const rtuNoHeatChecklist: ChecklistItem[] = [
  {
    id: '1',
    title: 'Safety / Prep',
    items: [
      { id: '1-1', text: 'Disconnect power & lockout', checked: false },
      { id: '1-2', text: 'Inspect unit condition and safety', checked: false },
    ]
  },
  {
    id: '2',
    title: 'Heat System Check',
    items: [
      { id: '2-1', text: 'Check gas supply valve', checked: false },
      { id: '2-2', text: 'Verify thermostat calling for heat', checked: false },
      { id: '2-3', text: 'Check igniter operation', checked: false },
      {
        id: '2-4',
        text: 'What is the gas pressure?',
        checked: false,
        numericValue: '',
        unit: 'psig'
      }
    ]
  },
  {
    id: '3',
    title: 'Testing & Verification',
    items: [
      { id: '3-1', text: 'Test heating operation', checked: false },
      { id: '3-2', text: 'Verify temperature rise', checked: false },
    ]
  }
];

// Register it
export const CHECKLISTS: Record<string, ChecklistItem[]> = {
  // ... existing checklists
  'rtu-no-heat': rtuNoHeatChecklist,
};
```

## Tips

1. **Use descriptive IDs**: Follow the pattern `sectionId-itemId` (e.g., `1-1`, `1-2`, `2-1`)
2. **Group related items**: Put related checks in the same section
3. **Use options for common responses**: If users commonly select from a set of answers, use `options`
4. **Keep sections focused**: Each section should have a clear purpose
5. **Test thoroughly**: Make sure all item types work as expected

## Need Help?

If you need to add a new item type or modify the checklist behavior, check the `page.tsx` file to see how items are rendered and handled.

