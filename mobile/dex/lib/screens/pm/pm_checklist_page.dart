import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:image_picker/image_picker.dart';
import 'dart:convert';
import 'dart:io';
import '../../config/pm_checklist_config.dart';
import '../../services/pm_service.dart';

class PMChecklistPage extends StatefulWidget {
  final String unitId;

  const PMChecklistPage({super.key, required this.unitId});

  @override
  State<PMChecklistPage> createState() => _PMChecklistPageState();
}

class _PMChecklistPageState extends State<PMChecklistPage> {
  PMChecklist? _checklist;
  int _currentSection = 1;
  final ScrollController _sectionScrollController = ScrollController();
  final Map<String, String> _readings = {
    'gasPressure': '',
    'tempRise': '',
    'blowerAmps': '',
    'additionalRepairs': '',
  };

  @override
  void initState() {
    super.initState();
    _loadChecklist();
  }

  @override
  void dispose() {
    _sectionScrollController.dispose();
    super.dispose();
  }

  Future<void> _loadChecklist() async {
    // Get default checklist
    final defaultChecklist = getDefaultChecklist(widget.unitId);
    
    // Try to load saved progress
    final prefs = await SharedPreferences.getInstance();
    final savedData = prefs.getString('pm-checklist-${widget.unitId}');
    
    if (savedData != null) {
      try {
        final parsed = jsonDecode(savedData);
        if (parsed['sections'] != null) {
          // Reconstruct checklist from saved data
          final sections = (parsed['sections'] as List<dynamic>)
              .map((s) => PMChecklistSection.fromJson(s))
              .toList();
          
          setState(() {
            _checklist = PMChecklist(
              unitType: defaultChecklist.unitType,
              unitName: defaultChecklist.unitName,
              sections: sections,
            );
          });
        } else {
          setState(() {
            _checklist = defaultChecklist;
          });
        }
        
        // Load readings
        if (parsed['readings'] != null) {
          final readings = parsed['readings'] as Map<String, dynamic>;
          setState(() {
            _readings['gasPressure'] = readings['gasPressure']?.toString() ?? '';
            _readings['tempRise'] = readings['tempRise']?.toString() ?? '';
            _readings['blowerAmps'] = readings['blowerAmps']?.toString() ?? '';
            _readings['additionalRepairs'] = readings['additionalRepairs']?.toString() ?? '';
          });
        }
      } catch (e) {
        // If parsing fails, use default
        setState(() {
          _checklist = defaultChecklist;
        });
      }
    } else {
      setState(() {
        _checklist = defaultChecklist;
      });
    }
  }

  Future<void> _saveChecklistLocal() async {
    if (_checklist == null) return;
    
    final prefs = await SharedPreferences.getInstance();
    final dataToSave = {
      'sections': _checklist!.sections.map((s) => s.toJson()).toList(),
      'readings': _readings,
    };
    
    await prefs.setString('pm-checklist-${widget.unitId}', jsonEncode(dataToSave));
  }

  Future<void> _saveChecklist() async {
    // First save locally
    await _saveChecklistLocal();

    // Also save to Supabase so PM jobs are persisted like in the Next.js app.
    try {
      await PMService.savePMChecklist(
        unitId: widget.unitId,
        checklist: _checklist!,
        readings: Map<String, String>.from(_readings),
        currentSection: _currentSection,
      );
    } catch (e) {
      if (!mounted) return;
      final messenger = ScaffoldMessenger.of(context);
      messenger.showSnackBar(
        SnackBar(
          content: Text('Error saving to cloud: $e'),
          backgroundColor: const Color(0xFFDC2626),
        ),
      );
    }
  }

