import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';

// Class definitions
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

class ChecklistItem {
  final String id;
  final String title;
  String description;
  bool completed;

  ChecklistItem({
    required this.id,
    required this.title,
    required this.description,
    this.completed = false,
  });
}

class ChatBot extends StatefulWidget {
  final String unitType;

  const ChatBot({super.key, required this.unitType});

  @override
  State<ChatBot> createState() => _ChatBotState();
}

class _ChatBotState extends State<ChatBot> {
  final List<ChatMessage> _messages = [];
  final TextEditingController _inputController = TextEditingController();
  final ScrollController _scrollController = ScrollController();
  bool _isLoading = false;
  bool _showUnitSelector = false;
  UnitInfo? _selectedUnit;

  @override
  void dispose() {
    _inputController.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  void _scrollToBottom() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scrollController.hasClients) {
        _scrollController.animateTo(
          _scrollController.position.maxScrollExtent,
          duration: const Duration(milliseconds: 300),
          curve: Curves.easeOut,
        );
      }
    });
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

  Future<void> _sendMessage(String messageText) async {
    if (messageText.trim().isEmpty || _isLoading) return;

    final userMessage = ChatMessage(
      id: DateTime.now().millisecondsSinceEpoch.toString(),
      text: messageText.trim(),
      isUser: true,
      timestamp: DateTime.now(),
    );

    setState(() {
      _messages.add(userMessage);
      _isLoading = true;
    });
    _scrollToBottom();

    _inputController.clear();

    // Create bot message placeholder
    final botMessageId = (DateTime.now().millisecondsSinceEpoch + 1).toString();
    final botMessage = ChatMessage(
      id: botMessageId,
      text: '',
      isUser: false,
      timestamp: DateTime.now(),
    );

    setState(() {
      _messages.add(botMessage);
    });
    _scrollToBottom();

    try {
      // Build conversation history (last 4 messages)
      final conversationHistory = _messages
          .where((msg) => msg.id != botMessageId)
          .take(4)
          .map((msg) => <String, String>{
            'role': msg.isUser ? 'user' : 'assistant',
            'content': msg.text,
          })
          .toList();

      // Prepare unit info
      final unitInfo = _selectedUnit != null &&
              _selectedUnit!.brand.isNotEmpty &&
              _selectedUnit!.model.isNotEmpty
          ? {
              'brand': _selectedUnit!.brand,
              'model': _selectedUnit!.model,
              'unitType': _selectedUnit!.unitType,
              if (_selectedUnit!.series != null) 'series': _selectedUnit!.series,
              if (_selectedUnit!.yearRange != null)
                'yearRange': _selectedUnit!.yearRange,
            }
          : null;

      // Get base URL - use localhost for development, or configure for production
      const baseUrl = String.fromEnvironment('API_BASE_URL',
          defaultValue: 'http://localhost:3000');
      final url = Uri.parse('$baseUrl/api/chat/stream');

      // Make API call
      final request = http.Request('POST', url);
      request.headers['Content-Type'] = 'application/json';
      request.body = jsonEncode({
        'message': messageText.trim(),
        if (unitInfo != null) 'unitInfo': unitInfo,
        'conversationHistory': conversationHistory,
      });

      final streamedResponse = await request.send();

      if (streamedResponse.statusCode != 200) {
        throw Exception('Failed to get response: ${streamedResponse.statusCode}');
      }

      // Read stream and update message
      String fullResponse = '';
      await for (final chunk in streamedResponse.stream.transform(utf8.decoder)) {
        fullResponse += chunk;

        // Update the bot message with current response
        setState(() {
          final index = _messages.indexWhere((msg) => msg.id == botMessageId);
          if (index != -1) {
            // Remove source content markers for display
            final displayText = fullResponse
                .replaceAll(RegExp(r'---SOURCE_CONTENT_START---[\s\S]*?---SOURCE_CONTENT_END---'), '')
                .trim();
            _messages[index] = ChatMessage(
              id: botMessageId,
              text: displayText,
              isUser: false,
              timestamp: DateTime.now(),
            );
          }
        });
        _scrollToBottom();
      }

      // Final update to ensure complete message
      setState(() {
        final index = _messages.indexWhere((msg) => msg.id == botMessageId);
        if (index != -1) {
          final displayText = fullResponse
              .replaceAll(RegExp(r'---SOURCE_CONTENT_START---[\s\S]*?---SOURCE_CONTENT_END---'), '')
              .trim();
          _messages[index] = ChatMessage(
            id: botMessageId,
            text: displayText.isEmpty
                ? 'Sorry, I couldn\'t generate a response. Please try again.'
                : displayText,
            isUser: false,
            timestamp: DateTime.now(),
          );
        }
        _isLoading = false;
      });
      _scrollToBottom();
    } catch (error) {
      print('Chat API error: $error');
      setState(() {
        final index = _messages.indexWhere((msg) => msg.id == botMessageId);
        if (index != -1) {
          _messages[index] = ChatMessage(
            id: botMessageId,
            text: 'Sorry, I encountered an error while processing your request. Please try again.',
            isUser: false,
            timestamp: DateTime.now(),
          );
        }
        _isLoading = false;
      });
    }
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
                    controller: _scrollController,
                    padding: const EdgeInsets.all(16),
                    itemCount: _messages.length,
                    itemBuilder: (context, index) {
                      return _buildMessage(_messages[index]);
                    },
                  ),
          ),

          // Unit Selector Modal
          if (_showUnitSelector)
            _buildUnitSelectorModal(),

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
    if (message.isUser) {
      return Align(
        alignment: Alignment.centerRight,
        child: Container(
          margin: const EdgeInsets.only(bottom: 16),
          padding: const EdgeInsets.all(12),
          constraints: const BoxConstraints(maxWidth: 300),
          decoration: BoxDecoration(
            color: const Color(0xFF374151), // gray-700
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
    } else {
      // AI response - use TroubleshootingChecklist widget
      // If message is empty, show loading placeholder
      if (message.text.isEmpty) {
        return _buildLoadingMessage();
      }
      return Align(
        alignment: Alignment.centerLeft,
        child: Container(
          margin: const EdgeInsets.only(bottom: 16),
          constraints: const BoxConstraints(maxWidth: 350),
          child: TroubleshootingChecklist(response: message.text),
        ),
      );
    }
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

  Widget _buildUnitSelectorModal() {
    return Dialog(
      backgroundColor: Colors.transparent,
      insetPadding: const EdgeInsets.all(16),
      child: _UnitSelectorModalContent(
        selectedUnit: _selectedUnit,
        unitType: widget.unitType,
        onClose: () {
          setState(() {
            _showUnitSelector = false;
          });
        },
        onSave: (unitInfo) {
          setState(() {
            _selectedUnit = unitInfo;
            _showUnitSelector = false;
          });
        },
        getEquipmentTypeName: _getEquipmentTypeName,
      ),
    );
  }
}

class _UnitSelectorModalContent extends StatefulWidget {
  final UnitInfo? selectedUnit;
  final String unitType;
  final VoidCallback onClose;
  final Function(UnitInfo) onSave;
  final String Function(String) getEquipmentTypeName;

  const _UnitSelectorModalContent({
    required this.selectedUnit,
    required this.unitType,
    required this.onClose,
    required this.onSave,
    required this.getEquipmentTypeName,
  });

  @override
  State<_UnitSelectorModalContent> createState() => _UnitSelectorModalContentState();
}

class _UnitSelectorModalContentState extends State<_UnitSelectorModalContent> {
  late TextEditingController brandController;
  late TextEditingController modelController;
  late TextEditingController seriesController;
  late TextEditingController yearRangeController;
  String inputMode = 'manual';

  @override
  void initState() {
    super.initState();
    brandController = TextEditingController(text: widget.selectedUnit?.brand ?? '');
    modelController = TextEditingController(text: widget.selectedUnit?.model ?? '');
    seriesController = TextEditingController(text: widget.selectedUnit?.series ?? '');
    yearRangeController = TextEditingController(text: widget.selectedUnit?.yearRange ?? '');
  }

  @override
  void dispose() {
    brandController.dispose();
    modelController.dispose();
    seriesController.dispose();
    yearRangeController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      constraints: const BoxConstraints(maxWidth: 400, maxHeight: 600),
      decoration: BoxDecoration(
        color: const Color(0xFF1F2937), // gray-800
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          // Header
          Padding(
            padding: const EdgeInsets.all(16),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text(
                  'Select Unit',
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.w600,
                    color: Colors.white,
                  ),
                ),
                IconButton(
                  icon: const Icon(Icons.close, color: Colors.white),
                  onPressed: widget.onClose,
                ),
              ],
            ),
          ),
          // Input Mode Toggle
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: Container(
              decoration: BoxDecoration(
                color: const Color(0xFF374151), // gray-700
                borderRadius: BorderRadius.circular(8),
              ),
              child: Row(
                children: [
                  Expanded(
                    child: GestureDetector(
                      onTap: () {
                        setState(() {
                          inputMode = 'manual';
                        });
                      },
                      child: Container(
                        padding: const EdgeInsets.symmetric(vertical: 8),
                        decoration: BoxDecoration(
                          color: inputMode == 'manual'
                              ? const Color(0xFF2563EB) // blue-600
                              : Colors.transparent,
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: const Text(
                          'Manual Input',
                          textAlign: TextAlign.center,
                          style: TextStyle(
                            color: Colors.white,
                            fontSize: 12,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                      ),
                    ),
                  ),
                  Expanded(
                    child: Container(
                      padding: const EdgeInsets.symmetric(vertical: 8),
                      child: const Column(
                        children: [
                          Text(
                            'Nameplate Scan',
                            textAlign: TextAlign.center,
                            style: TextStyle(
                              color: Color(0xFF9CA3AF), // gray-400
                              fontSize: 12,
                            ),
                          ),
                          Text(
                            '(Coming Soon)',
                            textAlign: TextAlign.center,
                            style: TextStyle(
                              color: Color(0xFF9CA3AF), // gray-400
                              fontSize: 10,
                              fontStyle: FontStyle.italic,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 16),
          // Form Fields
          Flexible(
            child: SingleChildScrollView(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Brand
                  const Text(
                    'Brand *',
                    style: TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w500,
                      color: Color(0xFFD1D5DB), // gray-300
                    ),
                  ),
                  const SizedBox(height: 4),
                  TextField(
                    controller: brandController,
                    style: const TextStyle(color: Colors.white),
                    decoration: InputDecoration(
                      hintText: 'e.g., Hoshizaki, Manitowoc, Scotsman',
                      hintStyle: const TextStyle(color: Color(0xFF9CA3AF)),
                      filled: true,
                      fillColor: const Color(0xFF374151), // gray-700
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(8),
                        borderSide: const BorderSide(color: Color(0xFF4B5563)),
                      ),
                      enabledBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(8),
                        borderSide: const BorderSide(color: Color(0xFF4B5563)),
                      ),
                      focusedBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(8),
                        borderSide: const BorderSide(color: Color(0xFF2563EB), width: 2),
                      ),
                    ),
                  ),
                  const SizedBox(height: 12),
                  // Model
                  const Text(
                    'Model *',
                    style: TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w500,
                      color: Color(0xFFD1D5DB), // gray-300
                    ),
                  ),
                  const SizedBox(height: 4),
                  TextField(
                    controller: modelController,
                    style: const TextStyle(color: Colors.white),
                    decoration: InputDecoration(
                      hintText: 'e.g., KM-1200 SRE, iT1200 Indigo',
                      hintStyle: const TextStyle(color: Color(0xFF9CA3AF)),
                      filled: true,
                      fillColor: const Color(0xFF374151), // gray-700
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(8),
                        borderSide: const BorderSide(color: Color(0xFF4B5563)),
                      ),
                      enabledBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(8),
                        borderSide: const BorderSide(color: Color(0xFF4B5563)),
                      ),
                      focusedBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(8),
                        borderSide: const BorderSide(color: Color(0xFF2563EB), width: 2),
                      ),
                    ),
                  ),
                  const SizedBox(height: 12),
                  // Series
                  const Text(
                    'Series',
                    style: TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w500,
                      color: Color(0xFFD1D5DB), // gray-300
                    ),
                  ),
                  const SizedBox(height: 4),
                  TextField(
                    controller: seriesController,
                    style: const TextStyle(color: Colors.white),
                    decoration: InputDecoration(
                      hintText: 'e.g., SRE Series, Indigo Series',
                      hintStyle: const TextStyle(color: Color(0xFF9CA3AF)),
                      filled: true,
                      fillColor: const Color(0xFF374151), // gray-700
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(8),
                        borderSide: const BorderSide(color: Color(0xFF4B5563)),
                      ),
                      enabledBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(8),
                        borderSide: const BorderSide(color: Color(0xFF4B5563)),
                      ),
                      focusedBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(8),
                        borderSide: const BorderSide(color: Color(0xFF2563EB), width: 2),
                      ),
                    ),
                  ),
                  const SizedBox(height: 12),
                  // Year Range
                  const Text(
                    'Year Range',
                    style: TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w500,
                      color: Color(0xFFD1D5DB), // gray-300
                    ),
                  ),
                  const SizedBox(height: 4),
                  TextField(
                    controller: yearRangeController,
                    style: const TextStyle(color: Colors.white),
                    decoration: InputDecoration(
                      hintText: 'e.g., 2020-2024, 2018+',
                      hintStyle: const TextStyle(color: Color(0xFF9CA3AF)),
                      filled: true,
                      fillColor: const Color(0xFF374151), // gray-700
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(8),
                        borderSide: const BorderSide(color: Color(0xFF4B5563)),
                      ),
                      enabledBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(8),
                        borderSide: const BorderSide(color: Color(0xFF4B5563)),
                      ),
                      focusedBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(8),
                        borderSide: const BorderSide(color: Color(0xFF2563EB), width: 2),
                      ),
                    ),
                  ),
                  const SizedBox(height: 12),
                  // Unit Type
                  Text(
                    'Unit Type ${widget.unitType.isNotEmpty ? '(Pre-selected)' : '*'}',
                    style: const TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w500,
                      color: Color(0xFFD1D5DB), // gray-300
                    ),
                  ),
                  const SizedBox(height: 4),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 14),
                    decoration: BoxDecoration(
                      color: const Color(0xFF374151), // gray-700
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(color: const Color(0xFF4B5563)),
                    ),
                    child: Row(
                      children: [
                        Expanded(
                          child: Text(
                            widget.getEquipmentTypeName(widget.unitType.isNotEmpty ? widget.unitType : 'ice-machine'),
                            style: const TextStyle(
                              color: Color(0xFFD1D5DB), // gray-300
                              fontSize: 14,
                            ),
                          ),
                        ),
                        const Icon(
                          Icons.check_circle,
                          color: Color(0xFF60A5FA), // blue-400
                          size: 16,
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 24),
                ],
              ),
            ),
          ),
          // Buttons
          Padding(
            padding: const EdgeInsets.all(16),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.end,
              children: [
                TextButton(
                  onPressed: widget.onClose,
                  style: TextButton.styleFrom(
                    backgroundColor: const Color(0xFF374151), // gray-600
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                  ),
                  child: const Text('Cancel'),
                ),
                const SizedBox(width: 8),
                TextButton(
                  onPressed: () {
                    if (brandController.text.trim().isEmpty ||
                        modelController.text.trim().isEmpty) {
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(
                          content: Text('Please fill in Brand and Model'),
                          backgroundColor: Color(0xFFDC2626),
                        ),
                      );
                      return;
                    }
                    widget.onSave(UnitInfo(
                      brand: brandController.text.trim(),
                      model: modelController.text.trim(),
                      series: seriesController.text.trim().isEmpty
                          ? null
                          : seriesController.text.trim(),
                      yearRange: yearRangeController.text.trim().isEmpty
                          ? null
                          : yearRangeController.text.trim(),
                      unitType: widget.unitType.isNotEmpty
                          ? widget.unitType
                          : 'ice-machine',
                    ));
                  },
                  style: TextButton.styleFrom(
                    backgroundColor: const Color(0xFF2563EB), // blue-600
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                  ),
                  child: const Text('Save Unit'),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class TroubleshootingChecklist extends StatefulWidget {
  final String response;

  const TroubleshootingChecklist({super.key, required this.response});

  @override
  State<TroubleshootingChecklist> createState() => _TroubleshootingChecklistState();
}

class _TroubleshootingChecklistState extends State<TroubleshootingChecklist> {
  final Set<String> _expandedItems = {};
  final Set<String> _completedItems = {};
  late List<ChecklistItem> _checklistItems;

  @override
  void initState() {
    super.initState();
    _checklistItems = _parseResponse(widget.response);
    // Auto-expand all items by default so response is visible
    for (final item in _checklistItems) {
      _expandedItems.add(item.id);
    }
  }

  @override
  void didUpdateWidget(TroubleshootingChecklist oldWidget) {
    super.didUpdateWidget(oldWidget);
    // Update checklist items when response changes (for streaming updates)
    if (oldWidget.response != widget.response) {
      _checklistItems = _parseResponse(widget.response);
      // Keep existing expanded/completed states, but add new items as expanded
      for (final item in _checklistItems) {
        if (!_expandedItems.contains(item.id)) {
          _expandedItems.add(item.id);
        }
      }
    }
  }

  List<ChecklistItem> _parseResponse(String text) {
    final items = <ChecklistItem>[];
    
    // Check for numbered steps (1., 2., 3., etc.)
    final lines = text.split('\n');
    ChecklistItem? currentStep;
    int stepId = 1;

    for (final line in lines) {
      final trimmedLine = line.trim();
      
      // Check if this line starts a new numbered step
      final stepMatch = RegExp(r'^(\d+)\.\s*(.+)$').firstMatch(trimmedLine);
      if (stepMatch != null) {
        // Save previous step if exists
        if (currentStep != null) {
          items.add(currentStep);
        }
        
        // Start new step
        currentStep = ChecklistItem(
          id: 'step-$stepId',
          title: '${stepMatch.group(1)}. ${stepMatch.group(2)}',
          description: '',
        );
        stepId++;
      } else if (currentStep != null && trimmedLine.isNotEmpty) {
        // Add content to current step's description
        if (currentStep.description.isNotEmpty) {
          currentStep.description += '\n$trimmedLine';
        } else {
          currentStep.description = trimmedLine;
        }
      }
    }
    
    // Add the last step
    if (currentStep != null) {
      items.add(currentStep);
    }

    // If no numbered steps found, treat as single item
    if (items.isEmpty) {
      items.add(ChecklistItem(
        id: 'single-response',
        title: 'Response',
        description: text,
      ));
    }

    return items;
  }

  void _toggleExpanded(String itemId) {
    setState(() {
      if (_expandedItems.contains(itemId)) {
        _expandedItems.remove(itemId);
      } else {
        _expandedItems.add(itemId);
      }
    });
  }

  void _toggleCompleted(String itemId) {
    setState(() {
      if (_completedItems.contains(itemId)) {
        _completedItems.remove(itemId);
      } else {
        _completedItems.add(itemId);
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    if (_checklistItems.isEmpty) {
      return Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: const Color(0xFF1F2937), // gray-800
          borderRadius: BorderRadius.circular(12),
        ),
        child: Text(
          widget.response,
          style: const TextStyle(
            color: Colors.white,
            fontSize: 14,
          ),
        ),
      );
    }

    final completedCount = _completedItems.length;
    final totalCount = _checklistItems.length;

    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: const Color(0xFF1F2937), // gray-800
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Checklist items
          ..._checklistItems.map((item) {
            final isExpanded = _expandedItems.contains(item.id);
            final isCompleted = _completedItems.contains(item.id);
            
            return Container(
              margin: const EdgeInsets.only(bottom: 12),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Checkbox
                  Checkbox(
                    value: isCompleted,
                    onChanged: (value) => _toggleCompleted(item.id),
                    activeColor: const Color(0xFF16A34A), // green-600
                    checkColor: Colors.white,
                  ),
                  const SizedBox(width: 8),
                  // Content
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Expanded(
                              child: Text(
                                item.title,
                                style: TextStyle(
                                  color: isCompleted
                                      ? const Color(0xFF9CA3AF) // gray-400
                                      : Colors.white,
                                  fontSize: 14,
                                  fontWeight: FontWeight.w500,
                                  decoration: isCompleted
                                      ? TextDecoration.lineThrough
                                      : TextDecoration.none,
                                ),
                              ),
                            ),
                            if (item.description.isNotEmpty)
                              TextButton(
                                onPressed: () => _toggleExpanded(item.id),
                                style: TextButton.styleFrom(
                                  padding: EdgeInsets.zero,
                                  minimumSize: Size.zero,
                                  tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                                ),
                                child: Text(
                                  isExpanded ? 'Collapse' : 'Expand',
                                  style: const TextStyle(
                                    color: Color(0xFF60A5FA), // blue-400
                                    fontSize: 12,
                                    fontWeight: FontWeight.w500,
                                  ),
                                ),
                              ),
                          ],
                        ),
                        // Expanded description
                        if (isExpanded && item.description.isNotEmpty)
                          Padding(
                            padding: const EdgeInsets.only(top: 8),
                            child: Text(
                              item.description,
                              style: const TextStyle(
                                color: Color(0xFFD1D5DB), // gray-300
                                fontSize: 13,
                                height: 1.5,
                              ),
                            ),
                          ),
                      ],
                    ),
                  ),
                ],
              ),
            );
          }),
          
          // Progress bar (only show if more than 1 item)
          if (_checklistItems.length > 1)
            Container(
              margin: const EdgeInsets.only(top: 8),
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: const Color(0xFF1F2937), // gray-800
                border: Border.all(color: const Color(0xFF4B5563)), // gray-600
                borderRadius: BorderRadius.circular(8),
              ),
              child: Column(
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text(
                        'Progress',
                        style: TextStyle(
                          color: Color(0xFFD1D5DB), // gray-300
                          fontSize: 12,
                        ),
                      ),
                      Text(
                        '$completedCount of $totalCount completed',
                        style: const TextStyle(
                          color: Color(0xFFD1D5DB), // gray-300
                          fontSize: 12,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  ClipRRect(
                    borderRadius: BorderRadius.circular(4),
                    child: LinearProgressIndicator(
                      value: totalCount > 0 ? completedCount / totalCount : 0,
                      backgroundColor: const Color(0xFF374151), // gray-700
                      valueColor: const AlwaysStoppedAnimation<Color>(
                        Color(0xFF16A34A), // green-600
                      ),
                      minHeight: 8,
                    ),
                  ),
                ],
              ),
            ),
        ],
      ),
    );
  }
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

