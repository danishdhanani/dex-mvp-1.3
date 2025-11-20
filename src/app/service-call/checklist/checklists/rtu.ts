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
      },
      {
        id: '2-5-blocking',
        text: 'It seems like there is power at the unit but not at the thermostat. Please check for a broken wire / open splice / tripped float switch / conduit inside the control wiring run',
        checked: false,
        isBlockingMessage: true,
        customCondition: true // Flag to indicate this needs custom condition checking
      }
    ]
  },
  {
    id: '3',
    title: 'Cooling Checks',
    items: [
      {
        id: 'supplyFanRunning',
        text: 'Is the supply fan running?',
        checked: false,
        options: ['Yes', 'No', 'Intermittent', 'Not sure'],
        selectedOptions: []
      },
      {
        id: 'supplyAirflowStrength',
        text: 'How strong is the supply airflow at the rooftop discharge?',
        checked: false,
        options: ['Strong', 'Weak', 'None', 'Not checked'],
        selectedOptions: []
      },
      {
        id: 'filtersCondition',
        text: 'Are the filters clean?',
        checked: false,
        options: ['Clean', 'Moderately dirty', 'Clogged', 'Missing'],
        selectedOptions: [],
        images: []
      },
      {
        id: 'evapCoilCondition',
        text: 'Is the evaporator coil clean or iced over?',
        checked: false,
        options: ['Clean', 'Dirty', 'Light frost', 'Heavily iced'],
        selectedOptions: [],
        images: []
      },
      {
        id: 'condenserFanStatus',
        text: 'Are the condenser fans running normally?',
        checked: false,
        options: ['All running', 'One or more not running', 'Running weak', 'Not sure'],
        selectedOptions: [],
        images: []
      },
      {
        id: 'condenserCoilCondition',
        text: 'Is the condenser coil clean?',
        checked: false,
        options: ['Clean', 'Moderately dirty', 'Very dirty / restricted'],
        selectedOptions: [],
        images: []
      },
      {
        id: 'compressorStatus',
        text: 'Is the compressor running?',
        checked: false,
        options: ['Running normally', 'Not running', 'Buzzing / not starting', 'Short-cycling', 'Not sure'],
        selectedOptions: []
      },
      {
        id: 'noiseVibration',
        text: 'Any abnormal noise or vibration from compressor or fan section?',
        checked: false,
        options: ['None', 'Fan noise', 'Compressor noise', 'Vibration', 'Other'],
        selectedOptions: [],
        notes: ''
      },
      {
        id: 'returnAirTemp',
        text: 'Enter the return air temperature (°F)',
        checked: false,
        numericValue: '',
        unit: '°F'
      },
      {
        id: 'supplyAirTemp',
        text: 'Enter the supply air temperature (°F)',
        checked: false,
        numericValue: '',
        unit: '°F'
      },
      {
        id: 'deltaTInterpretation',
        text: 'Auto-evaluated ΔT result',
        checked: false
      }
    ]
  },
  {
    id: 'rtuAirflowDiagnostics',
    title: 'Airflow diagnostics',
    items: [
      // Blower / belt system
      {
        id: 'af-belt-condition',
        text: 'Check belt condition',
        checked: false,
        options: ['Intact', 'Frayed', 'Broken'],
        selectedOptions: []
      },
      {
        id: 'af-belt-condition-action-broken',
        text: 'Replaced broken belt',
        checked: false,
        conditionalOn: { itemId: 'af-belt-condition', option: 'Broken' },
        isActionItem: true,
        images: []
      },
      {
        id: 'af-belt-condition-action-frayed',
        text: 'Replaced frayed belt',
        checked: false,
        conditionalOn: { itemId: 'af-belt-condition', option: 'Frayed' },
        isActionItem: true,
        images: []
      },
      {
        id: 'af-belt-tension',
        text: 'Check belt tension',
        checked: false,
        options: ['Proper', 'Loose', 'Too tight'],
        selectedOptions: []
      },
      {
        id: 'af-belt-tension-action-loose',
        text: 'Adjusted belt tension to proper tightness',
        checked: false,
        conditionalOn: { itemId: 'af-belt-tension', option: 'Loose' },
        isActionItem: true,
        images: []
      },
      {
        id: 'af-belt-tension-action-tight',
        text: 'Adjusted belt tension to proper tightness',
        checked: false,
        conditionalOn: { itemId: 'af-belt-tension', option: 'Too tight' },
        isActionItem: true,
        images: []
      },
      {
        id: 'af-pulley-alignment',
        text: 'Check pulley set screws and alignment',
        checked: false,
        options: ['Proper', 'Loose set screws', 'Misaligned', 'Not checked'],
        selectedOptions: []
      },
      {
        id: 'af-pulley-action-loose',
        text: 'Tightened loose set screws',
        checked: false,
        conditionalOn: { itemId: 'af-pulley-alignment', option: 'Loose set screws' },
        isActionItem: true,
        images: []
      },
      {
        id: 'af-pulley-action-misaligned',
        text: 'Aligned pulleys',
        checked: false,
        conditionalOn: { itemId: 'af-pulley-alignment', option: 'Misaligned' },
        isActionItem: true,
        images: []
      },
      {
        id: 'af-blower-wheel',
        text: 'Check blower wheel cleanliness',
        checked: false,
        options: ['Clean', 'Moderately dirty', 'Dust-matted / very dirty'],
        selectedOptions: [],
        images: []
      },
      {
        id: 'af-blower-wheel-action',
        text: 'Cleaned dust-matted blower wheel',
        checked: false,
        conditionalOn: { itemId: 'af-blower-wheel', option: 'Dust-matted / very dirty' },
        isActionItem: true,
        images: []
      },
      {
        id: 'af-motor-nameplate-amps',
        text: 'Blower motor nameplate amps (optional)',
        checked: false,
        numericValue: '',
        unit: 'A'
      },
      {
        id: 'af-motor-measured-amps',
        text: 'Blower motor measured amps (optional)',
        checked: false,
        numericValue: '',
        unit: 'A'
      },
      // Static pressure / duct side
      {
        id: 'af-return-static',
        text: 'Return static pressure (in wc)',
        checked: false,
        numericValue: '',
        unit: 'in wc'
      },
      {
        id: 'af-supply-static',
        text: 'Supply static pressure (in wc)',
        checked: false,
        numericValue: '',
        unit: 'in wc'
      },
      {
        id: 'staticPressureInterpretation',
        text: 'Auto-evaluated static pressure result',
        checked: false
      },
      {
        id: 'af-static-action',
        text: 'Investigated and resolved high static pressure (checked filters, ductwork, and coil)',
        checked: false,
        isActionItem: true,
        images: [],
        customCondition: true // Will be shown when total static > 1.0
      },
      // Filters & evap double-check
      {
        id: 'af-filters-recheck',
        text: 'Reconfirm filters after any change',
        checked: false,
        options: ['Clean', 'Moderately dirty', 'Clogged', 'Missing', 'Replaced'],
        selectedOptions: [],
        images: []
      },
      {
        id: 'af-filters-action',
        text: 'Replaced or cleaned clogged filters',
        checked: false,
        conditionalOn: { itemId: 'af-filters-recheck', option: 'Clogged' },
        isActionItem: true,
        images: []
      },
      {
        id: 'af-evap-recheck',
        text: 'Reconfirm evaporator coil condition',
        checked: false,
        options: ['Clean', 'Dirty', 'Light frost', 'Heavily iced', 'Plugged'],
        selectedOptions: [],
        images: []
      },
      {
        id: 'af-evap-action-iced',
        text: 'Defrosted and cleaned heavily iced evaporator coil',
        checked: false,
        conditionalOn: { itemId: 'af-evap-recheck', option: 'Heavily iced' },
        isActionItem: true,
        images: []
      },
      {
        id: 'af-evap-action-plugged',
        text: 'Cleaned plugged evaporator coil',
        checked: false,
        conditionalOn: { itemId: 'af-evap-recheck', option: 'Plugged' },
        isActionItem: true,
        images: []
      },
      // Outcome questions
      {
        id: 'af-airflow-improved',
        text: 'After fixes, is supply airflow now strong at vents?',
        checked: false,
        options: ['Yes', 'No', 'Partially improved'],
        selectedOptions: []
      },
      {
        id: 'af-deltat-after-return',
        text: 'After fixes, enter return air temperature (°F)',
        checked: false,
        numericValue: '',
        unit: '°F'
      },
      {
        id: 'af-deltat-after-supply',
        text: 'After fixes, enter supply air temperature (°F)',
        checked: false,
        numericValue: '',
        unit: '°F'
      },
      {
        id: 'af-deltat-after-interpretation',
        text: 'Auto-evaluated ΔT after fixes',
        checked: false
      },
      {
        id: 'af-primary-cause-found',
        text: 'Do you believe you\'ve found the primary cause of the "Not Cooling" issue?',
        checked: false,
        options: ['Yes', 'No'],
        selectedOptions: []
      }
    ]
  },
  {
    id: 'rtuCondenserDiagnostics',
    title: 'Condenser diagnostics',
    items: [
      // Number of condenser fans
      {
        id: 'cd-fan-count',
        text: 'How many condenser fans are there?',
        checked: false,
        numericValue: '',
        unit: ''
      },
      // Condenser fans (conditional on count)
      {
        id: 'cd-fan-1-status',
        text: 'Condenser fan 1 status',
        checked: false,
        options: ['Running', 'Not running', 'Noisy', 'Intermittent', 'Running in reverse'],
        selectedOptions: [],
        conditionalOn: {
          itemId: 'cd-fan-count',
          condition: (value: string) => {
            const count = parseInt(value);
            return !isNaN(count) && count >= 1;
          }
        }
      },
      {
        id: 'cd-fan-1-blade',
        text: 'Condenser fan 1 blade condition',
        checked: false,
        options: ['Intact', 'Damaged', 'Hitting shroud', 'Not checked'],
        selectedOptions: [],
        conditionalOn: {
          itemId: 'cd-fan-count',
          condition: (value: string) => {
            const count = parseInt(value);
            return !isNaN(count) && count >= 1;
          }
        }
      },
      {
        id: 'cd-fan-1-blade-damaged-action',
        text: 'Repaired or replaced damaged blade',
        checked: false,
        conditionalOn: {
          itemId: 'cd-fan-1-blade',
          option: 'Damaged'
        },
        isActionItem: true,
        images: []
      },
      {
        id: 'cd-fan-1-blade-hitting-action',
        text: 'Fixed blade contact with shroud',
        checked: false,
        conditionalOn: {
          itemId: 'cd-fan-1-blade',
          option: 'Hitting shroud'
        },
        isActionItem: true,
        images: []
      },
      {
        id: 'cd-fan-2-status',
        text: 'Condenser fan 2 status',
        checked: false,
        options: ['Running', 'Not running', 'Noisy', 'Intermittent', 'Running in reverse'],
        selectedOptions: [],
        conditionalOn: {
          itemId: 'cd-fan-count',
          condition: (value: string) => {
            const count = parseInt(value);
            return !isNaN(count) && count >= 2;
          }
        }
      },
      {
        id: 'cd-fan-2-blade',
        text: 'Condenser fan 2 blade condition',
        checked: false,
        options: ['Intact', 'Damaged', 'Hitting shroud', 'Not checked'],
        selectedOptions: [],
        conditionalOn: {
          itemId: 'cd-fan-count',
          condition: (value: string) => {
            const count = parseInt(value);
            return !isNaN(count) && count >= 2;
          }
        }
      },
      {
        id: 'cd-fan-2-blade-damaged-action',
        text: 'Repaired or replaced damaged blade',
        checked: false,
        conditionalOn: {
          itemId: 'cd-fan-2-blade',
          option: 'Damaged'
        },
        isActionItem: true,
        images: []
      },
      {
        id: 'cd-fan-2-blade-hitting-action',
        text: 'Fixed blade contact with shroud',
        checked: false,
        conditionalOn: {
          itemId: 'cd-fan-2-blade',
          option: 'Hitting shroud'
        },
        isActionItem: true,
        images: []
      },
      {
        id: 'cd-fan-3-status',
        text: 'Condenser fan 3 status',
        checked: false,
        options: ['Running', 'Not running', 'Noisy', 'Intermittent', 'Running in reverse'],
        selectedOptions: [],
        conditionalOn: {
          itemId: 'cd-fan-count',
          condition: (value: string) => {
            const count = parseInt(value);
            return !isNaN(count) && count >= 3;
          }
        }
      },
      {
        id: 'cd-fan-3-blade',
        text: 'Condenser fan 3 blade condition',
        checked: false,
        options: ['Intact', 'Damaged', 'Hitting shroud', 'Not checked'],
        selectedOptions: [],
        conditionalOn: {
          itemId: 'cd-fan-count',
          condition: (value: string) => {
            const count = parseInt(value);
            return !isNaN(count) && count >= 3;
          }
        }
      },
      {
        id: 'cd-fan-3-blade-damaged-action',
        text: 'Repaired or replaced damaged blade',
        checked: false,
        conditionalOn: {
          itemId: 'cd-fan-3-blade',
          option: 'Damaged'
        },
        isActionItem: true,
        images: []
      },
      {
        id: 'cd-fan-3-blade-hitting-action',
        text: 'Fixed blade contact with shroud',
        checked: false,
        conditionalOn: {
          itemId: 'cd-fan-3-blade',
          option: 'Hitting shroud'
        },
        isActionItem: true,
        images: []
      },
      // Condenser coil
      {
        id: 'cd-coil-visual',
        text: 'Condenser coil visual condition',
        checked: false,
        options: ['Clean', 'Dusty', 'Heavily clogged', 'Blocked by debris'],
        selectedOptions: [],
        images: []
      },
      {
        id: 'cd-coil-clean-info',
        text: 'Coil appears clean. Condenser airflow restriction is unlikely the cause.',
        checked: false,
        conditionalOn: {
          itemId: 'cd-coil-visual',
          option: 'Clean'
        },
        isInfoMessage: true
      },
      {
        id: 'cd-coil-dusty-action',
        text: 'Performed light cleaning',
        checked: false,
        conditionalOn: {
          itemId: 'cd-coil-visual',
          option: 'Dusty'
        },
        isActionItem: true,
        images: []
      },
      {
        id: 'cd-coil-dusty-info',
        text: 'Coil is slightly dusty. Light cleaning may improve efficiency, but this alone usually does not cause a no-cooling condition.',
        checked: false,
        conditionalOn: {
          itemId: 'cd-coil-visual',
          option: 'Dusty'
        },
        isInfoMessage: true
      },
      {
        id: 'cd-coil-clogged-info',
        text: 'Heavily clogged coil — this is a common cause of poor cooling or high head pressure. Coil should be cleaned before continuing deeper diagnostics.',
        checked: false,
        conditionalOn: {
          itemId: 'cd-coil-visual',
          option: 'Heavily clogged'
        },
        isInfoMessage: true
      },
      {
        id: 'cd-coil-clogged-pressure-before-discharge',
        text: 'Pressures before cleaning: Discharge',
        checked: false,
        unit: 'psig',
        conditionalOn: {
          itemId: 'cd-coil-visual',
          option: 'Heavily clogged'
        }
      },
      {
        id: 'cd-coil-clogged-action',
        text: 'Thoroughly cleaned condenser coil',
        checked: false,
        conditionalOn: {
          itemId: 'cd-coil-visual',
          option: 'Heavily clogged'
        },
        isActionItem: true,
        images: []
      },
      {
        id: 'cd-coil-clogged-pressure-after-discharge',
        text: 'Pressures after cleaning: Discharge',
        checked: false,
        unit: 'psig',
        conditionalOn: {
          itemId: 'cd-coil-visual',
          option: 'Heavily clogged'
        }
      },
      {
        id: 'cd-coil-debris-info',
        text: 'Debris is blocking the coil face. Removing the obstruction is usually required to restore proper condenser airflow.',
        checked: false,
        conditionalOn: {
          itemId: 'cd-coil-visual',
          option: 'Blocked by debris'
        },
        isInfoMessage: true
      },
      {
        id: 'cd-coil-debris-action',
        text: 'Removed debris from coil',
        checked: false,
        conditionalOn: {
          itemId: 'cd-coil-visual',
          option: 'Blocked by debris'
        },
        isActionItem: true,
        images: []
      },
      // Section 2: Electrical / motor drill down (conditional on fans not running or noisy)
      // These will be rendered conditionally in the page component
      {
        id: 'cd-safety-warning',
        text: 'Turn off unit and lock out the disconnect before continuing.',
        checked: false,
        isBlockingMessage: true
      },
      // Per-fan electrical checks (will be conditionally rendered)
      {
        id: 'cd-fan-1-voltage',
        text: 'Fan 1: Voltage at fan terminals',
        checked: false,
        options: ['Present', 'Not present', 'Not checked'],
        selectedOptions: []
      },
      {
        id: 'cd-fan-1-capacitor',
        text: 'Fan 1: Capacitor condition',
        checked: false,
        options: ['Good', 'Bad / replaced', 'Not checked'],
        selectedOptions: []
      },
      {
        id: 'cd-fan-1-spin-test',
        text: 'Fan 1: Spin test - does blade spin freely when manually pushed?',
        checked: false,
        options: ['Yes', 'No', 'Not checked'],
        selectedOptions: []
      },
      {
        id: 'cd-fan-1-motor-temp',
        text: 'Fan 1: Does the motor feel excessively hot or have a burnt smell?',
        checked: false,
        options: ['Normal temp / no smell', 'Hot to the touch', 'Burnt electrical smell'],
        selectedOptions: []
      },
      {
        id: 'cd-fan-1-measured-amps',
        text: 'Fan 1: Measured motor amps (A)',
        checked: false,
        numericValue: '',
        unit: 'A'
      },
      {
        id: 'cd-fan-1-nameplate-amps',
        text: 'Fan 1: Nameplate motor amps (A)',
        checked: false,
        numericValue: '',
        unit: 'A'
      },
      {
        id: 'cd-fan-2-voltage',
        text: 'Fan 2: Voltage at fan terminals',
        checked: false,
        options: ['Present', 'Not present', 'Not checked'],
        selectedOptions: []
      },
      {
        id: 'cd-fan-2-capacitor',
        text: 'Fan 2: Capacitor condition',
        checked: false,
        options: ['Good', 'Bad / replaced', 'Not checked'],
        selectedOptions: []
      },
      {
        id: 'cd-fan-2-spin-test',
        text: 'Fan 2: Spin test - does blade spin freely when manually pushed?',
        checked: false,
        options: ['Yes', 'No', 'Not checked'],
        selectedOptions: []
      },
      {
        id: 'cd-fan-2-motor-temp',
        text: 'Fan 2: Does the motor feel excessively hot or have a burnt smell?',
        checked: false,
        options: ['Normal temp / no smell', 'Hot to the touch', 'Burnt electrical smell'],
        selectedOptions: []
      },
      {
        id: 'cd-fan-2-measured-amps',
        text: 'Fan 2: Measured motor amps (A)',
        checked: false,
        numericValue: '',
        unit: 'A'
      },
      {
        id: 'cd-fan-2-nameplate-amps',
        text: 'Fan 2: Nameplate motor amps (A)',
        checked: false,
        numericValue: '',
        unit: 'A'
      },
      {
        id: 'cd-fan-3-voltage',
        text: 'Fan 3: Voltage at fan terminals',
        checked: false,
        options: ['Present', 'Not present', 'Not checked'],
        selectedOptions: []
      },
      {
        id: 'cd-fan-3-capacitor',
        text: 'Fan 3: Capacitor condition',
        checked: false,
        options: ['Good', 'Bad / replaced', 'Not checked'],
        selectedOptions: []
      },
      {
        id: 'cd-fan-3-spin-test',
        text: 'Fan 3: Spin test - does blade spin freely when manually pushed?',
        checked: false,
        options: ['Yes', 'No', 'Not checked'],
        selectedOptions: []
      },
      {
        id: 'cd-fan-3-motor-temp',
        text: 'Fan 3: Does the motor feel excessively hot or have a burnt smell?',
        checked: false,
        options: ['Normal temp / no smell', 'Hot to the touch', 'Burnt electrical smell'],
        selectedOptions: []
      },
      {
        id: 'cd-fan-3-measured-amps',
        text: 'Fan 3: Measured motor amps (A)',
        checked: false,
        numericValue: '',
        unit: 'A'
      },
      {
        id: 'cd-fan-3-nameplate-amps',
        text: 'Fan 3: Nameplate motor amps (A)',
        checked: false,
        numericValue: '',
        unit: 'A'
      },
      // Outcome
      {
        id: 'cd-fans-running',
        text: 'After any cleaning/repair, are all condenser fans running normally?',
        checked: false,
        options: ['Yes', 'No', 'Partially'],
        selectedOptions: []
      },
      {
        id: 'cd-coil-clear',
        text: 'Condenser coil now visually clear and unobstructed?',
        checked: false,
        options: ['Yes', 'No'],
        selectedOptions: []
      },
      {
        id: 'cd-head-pressure',
        text: 'If pressures are available: head pressure back in normal range?',
        checked: false,
        options: ['Yes', 'No', 'Not checked'],
        selectedOptions: []
      },
      {
        id: 'cd-primary-cause-found',
        text: 'Do you believe you\'ve found the primary cause of the "Not Cooling" issue?',
        checked: false,
        options: ['Yes', 'No'],
        selectedOptions: []
      }
    ]
  },
  {
    id: 'rtuCompressorCircuitDiagnostics',
    title: 'Compressor circuit diagnostics',
    items: [
      // Contactor / call
      {
        id: 'cc-contactor-energized',
        text: 'Is the contactor coil energized when there is a cooling call?',
        checked: false,
        options: ['Yes', 'No', 'Not sure'],
        selectedOptions: []
      },
      {
        id: 'cc-contactor-contacts',
        text: 'Are contactor contacts pitted/burned?',
        checked: false,
        options: ['Yes', 'No'],
        selectedOptions: []
      },
      // Line vs load side
      {
        id: 'cc-line-voltage',
        text: 'Does line side of contactor have proper voltage?',
        checked: false,
        options: ['Yes', 'No', 'Not checked'],
        selectedOptions: []
      },
      {
        id: 'cc-load-voltage',
        text: 'Does load side show voltage when the contactor is pulled in?',
        checked: false,
        options: ['Yes', 'No', 'Not checked'],
        selectedOptions: []
      },
      // Compressor start components (for single-phase)
      {
        id: 'cc-capacitor-condition',
        text: 'Start/run capacitor condition',
        checked: false,
        options: ['Normal', 'Bulged', 'Leaking', 'Replaced'],
        selectedOptions: []
      },
      {
        id: 'cc-compressor-buzzing',
        text: 'Is compressor buzzing but not starting?',
        checked: false,
        options: ['Yes', 'No', 'Not sure'],
        selectedOptions: []
      },
      // Overload and safeties
      {
        id: 'cc-compressor-hot',
        text: 'Is the compressor extremely hot to the touch?',
        checked: false,
        options: ['Yes', 'No'],
        selectedOptions: []
      },
      {
        id: 'cc-overload-open',
        text: 'Was the internal overload suspected to be open?',
        checked: false,
        options: ['Yes', 'No'],
        selectedOptions: []
      },
      {
        id: 'cc-pressure-switches',
        text: 'Any high-pressure or low-pressure switches open in series with the compressor contactor?',
        checked: false,
        options: ['Yes', 'No', 'Not checked'],
        selectedOptions: []
      },
      // Outcome
      {
        id: 'cc-compressor-running',
        text: 'Compressor now runs after repair/replacement of contactor/capacitor/etc.?',
        checked: false,
        options: ['Yes', 'No'],
        selectedOptions: []
      },
      {
        id: 'cc-replacement-needed',
        text: 'If still not running, is replacement likely required?',
        checked: false,
        options: ['Yes', 'No'],
        selectedOptions: []
      },
      {
        id: 'cc-primary-cause-found',
        text: 'Do you believe you\'ve found the primary cause of the "Not Cooling" issue?',
        checked: false,
        options: ['Yes', 'No'],
        selectedOptions: []
      }
    ]
  },
  {
    id: 'rtuRefrigerantDiagnostics',
    title: 'Refrigerant diagnostics',
    items: [
      // Operating conditions
      {
        id: 'rf-suction-pressure',
        text: 'Record suction pressure',
        checked: false,
        numericValue: '',
        unit: 'PSIG'
      },
      {
        id: 'rf-discharge-pressure',
        text: 'Record discharge pressure',
        checked: false,
        numericValue: '',
        unit: 'PSIG'
      },
      {
        id: 'rf-outdoor-ambient',
        text: 'Record outdoor ambient temperature',
        checked: false,
        numericValue: '',
        unit: '°F'
      },
      {
        id: 'rf-return-air-temp',
        text: 'Record approximate return air temperature',
        checked: false,
        numericValue: '',
        unit: '°F'
      },
      // Superheat & subcool
      {
        id: 'rf-suction-line-temp',
        text: 'Record suction line temperature at evap outlet (for superheat calculation)',
        checked: false,
        numericValue: '',
        unit: '°F'
      },
      {
        id: 'rf-liquid-line-temp',
        text: 'Record liquid line temperature at condenser outlet (for subcooling calculation)',
        checked: false,
        numericValue: '',
        unit: '°F'
      },
      // Simple interpretation prompts
      {
        id: 'rf-suction-interpretation',
        text: 'Suction looks',
        checked: false,
        options: ['Low', 'Normal', 'High'],
        selectedOptions: []
      },
      {
        id: 'rf-head-interpretation',
        text: 'Head pressure looks',
        checked: false,
        options: ['Low', 'Normal', 'High'],
        selectedOptions: []
      },
      {
        id: 'rf-superheat-interpretation',
        text: 'Superheat looks',
        checked: false,
        options: ['Low', 'Normal', 'High', 'Not measured'],
        selectedOptions: []
      },
      {
        id: 'rf-subcool-interpretation',
        text: 'Subcooling looks',
        checked: false,
        options: ['Low', 'Normal', 'High', 'Not measured'],
        selectedOptions: []
      },
      {
        id: 'rf-primary-cause-found',
        text: 'Do you believe you\'ve found the primary cause of the "Not Cooling" issue?',
        checked: false,
        options: ['Yes', 'No'],
        selectedOptions: []
      }
    ]
  },
  {
    id: 'rtuControlEconomizerDiagnostics',
    title: 'Control / economizer diagnostics',
    items: [
      // Thermostat / BAS config
      {
        id: 'ce-cooling-setpoint',
        text: 'Verify cooling setpoint and schedule',
        checked: false,
        options: ['Setpoint reasonable', 'Setpoint too high', 'Schedule issue', 'Not checked'],
        selectedOptions: []
      },
      {
        id: 'ce-occupied-mode',
        text: 'Check if unit is in "occupied" mode during complaint time',
        checked: false,
        options: ['Yes', 'No', 'Not sure'],
        selectedOptions: []
      },
      {
        id: 'ce-lockouts-overrides',
        text: 'Check if there are any lockouts, setbacks, or overrides',
        checked: false,
        options: ['None found', 'Lockout active', 'Setback active', 'Override active', 'Not checked'],
        selectedOptions: []
      },
      // Sensor placement / calibration
      {
        id: 'ce-sensor-placement',
        text: 'Is the space sensor located in a reasonable spot? (not in direct sun, not in supply air stream)',
        checked: false,
        options: ['Yes', 'No - in direct sun', 'No - in supply air stream', 'No - other issue', 'Not checked'],
        selectedOptions: []
      },
      {
        id: 'ce-sensor-calibration',
        text: 'Compare space temp reading vs actual reading with handheld thermometer',
        checked: false,
        options: ['Matches', 'Off by < 2°F', 'Off by 2-5°F', 'Off by > 5°F', 'Not checked'],
        selectedOptions: []
      },
      // Economizer / OA damper
      {
        id: 'ce-damper-position',
        text: 'On a call for mechanical cooling, is the economizer damper position reasonable?',
        checked: false,
        options: ['Yes - closed/minimum', 'No - stuck open', 'No - stuck closed', 'Not sure', 'Not checked'],
        selectedOptions: []
      },
      {
        id: 'ce-damper-stuck-open',
        text: 'Are dampers stuck open bringing in too much hot outdoor air?',
        checked: false,
        options: ['No', 'Yes', 'Not checked'],
        selectedOptions: []
      },
      {
        id: 'ce-mixed-air-temp',
        text: 'Is mixed air temperature unusually high compared to return and outdoor air temps?',
        checked: false,
        options: ['No', 'Yes', 'Not checked'],
        selectedOptions: []
      },
      // Zoning / distribution
      {
        id: 'ce-multi-zone',
        text: 'If multi-zone, are all zones calling?',
        checked: false,
        options: ['Yes - all zones calling', 'No - some zones not calling', 'N/A - single zone', 'Not checked'],
        selectedOptions: []
      },
      {
        id: 'ce-zone-dampers',
        text: 'Any zone dampers stuck closed/open?',
        checked: false,
        options: ['No', 'Yes - stuck closed', 'Yes - stuck open', 'N/A - single zone', 'Not checked'],
        selectedOptions: []
      },
      // Outcome
      {
        id: 'ce-issue-found',
        text: 'Found control/economizer issue that explains poor comfort?',
        checked: false,
        options: ['Yes', 'No'],
        selectedOptions: []
      },
      {
        id: 'ce-changes-made',
        text: 'Note what was changed (setpoints, schedules, economizer minimum position, etc.)',
        checked: false,
        notes: ''
      },
      {
        id: 'ce-primary-cause-found',
        text: 'Do you believe you\'ve found the primary cause of the "Not Cooling" issue?',
        checked: false,
        options: ['Yes', 'No'],
        selectedOptions: []
      }
    ]
  },
  {
    id: '4',
    title: 'Wrap up',
    items: [
      { id: '4-1', text: 'Restore power and disconnects', checked: false },
      { id: '4-2', text: 'Verify unit is operating correctly', checked: false },
      { id: '4-3', text: 'Reinstall panels/guards and clean workspace', checked: false },
      { id: '4-4', text: 'Confirm unit is cooling to setpoint', checked: false }
    ],
  }
];

