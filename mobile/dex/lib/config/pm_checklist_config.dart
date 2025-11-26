class PMChecklistItem {
  final String id;
  final String text;
  bool checked;
  String? status; // 'red', 'yellow', 'green', 'na', or null
  String? notes;
  List<String> images; // base64 image strings

  PMChecklistItem({
    required this.id,
    required this.text,
    this.checked = false,
    this.status,
    this.notes,
    this.images = const [],
  });

  Map<String, dynamic> toJson() => {
        'id': id,
        'text': text,
        'checked': checked,
        'status': status,
        'notes': notes,
        'images': images,
      };

  factory PMChecklistItem.fromJson(Map<String, dynamic> json) => PMChecklistItem(
        id: json['id'],
        text: json['text'],
        checked: json['checked'] ?? false,
        status: json['status'],
        notes: json['notes'],
        images: List<String>.from(json['images'] ?? []),
      );
}

class PMChecklistSection {
  final String id;
  final String title;
  List<PMChecklistItem> items;

  PMChecklistSection({
    required this.id,
    required this.title,
    required this.items,
  });

  Map<String, dynamic> toJson() => {
        'id': id,
        'title': title,
        'items': items.map((item) => item.toJson()).toList(),
      };

  factory PMChecklistSection.fromJson(Map<String, dynamic> json) => PMChecklistSection(
        id: json['id'],
        title: json['title'],
        items: (json['items'] as List<dynamic>?)
                ?.map((item) => PMChecklistItem.fromJson(item))
                .toList() ??
            [],
      );
}

class PMChecklist {
  final String unitType;
  final String unitName;
  List<PMChecklistSection> sections;

  PMChecklist({
    required this.unitType,
    required this.unitName,
    required this.sections,
  });

  Map<String, dynamic> toJson() => {
        'unitType': unitType,
        'unitName': unitName,
        'sections': sections.map((section) => section.toJson()).toList(),
      };

  factory PMChecklist.fromJson(Map<String, dynamic> json) => PMChecklist(
        unitType: json['unitType'],
        unitName: json['unitName'],
        sections: (json['sections'] as List<dynamic>)
            .map((section) => PMChecklistSection.fromJson(section))
            .toList(),
      );
}

// Helper function to parse unit ID
Map<String, dynamic> parseUnitId(String unitId) {
  final parts = unitId.split('-');
  return {
    'type': parts[0],
    'number': parts.length > 1 ? int.tryParse(parts[1]) ?? 1 : 1,
  };
}

String parseUnitName(String unitId) {
  final parsed = parseUnitId(unitId);
  final type = parsed['type'] as String;
  final number = parsed['number'] as int;
  
  const typeNames = {
    'rtu': 'RTU',
    'splitUnit': 'Split Unit',
    'reachIn': 'Reach-in',
    'walkIn': 'Walk-in',
    'iceMachine': 'Ice Machine',
  };
  
  return '${typeNames[type] ?? type} $number';
}

String parseUnitType(String unitId) {
  return parseUnitId(unitId)['type'] as String;
}

// Get default checklist based on unit type
PMChecklist getDefaultChecklist(String unitId) {
  final unitName = parseUnitName(unitId);
  final unitType = parseUnitType(unitId);

  final checklists = {
    'rtu': getRTUChecklist(),
    'splitUnit': getSplitUnitChecklist(),
    'reachIn': getReachInChecklist(),
    'walkIn': getWalkInChecklist(),
    'iceMachine': getIceMachineChecklist(),
  };

  return PMChecklist(
    unitType: unitType,
    unitName: unitName,
    sections: checklists[unitType] ?? getRTUChecklist(),
  );
}

