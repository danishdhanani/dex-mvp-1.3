import 'package:flutter/material.dart';
import '../../models/checklist_types.dart';

class ChatBot extends StatefulWidget {
  final String unitType;

  const ChatBot({super.key, required this.unitType});

  @override
  State<ChatBot> createState() => _ChatBotState();
}

class _ChatBotState extends State<ChatBot> {
  final List<ChatMessage> _messages = [];
  final TextEditingController _inputController = TextEditingController();
  bool _isLoading = false;
  bool _showUnitSelector = false;
  UnitInfo? _selectedUnit;

  @override
  void dispose() {
    _inputController.dispose();
    super.dispose();
  }

  String _getEquipmentTypeName(String type) {
    const equipmentNames = {
      'rtu': 'RTU (Roof Top Unit)',
      'split-unit': 'Split Unit',
      'reach-in': 'Reach-in Cooler/Freezer',
      'walk-in': 'Walk-in Cooler/Freezer',
      'ice-machine': 'Ice Machine',
    };
    return equipmentNames[type] ?? 'HVAC/R Equipment';
  }

  List<PresetOption> _getPresetOptions(String type) {
    // Get equipment-specific preset options matching the web version
    final equipmentName = _getEquipmentTypeName(type);
    
    if (type == 'rtu') {
      return [
        PresetOption(
          question: 'RTU not turning on - what do I do?',
          title: 'Not Turning On',
          description: 'Power and startup issues',
          icon: Icons.power_off,
        ),
        PresetOption(
          question: 'RTU not cooling properly - troubleshooting steps',
          title: 'Not Cooling',
          description: 'Temperature and refrigerant issues',
          icon: Icons.thermostat,
        ),
        PresetOption(
          question: 'RTU making loud noises - what\'s wrong?',
          title: 'Loud Noises',
          description: 'Fan motor and bearing issues',
          icon: Icons.volume_up,
        ),
        PresetOption(
          question: 'RTU economizer not working - diagnostic steps',
          title: 'Economizer Issues',
          description: 'Outside air damper problems',
          icon: Icons.air,
        ),
        PresetOption(
          question: 'RTU gas heating not working - troubleshooting',
          title: 'Heating Problems',
          description: 'Gas valve and ignition issues',
          icon: Icons.local_fire_department,
        ),
        PresetOption(
          question: 'RTU error codes and fault diagnostics',
          title: 'Error Codes',
          description: 'Control board and sensor faults',
          icon: Icons.warning,
        ),
      ];
    } else if (type == 'split-unit') {
      return [
        PresetOption(
          question: 'Split unit not turning on - what do I do?',
          title: 'Not Turning On',
          description: 'Power and thermostat issues',
          icon: Icons.power_off,
        ),
        PresetOption(
          question: 'Split unit not cooling properly - troubleshooting steps',
          title: 'Not Cooling',
          description: 'Refrigerant and airflow issues',
          icon: Icons.thermostat,
        ),
        PresetOption(
          question: 'Split unit making loud noises - what\'s wrong?',
          title: 'Loud Noises',
          description: 'Compressor and fan motor issues',
          icon: Icons.volume_up,
        ),
        PresetOption(
          question: 'Split unit indoor/outdoor communication problems',
          title: 'Communication Issues',
          description: 'Wiring and control board problems',
          icon: Icons.wifi_off,
        ),
        PresetOption(
          question: 'Split unit refrigerant leak diagnosis',
          title: 'Refrigerant Leaks',
          description: 'Leak detection and repair steps',
          icon: Icons.water_drop,
        ),
        PresetOption(
          question: 'Split unit error codes and fault diagnostics',
          title: 'Error Codes',
          description: 'Control board and sensor faults',
          icon: Icons.warning,
        ),
      ];
    } else if (type == 'reach-in') {
      return [
        PresetOption(
          question: 'Reach-in cooler not cooling properly - troubleshooting',
          title: 'Not Cooling',
          description: 'Temperature and refrigerant issues',
          icon: Icons.thermostat,
        ),
        PresetOption(
          question: 'Reach-in cooler not turning on - what do I do?',
          title: 'Not Turning On',
          description: 'Power and control issues',
          icon: Icons.power_off,
        ),
        PresetOption(
          question: 'Reach-in cooler defrost problems - diagnostic steps',
          title: 'Defrost Issues',
          description: 'Timer and heater problems',
          icon: Icons.ac_unit,
        ),
        PresetOption(
          question: 'Reach-in cooler door seal problems - troubleshooting',
          title: 'Door Seal Issues',
          description: 'Gasket and door alignment problems',
          icon: Icons.door_sliding,
        ),
        PresetOption(
          question: 'Reach-in cooler making loud noises - what\'s wrong?',
          title: 'Loud Noises',
          description: 'Evaporator fan and compressor issues',
          icon: Icons.volume_up,
        ),
        PresetOption(
          question: 'Reach-in cooler error codes and fault diagnostics',
          title: 'Error Codes',
          description: 'Control board and sensor faults',
          icon: Icons.warning,
        ),
      ];
    } else if (type == 'walk-in') {
      return [
        PresetOption(
          question: 'Walk-in cooler not cooling properly - troubleshooting',
          title: 'Not Cooling',
          description: 'Temperature and refrigerant issues',
          icon: Icons.thermostat,
        ),
        PresetOption(
          question: 'Walk-in cooler evaporator fan problems - diagnostic steps',
          title: 'Fan Issues',
          description: 'Motor and blade problems',
          icon: Icons.air,
        ),
        PresetOption(
          question: 'Walk-in cooler defrost problems - troubleshooting',
          title: 'Defrost Issues',
          description: 'Timer and heater problems',
          icon: Icons.ac_unit,
        ),
        PresetOption(
          question: 'Walk-in cooler door heater problems - what\'s wrong?',
          title: 'Door Heater Issues',
          description: 'Heater element and wiring problems',
          icon: Icons.local_fire_department,
        ),
        PresetOption(
          question: 'Walk-in cooler insulation problems - diagnostic steps',
          title: 'Insulation Issues',
          description: 'Moisture and energy efficiency problems',
          icon: Icons.insights,
        ),
        PresetOption(
          question: 'Walk-in cooler error codes and fault diagnostics',
          title: 'Error Codes',
          description: 'Control board and sensor faults',
          icon: Icons.warning,
        ),
      ];
    } else {
      // ice-machine (default)
      return [
        PresetOption(
          question: 'Ice machine not turning on - what do I do?',
          title: 'Not Turning On',
          description: 'Power and startup issues',
          icon: Icons.power_off,
        ),
        PresetOption(
          question: 'Ice machine runs but makes no ice - troubleshooting steps',
          title: 'No Ice Production',
          description: 'Water flow and refrigeration issues',
          icon: Icons.block,
        ),
        PresetOption(
          question: 'Ice machine won\'t harvest ice - diagnostic steps',
          title: 'Won\'t Harvest',
          description: 'Harvest valve and timing issues',
          icon: Icons.timer_off,
        ),
        PresetOption(
          question: 'Ice machine making bad tasting ice - troubleshooting',
          title: 'Bad Taste',
          description: 'Water quality and filter issues',
          icon: Icons.water_drop,
        ),
        PresetOption(
          question: 'Ice machine making loud noises - what\'s wrong?',
          title: 'Loud Noises',
          description: 'Compressor and fan motor issues',
          icon: Icons.volume_up,
        ),
        PresetOption(
          question: 'Ice machine error codes and fault diagnostics',
          title: 'Error Codes',
          description: 'Control board and sensor faults',
          icon: Icons.warning,
        ),
      ];
    }
  }