/**
 * RTU: Not Heating
 * Issue ID: 'not-heating'
 */
export const notHeating: ChecklistItem[] = [
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
        text: 'Is tstat receiving power? Set tstat to Heat and check for 24V between R-W (or R-W1/W2).',
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
        text: 'Turn on & recheck heating call',
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
        text: 'Is control voltage reaching contactor coil? I.e., is 24V present across R-W (or R-W1/W2) or directly across contactor coil?',
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
      },
      {
        id: '2-5-blocking',
        text: 'It seems like there is power at the unit but not at the thermostat. Please check for a broken wire / open splice / tripped float switch / conduit inside the control wiring run',
        checked: false,
        isBlockingMessage: true,
        customCondition: true // Flag to indicate this needs custom condition checking
      }
    ]
  },
  {
    id: '3',
    title: 'Heating Checks',
    items: [
      {
        id: 'heatingSystemType',
        text: 'What type of heating system?',
        checked: false,
        options: ['Gas (natural or propane)', 'Electric heat strips', 'Heat pump', 'Not sure'],
        selectedOption: ''
      },
      {
        id: 'supplyFanRunning',
        text: 'Is the supply fan running?',
        checked: false,
        options: ['Yes', 'No', 'Intermittent', 'Not sure'],
        selectedOption: ''
      },
      {
        id: 'supplyAirflowStrength',
        text: 'How strong is the supply airflow at the rooftop discharge?',
        checked: false,
        options: ['Strong', 'Weak', 'None', 'Not checked'],
        selectedOption: ''
      },
      {
        id: 'filtersCondition',
        text: 'Are the filters clean?',
        checked: false,
        options: ['Clean', 'Moderately dirty', 'Clogged', 'Missing'],
        selectedOption: '',
        images: []
      },
      {
        id: 'heatingElementStatus',
        text: 'Is the heating element/heat source operating?',
        checked: false,
        options: ['Yes - producing heat', 'No - not operating', 'Intermittent', 'Not sure'],
        selectedOption: ''
      },
      {
        id: 'gasValveEnergized',
        text: 'Is the gas valve energized?',
        checked: false,
        options: ['Yes', 'No', 'Not checked'],
        selectedOption: '',
        conditionalOn: { itemId: 'heatingSystemType', option: 'Gas (natural or propane)' }
      },
      {
        id: 'burnersLit',
        text: 'Are the burners lit?',
        checked: false,
        options: ['Yes', 'No', 'Not visible'],
        selectedOption: '',
        conditionalOn: { itemId: 'heatingSystemType', option: 'Gas (natural or propane)' }
      },
      {
        id: 'electricHeatOn',
        text: 'Is electric heat energized?',
        checked: false,
        options: ['Yes', 'No', 'Not checked'],
        selectedOption: '',
        conditionalOn: { itemId: 'heatingSystemType', option: 'Electric heat strips' }
      },
      {
        id: 'heatPumpRunning',
        text: 'Is the heat pump running in heat mode?',
        checked: false,
        options: ['Yes', 'No', 'Not checked'],
        selectedOption: '',
        conditionalOn: { itemId: 'heatingSystemType', option: 'Heat pump' }
      },
      {
        id: 'noiseVibration',
        text: 'Any abnormal noise or vibration from heating section?',
        checked: false,
        options: ['None', 'Fan noise', 'Gas valve noise', 'Electric heat noise', 'Vibration', 'Other'],
        selectedOption: '',
        notes: ''
      },
      {
        id: 'returnAirTemp',
        text: 'Enter the return air temperature (°F)',
        checked: false,
        numericValue: '',
        unit: '°F'
      },
      {
        id: 'supplyAirTemp',
        text: 'Enter the supply air temperature (°F)',
        checked: false,
        numericValue: '',
        unit: '°F'
      },
      {
        id: 'temperatureRiseInterpretation',
        text: 'Auto-evaluated temperature rise result',
        checked: false
      }
    ]
  },
  {
    id: '4',
    title: 'Gas Heating Diagnostics',
    items: [
      {
        id: '4-1',
        text: 'Is the gas valve energized? (Check for 24V at gas valve)',
        checked: false,
        options: ['Yes', 'No', 'Not checked'],
        selectedOptions: [],
        conditionalOn: { itemId: 'heatingSystemType', option: 'Gas (natural or propane)' }
      },
      {
        id: '4-2',
        text: 'Is there gas pressure at the unit?',
        checked: false,
        options: ['Yes', 'No', 'Not checked'],
        selectedOptions: [],
        conditionalOn: { itemId: 'heatingSystemType', option: 'Gas (natural or propane)' }
      },
      {
        id: '4-2-blocking',
        text: 'Check upstream gas valve, gas supply, and gas pressure regulator.',
        checked: false,
        conditionalOn: { itemId: '4-2', option: 'No' },
        isBlockingMessage: true
      },
      {
        id: '4-3',
        text: 'Does the igniter glow?',
        checked: false,
        options: ['Yes', 'No', 'Not visible'],
        selectedOptions: [],
        conditionalOn: { itemId: 'heatingSystemType', option: 'Gas (natural or propane)' }
      },
      {
        id: '4-4',
        text: 'Do the burners light?',
        checked: false,
        options: ['Yes', 'No', 'Lights then goes out'],
        selectedOptions: [],
        conditionalOn: { itemId: 'heatingSystemType', option: 'Gas (natural or propane)' }
      },
      {
        id: '4-5',
        text: 'Is the flame sensor clean?',
        checked: false,
        options: ['Yes', 'No', 'Not checked'],
        selectedOptions: [],
        conditionalOn: { itemId: 'heatingSystemType', option: 'Gas (natural or propane)' }
      },
      {
        id: '4-6',
        text: 'Is the heat exchanger visually intact? (No cracks, holes, or rust-through)',
        checked: false,
        options: ['Yes', 'No', 'Not checked'],
        selectedOptions: [],
        conditionalOn: { itemId: 'heatingSystemType', option: 'Gas (natural or propane)' },
        images: []
      },
      {
        id: '4-6-blocking',
        text: 'CRITICAL: If heat exchanger is compromised, unit must be shut down immediately. This is a safety hazard.',
        checked: false,
        conditionalOn: { itemId: '4-6', option: 'No' },
        isBlockingMessage: true
      },
      {
        id: '4-7',
        text: 'Is the rollout switch tripped?',
        checked: false,
        options: ['No', 'Yes', 'Not checked'],
        selectedOptions: [],
        conditionalOn: { itemId: 'heatingSystemType', option: 'Gas (natural or propane)' }
      },
      {
        id: '4-7-blocking',
        text: 'Rollout switch indicates flame rollout - check for blocked flue, cracked heat exchanger, or improper combustion.',
        checked: false,
        conditionalOn: { itemId: '4-7', option: 'Yes' },
        isBlockingMessage: true
      },
      {
        id: '4-8',
        text: 'Is the limit switch open?',
        checked: false,
        options: ['No', 'Yes', 'Not checked'],
        selectedOptions: [],
        conditionalOn: { itemId: 'heatingSystemType', option: 'Gas (natural or propane)' }
      },
      {
        id: '4-8-blocking',
        text: 'Limit switch open indicates overheating - check for restricted airflow, dirty filters, or blocked vents.',
        checked: false,
        conditionalOn: { itemId: '4-8', option: 'Yes' },
        isBlockingMessage: true
      }
    ]
  },
  {
    id: '5',
    title: 'Electric Heat Diagnostics',
    items: [
      {
        id: '5-1',
        text: 'Is the electric heat contactor energized?',
        checked: false,
        options: ['Yes', 'No', 'Not checked'],
        selectedOptions: [],
        conditionalOn: { itemId: 'heatingSystemType', option: 'Electric heat strips' }
      },
      {
        id: '5-2',
        text: 'Are the heat strips receiving voltage?',
        checked: false,
        options: ['Yes', 'No', 'Not checked'],
        selectedOptions: [],
        conditionalOn: { itemId: 'heatingSystemType', option: 'Electric heat strips' }
      },
      {
        id: '5-3',
        text: 'Are there any open fuses or breakers for the heat circuit?',
        checked: false,
        options: ['No', 'Yes', 'Not checked'],
        selectedOptions: [],
        conditionalOn: { itemId: 'heatingSystemType', option: 'Electric heat strips' }
      },
      {
        id: '5-4',
        text: 'Is the sequencer/relay operating?',
        checked: false,
        options: ['Yes', 'No', 'Not checked'],
        selectedOptions: [],
        conditionalOn: { itemId: 'heatingSystemType', option: 'Electric heat strips' }
      },
      {
        id: '5-5',
        text: 'Are the heat strips visually intact? (No broken elements)',
        checked: false,
        options: ['Yes', 'No', 'Not checked'],
        selectedOptions: [],
        conditionalOn: { itemId: 'heatingSystemType', option: 'Electric heat strips' },
        images: []
      }
    ]
  },
  {
    id: '6',
    title: 'Heat Pump Diagnostics',
    items: [
      {
        id: '6-1',
        text: 'Is the reversing valve energized?',
        checked: false,
        options: ['Yes', 'No', 'Not checked'],
        selectedOptions: [],
        conditionalOn: { itemId: 'heatingSystemType', option: 'Heat pump' }
      },
      {
        id: '6-2',
        text: 'Is the outdoor unit running in heat mode?',
        checked: false,
        options: ['Yes', 'No', 'Not checked'],
        selectedOptions: [],
        conditionalOn: { itemId: 'heatingSystemType', option: 'Heat pump' }
      },
      {
        id: '6-3',
        text: 'Is there defrost occurring?',
        checked: false,
        options: ['No', 'Yes - normal', 'Yes - excessive'],
        selectedOptions: [],
        conditionalOn: { itemId: 'heatingSystemType', option: 'Heat pump' }
      },
      {
        id: '6-4',
        text: 'What is the outdoor ambient temperature?',
        checked: false,
        numericValue: '',
        unit: '°F',
        conditionalOn: { itemId: 'heatingSystemType', option: 'Heat pump' }
      },
      {
        id: '6-4-blocking',
        text: 'Heat pumps lose efficiency below ~35-40°F. Below this temperature, auxiliary heat should engage.',
        checked: false,
        conditionalOn: { itemId: 'heatingSystemType', option: 'Heat pump' },
        isInfoMessage: true
      }
    ]
  },
  {
    id: '7',
    title: 'Wrap up',
    items: [
      { id: '7-1', text: 'Restore power and disconnects', checked: false },
      { id: '7-2', text: 'Verify unit is operating correctly', checked: false },
      { id: '7-3', text: 'Reinstall panels/guards and clean workspace', checked: false },
      { id: '7-4', text: 'Confirm unit is heating to setpoint', checked: false }
    ]
  }
];

