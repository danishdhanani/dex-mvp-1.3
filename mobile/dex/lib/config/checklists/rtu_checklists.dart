/// RTU (Roof Top Unit) Service Call Checklists
/// Ported from rtu.ts
/// 
/// Note: This is a partial port. Full checklists can be added incrementally.

import '../../models/checklist_types.dart';
import '../checklist_config.dart';

/// RTU: Not Cooling
/// Issue ID: 'not-cooling'
/// 
/// This is a simplified version. The full checklist has many more sections.
/// Additional sections can be added as needed.
final rtuNotCooling = [
  ChecklistItem(
    id: '1',
    title: 'Thermostat',
    items: [
      ChecklistItemData(
        id: '1-1',
        text: 'Thermostat type',
        checked: false,
        options: [
          'Digital (touch screen)',
          'Digital (battery-powered)',
          'Mechanical / Analog'
        ],
        selectedOptions: [],
      ),
      ChecklistItemData(
        id: '1-2',
        text: 'Is tstat receiving power? Set tstat to Cool and check for 24V between R-C.',
        checked: false,
        options: ['Yes', 'No', 'Partial'],
        selectedOptions: [],
      ),
    ],
  ),
  ChecklistItem(
    id: '2',
    title: 'Unit Power',
    items: [
      ChecklistItemData(
        id: '2-1',
        text: 'Is the disconnect switch ON?',
        checked: false,
        options: ['Yes', 'No'],
        selectedOptions: [],
      ),
      ChecklistItemData(
        id: '2-1a',
        text: 'Turn on & recheck cooling call',
        checked: false,
        conditionalOn: ConditionalOn(itemId: '2-1', option: 'No'),
        isBlockingMessage: true,
      ),
      ChecklistItemData(
        id: '2-2',
        text: 'Is the unit running?',
        checked: false,
        options: ['Yes', 'No', 'Intermittent'],
        selectedOptions: [],
      ),
      ChecklistItemData(
        id: '2-2a',
        text: 'Is line power present on primary side of transformer (typically 208-240V)?',
        checked: false,
        options: ['Yes', 'No'],
        selectedOptions: [],
        conditionalOn: ConditionalOn(itemId: '2-2', option: 'No'),
      ),
      ChecklistItemData(
        id: '2-2a-blocking',
        text: 'This is an upstream breaker / disconnect / fuse problem.',
        checked: false,
        conditionalOn: ConditionalOn(itemId: '2-2a', option: 'No'),
        isBlockingMessage: true,
      ),
      ChecklistItemData(
        id: '2-2b',
        text: 'Is control transformer putting out 24 V?',
        checked: false,
        options: ['Yes', 'No'],
        selectedOptions: [],
        conditionalOn: ConditionalOn(itemId: '2-2', option: 'No'),
      ),
      ChecklistItemData(
        id: '2-2b-blocking',
        text: 'This is either a blown transformer, or inline fuse open.',
        checked: false,
        conditionalOn: ConditionalOn(itemId: '2-2b', option: 'No'),
        isBlockingMessage: true,
      ),
      ChecklistItemData(
        id: '2-2c',
        text: 'Is control voltage reaching contactor coil? I.e., is 24V present across R-C or directly across contactor coil?',
        checked: false,
        options: ['Yes', 'No'],
        selectedOptions: [],
        conditionalOn: ConditionalOn(itemId: '2-2', option: 'No'),
      ),
      ChecklistItemData(
        id: '2-2c-blocking',
        text: 'This control circuit is open somewhere upstream (safety switch, pressure switch, freezestat, limit, or board).',
        checked: false,
        conditionalOn: ConditionalOn(itemId: '2-2c', option: 'No'),
        isBlockingMessage: true,
      ),
      ChecklistItemData(
        id: '2-3',
        text: 'Are all fuses on the control board and/or transformers intact?',
        checked: false,
        options: ['Yes', 'No', 'N/A'],
        selectedOptions: [],
        conditionalOn: ConditionalOn(itemId: '2-2', option: 'No'),
      ),
      ChecklistItemData(
        id: '2-3-blocking',
        text: 'Please correct for blown fuses.',
        checked: false,
        conditionalOn: ConditionalOn(itemId: '2-3', option: 'No'),
        isBlockingMessage: true,
      ),
      ChecklistItemData(
        id: '2-4',
        text: 'Are there any LED fault codes on the control board?',
        checked: false,
        options: ['No', 'Solid LED', 'Flashing LED'],
        selectedOptions: [],
      ),
      ChecklistItemData(
        id: '2-4-blocking',
        text: 'A flashing LED may indicate that safety is open or circuit is locked out. Please reference unit manual to confirm.',
        checked: false,
        conditionalOn: ConditionalOn(itemId: '2-4', option: 'Flashing LED'),
        isBlockingMessage: true,
      ),
      ChecklistItemData(
        id: '2-5-blocking',
        text: 'It seems like there is power at the unit but not at the thermostat. Please check for a broken wire / open splice / tripped float switch / conduit inside the control wiring run',
        checked: false,
        isBlockingMessage: true,
        customCondition: true, // Flag to indicate this needs custom condition checking
      ),
    ],
  ),
  ChecklistItem(
    id: '3',
    title: 'Cooling Checks',
    items: [
      ChecklistItemData(
        id: 'supplyFanRunning',
        text: 'Is the supply fan running?',
        checked: false,
        options: ['Yes', 'No', 'Intermittent', 'Not sure'],
        selectedOptions: [],
      ),
      ChecklistItemData(
        id: 'supplyAirflowStrength',
        text: 'How strong is the supply airflow at the rooftop discharge?',
        checked: false,
        options: ['Strong', 'Weak', 'None', 'Not checked'],
        selectedOptions: [],
      ),
      ChecklistItemData(
        id: 'filtersCondition',
        text: 'Are the filters clean?',
        checked: false,
        options: ['Clean', 'Moderately dirty', 'Clogged', 'Missing'],
        selectedOptions: [],
        images: [],
      ),
      ChecklistItemData(
        id: 'evapCoilCondition',
        text: 'Is the evaporator coil clean or iced over?',
        checked: false,
        options: ['Clean', 'Dirty', 'Light frost', 'Heavily iced'],
        selectedOptions: [],
        images: [],
      ),
      ChecklistItemData(
        id: 'condenserFanStatus',
        text: 'Are the condenser fans running normally?',
        checked: false,
        options: [
          'All running',
          'One or more not running',
          'Running weak',
          'Not sure'
        ],
        selectedOptions: [],
        images: [],
      ),
      ChecklistItemData(
        id: 'condenserCoilCondition',
        text: 'Is the condenser coil clean?',
        checked: false,
        options: ['Clean', 'Moderately dirty', 'Very dirty / restricted'],
        selectedOptions: [],
        images: [],
      ),
      ChecklistItemData(
        id: 'compressorStatus',
        text: 'Is the compressor running?',
        checked: false,
        options: [
          'Running normally',
          'Not running',
          'Buzzing / not starting',
          'Short-cycling',
          'Not sure'
        ],
        selectedOptions: [],
      ),
      ChecklistItemData(
        id: 'noiseVibration',
        text: 'Any unusual noise or vibration?',
        checked: false,
        options: ['None', 'Fan noise', 'Compressor noise', 'Vibration', 'Other'],
        selectedOptions: [],
      ),
      ChecklistItemData(
        id: 'returnAirTemp',
        text: 'Return air temperature',
        checked: false,
        numericValue: '',
        unit: '°F',
      ),
      ChecklistItemData(
        id: 'supplyAirTemp',
        text: 'Supply air temperature',
        checked: false,
        numericValue: '',
        unit: '°F',
      ),
    ],
  ),
  // Additional sections can be added here as needed
  // The full checklist has many more sections for different diagnostic paths
];

