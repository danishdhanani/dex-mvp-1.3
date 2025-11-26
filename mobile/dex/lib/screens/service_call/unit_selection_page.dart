import 'package:flutter/material.dart';
import '../../navigation/app_router.dart';
import 'issues/issues_page.dart';

class ServiceCallUnitSelectionPage extends StatelessWidget {
  const ServiceCallUnitSelectionPage({super.key});

  void _handleUnitTypeSelect(BuildContext context, String unitType) {
    // Navigate to issues selection page for this unit type
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => ServiceCallIssuesPage(unitType: unitType),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final unitTypes = [
      _UnitType(
        id: 'rtu',
        name: 'RTU',
        fullName: 'Roof Top Unit',
        description: 'Commercial rooftop HVAC systems',
        color: const Color(0xFF2563EB), // blue-600
        icon: Icons.roofing,
      ),
      _UnitType(
        id: 'split-unit',
        name: 'Split Unit',
        fullName: 'Split System',
        description: 'Residential and light commercial HVAC',
        color: const Color(0xFF10B981), // green-600
        icon: Icons.ac_unit,
      ),
      _UnitType(
        id: 'reach-in',
        name: 'Reach-in cooler or freezer',
        fullName: 'Reach-in Refrigeration',
        description: 'Commercial reach-in refrigeration units',
        color: const Color(0xFFEAB308), // yellow-600
        icon: Icons.kitchen,
      ),
      _UnitType(
        id: 'walk-in',
        name: 'Walk-in cooler or freezer',
        fullName: 'Walk-in Refrigeration',
        description: 'Large commercial walk-in refrigeration',
        color: const Color(0xFF06B6D4), // cyan-600
        icon: Icons.door_sliding,
      ),
      _UnitType(
        id: 'ice-machine',
        name: 'Ice Machine',
        fullName: 'Ice Machine',
        description: 'Commercial ice making equipment',
        color: const Color(0xFF9333EA), // purple-600
        icon: Icons.icecream,
      ),
    ];

    return Scaffold(
      body: SafeArea(
        child: Column(
          children: [
            // Header
            Container(
              padding: const EdgeInsets.all(16),
              decoration: const BoxDecoration(
                color: Color(0xFF1F2937), // gray-800
                border: Border(
                  bottom: BorderSide(
                    color: Color(0xFF374151), // gray-700
                    width: 1,
                  ),
                ),
              ),
              child: Row(
                children: [
                  IconButton(
                    icon: const Icon(Icons.arrow_back, color: Colors.white),
                    onPressed: () => Navigator.pop(context),
                  ),
                  const SizedBox(width: 12),
                  const Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Service Call',
                          style: TextStyle(
                            fontSize: 20,
                            fontWeight: FontWeight.bold,
                            color: Colors.white,
                          ),
                        ),
                        SizedBox(height: 4),
                        Text(
                          'What type of unit are you working on?',
                          style: TextStyle(
                            fontSize: 14,
                            color: Color(0xFF9CA3AF), // gray-400
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),

            // Main Content
            Expanded(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: LayoutBuilder(
                  builder: (context, constraints) {
                    final isTablet = constraints.maxWidth > 600;
                    return GridView.builder(
                      gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
                        crossAxisCount: isTablet ? 3 : 1,
                        crossAxisSpacing: 16,
                        mainAxisSpacing: 16,
                        childAspectRatio: isTablet ? 0.9 : 2.5,
                      ),
                      itemCount: unitTypes.length,
                      itemBuilder: (context, index) {
                        final unitType = unitTypes[index];
                        return _UnitTypeCard(
                          unitType: unitType,
                          onTap: () => _handleUnitTypeSelect(context, unitType.id),
                        );
                      },
                    );
                  },
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _UnitType {
  final String id;
  final String name;
  final String fullName;
  final String description;
  final Color color;
  final IconData icon;

  _UnitType({
    required this.id,
    required this.name,
    required this.fullName,
    required this.description,
    required this.color,
    required this.icon,
  });
}

class _UnitTypeCard extends StatelessWidget {
  final _UnitType unitType;
  final VoidCallback onTap;

  const _UnitTypeCard({
    required this.unitType,
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
              // Icon
              Container(
                width: 48,
                height: 48,
                decoration: BoxDecoration(
                  color: unitType.color,
                  borderRadius: BorderRadius.circular(24),
                ),
                child: Icon(
                  unitType.icon,
                  color: Colors.white,
                  size: 24,
                ),
              ),
              const SizedBox(width: 16),
              // Text Content
              Expanded(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      unitType.name,
                      style: const TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                        color: Colors.white,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      unitType.description,
                      style: const TextStyle(
                        fontSize: 12,
                        color: Color(0xFF9CA3AF), // gray-400
                      ),
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

