# Service Call Checklists

This directory contains all service call checklists, organized by unit type. Each unit type has its own file where you can define multiple issue-specific checklists.

## Structure

- **`walkIn.ts`** - Walk-in cooler/freezer checklists
- **`rtu.ts`** - RTU (Roof Top Unit) checklists
- **`splitUnit.ts`** - Split unit system checklists
- **`reachIn.ts`** - Reach-in cooler/freezer checklists
- **`iceMachine.ts`** - Ice machine checklists

## How to Add/Edit Checklists

### 1. Edit the Unit Type File

Open the appropriate unit type file (e.g., `walkIn.ts`, `rtu.ts`) and add or modify a checklist:

```typescript
/**
 * Walk-in: Issue Name
 * Issue ID: 'issue-id' (must match the issue ID used in the app)
 */
export const issueId: ChecklistItem[] = [
  {
    id: '1',
    title: 'Section Title',
    items: [
      {
        id: '1-1',
        text: 'Checklist item question or instruction',
        checked: false,
        // Optional: Add button options
        options: ['option1', 'option2', 'option3'],
        selectedOptions: []
      },
      {
        id: '1-2',
        text: 'Another item',
        checked: false
        // Simple checkbox item (no options needed)
      }
    ]
  },
  {
    id: '2',
    title: 'Next Section',
    items: [
      // ... more items
    ]
  }
];
```

### 2. Register in config.ts

After creating a checklist, register it in `../config.ts`:

1. Import the checklist at the top:
   ```typescript
   import { issueId } from './checklists/rtu';
   ```

2. Add it to the CHECKLISTS object:
   ```typescript
   export const CHECKLISTS: Record<string, ChecklistItem[]> = {
     // ... existing checklists
     'rtu-issue-id': issueId,  // Format: 'unitType-issueId'
   };
   ```

## Field Types

### Basic Item (Checkbox)
```typescript
{
  id: '1-1',
  text: 'Check this item',
  checked: false
}
```

### Item with Options (Button Selection)
```typescript
{
  id: '1-2',
  text: 'Select an option:',
  checked: false,
  options: ['yes', 'no', 'unsure'],
  selectedOptions: []
}
```

### Item with Numeric Input
```typescript
{
  id: '1-3',
  text: 'Enter temperature',
  checked: false,
  numericValue: '',
  unit: '°F'  // Optional unit label
}
```

### Item with Multiple Numeric Inputs (e.g., Pressure)
```typescript
{
  id: '2-5',
  text: 'Record suction and discharge pressures',
  checked: false,
  numericInputs: [
    { label: 'Suction', value: '', placeholder: 'Enter pressure', unit: 'psig' },
    { label: 'Discharge', value: '', placeholder: 'Enter pressure', unit: 'psig' }
  ],
  refrigerantType: '',  // Required for pressure validation
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
  text: '[Optional] Upload photos',
  checked: false
  // The app automatically detects "[Optional]" and "photo" in the text
}
```

## Best Practices

1. **Keep IDs unique** within each checklist
2. **Use descriptive section titles** (e.g., "Safety / Prep", "Condenser Check")
3. **Use clear, actionable item text** that tells the technician what to do
4. **Order sections logically** (safety first, then diagnostics, then wrap-up)
5. **Use consistent naming** for issue IDs (kebab-case: `ice-frost-build-up`)

## Offline Editing

You can edit these files offline and share them with non-technical advisors. The structure is straightforward enough that advisors can review and suggest changes even without coding knowledge.

## Example: Adding a New RTU Checklist

1. Open `rtu.ts`
2. Add your checklist:
   ```typescript
   export const noHeat: ChecklistItem[] = [
     {
       id: '1',
       title: 'Safety / Prep',
       items: [
         { id: '1-1', text: 'Disconnect power & lockout', checked: false },
         { id: '1-2', text: 'Inspect unit condition', checked: false }
       ]
     }
     // ... more sections
   ];
   ```
3. In `config.ts`, add:
   ```typescript
   import { noHeat } from './checklists/rtu';
   // ...
   CHECKLISTS['rtu-no-heat'] = noHeat;
   ```

That's it! The checklist will now be available in the app.






