import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'dart:math';
import 'dart:convert';
import '../../navigation/app_router.dart';

class PMSummaryPage extends StatefulWidget {
  const PMSummaryPage({super.key});

  @override
  State<PMSummaryPage> createState() => _PMSummaryPageState();
}

class Unit {
  final String id;
  final String type;
  final String name;
  int completedSteps;
  int totalSteps;

  Unit({
    required this.id,
    required this.type,
    required this.name,
    this.completedSteps = 0,
    this.totalSteps = 0,
  });

  Map<String, dynamic> toJson() => {
        'id': id,
        'type': type,
        'name': name,
        'completedSteps': completedSteps,
        'totalSteps': totalSteps,
      };

  factory Unit.fromJson(Map<String, dynamic> json) => Unit(
        id: json['id'],
        type: json['type'],
        name: json['name'],
        completedSteps: json['completedSteps'] ?? 0,
        totalSteps: json['totalSteps'] ?? 0,
      );
}

class _PMSummaryPageState extends State<PMSummaryPage> {
  String _jobNumber = '';
  List<Unit> _units = [];

  @override
  void initState() {
    super.initState();
    _loadJobData();
  }

  Future<void> _loadJobData() async {
    final prefs = await SharedPreferences.getInstance();
    
    // Load or generate job number
    String jobNum = prefs.getString('pm-current-job-number') ?? '';
    if (jobNum.isEmpty) {
      jobNum = (1000 + Random().nextInt(9000)).toString();
      await prefs.setString('pm-current-job-number', jobNum);
    }
    
    // Load units
    final unitsJson = prefs.getString('pm-units-$jobNum');
    List<Unit> units = [];
    if (unitsJson != null && unitsJson.isNotEmpty) {
      try {
        final List<dynamic> unitsList = jsonDecode(unitsJson);
        units = unitsList.map((u) => Unit.fromJson(u)).toList();
      } catch (e) {
        // If parsing fails, start with empty list
      }
    }
    
    // Load completed steps for each unit
    for (final unit in units) {
      final checklistData = prefs.getString('pm-checklist-${unit.id}');
      if (checklistData != null) {
        try {
          // Parse and count completed sections
          // This is simplified - you'd need to parse the actual checklist structure
          unit.completedSteps = _getCompletedSteps(unit.id, checklistData);
        } catch (e) {
          // Ignore parsing errors
        }
      }
      unit.totalSteps = _getTotalSteps(unit.type);
    }
    
    setState(() {
      _jobNumber = jobNum;
      _units = units;
    });
  }

  int _getTotalSteps(String type) {
    const steps = {
      'rtu': 8,
      'splitUnit': 3,
      'reachIn': 3,
      'walkIn': 3,
      'iceMachine': 3,
    };
    return steps[type] ?? 0;
  }

  int _getCompletedSteps(String unitId, String checklistData) {
    // Simplified - in real implementation, parse the checklist JSON
    // and count completed sections
    try {
      // This would parse the actual checklist structure
      // For now, return 0
      return 0;
    } catch (e) {
      return 0;
    }
  }

  String _formatUnitName(String type, int index) {
    const typeNames = {
      'rtu': 'RTU',
      'splitUnit': 'Split Unit',
      'reachIn': 'Reach-in',
      'walkIn': 'Walk-in',
      'iceMachine': 'Ice Machine',
    };
    return '${typeNames[type] ?? type} $index';
  }

  List<Unit> _getUnitsByType(String type) {
    return _units.where((u) => u.type == type).toList();
  }

  Future<void> _addUnit(String type) async {
    final existingUnits = _getUnitsByType(type);
    final newIndex = existingUnits.length + 1;
    final newUnit = Unit(
      id: '$type-$newIndex',
      type: type,
      name: _formatUnitName(type, newIndex),
      totalSteps: _getTotalSteps(type),
    );
    
    setState(() {
      _units.add(newUnit);
    });
    
    // Save to SharedPreferences
    final prefs = await SharedPreferences.getInstance();
    final unitsJson = jsonEncode(_units.map((u) => u.toJson()).toList());
    await prefs.setString('pm-units-$_jobNumber', unitsJson);
  }

  Future<void> _deleteUnit(String id) async {
    setState(() {
      _units.removeWhere((u) => u.id == id);
    });
    
    // Clear the checklist data for this unit from SharedPreferences
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('pm-checklist-$id');
    
    // Save updated units list to SharedPreferences
    final unitsJson = jsonEncode(_units.map((u) => u.toJson()).toList());
    await prefs.setString('pm-units-$_jobNumber', unitsJson);
  }

