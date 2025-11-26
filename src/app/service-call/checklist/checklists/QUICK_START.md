# Quick Start: Editing Checklists

## What Changed?

✅ **Before**: All checklists were in one large `config.ts` file  
✅ **Now**: Each unit type has its own file in `./checklists/`

## File Structure

```
checklists/
├── walkIn.ts          ← Edit walk-in checklists here
├── rtu.ts             ← Edit RTU checklists here
├── splitUnit.ts       ← Edit split unit checklists here
├── reachIn.ts         ← Edit reach-in checklists here
├── iceMachine.ts      ← Edit ice machine checklists here
└── README.md          ← Full documentation
```

## Quick Example: Adding a Checklist

### Step 1: Edit the unit type file (e.g., `rtu.ts`)

```typescript
export const noHeat: ChecklistItem[] = [
  {
    id: '1',
    title: 'Safety / Prep',
    items: [
      { id: '1-1', text: 'Disconnect power', checked: false },
      { id: '1-2', text: 'Inspect unit', checked: false }
    ]
  }
];
```

### Step 2: Register in `config.ts`

```typescript
// 1. Import it
import { noHeat } from './checklists/rtu';

// 2. Add to CHECKLISTS object
CHECKLISTS['rtu-no-heat'] = noHeat;
```

That's it! ✅

## Sharing with Advisors

You can now:
- ✅ Share individual unit type files (e.g., just `rtu.ts`)
- ✅ Work on checklists offline
- ✅ Get feedback from non-technical advisors
- ✅ Easily see what checklists exist for each unit type

## Common Patterns

**Simple checkbox:**
```typescript
{ id: '1-1', text: 'Check item', checked: false }
```

**Multiple choice buttons:**
```typescript
{
  id: '1-2',
  text: 'Select option:',
  checked: false,
  options: ['yes', 'no', 'unsure'],
  selectedOptions: []
}
```

**Number input:**
```typescript
{
  id: '1-3',
  text: 'Enter temperature',
  checked: false,
  numericValue: '',
  unit: '°F'
}
```

See `README.md` for full details!