/**
 * RTU: Poor Airflow
 * Issue ID: 'poor-airflow'
 */
export const poorAirflow: ChecklistItem[] = [
  {
    id: '1',
    title: 'Initial Assessment',
    items: [
      {
        id: '1-1',
        text: 'Where is the poor airflow noticed?',
        checked: false,
        options: ['All supply vents', 'Some supply vents', 'Return air', 'Not sure'],
        selectedOptions: []
      },
      {
        id: '1-2',
        text: 'Is the unit running?',
        checked: false,
        options: ['Yes', 'No', 'Intermittent'],
        selectedOptions: []
      },
      {
        id: '1-3',
        text: 'Is the supply fan running?',
        checked: false,
        options: ['Yes', 'No', 'Intermittent', 'Not sure'],
        selectedOptions: []
      }
    ]
  },
  {
    id: '2',
    title: 'Filters',
    items: [
      {
        id: '2-1',
        text: 'Filter condition',
        checked: false,
        options: ['Clean', 'Moderately dirty', 'Clogged', 'Missing'],
        selectedOptions: [],
        images: []
      },
      {
        id: '2-2',
        text: 'Were filters replaced/cleaned?',
        checked: false,
        options: ['Yes', 'No', 'N/A'],
        selectedOptions: []
      }
    ]
  },
  {
    id: '3',
    title: 'Supply Fan / Blower',
    items: [
      {
        id: '3-1',
        text: 'Is the supply fan motor running?',
        checked: false,
        options: ['Yes', 'No', 'Intermittent'],
        selectedOptions: []
      },
      {
        id: '3-2',
        text: 'Belt condition (if belt-driven)',
        checked: false,
        options: ['Intact', 'Frayed', 'Loose', 'Broken', 'N/A (direct drive)'],
        selectedOptions: []
      },
      {
        id: '3-3',
        text: 'Belt tension (if belt-driven)',
        checked: false,
        options: ['Proper', 'Loose', 'Too tight', 'N/A (direct drive)'],
        selectedOptions: []
      },
      {
        id: '3-4',
        text: 'Pulley alignment and set screws (if belt-driven)',
        checked: false,
        options: ['Proper', 'Loose set screws', 'Misaligned', 'N/A (direct drive)'],
        selectedOptions: []
      },
      {
        id: '3-5',
        text: 'Blower wheel condition',
        checked: false,
        options: ['Clean', 'Moderately dirty', 'Dust-matted / very dirty'],
        selectedOptions: [],
        images: []
      },
      {
        id: '3-6',
        text: 'Blower motor nameplate amps (optional)',
        checked: false,
        numericValue: '',
        unit: 'A'
      },
      {
        id: '3-7',
        text: 'Blower motor measured amps (optional)',
        checked: false,
        numericValue: '',
        unit: 'A'
      },
      {
        id: '3-8',
        text: 'Is the blower wheel spinning freely?',
        checked: false,
        options: ['Yes', 'No - binding', 'No - seized'],
        selectedOptions: []
      }
    ]
  },
  {
    id: '4',
    title: 'Evaporator Coil',
    items: [
      {
        id: '4-1',
        text: 'Evaporator coil condition',
        checked: false,
        options: ['Clean', 'Dirty', 'Light frost', 'Heavily iced', 'Plugged'],
        selectedOptions: [],
        images: []
      },
      {
        id: '4-2',
        text: 'Was coil cleaned during this visit?',
        checked: false,
        options: ['Yes', 'No'],
        selectedOptions: []
      }
    ]
  },
  {
    id: '5',
    title: 'Static Pressure',
    items: [
      {
        id: '5-1',
        text: 'Return static pressure (in wc)',
        checked: false,
        numericValue: '',
        unit: 'in wc'
      },
      {
        id: '5-2',
        text: 'Supply static pressure (in wc)',
        checked: false,
        numericValue: '',
        unit: 'in wc'
      },
      {
        id: '5-3',
        text: 'Note: Flag high static if total > ~1.0 in wc for most light-commercial RTUs',
        checked: false,
        isInfoMessage: true
      }
    ]
  },
  {
    id: '6',
    title: 'Ductwork / Vents',
    items: [
      {
        id: '6-1',
        text: 'Are supply vents open and unobstructed?',
        checked: false,
        options: ['Yes', 'No - some closed', 'No - obstructed'],
        selectedOptions: []
      },
      {
        id: '6-2',
        text: 'Are return grilles clear?',
        checked: false,
        options: ['Yes', 'No - blocked'],
        selectedOptions: []
      },
      {
        id: '6-3',
        text: 'Any visible ductwork damage or disconnections?',
        checked: false,
        options: ['No', 'Yes', 'Not visible'],
        selectedOptions: [],
        images: []
      },
      {
        id: '6-4',
        text: 'Are zone dampers (if present) in correct position?',
        checked: false,
        options: ['Yes', 'No - stuck closed', 'No - stuck open', 'N/A - no zone dampers'],
        selectedOptions: []
      }
    ]
  },
  {
    id: '7',
    title: 'Outcome',
    items: [
      {
        id: '7-1',
        text: 'After fixes, is supply airflow now strong at vents?',
        checked: false,
        options: ['Yes', 'No', 'Partially improved'],
        selectedOptions: []
      },
      {
        id: '7-2',
        text: 'Do you believe you\'ve found the primary cause?',
        checked: false,
        options: ['Yes', 'No'],
        selectedOptions: []
      }
    ]
  },
  {
    id: '8',
    title: 'Wrap up',
    items: [
      { id: '8-1', text: 'Restore power and disconnects', checked: false },
      { id: '8-2', text: 'Verify unit is operating correctly', checked: false },
      { id: '8-3', text: 'Reinstall panels/guards and clean workspace', checked: false }
    ]
  }
];