  void _sendMessage(String messageText) {
    if (messageText.trim().isEmpty || _isLoading) return;

    setState(() {
      _messages.add(ChatMessage(
        id: DateTime.now().millisecondsSinceEpoch.toString(),
        text: messageText.trim(),
        isUser: true,
        timestamp: DateTime.now(),
      ));
      _isLoading = true;
    });

    _inputController.clear();

    // Simulate API response
    Future.delayed(const Duration(seconds: 1), () {
      setState(() {
        _messages.add(ChatMessage(
          id: (DateTime.now().millisecondsSinceEpoch + 1).toString(),
          text: 'This is a placeholder response. In a full implementation, this would call your chat API.',
          isUser: false,
          timestamp: DateTime.now(),
        ));
        _isLoading = false;
      });
    });
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      color: const Color(0xFF111827), // gray-900
      child: Column(
        children: [
          // Unit Selection Header
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: _selectedUnit == null
                  ? const Color(0xFF7F1D1D).withOpacity(0.2) // red-900/20
                  : const Color(0xFF1F2937), // gray-800
              border: const Border(
                bottom: BorderSide(
                  color: Color(0xFF374151), // gray-700
                  width: 1,
                ),
              ),
            ),
            child: Row(
              children: [
                const Icon(
                  Icons.info_outline,
                  color: Color(0xFF60A5FA), // blue-400
                  size: 20,
                ),
                const SizedBox(width: 8),
                const Text(
                  'Unit Information',
                  style: TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w500,
                    color: Colors.white,
                  ),
                ),
                const Spacer(),
                TextButton(
                  onPressed: () {
                    setState(() {
                      _showUnitSelector = true;
                    });
                  },
                  style: TextButton.styleFrom(
                    backgroundColor: _selectedUnit == null
                        ? const Color(0xFF374151) // gray-600
                        : const Color(0xFF2563EB), // blue-600
                    foregroundColor: Colors.white,
                  ),
                  child: Text(
                    _selectedUnit == null ? 'Select Unit' : 'Change Unit',
                    style: const TextStyle(fontSize: 12),
                  ),
                ),
              ],
            ),
          ),

