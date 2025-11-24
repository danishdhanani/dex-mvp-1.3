/// Centralized Checklist Configuration
/// Ported from config.ts
/// 
/// This file imports all checklists from individual unit type files and registers them.
library;

import '../models/checklist_types.dart';
import 'checklists/walk_in_checklists.dart';
import 'checklists/rtu_checklists.dart';

/// Default checklist template for combinations that don't have a custom checklist yet
final defaultChecklist = [
  ChecklistItem(
    id: '1',
    title: 'Safety / Prep',
    items: [
      ChecklistItemData(
        id: '1-1',
        text: 'Disconnect power & lockout',
        checked: false,
      ),
      ChecklistItemData(
        id: '1-2',
        text: 'Inspect unit condition and safety',
        checked: false,
      ),
      ChecklistItemData(
        id: '1-3',
        text: 'Clear work area',
        checked: false,
      ),
    ],
  ),
  ChecklistItem(
    id: '2',
    title: 'Initial Diagnosis',
    items: [
      ChecklistItemData(
        id: '2-1',
        text: 'Check power supply and connections',
        checked: false,
      ),
      ChecklistItemData(
        id: '2-2',
        text: 'Verify control settings',
        checked: false,
      ),
      ChecklistItemData(
        id: '2-3',
        text: 'Test basic operation',
        checked: false,
      ),
    ],
  ),
  ChecklistItem(
    id: '3',
    title: 'System Check',
    items: [
      ChecklistItemData(
        id: '3-1',
        text: 'Inspect components for visible issues',
        checked: false,
      ),
      ChecklistItemData(
        id: '3-2',
        text: 'Check for leaks or damage',
        checked: false,
      ),
      ChecklistItemData(
        id: '3-3',
        text: 'Test system response',
        checked: false,
      ),
    ],
  ),
  ChecklistItem(
    id: '4',
    title: 'Repair Actions',
    items: [
      ChecklistItemData(
        id: '4-1',
        text: 'Perform necessary repairs',
        checked: false,
      ),
      ChecklistItemData(
        id: '4-2',
        text: 'Replace faulty components',
        checked: false,
      ),
      ChecklistItemData(
        id: '4-3',
        text: 'Clean and adjust as needed',
        checked: false,
      ),
    ],
  ),
  ChecklistItem(
    id: '5',
    title: 'Testing & Verification',
    items: [
      ChecklistItemData(
        id: '5-1',
        text: 'Test system operation',
        checked: false,
      ),
      ChecklistItemData(
        id: '5-2',
        text: 'Verify issue resolution',
        checked: false,
      ),
      ChecklistItemData(
        id: '5-3',
        text: 'Check for proper cycling',
        checked: false,
      ),
    ],
  ),
  ChecklistItem(
    id: '6',
    title: 'Notes & Recommended Repairs',
    items: [], // No checklist items, handled by separate inputs
  ),
];

/// Central registry of all custom checklists
/// Key format: `${unitType}-${issueId}`
final Map<String, List<ChecklistItem>> checklists = {
  // Walk-in checklists
  'walkIn-ice-frost-build-up': walkInIceFrostBuildUp,
  
  // RTU checklists
  'rtu-not-cooling': rtuNotCooling,
  'rtu-not-heating': rtuNotHeating,
  'rtu-poor-airflow': rtuPoorAirflow,
  'rtu-unit-not-running': rtuUnitNotRunning,
  'rtu-unit-leaking': rtuUnitLeaking,
  'rtu-short-cycling': rtuShortCycling,
  'rtu-zoning-issues': rtuZoningIssues,
  
  // Add more checklists here as they're ported
};

/// Get checklist for a specific unit type + issue combination
/// Returns the custom checklist if available, otherwise returns the default checklist
List<ChecklistItem> getChecklistFor(String unitType, String issueId) {
  final key = '$unitType-$issueId';
  return checklists[key] ?? defaultChecklist;
}

/// Check if a custom checklist exists for a unit type + issue combination
bool hasCustomChecklist(String unitType, String issueId) {
  final key = '$unitType-$issueId';
  return checklists.containsKey(key);
}

/// Get all available unit types that have custom checklists
List<String> getUnitTypesWithChecklists() {
  final unitTypes = <String>{};
  for (final key in checklists.keys) {
    final unitType = key.split('-').first;
    unitTypes.add(unitType);
  }
  return unitTypes.toList();
}

/// Get all available issues for a unit type that have custom checklists
List<String> getIssuesWithChecklists(String unitType) {
  return checklists.keys
      .where((key) => key.startsWith('$unitType-'))
      .map((key) => key.replaceFirst('$unitType-', ''))
      .toList();
}