/**
 * RTU: Unit Not Running
 * Issue ID: 'unit-not-running'
 */
export const unitNotRunning: ChecklistItem[] = [
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
        text: 'Is the thermostat display working?',
        checked: false,
        options: ['Yes', 'No - blank', 'No - error message'],
        selectedOptions: []
      },
      {
        id: '1-2-blocking',
        text: 'If battery-powered, replace batteries and recheck.',
        checked: false,
        conditionalOn: { itemId: '1-1', option: 'Digital (battery-powered)' },
        isBlockingMessage: true
      },
      {
        id: '1-3',
        text: 'Is tstat receiving power? Check for 24V between R-C.',
        checked: false,
        options: ['Yes', 'No'],
        selectedOptions: []
      },
      {
        id: '1-4',
        text: 'What mode is the thermostat set to?',
        checked: false,
        options: ['Cool', 'Heat', 'Auto', 'Off', 'Emergency Heat'],
        selectedOptions: []
      },
      {
        id: '1-4-blocking',
        text: 'Set thermostat to appropriate mode (Cool or Heat) and recheck.',
        checked: false,
        conditionalOn: { itemId: '1-4', option: 'Off' },
        isBlockingMessage: true
      },
      {
        id: '1-5',
        text: 'Is there a call for cooling/heating? (Check if setpoint is above/below space temp)',
        checked: false,
        options: ['Yes', 'No'],
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
        text: 'Turn on & recheck',
        checked: false,
        conditionalOn: { itemId: '2-1', option: 'No' },
        isBlockingMessage: true
      },
      {
        id: '2-2',
        text: 'Is line power present on primary side of transformer (typically 208-240V)?',
        checked: false,
        options: ['Yes', 'No', 'Not checked'],
        selectedOptions: []
      },
      {
        id: '2-2-blocking',
        text: 'This is an upstream breaker / disconnect / fuse problem.',
        checked: false,
        conditionalOn: { itemId: '2-2', option: 'No' },
        isBlockingMessage: true
      },
      {
        id: '2-3',
        text: 'Is control transformer putting out 24 V?',
        checked: false,
        options: ['Yes', 'No', 'Not checked'],
        selectedOptions: []
      },
      {
        id: '2-3-blocking',
        text: 'This is either a blown transformer, or inline fuse open.',
        checked: false,
        conditionalOn: { itemId: '2-3', option: 'No' },
        isBlockingMessage: true
      },
      {
        id: '2-4',
        text: 'Are all fuses on the control board and/or transformers intact?',
        checked: false,
        options: ['Yes', 'No', 'N/A'],
        selectedOptions: []
      },
      {
        id: '2-4-blocking',
        text: 'Please correct for blown fuses.',
        checked: false,
        conditionalOn: { itemId: '2-4', option: 'No' },
        isBlockingMessage: true
      },
      {
        id: '2-5',
        text: 'Are there any LED fault codes on the control board?',
        checked: false,
        options: ['No', 'Solid LED', 'Flashing LED'],
        selectedOptions: []
      },
      {
        id: '2-5-blocking',
        text: 'A flashing LED may indicate that safety is open or circuit is locked out. Please reference unit manual to confirm.',
        checked: false,
        conditionalOn: { itemId: '2-5', option: 'Flashing LED' },
        isBlockingMessage: true
      }
    ]
  },
  {
    id: '3',
    title: 'Control Circuit',
    items: [
      {
        id: '3-1',
        text: 'Is 24V present at the contactor coil?',
        checked: false,
        options: ['Yes', 'No', 'Not checked'],
        selectedOptions: []
      },
      {
        id: '3-1-blocking',
        text: 'This control circuit is open somewhere upstream (safety switch, pressure switch, freezestat, limit, or board).',
        checked: false,
        conditionalOn: { itemId: '3-1', option: 'No' },
        isBlockingMessage: true
      },
      {
        id: '3-2',
        text: 'Check high-pressure switch',
        checked: false,
        options: ['Closed (normal)', 'Open (tripped)', 'Not checked'],
        selectedOptions: []
      },
      {
        id: '3-3',
        text: 'Check low-pressure switch',
        checked: false,
        options: ['Closed (normal)', 'Open (tripped)', 'Not checked'],
        selectedOptions: []
      },
      {
        id: '3-4',
        text: 'Check freeze stat (if present)',
        checked: false,
        options: ['Closed (normal)', 'Open (tripped)', 'Not present', 'Not checked'],
        selectedOptions: []
      },
      {
        id: '3-5',
        text: 'Check limit switches',
        checked: false,
        options: ['All closed (normal)', 'One or more open', 'Not checked'],
        selectedOptions: []
      },
      {
        id: '3-6',
        text: 'Check door/access panel safety switches',
        checked: false,
        options: ['All closed (normal)', 'One or more open', 'Not present', 'Not checked'],
        selectedOptions: []
      }
    ]
  },
  {
    id: '4',
    title: 'Communication / BAS',
    items: [
      {
        id: '4-1',
        text: 'Is unit connected to a Building Automation System (BAS)?',
        checked: false,
        options: ['No', 'Yes', 'Not sure'],
        selectedOptions: []
      },
      {
        id: '4-2',
        text: 'Is there a lockout or override from BAS?',
        checked: false,
        options: ['No', 'Yes', 'Not checked'],
        selectedOptions: [],
        conditionalOn: { itemId: '4-1', option: 'Yes' }
      },
      {
        id: '4-3',
        text: 'Is the communication link active?',
        checked: false,
        options: ['Yes', 'No', 'Not checked'],
        selectedOptions: [],
        conditionalOn: { itemId: '4-1', option: 'Yes' }
      }
    ]
  },
  {
    id: '5',
    title: 'Wrap up',
    items: [
      { id: '5-1', text: 'Restore power and disconnects', checked: false },
      { id: '5-2', text: 'Verify unit is operating correctly', checked: false },
      { id: '5-3', text: 'Reinstall panels/guards and clean workspace', checked: false }
    ]
  }
];

