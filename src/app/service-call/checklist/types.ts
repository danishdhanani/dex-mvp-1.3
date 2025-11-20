/**
 * Type definitions for service call checklists
 */

export interface ChecklistItemData {
  id: string;
  text: string;
  checked: boolean;
  status?: 'red' | 'yellow' | 'green' | 'na' | 'unchecked';
  notes?: string;
  images?: string[];
  options?: string[];
  selectedOption?: string;
  selectedOptions?: string[];
  numericInputs?: { label: string; value: string; placeholder?: string; unit?: string }[];
  numericValue?: string;
  unit?: string;
  refrigerantType?: string;
  pressureValidation?: {
    suction: string;
    discharge: string;
  };
  conditionalOn?: {
    itemId: string;
    option?: string; // For exact option matching
    condition?: (value: string) => boolean; // For custom condition functions (e.g., numeric comparisons)
  };
  isBlockingMessage?: boolean; // If true, displays as a blocking alert message instead of a checklist item
  isInfoMessage?: boolean; // If true, displays as an informational message (not blocking)
  isActionItem?: boolean; // If true, displays as an action item with checkbox and photo upload capability
  customCondition?: boolean; // If true, requires custom condition checking logic in the component
}

export interface ChecklistItem {
  id: string;
  title: string;
  items: ChecklistItemData[];
}

export interface ServiceCallChecklist {
  unitType: string;
  issueType: string;
  sections: ChecklistItem[];
}