  void _toggleItem(String sectionId, String itemId) {
    if (_checklist == null) return;
    
    setState(() {
      final updatedSections = _checklist!.sections.map((section) {
        if (section.id == sectionId) {
          return PMChecklistSection(
            id: section.id,
            title: section.title,
            items: section.items.map((item) {
              if (item.id == itemId) {
                // Cycle through: unchecked -> red -> yellow -> green -> na -> unchecked
                const statusOrder = ['unchecked', 'red', 'yellow', 'green', 'na'];
                final currentStatus = item.status ?? 'unchecked';
                final currentIndex = statusOrder.indexOf(currentStatus);
                final nextIndex = (currentIndex + 1) % statusOrder.length;
                final nextStatus = statusOrder[nextIndex];
                
                return PMChecklistItem(
                  id: item.id,
                  text: item.text,
                  checked: nextStatus != 'unchecked',
                  status: nextStatus == 'unchecked' ? null : nextStatus,
                  notes: item.notes,
                  images: item.images,
                );
              }
              return item;
            }).toList(),
          );
        }
        return section;
      }).toList();
      
      _checklist = PMChecklist(
        unitType: _checklist!.unitType,
        unitName: _checklist!.unitName,
        sections: updatedSections,
      );
    });
    
    _saveChecklistLocal();
  }

  void _updateNotes(String sectionId, String itemId, String notes) {
    if (_checklist == null) return;
    
    setState(() {
      final updatedSections = _checklist!.sections.map((section) {
        if (section.id == sectionId) {
          return PMChecklistSection(
            id: section.id,
            title: section.title,
            items: section.items.map((item) {
              if (item.id == itemId) {
                return PMChecklistItem(
                  id: item.id,
                  text: item.text,
                  checked: item.checked,
                  status: item.status,
                  notes: notes,
                  images: item.images,
                );
              }
              return item;
            }).toList(),
          );
        }
        return section;
      }).toList();
      
      _checklist = PMChecklist(
        unitType: _checklist!.unitType,
        unitName: _checklist!.unitName,
        sections: updatedSections,
      );
    });
    
    _saveChecklistLocal();
  }

  Future<void> _handleImageUpload(String sectionId, String itemId) async {
    if (_checklist == null) return;
    
    final ImagePicker picker = ImagePicker();
    try {
      final XFile? image = await picker.pickImage(
        source: ImageSource.gallery,
        maxWidth: 1920,
        maxHeight: 1920,
        imageQuality: 85,
      );
      
      if (image == null) return;
      
      // Check file size (max 5MB)
      final file = File(image.path);
      final fileSize = await file.length();
      if (fileSize > 5 * 1024 * 1024) {
        if (!mounted) return;
        final messenger = ScaffoldMessenger.of(context);
        messenger.showSnackBar(
          const SnackBar(
            content: Text('Image size must be less than 5MB'),
            backgroundColor: Color(0xFFDC2626),
          ),
        );
        return;
      }
      
      // Read file as base64
      final bytes = await file.readAsBytes();
      final base64String = base64Encode(bytes);
      final dataUri = 'data:image/${image.path.split('.').last};base64,$base64String';
      
      setState(() {
        final updatedSections = _checklist!.sections.map((section) {
          if (section.id == sectionId) {
            return PMChecklistSection(
              id: section.id,
              title: section.title,
              items: section.items.map((item) {
                if (item.id == itemId) {
                  return PMChecklistItem(
                    id: item.id,
                    text: item.text,
                    checked: item.checked,
                    status: item.status,
                    notes: item.notes,
                    images: [...item.images, dataUri],
                  );
                }
                return item;
              }).toList(),
            );
          }
          return section;
        }).toList();
        
        _checklist = PMChecklist(
          unitType: _checklist!.unitType,
          unitName: _checklist!.unitName,
          sections: updatedSections,
        );
      });
      
      _saveChecklistLocal();
    } catch (e) {
      if (!mounted) return;
      final messenger = ScaffoldMessenger.of(context);
      messenger.showSnackBar(
        SnackBar(
          content: Text('Error uploading image: $e'),
          backgroundColor: const Color(0xFFDC2626),
        ),
      );
    }
  }