/**
 * RTU: Water Leaking From Unit
 * Issue ID: 'unit-leaking'
 */
export const unitLeaking: ChecklistItem[] = [
  {
    id: '1',
    title: 'Initial Assessment',
    items: [
      {
        id: '1-1',
        text: 'Where is the water leaking from?',
        checked: false,
        options: ['Ceiling below unit', 'Unit cabinet', 'Drain pan overflow', 'Condensate drain line', 'Not sure'],
        selectedOptions: [],
        images: []
      },
      {
        id: '1-2',
        text: 'How much water?',
        checked: false,
        options: ['Dripping', 'Steady stream', 'Pooling on roof', 'Flooding'],
        selectedOptions: []
      },
      {
        id: '1-3',
        text: 'Is the unit running?',
        checked: false,
        options: ['Yes', 'No'],
        selectedOptions: []
      }
    ]
  },
  {
    id: '2',
    title: 'Drain Pan',
    items: [
      {
        id: '2-1',
        text: 'Drain pan condition',
        checked: false,
        options: ['Dry', 'Some water (normal)', 'Overflowing', 'Cracked/damaged'],
        selectedOptions: [],
        images: []
      },
      {
        id: '2-2',
        text: 'Is the drain pan level?',
        checked: false,
        options: ['Yes', 'No - tilted', 'Not checked'],
        selectedOptions: []
      },
      {
        id: '2-3',
        text: 'Is the drain pan properly positioned under the coil?',
        checked: false,
        options: ['Yes', 'No', 'Not checked'],
        selectedOptions: []
      }
    ]
  },
  {
    id: '3',
    title: 'Condensate Drain',
    items: [
      {
        id: '3-1',
        text: 'Primary drain line condition',
        checked: false,
        options: ['Clear', 'Partially clogged', 'Completely blocked', 'Disconnected'],
        selectedOptions: [],
        images: []
      },
      {
        id: '3-2',
        text: 'Is there a secondary/overflow drain?',
        checked: false,
        options: ['Yes', 'No', 'Not sure'],
        selectedOptions: []
      },
      {
        id: '3-3',
        text: 'Secondary drain condition (if present)',
        checked: false,
        options: ['Clear', 'Clogged', 'Not checked'],
        selectedOptions: [],
        conditionalOn: { itemId: '3-2', option: 'Yes' }
      },
      {
        id: '3-4',
        text: 'Was drain line cleared during this visit?',
        checked: false,
        options: ['Yes', 'No'],
        selectedOptions: []
      },
      {
        id: '3-5',
        text: 'Is the drain line properly sloped?',
        checked: false,
        options: ['Yes', 'No', 'Not checked'],
        selectedOptions: []
      },
      {
        id: '3-6',
        text: 'Is there a P-trap?',
        checked: false,
        options: ['Yes', 'No', 'Not sure'],
        selectedOptions: []
      },
      {
        id: '3-7',
        text: 'Is the P-trap filled with water?',
        checked: false,
        options: ['Yes', 'No', 'N/A - no trap'],
        selectedOptions: [],
        conditionalOn: { itemId: '3-6', option: 'Yes' }
      }
    ]
  },
  {
    id: '4',
    title: 'Evaporator Coil',
    items: [
      {
        id: '4-1',
        text: 'Evaporator coil condition',
        checked: false,
        options: ['Clean', 'Dirty', 'Light frost', 'Heavily iced'],
        selectedOptions: [],
        images: []
      },
      {
        id: '4-2',
        text: 'Is ice melting and causing overflow?',
        checked: false,
        options: ['No', 'Yes', 'Not sure'],
        selectedOptions: []
      },
      {
        id: '4-3',
        text: 'Is condensate forming normally?',
        checked: false,
        options: ['Yes', 'No - excessive', 'No - none forming'],
        selectedOptions: []
      }
    ]
  },
  {
    id: '5',
    title: 'Unit Cabinet',
    items: [
      {
        id: '5-1',
        text: 'Any visible cracks or holes in cabinet?',
        checked: false,
        options: ['No', 'Yes', 'Not visible'],
        selectedOptions: [],
        images: []
      },
      {
        id: '5-2',
        text: 'Is the unit level?',
        checked: false,
        options: ['Yes', 'No', 'Not checked'],
        selectedOptions: []
      },
      {
        id: '5-3',
        text: 'Are access panels properly sealed?',
        checked: false,
        options: ['Yes', 'No', 'Not checked'],
        selectedOptions: []
      },
      {
        id: '5-4',
        text: 'Any water entering from roof/weather?',
        checked: false,
        options: ['No', 'Yes', 'Not sure'],
        selectedOptions: []
      }
    ]
  },
  {
    id: '6',
    title: 'Outcome',
    items: [
      {
        id: '6-1',
        text: 'After fixes, is the leak stopped?',
        checked: false,
        options: ['Yes', 'No', 'Reduced'],
        selectedOptions: []
      },
      {
        id: '6-2',
        text: 'Do you believe you\'ve found the primary cause?',
        checked: false,
        options: ['Yes', 'No'],
        selectedOptions: []
      }
    ]
  },
  {
    id: '7',
    title: 'Wrap up',
    items: [
      { id: '7-1', text: 'Restore power and disconnects', checked: false },
      { id: '7-2', text: 'Verify unit is operating correctly', checked: false },
      { id: '7-3', text: 'Reinstall panels/guards and clean workspace', checked: false },
      { id: '7-4', text: 'Confirm leak is resolved', checked: false }
    ]
  }
];