List<PMChecklistSection> getRTUChecklist() {
  return [
    PMChecklistSection(
      id: '1',
      title: 'Safety / Prep',
      items: [
        PMChecklistItem(id: '1-1', text: 'Disconnect power & lockout'),
        PMChecklistItem(id: '1-2', text: 'Inspect panels, wiring, and overall unit condition'),
        PMChecklistItem(id: '1-3', text: 'Clear debris around unit'),
      ],
    ),
    PMChecklistSection(
      id: '2',
      title: 'Airflow',
      items: [
        PMChecklistItem(id: '2-1', text: 'Replace/clean filters'),
        PMChecklistItem(id: '2-2', text: 'Inspect blower wheel, belts, and bearings'),
        PMChecklistItem(id: '2-3', text: 'Check damper & economizer operation'),
        PMChecklistItem(id: '2-4', text: 'Verify blower amps vs nameplate'),
      ],
    ),
    PMChecklistSection(
      id: '3',
      title: 'Gas Heat Section',
      items: [
        PMChecklistItem(id: '3-1', text: 'Inspect gas piping & connections for leaks'),
        PMChecklistItem(id: '3-2', text: 'Check burners, orifices, and heat exchanger'),
        PMChecklistItem(id: '3-3', text: 'Inspect ignitor & flame sensor (clean if needed)'),
        PMChecklistItem(id: '3-4', text: 'Verify inducer & pressure switch operation'),
        PMChecklistItem(id: '3-5', text: 'Check flame quality (steady blue)'),
        PMChecklistItem(id: '3-6', text: 'Record manifold gas pressure & temperature rise'),
        PMChecklistItem(id: '3-7', text: 'Verify limit & rollout switch operation'),
        PMChecklistItem(id: '3-8', text: 'Inspect flue/vent for corrosion or blockage'),
      ],
    ),
    PMChecklistSection(
      id: '4',
      title: 'Controls / Sensors',
      items: [
        PMChecklistItem(id: '4-1', text: 'Test thermostat or BAS heat call'),
        PMChecklistItem(id: '4-2', text: 'Verify staging & sequence of operation'),
        PMChecklistItem(id: '4-3', text: 'Check high/low pressure controls (as equipped)'),
        PMChecklistItem(id: '4-4', text: 'Verify safety controls cut out/reset properly'),
        PMChecklistItem(id: '4-5', text: 'Confirm supply/return sensors reading accurately'),
      ],
    ),
    PMChecklistSection(
      id: '5',
      title: 'Electrical',
      items: [
        PMChecklistItem(id: '5-1', text: 'Inspect contactors, wiring, and connections'),
        PMChecklistItem(id: '5-2', text: 'Check control voltage (24V)'),
        PMChecklistItem(id: '5-3', text: 'Verify crankcase heater operation (warm shell or 0.1–0.5A draw)'),
        PMChecklistItem(id: '5-4', text: 'Check motor capacitors (µF) & record'),
      ],
    ),
    PMChecklistSection(
      id: '6',
      title: 'Coils / Drain / Housekeeping',
      items: [
        PMChecklistItem(id: '6-1', text: 'Inspect condenser & evap coils; clean if needed'),
        PMChecklistItem(id: '6-2', text: 'Verify drain pan & line clear'),
        PMChecklistItem(id: '6-3', text: 'Confirm all panels secured'),
      ],
    ),
    PMChecklistSection(
      id: '7',
      title: 'Operational Test',
      items: [
        PMChecklistItem(id: '7-1', text: 'Restore power/gas and run full heating cycle'),
        PMChecklistItem(id: '7-2', text: 'Verify proper ignition, flame proving, fan operation'),
        PMChecklistItem(id: '7-3', text: 'Check for abnormal noise/vibration'),
      ],
    ),
    PMChecklistSection(
      id: '8',
      title: 'Notes & Recommended Repairs',
      items: [], // Empty - will be rendered with input fields
    ),
  ];
}

List<PMChecklistSection> getSplitUnitChecklist() {
  return [
    PMChecklistSection(
      id: '1',
      title: 'Safety / Prep',
      items: [
        PMChecklistItem(id: '1-1', text: 'Disconnect power & lockout'),
        PMChecklistItem(id: '1-2', text: 'Inspect outdoor and indoor unit condition'),
        PMChecklistItem(id: '1-3', text: 'Clear debris around units'),
      ],
    ),
    PMChecklistSection(
      id: '2',
      title: 'Airflow',
      items: [
        PMChecklistItem(id: '2-1', text: 'Replace/clean indoor unit filters'),
        PMChecklistItem(id: '2-2', text: 'Inspect evaporator coil for debris'),
        PMChecklistItem(id: '2-3', text: 'Verify indoor fan operation'),
      ],
    ),
    PMChecklistSection(
      id: '3',
      title: 'Refrigerant System',
      items: [
        PMChecklistItem(id: '3-1', text: 'Check refrigerant pressures'),
        PMChecklistItem(id: '3-2', text: 'Inspect refrigerant lines for leaks'),
        PMChecklistItem(id: '3-3', text: 'Verify superheat and subcooling'),
        PMChecklistItem(id: '3-4', text: 'Check compressor operation'),
      ],
    ),
  ];
}