// Placeholder checklists for other RTU issues
// These can be expanded with full implementations later

/// RTU: Not Heating
/// Issue ID: 'not-heating'
final rtuNotHeating = [
  ChecklistItem(
    id: '1',
    title: 'Thermostat',
    items: [
      ChecklistItemData(
        id: '1-1',
        text: 'Thermostat type',
        checked: false,
        options: [
          'Digital (touch screen)',
          'Digital (battery-powered)',
          'Mechanical / Analog'
        ],
        selectedOptions: [],
      ),
      ChecklistItemData(
        id: '1-2',
        text: 'Is tstat receiving power? Set tstat to Heat and check for 24V between R-W (or R-W1/W2).',
        checked: false,
        options: ['Yes', 'No', 'Partial'],
        selectedOptions: [],
      ),
    ],
  ),
  ChecklistItem(
    id: '2',
    title: 'Unit Power',
    items: [
      ChecklistItemData(
        id: '2-1',
        text: 'Is the disconnect switch ON?',
        checked: false,
        options: ['Yes', 'No'],
        selectedOptions: [],
      ),
      ChecklistItemData(
        id: '2-1a',
        text: 'Turn on & recheck heating call',
        checked: false,
        conditionalOn: ConditionalOn(itemId: '2-1', option: 'No'),
        isBlockingMessage: true,
      ),
      ChecklistItemData(
        id: '2-2',
        text: 'Is the unit running?',
        checked: false,
        options: ['Yes', 'No', 'Intermittent'],
        selectedOptions: [],
      ),
      ChecklistItemData(
        id: '2-2a',
        text: 'Is line power present on primary side of transformer (typically 208-240V)?',
        checked: false,
        options: ['Yes', 'No'],
        selectedOptions: [],
        conditionalOn: ConditionalOn(itemId: '2-2', option: 'No'),
      ),
      ChecklistItemData(
        id: '2-2a-blocking',
        text: 'This is an upstream breaker / disconnect / fuse problem.',
        checked: false,
        conditionalOn: ConditionalOn(itemId: '2-2a', option: 'No'),
        isBlockingMessage: true,
      ),
      ChecklistItemData(
        id: '2-2b',
        text: 'Is control transformer putting out 24 V?',
        checked: false,
        options: ['Yes', 'No'],
        selectedOptions: [],
        conditionalOn: ConditionalOn(itemId: '2-2', option: 'No'),
      ),
      ChecklistItemData(
        id: '2-2b-blocking',
        text: 'This is either a blown transformer, or inline fuse open.',
        checked: false,
        conditionalOn: ConditionalOn(itemId: '2-2b', option: 'No'),
        isBlockingMessage: true,
      ),
      ChecklistItemData(
        id: '2-2c',
        text: 'Is control voltage reaching contactor coil? I.e., is 24V present across R-W (or R-W1/W2) or directly across contactor coil?',
        checked: false,
        options: ['Yes', 'No'],
        selectedOptions: [],
        conditionalOn: ConditionalOn(itemId: '2-2', option: 'No'),
      ),
      ChecklistItemData(
        id: '2-2c-blocking',
        text: 'This control circuit is open somewhere upstream (safety switch, pressure switch, freezestat, limit, or board).',
        checked: false,
        conditionalOn: ConditionalOn(itemId: '2-2c', option: 'No'),
        isBlockingMessage: true,
      ),
      ChecklistItemData(
        id: '2-3',
        text: 'Are all fuses on the control board and/or transformers intact?',
        checked: false,
        options: ['Yes', 'No', 'N/A'],
        selectedOptions: [],
        conditionalOn: ConditionalOn(itemId: '2-2', option: 'No'),
      ),
      ChecklistItemData(
        id: '2-3-blocking',
        text: 'Please correct for blown fuses.',
        checked: false,
        conditionalOn: ConditionalOn(itemId: '2-3', option: 'No'),
        isBlockingMessage: true,
      ),
      ChecklistItemData(
        id: '2-4',
        text: 'Are there any LED fault codes on the control board?',
        checked: false,
        options: ['No', 'Solid LED', 'Flashing LED'],
        selectedOptions: [],
      ),
      ChecklistItemData(
        id: '2-4-blocking',
        text: 'A flashing LED may indicate that safety is open or circuit is locked out. Please reference unit manual to confirm.',
        checked: false,
        conditionalOn: ConditionalOn(itemId: '2-4', option: 'Flashing LED'),
        isBlockingMessage: true,
      ),
      ChecklistItemData(
        id: '2-5-blocking',
        text: 'It seems like there is power at the unit but not at the thermostat. Please check for a broken wire / open splice / tripped float switch / conduit inside the control wiring run',
        checked: false,
        isBlockingMessage: true,
        customCondition: true, // Flag to indicate this needs custom condition checking
      ),
    ],
  ),
  ChecklistItem(
    id: '3',
    title: 'Heating Checks',
    items: [
      ChecklistItemData(
        id: 'heatingSystemType',
        text: 'What type of heating system?',
        checked: false,
        options: [
          'Gas (natural or propane)',
          'Electric heat strips',
          'Heat pump',
          'Not sure'
        ],
        selectedOptions: [],
      ),
      ChecklistItemData(
        id: 'supplyFanRunning',
        text: 'Is the supply fan running?',
        checked: false,
        options: ['Yes', 'No', 'Intermittent', 'Not sure'],
        selectedOptions: [],
      ),
      ChecklistItemData(
        id: 'supplyAirflowStrength',
        text: 'How strong is the supply airflow at the rooftop discharge?',
        checked: false,
        options: ['Strong', 'Weak', 'None', 'Not checked'],
        selectedOptions: [],
      ),
      ChecklistItemData(
        id: 'filtersCondition',
        text: 'Are the filters clean?',
        checked: false,
        options: ['Clean', 'Moderately dirty', 'Clogged', 'Missing'],
        selectedOptions: [],
        images: [],
      ),
      ChecklistItemData(
        id: 'heatingElementStatus',
        text: 'Is the heating element/heat source operating?',
        checked: false,
        options: ['Yes - producing heat', 'No - not operating', 'Intermittent', 'Not sure'],
        selectedOptions: [],
      ),
      ChecklistItemData(
        id: 'noiseVibration',
        text: 'Any abnormal noise or vibration from heating section?',
        checked: false,
        options: ['None', 'Fan noise', 'Gas valve noise', 'Electric heat noise', 'Vibration', 'Other'],
        selectedOptions: [],
      ),
      ChecklistItemData(
        id: 'returnAirTemp',
        text: 'Enter the return air temperature (°F)',
        checked: false,
        numericValue: '',
        unit: '°F',
      ),
      ChecklistItemData(
        id: 'supplyAirTemp',
        text: 'Enter the supply air temperature (°F)',
        checked: false,
        numericValue: '',
        unit: '°F',
      ),
      ChecklistItemData(
        id: 'temperatureRiseInterpretation',
        text: 'Auto-evaluated temperature rise result',
        checked: false,
        isInfoMessage: true, // Flag to indicate this is a calculated/display-only item
      ),
    ],
  ),
];

final rtuPoorAirflow = defaultChecklist;
final rtuUnitNotRunning = defaultChecklist;
final rtuUnitLeaking = defaultChecklist;
final rtuShortCycling = defaultChecklist;
final rtuZoningIssues = defaultChecklist;