  void _removeImage(String sectionId, String itemId, int imageIndex) {
    if (_checklist == null) return;
    
    setState(() {
      final updatedSections = _checklist!.sections.map((section) {
        if (section.id == sectionId) {
          return PMChecklistSection(
            id: section.id,
            title: section.title,
            items: section.items.map((item) {
              if (item.id == itemId) {
                return PMChecklistItem(
                  id: item.id,
                  text: item.text,
                  checked: item.checked,
                  status: item.status,
                  notes: item.notes,
                  images: item.images.asMap().entries.where((entry) => entry.key != imageIndex).map((entry) => entry.value).toList(),
                );
              }
              return item;
            }).toList(),
          );
        }
        return section;
      }).toList();
      
      _checklist = PMChecklist(
        unitType: _checklist!.unitType,
        unitName: _checklist!.unitName,
        sections: updatedSections,
      );
    });
    
    _saveChecklist();
  }

  void _goToSection(int sectionNumber) {
    if (_checklist == null) return;
    if (sectionNumber >= 1 && sectionNumber <= _checklist!.sections.length) {
      setState(() {
        _currentSection = sectionNumber;
      });
    }
  }

  void _goToNextSection() {
    if (_checklist == null) return;
    if (_currentSection < _checklist!.sections.length) {
      setState(() {
        _currentSection = _currentSection + 1;
      });
    }
  }

  void _goToPreviousSection() {
    if (_currentSection > 1) {
      setState(() {
        _currentSection = _currentSection - 1;
      });
    }
  }

  bool _isSectionCompleted(PMChecklistSection section) {
    if (section.title == 'Notes & Recommended Repairs') {
      return _readings['gasPressure']!.trim().isNotEmpty ||
          _readings['tempRise']!.trim().isNotEmpty ||
          _readings['blowerAmps']!.trim().isNotEmpty ||
          _readings['additionalRepairs']!.trim().isNotEmpty;
    }
    return section.items.every((item) => item.checked);
  }

  String _getSectionDescriptor(String title) {
    const descriptors = {
      'Safety / Prep': 'Safety',
      'Airflow': 'Airflow',
      'Gas Heat Section': 'Gas',
      'Controls / Sensors': 'Controls',
      'Electrical': 'Electrical',
      'Coils / Drain / Housekeeping': 'Coils',
      'Operational Test': 'Test',
      'Notes & Recommended Repairs': 'Notes',
    };
    return descriptors[title] ?? 'Step';
  }

  @override
  Widget build(BuildContext context) {
    if (_checklist == null) {
      return Scaffold(
        backgroundColor: const Color(0xFF111827), // gray-900
        body: const Center(
          child: CircularProgressIndicator(),
        ),
      );
    }

    final currentSectionData = _checklist!.sections[_currentSection - 1];

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
              child: Column(
                children: [
                  // Title Row
                  Row(
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
                              _checklist!.unitName,
                              style: const TextStyle(
                                fontSize: 20,
                                fontWeight: FontWeight.bold,
                                color: Colors.white,
                              ),
                            ),
                            const SizedBox(height: 4),
                            const Text(
                              'Preventive Maintenance Checklist',
                              style: TextStyle(
                                fontSize: 12,
                                color: Color(0xFF9CA3AF), // gray-400
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                  
                  const SizedBox(height: 16),
                  
                  // Section Navigation
                  _buildSectionNavigation(),
                ],
              ),
            ),

            // Checklist Content
            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.all(16),
                child: _buildSectionContent(currentSectionData),
              ),
            ),

