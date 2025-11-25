import 'package:flutter/material.dart';
import '../checklist/service_call_checklist_page.dart';
import '../../../config/checklist_config.dart';

class ServiceCallIssuesPage extends StatelessWidget {
  final String unitType;

  const ServiceCallIssuesPage({super.key, required this.unitType});

  List<_Issue> _getIssuesForUnitType(String unitType) {
    switch (unitType) {
      case 'rtu':
        return [
          _Issue(
            id: 'not-cooling',
            title: 'Not Cooling',
            description: 'Unit is not delivering cooling',
            icon: Icons.ac_unit,
          ),
          _Issue(
            id: 'not-heating',
            title: 'Not Heating',
            description: 'Unit is not delivering heat',
            icon: Icons.whatshot,
          ),
          _Issue(
            id: 'zoning-issues',
            title: 'Zoning Issues',
            description: 'Uneven temperatures or unexpected cooling/heating across zones',
            icon: Icons.map,
          ),
          _Issue(
            id: 'poor-airflow',
            title: 'Poor Airflow',
            description: 'Little or no airflow from supply vents',
            icon: Icons.air,
          ),
          _Issue(
            id: 'unit-not-running',
            title: 'Unit Not Running (incl. thermostat / comm error)',
            description: 'System will not start, thermostat is blank, or will not communicate',
            icon: Icons.power_off,
          ),
          _Issue(
            id: 'unit-leaking',
            title: 'Water Leaking From Unit',
            description: 'Water dripping from the roof or ceiling around the unit',
            icon: Icons.water_drop,
          ),
          _Issue(
            id: 'short-cycling',
            title: 'Short Cycling / Noisy Operation',
            description: 'Unit turns on/off rapidly or making unusual sounds during operation',
            icon: Icons.repeat,
          ),
          _Issue(
            id: 'something-else',
            title: 'Something Else',
            description: 'Other issue not listed',
            icon: Icons.help_outline,
          ),
        ];
      case 'walkIn':
      case 'walk-in':
        return [
          _Issue(
            id: 'running-warm',
            title: 'Running Warm',
            description: 'Temperature above set point',
            icon: Icons.thermostat,
          ),
          _Issue(
            id: 'unit-not-running-display',
            title: 'Not Running / Blank Display',
            description: 'System will not start or display is blank',
            icon: Icons.power_off,
          ),
          _Issue(
            id: 'ice-frost-build-up',
            title: 'Ice / Frost Build Up',
            description: 'Heavy ice or frost buildup on coils',
            icon: Icons.ac_unit,
          ),
          _Issue(
            id: 'water-leaking',
            title: 'Water Leaking',
            description: 'Water dripping or pooling',
            icon: Icons.water_drop,
          ),
          _Issue(
            id: 'running-constantly',
            title: 'Constant Run / Short Cycle',
            description: 'Unit runs continuously or turns on/off rapidly',
            icon: Icons.repeat,
          ),
          _Issue(
            id: 'noisy-operation',
            title: 'Noisy Operation / Vibrating',
            description: 'Unusual sounds or excessive vibration',
            icon: Icons.volume_up,
          ),
          _Issue(
            id: 'door-gasket-issue',
            title: 'Door or Gasket Issue',
            description: 'Poor door seal or gasket problems',
            icon: Icons.door_sliding,
          ),
          _Issue(
            id: 'other-alarm',
            title: 'Other / Alarm on Controller',
            description: 'Other issue or alarm displayed on controller',
            icon: Icons.warning,
          ),
        ];
      case 'split-unit':
      case 'splitUnit':
        return [
          _Issue(
            id: 'not-cooling',
            title: 'Not Cooling',
            description: 'Unit is not delivering cooling',
            icon: Icons.ac_unit,
          ),
          _Issue(
            id: 'not-heating',
            title: 'Not Heating',
            description: 'Unit is not delivering heat',
            icon: Icons.whatshot,
          ),
          _Issue(
            id: 'poor-airflow',
            title: 'Poor Airflow',
            description: 'Little or no airflow from supply vents',
            icon: Icons.air,
          ),
          _Issue(
            id: 'unit-not-running',
            title: 'Unit Not Running (incl. thermostat / comm error)',
            description: 'System will not start, thermostat is blank, or will not communicate',
            icon: Icons.power_off,
          ),
          _Issue(
            id: 'unit-leaking',
            title: 'Water Leaking From Unit',
            description: 'Water dripping from the roof or ceiling around the unit',
            icon: Icons.water_drop,
          ),
          _Issue(
            id: 'short-cycling',
            title: 'Short Cycling / Noisy Operation',
            description: 'Unit turns on/off rapidly or making unusual sounds during operation',
            icon: Icons.repeat,
          ),
          _Issue(
            id: 'something-else',
            title: 'Something Else',
            description: 'Other issue not listed',
            icon: Icons.help_outline,
          ),
        ];
      case 'reach-in':
      case 'reachIn':
        return [
          _Issue(
            id: 'running-warm',
            title: 'Running Warm',
            description: 'Temperature above set point',
            icon: Icons.thermostat,
          ),
          _Issue(
            id: 'unit-not-running-display',
            title: 'Not Running / Blank Display',
            description: 'System will not start or display is blank',
            icon: Icons.power_off,
          ),
          _Issue(
            id: 'ice-frost-build-up',
            title: 'Ice / Frost Build Up',
            description: 'Heavy ice or frost buildup on coils',
            icon: Icons.ac_unit,
          ),
          _Issue(
            id: 'water-leaking',
            title: 'Water Leaking',
            description: 'Water dripping or pooling',
            icon: Icons.water_drop,
          ),
          _Issue(
            id: 'running-constantly',
            title: 'Constant Run / Short Cycle',
            description: 'Unit runs continuously or turns on/off rapidly',
            icon: Icons.repeat,
          ),
          _Issue(
            id: 'noisy-operation',
            title: 'Noisy Operation / Vibrating',
            description: 'Unusual sounds or excessive vibration',
            icon: Icons.volume_up,
          ),
          _Issue(
            id: 'door-gasket-issue',
            title: 'Door or Gasket Issue',
            description: 'Poor door seal or gasket problems',
            icon: Icons.door_sliding,
          ),
          _Issue(
            id: 'other-alarm',
            title: 'Other / Alarm on Controller',
            description: 'Other issue or alarm displayed on controller',
            icon: Icons.warning,
          ),
        ];
      case 'ice-machine':
      case 'iceMachine':
        return [
          _Issue(
            id: 'no-ice-production',
            title: 'No (or slow) Ice Production',
            description: 'Machine not making ice or producing slowly',
            icon: Icons.icecream,
          ),
          _Issue(
            id: 'poor-ice-quality',
            title: 'Poor Ice Quality',
            description: 'Ice is cloudy, small, or malformed',
            icon: Icons.warning,
          ),
          _Issue(
            id: 'water-leaking',
            title: 'Water Leaking',
            description: 'Water dripping or pooling',
            icon: Icons.water_drop,
          ),
          _Issue(
            id: 'machine-icing-up',
            title: 'Machine Icing Up',
            description: 'Ice buildup on machine components',
            icon: Icons.ac_unit,
          ),
          _Issue(
            id: 'noisy-operation',
            title: 'Noisy Operation / Vibrating',
            description: 'Unusual sounds or excessive vibration',
            icon: Icons.volume_up,
          ),
          _Issue(
            id: 'machine-not-cycling',
            title: 'Power or Cycle Issues',
            description: 'Machine will not start or not completing cycles',
            icon: Icons.power_off,
          ),
          _Issue(
            id: 'other-alarm',
            title: 'Other / Alarm on Controller',
            description: 'Other issue or alarm displayed on controller',
            icon: Icons.warning,
          ),
        ];
      default:
        return [];
    }
  }

