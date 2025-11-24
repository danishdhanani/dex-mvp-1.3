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
    // Simplified preset options - full implementation would match the web version
    return [
      PresetOption(
        question: '${_getEquipmentTypeName(type)} not turning on - what do I do?',
        title: 'Not Turning On',
        description: 'Power and startup issues',
        icon: Icons.power,
      ),
      PresetOption(
        question: '${_getEquipmentTypeName(type)} not cooling properly - troubleshooting steps',
        title: 'Not Cooling',
        description: 'Temperature and refrigerant issues',
        icon: Icons.thermostat,
      ),
      PresetOption(
        question: '${_getEquipmentTypeName(type)} making loud noises - what\'s wrong?',
        title: 'Loud Noises',
        description: 'Fan motor and bearing issues',
        icon: Icons.volume_up,
      ),
    ];
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
          const SizedBox(height: 32),
          Text(
            '${_getEquipmentTypeName(widget.unitType)} Troubleshooter',
            style: const TextStyle(
              fontSize: 32,
              fontWeight: FontWeight.bold,
              color: Colors.white,
            ),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 16),
          const Text(
            'What issue are you facing? Select an option below or type in a question',
            style: TextStyle(
              fontSize: 18,
              color: Color(0xFFD1D5DB), // gray-300
            ),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 32),
          GridView.builder(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: 2,
              crossAxisSpacing: 16,
              mainAxisSpacing: 16,
              childAspectRatio: 1.5,
            ),
            itemCount: presetOptions.length,
            itemBuilder: (context, index) {
              final option = presetOptions[index];
              return _PresetOptionCard(
                option: option,
                onTap: () => _sendMessage(option.question),
              );
            },
          ),
          const SizedBox(height: 16),
          const Text(
            'Or type your specific question below',
            style: TextStyle(
              fontSize: 12,
              color: Color(0xFF6B7280), // gray-500
            ),
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

  const _PresetOptionCard({
    required this.option,
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
              width: 1,
            ),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                width: 32,
                height: 32,
                decoration: BoxDecoration(
                  color: const Color(0xFF2563EB), // blue-600
                  borderRadius: BorderRadius.circular(16),
                ),
                child: Icon(
                  option.icon,
                  color: Colors.white,
                  size: 20,
                ),
              ),
              const SizedBox(height: 8),
              Text(
                option.title,
                style: const TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.bold,
                  color: Colors.white,
                ),
              ),
              const SizedBox(height: 4),
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
      ),
    );
  }
}