/**
 * RTU: Short Cycling / Noisy Operation
 * Issue ID: 'short-cycling'
 */
export const shortCycling: ChecklistItem[] = [
  {
    id: '1',
    title: 'Initial Assessment',
    items: [
      {
        id: '1-1',
        text: 'What is the primary complaint?',
        checked: false,
        options: ['Short cycling (on/off rapidly)', 'Noisy operation', 'Both'],
        selectedOptions: []
      },
      {
        id: '1-2',
        text: 'How often does the unit cycle?',
        checked: false,
        options: ['Every few minutes', 'Every 10-15 minutes', 'Every 30+ minutes', 'Not sure'],
        selectedOptions: []
      },
      {
        id: '1-3',
        text: 'What type of noise?',
        checked: false,
        options: ['Fan noise', 'Compressor noise', 'Vibration/rattling', 'Grinding', 'Other', 'N/A - no noise'],
        selectedOptions: [],
        notes: ''
      }
    ]
  },
  {
    id: '2',
    title: 'Thermostat / Controls',
    items: [
      {
        id: '2-1',
        text: 'What is the temperature differential (deadband) setting?',
        checked: false,
        options: ['1-2°F (too narrow)', '3-5°F (normal)', '6+°F (wide)', 'Not adjustable / not sure'],
        selectedOptions: []
      },
      {
        id: '2-2',
        text: 'Is the thermostat location appropriate? (Not in direct sun, supply air, or near heat sources)',
        checked: false,
        options: ['Yes', 'No', 'Not sure'],
        selectedOptions: []
      },
      {
        id: '2-3',
        text: 'Is the thermostat calibrated correctly?',
        checked: false,
        options: ['Yes', 'No - off by 2+°F', 'Not checked'],
        selectedOptions: []
      },
      {
        id: '2-4',
        text: 'Are there multiple thermostats calling for different modes?',
        checked: false,
        options: ['No', 'Yes', 'N/A - single zone'],
        selectedOptions: []
      }
    ]
  },
  {
    id: '3',
    title: 'Pressure Switches / Safeties',
    items: [
      {
        id: '3-1',
        text: 'Is the high-pressure switch tripping?',
        checked: false,
        options: ['No', 'Yes', 'Not checked'],
        selectedOptions: []
      },
      {
        id: '3-2',
        text: 'Is the low-pressure switch tripping?',
        checked: false,
        options: ['No', 'Yes', 'Not checked'],
        selectedOptions: []
      },
      {
        id: '3-3',
        text: 'Record suction pressure (if available)',
        checked: false,
        numericValue: '',
        unit: 'PSIG'
      },
      {
        id: '3-4',
        text: 'Record discharge pressure (if available)',
        checked: false,
        numericValue: '',
        unit: 'PSIG'
      },
      {
        id: '3-5',
        text: 'Is the freeze stat tripping?',
        checked: false,
        options: ['No', 'Yes', 'Not present', 'Not checked'],
        selectedOptions: []
      },
      {
        id: '3-6',
        text: 'Are limit switches tripping?',
        checked: false,
        options: ['No', 'Yes', 'Not checked'],
        selectedOptions: []
      }
    ]
  },
  {
    id: '4',
    title: 'Condenser / Outdoor Unit',
    items: [
      {
        id: '4-1',
        text: 'Are all condenser fans running?',
        checked: false,
        options: ['Yes', 'No - one or more not running', 'Intermittent'],
        selectedOptions: []
      },
      {
        id: '4-2',
        text: 'Condenser coil condition',
        checked: false,
        options: ['Clean', 'Moderately dirty', 'Very dirty / restricted'],
        selectedOptions: [],
        images: []
      },
      {
        id: '4-3',
        text: 'Is there adequate clearance around the condenser?',
        checked: false,
        options: ['Yes', 'No - blocked', 'Not checked'],
        selectedOptions: []
      },
      {
        id: '4-4',
        text: 'Any unusual condenser fan noise?',
        checked: false,
        options: ['No', 'Yes', 'N/A - not noisy'],
        selectedOptions: []
      }
    ]
  },
  {
    id: '5',
    title: 'Compressor',
    items: [
      {
        id: '5-1',
        text: 'Compressor operation',
        checked: false,
        options: ['Running normally', 'Short-cycling', 'Not starting', 'Buzzing'],
        selectedOptions: []
      },
      {
        id: '5-2',
        text: 'Is the compressor extremely hot?',
        checked: false,
        options: ['No', 'Yes', 'Not checked'],
        selectedOptions: []
      },
      {
        id: '5-3',
        text: 'Any unusual compressor noise?',
        checked: false,
        options: ['No', 'Yes', 'N/A - not noisy'],
        selectedOptions: []
      },
      {
        id: '5-4',
        text: 'Is the contactor pitted/burned?',
        checked: false,
        options: ['No', 'Yes', 'Not checked'],
        selectedOptions: []
      },
      {
        id: '5-5',
        text: 'Capacitor condition',
        checked: false,
        options: ['Normal', 'Bulged', 'Leaking', 'Not checked'],
        selectedOptions: []
      }
    ]
  },
  {
    id: '6',
    title: 'Airflow',
    items: [
      {
        id: '6-1',
        text: 'Are filters clean?',
        checked: false,
        options: ['Clean', 'Moderately dirty', 'Clogged'],
        selectedOptions: []
      },
      {
        id: '6-2',
        text: 'Evaporator coil condition',
        checked: false,
        options: ['Clean', 'Dirty', 'Light frost', 'Heavily iced'],
        selectedOptions: [],
        images: []
      },
      {
        id: '6-3',
        text: 'Is supply fan running?',
        checked: false,
        options: ['Yes', 'No', 'Intermittent'],
        selectedOptions: []
      },
      {
        id: '6-4',
        text: 'Supply airflow strength',
        checked: false,
        options: ['Strong', 'Weak', 'None'],
        selectedOptions: []
      }
    ]
  },
  {
    id: '7',
    title: 'Outcome',
    items: [
      {
        id: '7-1',
        text: 'After fixes, is cycling normal?',
        checked: false,
        options: ['Yes', 'No', 'Improved'],
        selectedOptions: []
      },
      {
        id: '7-2',
        text: 'After fixes, is noise reduced?',
        checked: false,
        options: ['Yes', 'No', 'Improved', 'N/A - no noise issue'],
        selectedOptions: []
      },
      {
        id: '7-3',
        text: 'Do you believe you\'ve found the primary cause?',
        checked: false,
        options: ['Yes', 'No'],
        selectedOptions: []
      }
    ]
  },
  {
    id: '8',
    title: 'Wrap up',
    items: [
      { id: '8-1', text: 'Restore power and disconnects', checked: false },
      { id: '8-2', text: 'Verify unit is operating correctly', checked: false },
      { id: '8-3', text: 'Reinstall panels/guards and clean workspace', checked: false }
    ]
  }
];

