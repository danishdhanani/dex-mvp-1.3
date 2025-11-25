import 'package:flutter/material.dart';
import 'unit_type_selector.dart';
import 'chat_bot.dart';

class ServiceCallPage extends StatefulWidget {
  final String? unitType;

  const ServiceCallPage({super.key, this.unitType});

  @override
  State<ServiceCallPage> createState() => _ServiceCallPageState();
}

class _ServiceCallPageState extends State<ServiceCallPage> {
  String? _selectedUnitType;

  @override
  void initState() {
    super.initState();
    _selectedUnitType = widget.unitType;
  }

  void _handleUnitTypeSelect(String unitType) {
    setState(() {
      _selectedUnitType = unitType;
    });
  }

  void _handleBackToUnitSelection() {
    setState(() {
      _selectedUnitType = null;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: Column(
          children: [
            // Header
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 8),
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
                  const SizedBox(width: 8),
                  // Logo
                  Container(
                    width: 24,
                    height: 24,
                    decoration: BoxDecoration(
                      color: const Color(0xFF374151), // gray-600
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: const Icon(
                      Icons.settings,
                      color: Colors.white,
                      size: 16,
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      _selectedUnitType != null
                          ? 'Dex - HVAC/R Troubleshooter'
                          : 'Dex Service Copilot',
                      style: const TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w600,
                        color: Colors.white,
                      ),
                    ),
                  ),
                  if (_selectedUnitType != null)
                    Padding(
                      padding: const EdgeInsets.only(right: 4),
                      child: TextButton(
                        onPressed: _handleBackToUnitSelection,
                        style: TextButton.styleFrom(
                          backgroundColor: const Color(0xFF374151), // gray-600
                          foregroundColor: Colors.white,
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                          minimumSize: Size.zero,
                          tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                        ),
                        child: const Text(
                          'Home',
                          style: TextStyle(fontSize: 12),
                        ),
                      ),
                    ),
                  TextButton(
                    onPressed: () {
                      // Navigate to troubleshooting page
                      Navigator.pushNamed(context, '/troubleshooting');
                    },
                    style: TextButton.styleFrom(
                      backgroundColor: const Color(0xFF2563EB), // blue-600
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                      minimumSize: Size.zero,
                      tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                    ),
                    child: const Text(
                      'Troubleshoot',
                      style: TextStyle(fontSize: 12),
                    ),
                  ),
                  const SizedBox(width: 4),
                  IconButton(
                    icon: const Icon(Icons.admin_panel_settings, color: Colors.white, size: 20),
                    onPressed: () {
                      // Navigate to admin page
                    },
                    padding: EdgeInsets.zero,
                    constraints: const BoxConstraints(),
                  ),
                ],
              ),
            ),

            // Main Content
            Expanded(
              child: _selectedUnitType != null
                  ? ChatBot(unitType: _selectedUnitType!)
                  : UnitTypeSelector(onUnitTypeSelect: _handleUnitTypeSelect),
            ),
          ],
        ),
      ),
    );
  }
}