          // Messages Area
          Expanded(
            child: _messages.isEmpty
                ? _buildWelcomeScreen()
                : ListView.builder(
                    padding: const EdgeInsets.all(16),
                    itemCount: _messages.length + (_isLoading ? 1 : 0),
                    itemBuilder: (context, index) {
                      if (index == _messages.length && _isLoading) {
                        return _buildLoadingMessage();
                      }
                      return _buildMessage(_messages[index]);
                    },
                  ),
          ),

          // Input Area
          Container(
            padding: const EdgeInsets.all(16),
            decoration: const BoxDecoration(
              color: Color(0xFF111827), // gray-900
              border: Border(
                top: BorderSide(
                  color: Color(0xFF374151), // gray-700
                  width: 1,
                ),
              ),
            ),
            child: Row(
              children: [
                IconButton(
                  icon: const Icon(Icons.add, color: Colors.white),
                  onPressed: () {},
                ),
                Expanded(
                  child: TextField(
                    controller: _inputController,
                    style: const TextStyle(color: Colors.white),
                    decoration: InputDecoration(
                      hintText: 'Describe your ${_getEquipmentTypeName(widget.unitType).toLowerCase()} issue...',
                      hintStyle: const TextStyle(color: Color(0xFF9CA3AF)), // gray-400
                      filled: true,
                      fillColor: const Color(0xFF374151), // gray-700
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                        borderSide: const BorderSide(
                          color: Color(0xFF4B5563), // gray-600
                        ),
                      ),
                      enabledBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                        borderSide: const BorderSide(
                          color: Color(0xFF4B5563), // gray-600
                        ),
                      ),
                      focusedBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                        borderSide: const BorderSide(
                          color: Color(0xFF2563EB), // blue-600
                          width: 2,
                        ),
                      ),
                    ),
                    maxLines: null,
                    textInputAction: TextInputAction.send,
                    onSubmitted: (value) => _sendMessage(value),
                  ),
                ),
                const SizedBox(width: 8),
                IconButton(
                  icon: const Icon(Icons.send, color: Colors.white),
                  onPressed: () => _sendMessage(_inputController.text),
                  style: IconButton.styleFrom(
                    backgroundColor: const Color(0xFF2563EB), // blue-600
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildWelcomeScreen() {
    final presetOptions = _getPresetOptions(widget.unitType);
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const SizedBox(height: 24),
          Text(
            '${_getEquipmentTypeName(widget.unitType)} Troubleshooter',
            style: const TextStyle(
              fontSize: 28,
              fontWeight: FontWeight.bold,
              color: Colors.white,
            ),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 12),
          const Text(
            'What issue are you facing? Select an option below or type in a question',
            style: TextStyle(
              fontSize: 16,
              color: Color(0xFFD1D5DB), // gray-300
            ),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 24),
          // Single column list of preset options
          ...presetOptions.asMap().entries.map((entry) {
            final index = entry.key;
            final option = entry.value;
            final colors = [
              const Color(0xFFDC2626), // red-600
              const Color(0xFF2563EB), // blue-600
              const Color(0xFFEAB308), // yellow-600
              const Color(0xFF16A34A), // green-600
              const Color(0xFF06B6D4), // cyan-600
              const Color(0xFF9333EA), // purple-600
            ];
            final color = colors[index % colors.length];
            
            return Padding(
              padding: const EdgeInsets.only(bottom: 8),
              child: _PresetOptionCard(
                option: option,
                onTap: () => _sendMessage(option.question),
                iconColor: color,
              ),
            );
          }).toList(),
          const SizedBox(height: 16),
          const Text(
            'Or type your specific question below',
            style: TextStyle(
              fontSize: 12,
              color: Color(0xFF6B7280), // gray-500
            ),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }

  Widget _buildMessage(ChatMessage message) {
    return Align(
      alignment: message.isUser ? Alignment.centerRight : Alignment.centerLeft,
      child: Container(
        margin: const EdgeInsets.only(bottom: 16),
        padding: const EdgeInsets.all(12),
        constraints: const BoxConstraints(maxWidth: 300),
        decoration: BoxDecoration(
          color: message.isUser
              ? const Color(0xFF374151) // gray-700
              : const Color(0xFF1F2937), // gray-800
          borderRadius: BorderRadius.circular(12),
        ),
        child: Text(
          message.text,
          style: const TextStyle(
            color: Colors.white,
            fontSize: 14,
          ),
        ),
      ),
    );
  }

  Widget _buildLoadingMessage() {
    return const Align(
      alignment: Alignment.centerLeft,
      child: Padding(
        padding: EdgeInsets.all(16),
        child: Row(
          children: [
            SizedBox(
              width: 16,
              height: 16,
              child: CircularProgressIndicator(
                strokeWidth: 2,
                valueColor: AlwaysStoppedAnimation<Color>(Color(0xFF9CA3AF)),
              ),
            ),
            SizedBox(width: 12),
            Text(
              'Generating recommendations...',
              style: TextStyle(
                color: Color(0xFF9CA3AF), // gray-400
                fontSize: 14,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class ChatMessage {
  final String id;
  final String text;
  final bool isUser;
  final DateTime timestamp;

  ChatMessage({
    required this.id,
    required this.text,
    required this.isUser,
    required this.timestamp,
  });
}

class UnitInfo {
  final String brand;
  final String model;
  final String? series;
  final String? yearRange;
  final String unitType;

  UnitInfo({
    required this.brand,
    required this.model,
    this.series,
    this.yearRange,
    required this.unitType,
  });
}

class PresetOption {
  final String question;
  final String title;
  final String description;
  final IconData icon;

  PresetOption({
    required this.question,
    required this.title,
    required this.description,
    required this.icon,
  });
}

class _PresetOptionCard extends StatelessWidget {
  final PresetOption option;
  final VoidCallback onTap;
  final Color iconColor;

  const _PresetOptionCard({
    required this.option,
    required this.onTap,
    required this.iconColor,
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
          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 8),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(12),
            border: Border.all(
              color: const Color(0xFF4B5563), // gray-600
              width: 1,
            ),
          ),
          child: Row(
            children: [
              // Colored icon background
              Container(
                width: 32,
                height: 32,
                decoration: BoxDecoration(
                  color: iconColor,
                  borderRadius: BorderRadius.circular(16),
                ),
                child: Icon(
                  option.icon,
                  color: Colors.white,
                  size: 18,
                ),
              ),
              const SizedBox(width: 12),
              // Text content
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(
                      option.title,
                      style: const TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w500,
                        color: Colors.white,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      option.description,
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