/**
 * RTU: Zoning Issues
 * Issue ID: 'zoning-issues'
 */
export const zoningIssues: ChecklistItem[] = [
  {
    id: '1',
    title: 'Initial Assessment',
    items: [
      {
        id: '1-1',
        text: 'What is the zoning complaint?',
        checked: false,
        options: ['Some zones too hot', 'Some zones too cold', 'Uneven temperatures', 'Zones not responding', 'Other'],
        selectedOptions: []
      },
      {
        id: '1-2',
        text: 'How many zones?',
        checked: false,
        options: ['2 zones', '3-4 zones', '5+ zones', 'Not sure'],
        selectedOptions: []
      },
      {
        id: '1-3',
        text: 'Which zones are having issues?',
        checked: false,
        notes: ''
      }
    ]
  },
  {
    id: '2',
    title: 'Zone Thermostats',
    items: [
      {
        id: '2-1',
        text: 'Are all zone thermostats working?',
        checked: false,
        options: ['Yes', 'No - one or more blank/error', 'Not sure'],
        selectedOptions: []
      },
      {
        id: '2-2',
        text: 'Are zone setpoints reasonable?',
        checked: false,
        options: ['Yes', 'No - conflicting setpoints', 'Not checked'],
        selectedOptions: []
      },
      {
        id: '2-3',
        text: 'What are the zone setpoints?',
        checked: false,
        notes: ''
      },
      {
        id: '2-4',
        text: 'What are the zone temperatures?',
        checked: false,
        notes: ''
      },
      {
        id: '2-5',
        text: 'Are thermostats properly calibrated?',
        checked: false,
        options: ['Yes', 'No - off by 2+°F', 'Not checked'],
        selectedOptions: []
      }
    ]
  },
  {
    id: '3',
    title: 'Zone Dampers',
    items: [
      {
        id: '3-1',
        text: 'Are zone dampers responding to thermostat calls?',
        checked: false,
        options: ['Yes', 'No - some not responding', 'Not sure'],
        selectedOptions: []
      },
      {
        id: '3-2',
        text: 'Are any dampers stuck closed?',
        checked: false,
        options: ['No', 'Yes', 'Not checked'],
        selectedOptions: []
      },
      {
        id: '3-3',
        text: 'Are any dampers stuck open?',
        checked: false,
        options: ['No', 'Yes', 'Not checked'],
        selectedOptions: []
      },
      {
        id: '3-4',
        text: 'Are damper actuators working?',
        checked: false,
        options: ['Yes', 'No - one or more failed', 'Not checked'],
        selectedOptions: []
      },
      {
        id: '3-5',
        text: 'Are damper linkages intact?',
        checked: false,
        options: ['Yes', 'No - broken/disconnected', 'Not checked'],
        selectedOptions: []
      }
    ]
  },
  {
    id: '4',
    title: 'Zone Control Panel',
    items: [
      {
        id: '4-1',
        text: 'Is the zone control panel receiving power?',
        checked: false,
        options: ['Yes', 'No', 'Not checked'],
        selectedOptions: []
      },
      {
        id: '4-2',
        text: 'Are there any error codes on the zone control panel?',
        checked: false,
        options: ['No', 'Yes', 'Not checked'],
        selectedOptions: []
      },
      {
        id: '4-3',
        text: 'Is communication between panel and thermostats working?',
        checked: false,
        options: ['Yes', 'No', 'Not checked'],
        selectedOptions: []
      }
    ]
  },
  {
    id: '5',
    title: 'RTU Operation',
    items: [
      {
        id: '5-1',
        text: 'Is the RTU running?',
        checked: false,
        options: ['Yes', 'No'],
        selectedOptions: []
      },
      {
        id: '5-2',
        text: 'Is the RTU responding to zone calls?',
        checked: false,
        options: ['Yes', 'No', 'Not sure'],
        selectedOptions: []
      },
      {
        id: '5-3',
        text: 'What mode is the RTU in?',
        checked: false,
        options: ['Cool', 'Heat', 'Auto', 'Off'],
        selectedOptions: []
      },
      {
        id: '5-4',
        text: 'Is supply airflow adequate?',
        checked: false,
        options: ['Yes', 'No - weak', 'Not checked'],
        selectedOptions: []
      }
    ]
  },
  {
    id: '6',
    title: 'Ductwork',
    items: [
      {
        id: '6-1',
        text: 'Are supply ducts to problem zones intact?',
        checked: false,
        options: ['Yes', 'No - damaged/disconnected', 'Not visible'],
        selectedOptions: []
      },
      {
        id: '6-2',
        text: 'Are return ducts intact?',
        checked: false,
        options: ['Yes', 'No - damaged/disconnected', 'Not visible'],
        selectedOptions: []
      },
      {
        id: '6-3',
        text: 'Are supply vents open in problem zones?',
        checked: false,
        options: ['Yes', 'No - some closed', 'Not checked'],
        selectedOptions: []
      },
      {
        id: '6-4',
        text: 'Are return grilles clear?',
        checked: false,
        options: ['Yes', 'No - blocked', 'Not checked'],
        selectedOptions: []
      }
    ]
  },
  {
    id: '7',
    title: 'Outcome',
    items: [
      {
        id: '7-1',
        text: 'After fixes, are zone temperatures more even?',
        checked: false,
        options: ['Yes', 'No', 'Improved'],
        selectedOptions: []
      },
      {
        id: '7-2',
        text: 'Do you believe you\'ve found the primary cause?',
        checked: false,
        options: ['Yes', 'No'],
        selectedOptions: []
      }
    ]
  },
  {
    id: '8',
    title: 'Wrap up',
    items: [
      { id: '8-1', text: 'Restore power and disconnects', checked: false },
      { id: '8-2', text: 'Verify unit is operating correctly', checked: false },
      { id: '8-3', text: 'Reinstall panels/guards and clean workspace', checked: false }
    ]
  }
];


