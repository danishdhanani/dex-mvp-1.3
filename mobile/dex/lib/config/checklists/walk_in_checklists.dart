/// Walk-in Cooler/Freezer Service Call Checklists
/// Ported from walkIn.ts

import '../../models/checklist_types.dart';

/// Walk-in: Ice Build Up
/// Issue ID: 'ice-frost-build-up'
final walkInIceFrostBuildUp = [
  ChecklistItem(
    id: '1',
    title: 'box check',
    items: [
      ChecklistItemData(
        id: '1-1',
        text: 'Where is the ice buildup?',
        checked: false,
        options: ['door', 'evap fans', 'walls near piping', 'product', 'other'],
        selectedOptions: [],
      ),
      ChecklistItemData(
        id: '1-2',
        text: 'What is the box temperature?',
        checked: false,
        options: ['around setpoint', '10+ above setpoint', '10+ below setpoint'],
        selectedOptions: [],
      ),
      ChecklistItemData(
        id: '1-8',
        text: 'Is there any product blocking airflow?',
        checked: false,
        options: ['clear airflow', 'partially blocked', 'overloaded'],
        selectedOptions: [],
      ),
      ChecklistItemData(
        id: '1-3',
        text: 'Are all evaporator fans running?',
        checked: false,
        options: ['yes', 'no', 'unsure'],
        selectedOptions: [],
      ),
      ChecklistItemData(
        id: '1-4',
        text: 'Is coil area visibly iced over?',
        checked: false,
        options: ['clear', 'light frost', 'heavy ice'],
        selectedOptions: [],
      ),
      ChecklistItemData(
        id: '1-5',
        text: 'Is there standing water or ice on floor or drain pan?',
        checked: false,
        options: ['dry', 'some water', 'ice buildup'],
        selectedOptions: [],
      ),
      ChecklistItemData(
        id: '1-6',
        text: 'Is the door sealing properly?',
        checked: false,
        options: ['fully sealed', 'partially sealed', 'held open'],
        selectedOptions: [],
      ),
      ChecklistItemData(
        id: '1-7',
        text: 'Are the door frame heaters and/or window heaters operating properly?',
        checked: false,
        options: [
          'warm to touch (normal)',
          'cold to touch (not heating)',
          'not sure / no frame heaters present'
        ],
        selectedOptions: [],
      ),
      ChecklistItemData(
        id: '1-10',
        text: '[Optional] Upload overall box photos',
        checked: false,
      ),
    ],
  ),
  ChecklistItem(
    id: '2',
    title: 'Condenser check',
    items: [
      ChecklistItemData(
        id: '2-1',
        text: 'Is the condenser fan running?',
        checked: false,
        options: ['Yes', 'No', 'Intermittent'],
        selectedOptions: [],
      ),
      ChecklistItemData(
        id: '2-2',
        text: 'Is the compressor running or attempting to start?',
        checked: false,
        options: ['Yes', 'No', 'Short-cycling'],
        selectedOptions: [],
      ),
      ChecklistItemData(
        id: '2-3',
        text: 'Any unusual noises, vibration, or burnt smell at the unit?',
        checked: false,
        options: ['None', 'Noise', 'Vibration', 'Burnt smell'],
        selectedOptions: [],
      ),
      ChecklistItemData(
        id: '2-4',
        text: 'Are condenser coils visibly dirty or restricted?',
        checked: false,
        options: ['Clean', 'Moderate debris', 'Heavily clogged'],
        selectedOptions: [],
      ),
      ChecklistItemData(
        id: '2-5',
        text: 'Record suction and discharge pressures (if gauges available)',
        checked: false,
        numericInputs: [
          NumericInput(
            label: 'Suction',
            value: '',
            placeholder: 'Enter pressure',
            unit: 'psig',
          ),
          NumericInput(
            label: 'Discharge',
            value: '',
            placeholder: 'Enter pressure',
            unit: 'psig',
          ),
        ],
        refrigerantType: '',
        pressureValidation: PressureValidation(
          suction: '',
          discharge: '',
        ),
      ),
      ChecklistItemData(
        id: '2-6',
        text: 'Record ambient air temperature near condenser',
        checked: false,
        numericValue: '',
        unit: '°F',
      ),
    ],
  ),
  ChecklistItem(
    id: '3',
    title: 'Defrost diagnostics',
    items: [
      ChecklistItemData(
        id: '3-1',
        text: 'Check defrost timer/control operation',
        checked: false,
      ),
      ChecklistItemData(
        id: '3-2',
        text: 'Verify defrost heaters energize during defrost',
        checked: false,
      ),
      ChecklistItemData(
        id: '3-3',
        text: 'Inspect termination/defrost sensors',
        checked: false,
      ),
    ],
  ),
  ChecklistItem(
    id: '4',
    title: 'Door / infiltration checks',
    items: [
      ChecklistItemData(
        id: '4-1',
        text: 'Inspect frame/window heaters for power and warmth',
        checked: false,
      ),
      ChecklistItemData(
        id: '4-2',
        text: 'Check door alignment and gasket seal',
        checked: false,
      ),
      ChecklistItemData(
        id: '4-3',
        text: 'Look for frost trails at penetrations',
        checked: false,
      ),
    ],
  ),
  ChecklistItem(
    id: '5',
    title: 'Evaporator fan checks',
    items: [
      ChecklistItemData(
        id: '5-1',
        text: 'Verify all fans powered and spinning freely',
        checked: false,
      ),
      ChecklistItemData(
        id: '5-2',
        text: 'Clear ice from blades/guards if present',
        checked: false,
      ),
      ChecklistItemData(
        id: '5-3',
        text: 'Check fan interlocks/door switches',
        checked: false,
      ),
    ],
  ),
  ChecklistItem(
    id: '6',
    title: 'Condenser airflow checks',
    items: [
      ChecklistItemData(
        id: '6-1',
        text: 'Clean condenser coil and verify airflow path',
        checked: false,
      ),
      ChecklistItemData(
        id: '6-2',
        text: 'Verify condenser fan operation and rotation',
        checked: false,
      ),
      ChecklistItemData(
        id: '6-3',
        text: 'Check for obstructions/recirculation',
        checked: false,
      ),
    ],
  ),
  ChecklistItem(
    id: '8',
    title: 'Evap drain tracing',
    items: [
      ChecklistItemData(
        id: '8-1',
        text: 'Open evaporator compartment access panels',
        checked: false,
      ),
      ChecklistItemData(
        id: '8-2',
        text: 'Pour warm water over iced areas in evaporator case',
        checked: false,
      ),
      ChecklistItemData(
        id: '8-3',
        text: 'Trace melt path and follow water flow toward drain',
        checked: false,
      ),
      ChecklistItemData(
        id: '8-4',
        text: 'Did you find a fault?',
        checked: false,
        options: ['yes', 'no'],
        selectedOptions: [],
      ),
      ChecklistItemData(
        id: '8-5',
        text: 'Describe fault found (optional)',
        checked: false,
      ),
    ],
  ),
  ChecklistItem(
    id: '9',
    title: 'Suction line humidity checks',
    items: [
      ChecklistItemData(
        id: '9-1',
        text: 'Inspect suction line insulation for gaps/tears',
        checked: false,
      ),
      ChecklistItemData(
        id: '9-2',
        text: 'Look for moisture sources near suction line',
        checked: false,
      ),
      ChecklistItemData(
        id: '9-3',
        text: 'Seal/repair insulation as needed',
        checked: false,
      ),
    ],
  ),
  ChecklistItem(
    id: '7',
    title: 'General diagnostics',
    items: [
      ChecklistItemData(
        id: '7-1',
        text: 'Perform broad system checks as needed',
        checked: false,
      ),
      ChecklistItemData(
        id: '7-2',
        text: 'Document observations and plan',
        checked: false,
      ),
    ],
  ),
  ChecklistItem(
    id: '10',
    title: 'Wrap up',
    items: [
      ChecklistItemData(
        id: '10-1',
        text: 'Restore power and disconnects',
        checked: false,
      ),
      ChecklistItemData(
        id: '10-2',
        text: 'Verify all ice melted and area dried',
        checked: false,
      ),
      ChecklistItemData(
        id: '10-3',
        text: 'Reinstall panels/guards and clean workspace',
        checked: false,
      ),
      ChecklistItemData(
        id: '10-4',
        text: 'Confirm unit trending to setpoint',
        checked: false,
      ),
    ],
  ),
];

