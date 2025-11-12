# Service Call Checklist System

## Quick Start

To create a custom checklist for a unit type + issue combination:

1. **Open** `my-app/src/app/service-call/checklist/config.ts`

2. **Add your checklist** following the existing pattern:
   ```typescript
   export const myUnitTypeMyIssueChecklist: ChecklistItem[] = [
     {
       id: '1',
       title: 'Section Title',
       items: [
         { id: '1-1', text: 'Check item 1', checked: false },
         { id: '1-2', text: 'Check item 2', checked: false },
       ]
     }
   ];
   ```

3. **Register it** in the `CHECKLISTS` object:
   ```typescript
   export const CHECKLISTS: Record<string, ChecklistItem[]> = {
     // ... existing checklists
     'myUnitType-myIssueId': myUnitTypeMyIssueChecklist,
   };
   ```

4. **Done!** The checklist will automatically appear when users select that unit type and issue.

## Files

- **`config.ts`** - All checklist definitions and registry
- **`types.ts`** - TypeScript type definitions
- **`CHECKLIST_GUIDE.md`** - Detailed guide with examples
- **`[unitType]/[issueId]/page.tsx`** - The checklist page component

## Current Checklists

- ✅ `walkIn-ice-frost-build-up`
- ✅ `walkIn-excessive-frost`
- 🔄 All other combinations use the default checklist

## Next Steps

See `CHECKLIST_GUIDE.md` for detailed instructions and examples on:
- Creating different types of checklist items
- Using options, numeric inputs, and photo uploads
- Available unit types and issue IDs
- Best practices