            // Action Buttons
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
              child: _buildActionButtons(),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSectionNavigation() {
    return SizedBox(
      height: 80,
      child: ListView.builder(
        controller: _sectionScrollController,
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 10),
        itemCount: _checklist!.sections.length,
        itemBuilder: (context, index) {
          final sectionNumber = index + 1;
          final section = _checklist!.sections[index];
          final isActive = sectionNumber == _currentSection;
          final isCompleted = _isSectionCompleted(section);

          return GestureDetector(
            onTap: () => _goToSection(sectionNumber),
            child: Container(
              margin: const EdgeInsets.only(right: 24),
              child: Column(
                children: [
                  Container(
                    width: 40,
                    height: 40,
                    decoration: BoxDecoration(
                      color: isActive
                          ? const Color(0xFF2563EB) // blue-600
                          : isCompleted
                              ? const Color(0xFF16A34A) // green-600
                              : const Color(0xFF374151), // gray-700
                      shape: BoxShape.circle,
                    ),
                    child: Center(
                      child: Text(
                        '$sectionNumber',
                        style: TextStyle(
                          color: Colors.white,
                          fontWeight: FontWeight.bold,
                          fontSize: 14,
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    _getSectionDescriptor(section.title),
                    style: const TextStyle(
                      fontSize: 10,
                      color: Color(0xFF9CA3AF), // gray-400
                    ),
                  ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }

  Widget _buildSectionContent(PMChecklistSection section) {
    return Container(
      decoration: BoxDecoration(
        color: const Color(0xFF1F2937), // gray-800
        borderRadius: BorderRadius.circular(8),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Section Header
          Container(
            padding: const EdgeInsets.all(16),
            decoration: const BoxDecoration(
              color: Color(0xFF374151), // gray-700
              borderRadius: BorderRadius.only(
                topLeft: Radius.circular(8),
                topRight: Radius.circular(8),
              ),
            ),
            child: Row(
              children: [
                Container(
                  width: 32,
                  height: 32,
                  decoration: const BoxDecoration(
                    color: Color(0xFF2563EB), // blue-600
                    shape: BoxShape.circle,
                  ),
                  child: Center(
                    child: Text(
                      '$_currentSection',
                      style: const TextStyle(
                        color: Colors.white,
                        fontWeight: FontWeight.bold,
                        fontSize: 14,
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                Text(
                  section.title,
                  style: const TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w600,
                    color: Colors.white,
                  ),
                ),
              ],
            ),
          ),

          // Section Content
          Padding(
            padding: const EdgeInsets.all(16),
            child: section.title == 'Notes & Recommended Repairs'
                ? _buildNotesSection()
                : _buildChecklistItems(section),
          ),
        ],
      ),
    );
  }

  Widget _buildChecklistItems(PMChecklistSection section) {
    return Column(
      children: section.items.map((item) {
        return Container(
          margin: const EdgeInsets.only(bottom: 12),
          padding: const EdgeInsets.only(bottom: 12),
          decoration: const BoxDecoration(
            border: Border(
              bottom: BorderSide(
                color: Color(0xFF374151), // gray-700
                width: 1,
              ),
            ),
          ),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Status Button
              GestureDetector(
                onTap: () => _toggleItem(section.id, item.id),
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                  decoration: BoxDecoration(
                    color: item.status == 'green'
                        ? const Color(0xFF16A34A) // green-600
                        : item.status == 'yellow'
                            ? const Color(0xFFEAB308) // yellow-600
                            : item.status == 'red'
                                ? const Color(0xFFDC2626) // red-600
                                : item.status == 'na'
                                    ? const Color(0xFF6B7280) // gray-500
                                    : const Color(0xFF374151), // gray-700
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(
                      color: item.status == 'green'
                          ? const Color(0xFF16A34A)
                          : item.status == 'yellow'
                              ? const Color(0xFFEAB308)
                              : item.status == 'red'
                                  ? const Color(0xFFDC2626)
                                  : item.status == 'na'
                                      ? const Color(0xFF6B7280)
                                      : const Color(0xFF4B5563), // gray-600
                      width: 2,
                    ),
                  ),
                  child: Text(
                    item.status == 'green'
                        ? 'Good'
                        : item.status == 'yellow'
                            ? 'Ok'
                            : item.status == 'red'
                                ? 'Bad'
                                : item.status == 'na'
                                    ? 'N/A'
                                    : '○',
                    style: const TextStyle(
                      color: Colors.white,
                      fontWeight: FontWeight.bold,
                      fontSize: 12,
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 12),
              // Item Text and Notes
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    GestureDetector(
                      onTap: () => _toggleItem(section.id, item.id),
                      child: Text(
                        item.text,
                        style: const TextStyle(
                          color: Color(0xFFE5E7EB), // gray-200
                          fontSize: 14,
                        ),
                      ),
                    ),
                    if (item.status != null) ...[
                      const SizedBox(height: 8),
                      TextField(
                        controller: TextEditingController(text: item.notes ?? '')
                          ..selection = TextSelection.fromPosition(
                            TextPosition(offset: item.notes?.length ?? 0),
                          ),
                        onChanged: (value) => _updateNotes(section.id, item.id, value),
                        decoration: InputDecoration(
                          hintText: 'Add notes...',
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
                          contentPadding: const EdgeInsets.all(12),
                        ),
                        style: const TextStyle(color: Colors.white, fontSize: 12),
                        maxLines: 2,
                      ),
                      const SizedBox(height: 12),
                      // Image Upload Section
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              const Text(
                                'Attach Photos:',
                                style: TextStyle(
                                  fontSize: 12,
                                  color: Color(0xFF9CA3AF), // gray-400
                                ),
                              ),
                              const SizedBox(width: 8),
                              TextButton(
                                onPressed: () => _handleImageUpload(section.id, item.id),
                                style: TextButton.styleFrom(
                                  backgroundColor: const Color(0xFF2563EB), // blue-600
                                  foregroundColor: Colors.white,
                                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                  minimumSize: Size.zero,
                                  tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                                ),
                                child: const Text(
                                  '+ Add Photo',
                                  style: TextStyle(fontSize: 12),
                                ),
                              ),
                            ],
                          ),
                          // Display uploaded images
                          if (item.images.isNotEmpty) ...[
                            const SizedBox(height: 8),
                            Wrap(
                              spacing: 8,
                              runSpacing: 8,
                              children: item.images.asMap().entries.map((entry) {
                                final index = entry.key;
                                final imageData = entry.value;
                                return Stack(
                                  children: [
                                    Container(
                                      width: 80,
                                      height: 80,
                                      decoration: BoxDecoration(
                                        borderRadius: BorderRadius.circular(8),
                                        border: Border.all(
                                          color: const Color(0xFF4B5563), // gray-600
                                          width: 1,
                                        ),
                                      ),
                                      child: ClipRRect(
                                        borderRadius: BorderRadius.circular(8),
                                        child: imageData.startsWith('data:image')
                                            ? Image.memory(
                                                base64Decode(imageData.split(',')[1]),
                                                fit: BoxFit.cover,
                                              )
                                            : Image.network(
                                                imageData,
                                                fit: BoxFit.cover,
                                                errorBuilder: (context, error, stackTrace) {
                                                  return const Icon(
                                                    Icons.broken_image,
                                                    color: Color(0xFF9CA3AF),
                                                  );
                                                },
                                              ),
                                      ),
                                    ),
                                    Positioned(
                                      top: -4,
                                      right: -4,
                                      child: GestureDetector(
                                        onTap: () => _removeImage(section.id, item.id, index),
                                        child: Container(
                                          width: 20,
                                          height: 20,
                                          decoration: const BoxDecoration(
                                            color: Color(0xFFDC2626), // red-600
                                            shape: BoxShape.circle,
                                          ),
                                          child: const Icon(
                                            Icons.close,
                                            size: 14,
                                            color: Colors.white,
                                          ),
                                        ),
                                      ),
                                    ),
                                  ],
                                );
                              }).toList(),
                            ),
                          ],
                        ],
                      ),
                    ],
                  ],
                ),
              ),
            ],
          ),
        );
      }).toList(),
    );
  }

  Widget _buildNotesSection() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Gas Pressure
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Gas Pressure',
              style: TextStyle(
                fontSize: 12,
                color: Color(0xFFD1D5DB), // gray-300
              ),
            ),
            const SizedBox(height: 8),
            TextField(
              controller: TextEditingController(text: _readings['gasPressure']!)
                ..selection = TextSelection.fromPosition(
                  TextPosition(offset: _readings['gasPressure']!.length),
                ),
              onChanged: (value) {
                setState(() {
                  _readings['gasPressure'] = value;
                });
                _saveChecklistLocal();
              },
              decoration: InputDecoration(
                hintText: 'Enter reading',
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
                contentPadding: const EdgeInsets.all(12),
              ),
              style: const TextStyle(color: Colors.white),
            ),
          ],
        ),
        const SizedBox(height: 16),
        // Temp Rise
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Temp Rise / Delta T',
              style: TextStyle(
                fontSize: 12,
                color: Color(0xFFD1D5DB), // gray-300
              ),
            ),
            const SizedBox(height: 8),
            TextField(
              controller: TextEditingController(text: _readings['tempRise']!)
                ..selection = TextSelection.fromPosition(
                  TextPosition(offset: _readings['tempRise']!.length),
                ),
              onChanged: (value) {
                setState(() {
                  _readings['tempRise'] = value;
                });
                _saveChecklistLocal();
              },
              decoration: InputDecoration(
                hintText: 'Enter reading',
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
                contentPadding: const EdgeInsets.all(12),
              ),
              style: const TextStyle(color: Colors.white),
            ),
          ],
        ),
        const SizedBox(height: 16),
        // Blower Amps
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Blower Amps',
              style: TextStyle(
                fontSize: 12,
                color: Color(0xFFD1D5DB), // gray-300
              ),
            ),
            const SizedBox(height: 8),
            TextField(
              controller: TextEditingController(text: _readings['blowerAmps']!)
                ..selection = TextSelection.fromPosition(
                  TextPosition(offset: _readings['blowerAmps']!.length),
                ),
              onChanged: (value) {
                setState(() {
                  _readings['blowerAmps'] = value;
                });
                _saveChecklistLocal();
              },
              decoration: InputDecoration(
                hintText: 'Enter reading',
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
                contentPadding: const EdgeInsets.all(12),
              ),
              style: const TextStyle(color: Colors.white),
            ),
          ],
        ),
        const SizedBox(height: 24),
        // Additional Repairs
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Any additional recommended repairs?',
              style: TextStyle(
                fontSize: 12,
                color: Color(0xFFD1D5DB), // gray-300
              ),
            ),
            const SizedBox(height: 8),
            TextField(
              controller: TextEditingController(text: _readings['additionalRepairs']!)
                ..selection = TextSelection.fromPosition(
                  TextPosition(offset: _readings['additionalRepairs']!.length),
                ),
              onChanged: (value) {
                setState(() {
                  _readings['additionalRepairs'] = value;
                });
                _saveChecklistLocal();
              },
              decoration: InputDecoration(
                hintText: 'Enter any additional repairs or notes...',
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
                contentPadding: const EdgeInsets.all(12),
              ),
              style: const TextStyle(color: Colors.white),
              maxLines: 4,
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildActionButtons() {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        // Previous Button
        TextButton(
          onPressed: _currentSection == 1 ? null : _goToPreviousSection,
          style: TextButton.styleFrom(
            backgroundColor: const Color(0xFF374151), // gray-700
            foregroundColor: Colors.white,
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(8),
            ),
            disabledBackgroundColor: const Color(0xFF374151).withValues(alpha: 0.5),
          ),
          child: const Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(Icons.arrow_back, size: 20),
              SizedBox(width: 8),
              Text('Previous'),
            ],
          ),
        ),

        // Save & Return Button
        ElevatedButton(
          onPressed: () async {
            await _saveChecklist();
            if (!mounted) return;
            Navigator.of(context).pop();
          },
          style: ElevatedButton.styleFrom(
            backgroundColor: const Color(0xFF2563EB), // blue-600
            foregroundColor: Colors.white,
            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(8),
            ),
          ),
          child: const Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text('Save & Return'),
            ],
          ),
        ),

        // Next Button
        TextButton(
          onPressed: _checklist == null || _currentSection == _checklist!.sections.length
              ? null
              : _goToNextSection,
          style: TextButton.styleFrom(
            backgroundColor: const Color(0xFF374151), // gray-700
            foregroundColor: Colors.white,
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(8),
            ),
            disabledBackgroundColor: const Color(0xFF374151).withValues(alpha: 0.5),
          ),
          child: const Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text('Next'),
              SizedBox(width: 8),
              Icon(Icons.arrow_forward, size: 20),
            ],
          ),
        ),
      ],
    );
  }
}

