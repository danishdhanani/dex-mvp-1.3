import 'package:flutter/material.dart';

class UnitTypeSelector extends StatelessWidget {
  final Function(String) onUnitTypeSelect;

  const UnitTypeSelector({super.key, required this.onUnitTypeSelect});

  @override
  Widget build(BuildContext context) {
    final unitTypes = [
      _UnitTypeData(
        id: 'rtu',
        name: 'RTU',
        fullName: 'Roof Top Unit',
        description: 'Commercial rooftop HVAC systems',
        icon: Icons.roofing,
      ),
      _UnitTypeData(
        id: 'split-unit',
        name: 'Split Unit',
        fullName: 'Split System',
        description: 'Residential and light commercial HVAC',
        icon: Icons.ac_unit,
      ),
      _UnitTypeData(
        id: 'reach-in',
        name: 'Reach-in cooler or freezer',
        fullName: 'Reach-in Refrigeration',
        description: 'Commercial reach-in refrigeration units',
        icon: Icons.kitchen,
      ),
      _UnitTypeData(
        id: 'walk-in',
        name: 'Walk-in cooler or freezer',
        fullName: 'Walk-in Refrigeration',
        description: 'Large commercial walk-in refrigeration',
        icon: Icons.door_sliding,
      ),
      _UnitTypeData(
        id: 'ice-machine',
        name: 'Ice Machine',
        fullName: 'Ice Machine',
        description: 'Commercial ice making equipment',
        icon: Icons.icecream,
      ),
    ];

    return Container(
      color: const Color(0xFF111827), // gray-900
      child: Column(
        children: [
          // Header
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 24),
            decoration: const BoxDecoration(
              color: Color(0xFF1F2937), // gray-800
              border: Border(
                bottom: BorderSide(
                  color: Color(0xFF374151), // gray-700
                  width: 1,
                ),
              ),
            ),
            child: const Column(
              children: [
                Text(
                  'Dex Service Copilot',
                  style: TextStyle(
                    fontSize: 24,
                    fontWeight: FontWeight.bold,
                    color: Colors.white,
                  ),
                ),
                SizedBox(height: 8),
                Text(
                  'AI-powered HVAC/R troubleshooting assistant',
                  style: TextStyle(
                    fontSize: 16,
                    color: Color(0xFF9CA3AF), // gray-400
                  ),
                ),
              ],
            ),
          ),

          // Main Content
          Expanded(
            child: Center(
              child: SingleChildScrollView(
                padding: const EdgeInsets.all(16),
                child: Column(
                  children: [
                    const Text(
                      'What type of unit are you working on?',
                      style: TextStyle(
                        fontSize: 20,
                        fontWeight: FontWeight.w600,
                        color: Colors.white,
                      ),
                    ),
                    const SizedBox(height: 8),
                    const Text(
                      'Select the equipment type to get started with troubleshooting',
                      style: TextStyle(
                        fontSize: 16,
                        color: Color(0xFF9CA3AF), // gray-400
                      ),
                      textAlign: TextAlign.center,
                    ),
                    const SizedBox(height: 32),

                    // Unit Type Grid
                    LayoutBuilder(
                      builder: (context, constraints) {
                        final isTablet = constraints.maxWidth > 600;
                        return GridView.builder(
                          shrinkWrap: true,
                          physics: const NeverScrollableScrollPhysics(),
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
                              onTap: () => onUnitTypeSelect(unitType.id),
                            );
                          },
                        );
                      },
                    ),

                    const SizedBox(height: 32),
                    const Text(
                      'Supporting all major HVAC/R equipment types. Upload your service manuals to get started.',
                      style: TextStyle(
                        fontSize: 12,
                        color: Color(0xFF6B7280), // gray-500
                      ),
                      textAlign: TextAlign.center,
                    ),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _UnitTypeData {
  final String id;
  final String name;
  final String fullName;
  final String description;
  final IconData icon;

  _UnitTypeData({
    required this.id,
    required this.name,
    required this.fullName,
    required this.description,
    required this.icon,
  });
}

class _UnitTypeCard extends StatelessWidget {
  final _UnitTypeData unitType;
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
                  color: const Color(0xFF2563EB), // blue-600
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
              // Available badge
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: const Color(0xFF2563EB), // blue-600
                  borderRadius: BorderRadius.circular(12),
                ),
                child: const Text(
                  'Available',
                  style: TextStyle(
                    fontSize: 10,
                    color: Colors.white,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