List<PMChecklistSection> getReachInChecklist() {
  return [
    PMChecklistSection(
      id: '1',
      title: 'Safety / Prep',
      items: [
        PMChecklistItem(id: '1-1', text: 'Disconnect power & lockout'),
        PMChecklistItem(id: '1-2', text: 'Remove contents safely'),
        PMChecklistItem(id: '1-3', text: 'Inspect door seals'),
      ],
    ),
    PMChecklistSection(
      id: '2',
      title: 'Temperature Control',
      items: [
        PMChecklistItem(id: '2-1', text: 'Verify thermostat calibration'),
        PMChecklistItem(id: '2-2', text: 'Check temperature sensor accuracy'),
        PMChecklistItem(id: '2-3', text: 'Inspect defrost timer/heater'),
      ],
    ),
    PMChecklistSection(
      id: '3',
      title: 'Refrigeration',
      items: [
        PMChecklistItem(id: '3-1', text: 'Check evaporator coil condition'),
        PMChecklistItem(id: '3-2', text: 'Verify condenser coil is clean'),
        PMChecklistItem(id: '3-3', text: 'Inspect refrigerant levels'),
      ],
    ),
  ];
}

List<PMChecklistSection> getWalkInChecklist() {
  return [
    PMChecklistSection(
      id: '1',
      title: 'Safety / Prep',
      items: [
        PMChecklistItem(id: '1-1', text: 'Disconnect power & lockout'),
        PMChecklistItem(id: '1-2', text: 'Clear area around unit'),
        PMChecklistItem(id: '1-3', text: 'Inspect door seals and gaskets'),
      ],
    ),
    PMChecklistSection(
      id: '2',
      title: 'Evaporator',
      items: [
        PMChecklistItem(id: '2-1', text: 'Clean evaporator coils'),
        PMChecklistItem(id: '2-2', text: 'Check evaporator fan motors'),
        PMChecklistItem(id: '2-3', text: 'Inspect defrost system'),
      ],
    ),
    PMChecklistSection(
      id: '3',
      title: 'Condensing Unit',
      items: [
        PMChecklistItem(id: '3-1', text: 'Clean condenser coils'),
        PMChecklistItem(id: '3-2', text: 'Check compressor operation'),
        PMChecklistItem(id: '3-3', text: 'Verify refrigerant levels'),
      ],
    ),
  ];
}

List<PMChecklistSection> getIceMachineChecklist() {
  return [
    PMChecklistSection(
      id: '1',
      title: 'Safety / Prep',
      items: [
        PMChecklistItem(id: '1-1', text: 'Disconnect power & lockout'),
        PMChecklistItem(id: '1-2', text: 'Inspect overall unit condition'),
        PMChecklistItem(id: '1-3', text: 'Clear area around unit'),
      ],
    ),
    PMChecklistSection(
      id: '2',
      title: 'Water System',
      items: [
        PMChecklistItem(id: '2-1', text: 'Check water filter'),
        PMChecklistItem(id: '2-2', text: 'Inspect water lines for leaks'),
        PMChecklistItem(id: '2-3', text: 'Verify water pressure'),
      ],
    ),
    PMChecklistSection(
      id: '3',
      title: 'Refrigeration',
      items: [
        PMChecklistItem(id: '3-1', text: 'Clean evaporator plate'),
        PMChecklistItem(id: '3-2', text: 'Check condenser coils'),
        PMChecklistItem(id: '3-3', text: 'Verify refrigerant levels'),
      ],
    ),
  ];
}