  final _unitTypeInfo = [
    {'key': 'rtu', 'label': 'RTU(S)'},
    {'key': 'splitUnit', 'label': 'SPLIT UNIT(S)'},
    {'key': 'reachIn', 'label': 'REACH-IN(S)'},
    {'key': 'walkIn', 'label': 'WALK-IN(S)'},
    {'key': 'iceMachine', 'label': 'ICE MACHINE(S)'},
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF111827), // gray-900
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
                    onPressed: () => Navigator.of(context).pop(),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Job #$_jobNumber',
                          style: const TextStyle(
                            fontSize: 20,
                            fontWeight: FontWeight.bold,
                            color: Colors.white,
                          ),
                        ),
                        const SizedBox(height: 4),
                        const Text(
                          'Preventive Maintenance',
                          style: TextStyle(
                            fontSize: 14,
                            color: Color(0xFF9CA3AF), // gray-400
                          ),
                        ),
                      ],
                    ),
                  ),
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.end,
                    children: [
                      const Text(
                        'Total Units',
                        style: TextStyle(
                          fontSize: 12,
                          color: Color(0xFF9CA3AF), // gray-400
                        ),
                      ),
                      Text(
                        '${_units.length}',
                        style: const TextStyle(
                          fontSize: 24,
                          fontWeight: FontWeight.bold,
                          color: Colors.white,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),

            // Main Content
            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.all(16),
                child: Column(
                  children: _unitTypeInfo.map((typeInfo) {
                    final typeUnits = _getUnitsByType(typeInfo['key'] as String);
                    final completedUnits = typeUnits.where((unit) {
                      return unit.completedSteps == unit.totalSteps && 
                             unit.totalSteps > 0;
                    }).length;

                    return _buildUnitTypeSection(
                      typeInfo['label'] as String,
                      typeInfo['key'] as String,
                      typeUnits,
                      completedUnits,
                    );
                  }).toList(),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildUnitTypeSection(
    String label,
    String type,
    List<Unit> units,
    int completedUnits,
  ) {
    return Container(
      margin: const EdgeInsets.only(bottom: 24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Section Header
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            child: Row(
              children: [
                Text(
                  label,
                  style: const TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.w600,
                    color: Colors.white,
                    letterSpacing: 0.5,
                  ),
                ),
                const SizedBox(width: 12),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                  decoration: BoxDecoration(
                    color: const Color(0xFF374151), // gray-700
                    borderRadius: BorderRadius.circular(16),
                  ),
                  child: Text(
                    '$completedUnits/${units.length}',
                    style: const TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w500,
                      color: Color(0xFFD1D5DB), // gray-300
                    ),
                  ),
                ),
              ],
            ),
          ),

          // Units List
          ...units.map((unit) => _buildUnitCard(unit)),

          // Add Another Button
          Container(
            margin: const EdgeInsets.only(top: 8),
            decoration: BoxDecoration(
              border: Border.all(
                color: const Color(0xFF374151), // gray-700
                width: 2,
                style: BorderStyle.solid,
              ),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Material(
              color: Colors.transparent,
              child: InkWell(
                onTap: () => _addUnit(type),
                borderRadius: BorderRadius.circular(8),
                child: Container(
                  padding: const EdgeInsets.all(16),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Icon(
                        Icons.add,
                        color: Color(0xFF9CA3AF), // gray-400
                        size: 24,
                      ),
                      const SizedBox(width: 8),
                      Text(
                        'Add Another',
                        style: TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.w500,
                          color: Colors.grey[500],
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildUnitCard(Unit unit) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: const Color(0xFF1F2937), // gray-800
        border: Border.all(
          color: const Color(0xFF374151), // gray-700
          width: 1,
        ),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: () {
            Navigator.pushNamed(
              context,
              AppRouter.pmChecklist,
              arguments: unit.id,
            );
          },
          borderRadius: BorderRadius.circular(8),
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Row(
              children: [
                Expanded(
                  child: Row(
                    children: [
                      Expanded(
                        child: Text(
                          unit.name,
                          style: const TextStyle(
                            fontSize: 14,
                            fontWeight: FontWeight.w500,
                            color: Colors.white,
                          ),
                        ),
                      ),
                      const SizedBox(width: 8),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                        decoration: BoxDecoration(
                          color: const Color(0xFF374151), // gray-700
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Text(
                          '${unit.completedSteps}/${unit.totalSteps} steps',
                          style: const TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.w500,
                            color: Color(0xFFD1D5DB), // gray-300
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
                IconButton(
                  icon: const Icon(
                    Icons.delete_outline,
                    color: Color(0xFF9CA3AF), // gray-400
                    size: 20,
                  ),
                  onPressed: () => _deleteUnit(unit.id),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

