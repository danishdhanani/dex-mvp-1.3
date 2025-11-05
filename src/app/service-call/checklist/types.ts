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