  String _getUnitTypeName(String unitType) {
    const names = {
      'rtu': 'RTU',
      'split-unit': 'Split Unit',
      'splitUnit': 'Split Unit',
      'reach-in': 'Reach-in',
      'reachIn': 'Reach-in',
      'walk-in': 'Walk-in',
      'walkIn': 'Walk-in',
      'ice-machine': 'Ice Machine',
      'iceMachine': 'Ice Machine',
    };
    return names[unitType] ?? unitType;
  }

  void _handleIssueSelect(BuildContext context, String issueId) {
    // Normalize unit type for checklist lookup
    // Config uses: walkIn, rtu, splitUnit, reachIn, iceMachine
    String normalizedUnitType = unitType;
    if (unitType == 'walk-in') normalizedUnitType = 'walkIn';
    if (unitType == 'split-unit') normalizedUnitType = 'splitUnit';
    if (unitType == 'reach-in') normalizedUnitType = 'reachIn';
    if (unitType == 'ice-machine') normalizedUnitType = 'iceMachine';
    
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => ServiceCallChecklistPage(
          unitType: normalizedUnitType,
          issueId: issueId,
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final issues = _getIssuesForUnitType(unitType);

    return Scaffold(
      backgroundColor: const Color(0xFF111827), // gray-900
      appBar: AppBar(
        title: Text('Service Call - ${_getUnitTypeName(unitType)}'),
        backgroundColor: const Color(0xFF1F2937), // gray-800
        foregroundColor: Colors.white,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => Navigator.pop(context),
        ),
      ),
      body: issues.isEmpty
          ? const Center(
              child: Text(
                'No issues available for this unit type',
                style: TextStyle(color: Colors.white),
              ),
            )
          : SingleChildScrollView(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'What issue are you experiencing?',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 20,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 24),
                  ...issues.map((issue) => Padding(
                    padding: const EdgeInsets.only(bottom: 16),
                    child: _IssueCard(
                      issue: issue,
                      onTap: () => _handleIssueSelect(context, issue.id),
                    ),
                  )).toList(),
                ],
              ),
            ),
    );
  }
}

class _Issue {
  final String id;
  final String title;
  final String description;
  final IconData icon;

  _Issue({
    required this.id,
    required this.title,
    required this.description,
    required this.icon,
  });
}

class _IssueCard extends StatelessWidget {
  final _Issue issue;
  final VoidCallback onTap;

  const _IssueCard({
    required this.issue,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Material(
      color: const Color(0xFF1F2937), // gray-800
      borderRadius: BorderRadius.circular(12),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
          child: Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(12),
            border: Border.all(
              color: const Color(0xFF374151), // gray-700
              width: 2,
            ),
          ),
          child: Row(
            children: [
              Icon(
                issue.icon,
                color: const Color(0xFF2563EB), // blue-600
                size: 40,
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Text(
                      issue.title,
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                      ),
                      maxLines: 3,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 4),
                    Text(
                      issue.description,
                      style: const TextStyle(
                        color: Color(0xFF9CA3AF), // gray-400
                        fontSize: 14,
                      ),
                      maxLines: 3,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

