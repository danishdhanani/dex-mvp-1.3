import 'package:flutter/material.dart';
import '../../../config/checklist_config.dart';
import '../../../models/checklist_types.dart';
import '../../../logic/decision_tree_rules.dart';
import '../../../models/diagnostic_context.dart';
import '../../../components/hypothesis_popup.dart';

class ServiceCallChecklistPage extends StatefulWidget {
  final String unitType;
  final String issueId;

  const ServiceCallChecklistPage({
    super.key,
    required this.unitType,
    required this.issueId,
  });

  @override
  State<ServiceCallChecklistPage> createState() =>
      _ServiceCallChecklistPageState();
}

class _ServiceCallChecklistPageState extends State<ServiceCallChecklistPage> {
  ServiceCallChecklist? _checklist;
  int _currentSection = 1;
  bool _hypothesesOpen = false;
  List<Hypothesis> _hypotheses = [];
  List<String> _chosenPathTitles = [];
  bool _chosenWrapUp = false;
  Map<String, String> _blockingMessageResolutions = {}; // 'resolved' | 'acknowledged'

  @override
  void initState() {
    super.initState();
    _loadChecklist();
  }

  void _loadChecklist() {
    final sections = getChecklistFor(widget.unitType, widget.issueId);
    setState(() {
      _checklist = ServiceCallChecklist(
        unitType: widget.unitType,
        issueType: widget.issueId,
        sections: sections,
      );
    });
    
    // Scroll to top when section changes
    WidgetsBinding.instance.addPostFrameCallback((_) {
      // This will be handled by the scroll controller if needed
    });
  }

  void _updateItem(
    String sectionId,
    String itemId,
    ChecklistItemData Function(ChecklistItemData) updater,
  ) {
    if (_checklist == null) return;
    setState(() {
      _checklist = ServiceCallChecklist(
        unitType: _checklist!.unitType,
        issueType: _checklist!.issueType,
        sections: _checklist!.sections.map((section) {
          if (section.id == sectionId) {
            return ChecklistItem(
              id: section.id,
              title: section.title,
              items: section.items.map((item) {
                if (item.id == itemId) {
                  return updater(item);
                }
                return item;
              }).toList(),
            );
          }
          return section;
        }).toList(),
      );
    });
  }

  void _setItemChecked(String sectionId, String itemId, bool checked) {
    _updateItem(sectionId, itemId, (item) {
      return item.copyWith(checked: checked);
    });
  }

  void _updateSelectedOption(String sectionId, String itemId, String option) {
    _updateItem(sectionId, itemId, (item) {
      // Clear selectedOptions and set selectedOption for single selection
      return item.copyWith(
        selectedOption: option,
        selectedOptions: null,
      );
    });
  }

  void _updateNumericValue(String sectionId, String itemId, String value) {
    _updateItem(sectionId, itemId, (item) {
      return item.copyWith(numericValue: value);
    });
  }

  void _updateNumericInput(
    String sectionId,
    String itemId,
    int index,
    String value,
  ) {
    _updateItem(sectionId, itemId, (item) {
      if (item.numericInputs != null && index < item.numericInputs!.length) {
        final updatedInputs = List<NumericInput>.from(item.numericInputs!);
        updatedInputs[index] = NumericInput(
          label: updatedInputs[index].label,
          value: value,
          placeholder: updatedInputs[index].placeholder,
          unit: updatedInputs[index].unit,
        );
        return item.copyWith(numericInputs: updatedInputs);
      }
      return item;
    });
  }

  void _updateNotes(String sectionId, String itemId, String notes) {
    _updateItem(sectionId, itemId, (item) {
      return item.copyWith(notes: notes);
    });
  }

  bool _shouldShowItem(ChecklistItemData item, ChecklistItem section) {
    // Exclude blocking messages from regular items
    if (item.isBlockingMessage == true) return false;

    // Show conditional items only if their condition is met
    if (item.conditionalOn != null) {
      final referencedItem = section.items.firstWhere(
        (i) => i.id == item.conditionalOn!.itemId,
        orElse: () => ChecklistItemData(id: '', text: '', checked: false),
      );

      if (referencedItem.id.isNotEmpty) {
        final selectedValue = referencedItem.selectedOptions?.first ??
            referencedItem.selectedOption;
        return selectedValue != null &&
            selectedValue == item.conditionalOn!.option;
      }
      return false;
    }

    return true; // Show non-conditional items
  }

  bool _hasActiveBlockingMessage() {
    final currentSectionData = _checklist!.sections[_currentSection - 1];
    if (currentSectionData.items.isEmpty) return false;

    for (final item in currentSectionData.items) {
      if (item.conditionalOn != null && item.isBlockingMessage == true) {
        final resolution = _blockingMessageResolutions[item.id];
        if (resolution == 'resolved' || resolution == 'acknowledged') {
          continue;
        }

        final referencedItem = currentSectionData.items.firstWhere(
          (i) => i.id == item.conditionalOn!.itemId,
          orElse: () => ChecklistItemData(id: '', text: '', checked: false),
        );

        if (referencedItem.id.isNotEmpty) {
          final value = referencedItem.numericValue ??
              referencedItem.selectedOptions?.first ??
              referencedItem.selectedOption ??
              '';
          if (item.conditionalOn!.option != null &&
              value == item.conditionalOn!.option) {
            return true;
          }
        }
      }
    }

    return false;
  }

  void _resolveBlockingMessage(String itemId, String resolution) {
    setState(() {
      _blockingMessageResolutions[itemId] = resolution;
    });
  }

  void _goToSection(int sectionNumber) {
    if (_checklist == null) return;
    if (sectionNumber >= 1 && sectionNumber <= _checklist!.sections.length) {
      setState(() {
        _currentSection = sectionNumber;
      });
    }
  }

  void _generateHypotheses() {
    DiagnosticContext? context;
    List<Hypothesis> hypotheses = [];

    // Build context based on unit type and issue
    if (widget.unitType == 'walkIn' && widget.issueId == 'ice-frost-build-up') {
      // Demo flow for walk-in ice build up: show specific demo options
      if (_currentSection == 2) {
        hypotheses = [
          Hypothesis(
            id: 'drainLineDemo',
            label: 'Check drain line for leaks',
            reason: 'Trace drain path to identify potential leaks or blockages',
            confidence: 0.9,
            nextSectionId: 'evapDrainTracingDemo',
          ),
          Hypothesis(
            id: 'defrostCycleDemo',
            label: 'Defrost cycle',
            reason: 'Verify defrost system is operating correctly',
            confidence: 0.85,
            nextSectionId: 'defrostDiagnostics',
          ),
        ];
      } else {
        context = _buildDiagnosticContext();
        if (context != null) {
          hypotheses = DecisionTreeRules.generateHypotheses(context);
        }
      }
    } else if (widget.unitType == 'rtu' && widget.issueId == 'not-cooling') {
      final rtuContext = _buildRTUCoolingChecksContext();
      if (rtuContext != null) {
        hypotheses = DecisionTreeRules.generateRTUCoolingHypotheses(rtuContext);
      }
    } else if (widget.unitType == 'rtu' && widget.issueId == 'not-heating') {
      final rtuContext = _buildRTUHeatingChecksContext();
      if (rtuContext != null) {
        hypotheses = DecisionTreeRules.generateRTUHeatingHypotheses(rtuContext);
      }
    }

    if (hypotheses.isEmpty && context != null) {
      // Fallback to general diagnostics
      hypotheses = DecisionTreeRules.generateHypotheses(context);
    }

    setState(() {
      _hypotheses = hypotheses;
      _hypothesesOpen = true;
    });
  }

  RTUCoolingChecksContext? _buildRTUCoolingChecksContext() {
    if (_checklist == null) return null;
    final coolingChecksSection = _checklist!.sections.firstWhere(
      (s) => s.title == 'Cooling Checks',
      orElse: () => ChecklistItem(id: '', title: '', items: []),
    );

    if (coolingChecksSection.id.isEmpty) return null;

    String? getValue(String itemId) {
      try {
        final item = coolingChecksSection.items.firstWhere((i) => i.id == itemId);
        return item.selectedOptions?.first ?? item.selectedOption;
      } catch (e) {
        return null;
      }
    }

    double? getNumericValue(String itemId) {
      try {
        final item = coolingChecksSection.items.firstWhere((i) => i.id == itemId);
        if (item.numericValue != null && item.numericValue!.isNotEmpty) {
          return double.tryParse(item.numericValue!);
        }
      } catch (e) {
        // Item not found
      }
      return null;
    }

    return RTUCoolingChecksContext(
      supplyFanRunning: getValue('supplyFanRunning'),
      supplyAirflowStrength: getValue('supplyAirflowStrength'),
      filtersCondition: getValue('filtersCondition'),
      evapCoilCondition: getValue('evapCoilCondition'),
      condenserFanStatus: getValue('condenserFanStatus'),
      condenserCoilCondition: getValue('condenserCoilCondition'),
      compressorStatus: getValue('compressorStatus'),
      noiseVibration: getValue('noiseVibration'),
      returnAirTemp: getNumericValue('returnAirTemp'),
      supplyAirTemp: getNumericValue('supplyAirTemp'),
    );
  }

  RTUHeatingChecksContext? _buildRTUHeatingChecksContext() {
    if (_checklist == null) return null;
    final heatingChecksSection = _checklist!.sections.firstWhere(
      (s) => s.title == 'Heating Checks',
      orElse: () => ChecklistItem(id: '', title: '', items: []),
    );

    if (heatingChecksSection.id.isEmpty) return null;

    String? getValue(String itemId) {
      try {
        final item = heatingChecksSection.items.firstWhere((i) => i.id == itemId);
        return item.selectedOptions?.first ?? item.selectedOption;
      } catch (e) {
        return null;
      }
    }

    double? getNumericValue(String itemId) {
      try {
        final item = heatingChecksSection.items.firstWhere((i) => i.id == itemId);
        if (item.numericValue != null && item.numericValue!.isNotEmpty) {
          return double.tryParse(item.numericValue!);
        }
      } catch (e) {
        // Item not found
      }
      return null;
    }

    return RTUHeatingChecksContext(
      heatingSystemType: getValue('heatingSystemType'),
      supplyFanRunning: getValue('supplyFanRunning'),
      supplyAirflowStrength: getValue('supplyAirflowStrength'),
      filtersCondition: getValue('filtersCondition'),
      heatingElementStatus: getValue('heatingElementStatus'),
      gasValveEnergized: getValue('gasValveEnergized'),
      burnersLit: getValue('burnersLit'),
      electricHeatOn: getValue('electricHeatOn'),
      heatPumpRunning: getValue('heatPumpRunning'),
      noiseVibration: getValue('noiseVibration'),
      returnAirTemp: getNumericValue('returnAirTemp'),
      supplyAirTemp: getNumericValue('supplyAirTemp'),
    );
  }

  void _navigateToNextSectionId(String nextSectionId) {
    // Map section IDs to section titles
    final sectionIdByKey = {
      'defrostDiagnostics': 'Defrost diagnostics',
      'doorInfiltrationChecks': 'Door / infiltration checks',
      'evapFanChecks': 'Evaporator fan checks',
      'condenserAirflowChecks': 'Condenser airflow checks',
      'generalDiagnostics': 'General diagnostics',
      'evapDrainTracingDemo': 'Evap drain tracing',
      'suctionLineHumidityChecks': 'Suction line humidity checks',
      'rtuAirflowDiagnostics': 'Airflow diagnostics',
      'rtuCondenserDiagnostics': 'Condenser diagnostics',
      'rtuCompressorCircuitDiagnostics': 'Compressor circuit diagnostics',
      'rtuRefrigerantDiagnostics': 'Refrigerant diagnostics',
      'rtuControlEconomizerDiagnostics': 'Control / economizer diagnostics',
      'wrap-up': 'Wrap up',
    };

    // Check if it's a numeric section ID (for heating diagnostics)
    final numericId = int.tryParse(nextSectionId);
    if (numericId != null) {
      if (_checklist == null) return;
      final index = _checklist!.sections.indexWhere((s) => s.id == nextSectionId);
      if (index >= 0) {
        final section = _checklist!.sections[index];
        setState(() {
          if (!_chosenPathTitles.contains(section.title)) {
            _chosenPathTitles.add(section.title);
          }
          _currentSection = index + 1;
        });
        return;
      }
    }

    final title = sectionIdByKey[nextSectionId];
    if (title == null) {
      debugPrint('navigateToNextSectionId: No title found for nextSectionId: $nextSectionId');
      return;
    }

    // Add to chosen paths if not already in the array
    setState(() {
      if (!_chosenPathTitles.contains(title)) {
        _chosenPathTitles.add(title);
      }

      // Find section by title
      if (_checklist == null) return;
      final index = _checklist!.sections.indexWhere((s) => s.title == title);
      if (index < 0) {
        // Try to find by ID as fallback
        final indexById = _checklist!.sections.indexWhere((s) => s.id == nextSectionId);
        if (indexById >= 0) {
          _currentSection = indexById + 1;
        } else {
          debugPrint(
              'navigateToNextSectionId: Section not found with title: $title or ID: $nextSectionId');
        }
      } else {
        _currentSection = index + 1;
      }
    });
  }

  DiagnosticContext? _buildDiagnosticContext() {
    if (_checklist == null || _checklist!.sections.isEmpty) return null;

    // Section 1 (box check)
    if (_checklist == null || _checklist!.sections.isEmpty) return null;
    final s1 = _checklist!.sections[0];
    ChecklistItemData? getSel(String id) {
      try {
        return s1.items.firstWhere((i) => i.id == id);
      } catch (e) {
        return null;
      }
    }

    final visual = VisualContext(
      iceLocation: getSel('1-1')?.selectedOptions?.first ??
          getSel('1-1')?.selectedOption,
      boxTempBand: getSel('1-2')?.selectedOptions?.first ??
          getSel('1-2')?.selectedOption,
      allEvapFansRunning: getSel('1-3')?.selectedOptions?.first ??
          getSel('1-3')?.selectedOption,
      coilIced: getSel('1-4')?.selectedOptions?.first ??
          getSel('1-4')?.selectedOption,
      standingWater: getSel('1-5')?.selectedOptions?.first ??
          getSel('1-5')?.selectedOption,
      doorSeal: getSel('1-6')?.selectedOptions?.first ??
          getSel('1-6')?.selectedOption,
      frameHeaterStatus: getSel('1-7')?.selectedOptions?.first ??
          getSel('1-7')?.selectedOption,
    );

    // Section 2 (Condenser) - only if it exists
    if (_checklist == null || _checklist!.sections.length < 2) {
      return DiagnosticContext(
        visual: visual,
        condenser: CondenserContext(),
      );
    }

    final s2 = _checklist!.sections[1];
    ChecklistItemData? getItem(String id) {
      try {
        return s2.items.firstWhere((i) => i.id == id);
      } catch (e) {
        return null;
      }
    }

    final suctionItem = getItem('2-5');
    final suctionStr = (suctionItem?.numericInputs?.isNotEmpty == true)
        ? suctionItem!.numericInputs!.first.value
        : '';
    final dischargeStr = (suctionItem?.numericInputs != null &&
            suctionItem!.numericInputs!.length >= 2)
        ? suctionItem.numericInputs![1].value
        : '';

    final condenser = CondenserContext(
      suctionPsig: suctionStr.isNotEmpty ? double.tryParse(suctionStr) : null,
      dischargePsig:
          dischargeStr.isNotEmpty ? double.tryParse(dischargeStr) : null,
      condenserFan: getItem('2-1')?.selectedOptions?.first ??
          getItem('2-1')?.selectedOption,
      compressor: getItem('2-2')?.selectedOptions?.first ??
          getItem('2-2')?.selectedOption,
      noises: getItem('2-3')?.selectedOptions?.first ??
          getItem('2-3')?.selectedOption,
      coilDirty: getItem('2-4')?.selectedOptions?.first ??
          getItem('2-4')?.selectedOption,
      refrigerant: suctionItem?.refrigerantType,
    );

    return DiagnosticContext(visual: visual, condenser: condenser);
  }

  void _handleHypothesisChoose(Hypothesis hypothesis) {
    setState(() {
      _hypothesesOpen = false;
    });

    // Handle wrap-up case
    if (hypothesis.nextSectionId == 'wrap-up') {
      // Navigate to wrap-up section
      if (_checklist == null) return;
      final wrapUpIndex = _checklist!.sections.indexWhere((s) => s.title == 'Wrap up');
      if (wrapUpIndex >= 0) {
        setState(() {
          _chosenWrapUp = true;
          _currentSection = wrapUpIndex + 1;
        });
      }
      return;
    }

    // Navigate to the section specified by the hypothesis
    _navigateToNextSectionId(hypothesis.nextSectionId);
  }

  void _checkAndShowHypotheses() {
    // For walk-in ice-frost-build-up: show after section 2
    if (widget.unitType == 'walkIn' &&
        widget.issueId == 'ice-frost-build-up' &&
        _currentSection == 2) {
      _generateHypotheses();
      return;
    }

    // For RTU not-cooling: show after section 3 (Cooling Checks)
    if (widget.unitType == 'rtu' &&
        widget.issueId == 'not-cooling' &&
        _currentSection == 3) {
      _generateHypotheses();
      return;
    }

    // For RTU not-heating: show after section 3 (Heating Checks)
    if (widget.unitType == 'rtu' &&
        widget.issueId == 'not-heating' &&
        _currentSection == 3) {
      _generateHypotheses();
      return;
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_checklist == null || _checklist!.sections.isEmpty) {
      return const Scaffold(
        backgroundColor: Color(0xFF111827),
        body: Center(
          child: Text(
            'Loading checklist...',
            style: TextStyle(color: Colors.white),
          ),
        ),
      );
    }

    final currentSectionData = _checklist!.sections[_currentSection - 1];
    final hasBlocking = _hasActiveBlockingMessage();

    return Stack(
      children: [
        Scaffold(
          backgroundColor: const Color(0xFF111827), // gray-900
          appBar: AppBar(
            title: const Text('Service Call Checklist'),
            backgroundColor: const Color(0xFF1F2937), // gray-800
            foregroundColor: Colors.white,
            leading: IconButton(
              icon: const Icon(Icons.arrow_back),
              onPressed: () => Navigator.pop(context),
            ),
            actions: [
              if (widget.unitType == 'walkIn' || widget.unitType == 'rtu')
                IconButton(
                  icon: const Icon(Icons.lightbulb_outline),
                  onPressed: _generateHypotheses,
                  tooltip: 'Generate Hypotheses',
                ),
            ],
          ),
          body: Column(
            children: [
              // Timeline/Progress indicator
              _buildTimeline(),

              // Blocking message if present
              if (hasBlocking) _buildBlockingMessage(currentSectionData),

              // Main content
              Expanded(
                child: SingleChildScrollView(
                  padding: const EdgeInsets.all(16),
                  child: _buildSectionContent(currentSectionData),
                ),
              ),

              // Navigation buttons
              _buildNavigationButtons(),
            ],
          ),
        ),

        // Hypothesis Popup (overlay)
        if (_hypothesesOpen)
          Positioned.fill(
            child: HypothesisPopup(
              open: _hypothesesOpen,
              hypotheses: _hypotheses,
              onClose: () {
                setState(() {
                  _hypothesesOpen = false;
                });
              },
              onChoose: _handleHypothesisChoose,
            ),
          ),
      ],
    );
  }

  Widget _buildTimeline() {
    // Simplified timeline - can be enhanced later
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      color: const Color(0xFF1F2937), // gray-800
      child: Row(
        children: [
          Text(
            'Section $_currentSection of ${_checklist!.sections.length}',
            style: const TextStyle(color: Colors.white),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: LinearProgressIndicator(
              value: _currentSection / _checklist!.sections.length,
              backgroundColor: const Color(0xFF374151), // gray-700
              valueColor: const AlwaysStoppedAnimation<Color>(
                Color(0xFF2563EB), // blue-600
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildBlockingMessage(ChecklistItem section) {
    final blockingItem = section.items.firstWhere(
      (item) =>
          item.isBlockingMessage == true &&
          item.conditionalOn != null &&
          _blockingMessageResolutions[item.id] == null,
      orElse: () => ChecklistItemData(id: '', text: '', checked: false),
    );

    if (blockingItem.id.isEmpty) return const SizedBox.shrink();

    return Container(
      margin: const EdgeInsets.all(16),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFF7F1D1D), // red-900
        borderRadius: BorderRadius.circular(8),
        border: Border.all(
          color: const Color(0xFFDC2626), // red-600
          width: 2,
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(Icons.warning, color: Colors.white, size: 24),
              const SizedBox(width: 8),
              const Expanded(
                child: Text(
                  'Action Required',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Text(
            blockingItem.text,
            style: const TextStyle(color: Colors.white, fontSize: 14),
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: OutlinedButton(
                  onPressed: () {
                    _resolveBlockingMessage(blockingItem.id, 'acknowledged');
                  },
                  style: OutlinedButton.styleFrom(
                    foregroundColor: Colors.white,
                    side: const BorderSide(color: Colors.white),
                  ),
                  child: const Text('Acknowledge'),
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: ElevatedButton(
                  onPressed: () {
                    _resolveBlockingMessage(blockingItem.id, 'resolved');
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF10B981), // green-600
                    foregroundColor: Colors.white,
                  ),
                  child: const Text('Resolved'),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildSectionContent(ChecklistItem section) {
    final visibleItems = section.items
        .where((item) => _shouldShowItem(item, section))
        .toList();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          section.title,
          style: const TextStyle(
            color: Colors.white,
            fontSize: 24,
            fontWeight: FontWeight.bold,
          ),
        ),
        const SizedBox(height: 24),
        ...visibleItems.map((item) => _buildItemWidget(section.id, item)),
      ],
    );
  }

  Widget _buildItemWidget(String sectionId, ChecklistItemData item) {
    return Container(
      margin: const EdgeInsets.only(bottom: 24),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFF1F2937), // gray-800
        borderRadius: BorderRadius.circular(8),
        border: Border.all(
          color: const Color(0xFF374151), // gray-700
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Item text
          Text(
            item.text,
            style: const TextStyle(
              color: Colors.white,
              fontSize: 16,
              fontWeight: FontWeight.w500,
            ),
          ),
          const SizedBox(height: 12),

          // Options (button selection)
          if (item.options != null && item.options!.isNotEmpty)
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: item.options!.map((option) {
                final isSelected = item.selectedOptions?.contains(option) == true ||
                    item.selectedOption == option;
                return ChoiceChip(
                  label: Text(option),
                  selected: isSelected,
                  onSelected: (selected) {
                    if (selected) {
                      _updateSelectedOption(sectionId, item.id, option);
                    }
                  },
                  selectedColor: const Color(0xFF10B981), // green-600
                  labelStyle: TextStyle(
                    color: isSelected ? Colors.white : Colors.white70,
                  ),
                  backgroundColor: const Color(0xFF374151), // gray-700
                );
              }).toList(),
            ),

          // Numeric input (single)
          if (item.unit != null && item.numericValue != null)
            TextField(
              keyboardType: TextInputType.number,
              style: const TextStyle(color: Colors.white),
              decoration: InputDecoration(
                labelText: item.unit != null ? 'Value (${item.unit})' : 'Value',
                labelStyle: const TextStyle(color: Colors.grey),
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
                  borderSide: const BorderSide(
                    color: Color(0xFF2563EB), // blue-600
                    width: 2,
                  ),
                ),
              ),
              controller: TextEditingController(text: item.numericValue ?? '')
                ..selection = TextSelection.fromPosition(
                  TextPosition(offset: item.numericValue?.length ?? 0),
                ),
              onChanged: (value) {
                _updateNumericValue(sectionId, item.id, value);
              },
            ),

          // Numeric inputs (multiple)
          if (item.numericInputs != null && item.numericInputs!.isNotEmpty)
            ...item.numericInputs!.asMap().entries.map((entry) {
              final index = entry.key;
              final input = entry.value;
              return Padding(
                padding: const EdgeInsets.only(bottom: 12),
                  child: TextField(
                    keyboardType: TextInputType.number,
                    style: const TextStyle(color: Colors.white),
                    controller: TextEditingController(text: input.value)
                      ..selection = TextSelection.fromPosition(
                        TextPosition(offset: input.value.length),
                      ),
                    decoration: InputDecoration(
                      labelText: input.label +
                          (input.unit != null ? ' (${input.unit})' : ''),
                      hintText: input.placeholder,
                      labelStyle: const TextStyle(color: Colors.grey),
                      hintStyle: const TextStyle(color: Colors.grey),
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
                        borderSide: const BorderSide(
                          color: Color(0xFF2563EB), // blue-600
                          width: 2,
                        ),
                      ),
                    ),
                    onChanged: (value) {
                      _updateNumericInput(sectionId, item.id, index, value);
                    },
                  ),
              );
            }),

          // Checkbox for simple items
          if (item.options == null &&
              item.numericValue == null &&
              item.numericInputs == null)
            CheckboxListTile(
              title: const Text(''),
              value: item.checked,
              onChanged: (value) {
                _setItemChecked(sectionId, item.id, value ?? false);
              },
              activeColor: const Color(0xFF2563EB), // blue-600
              contentPadding: EdgeInsets.zero,
            ),

          // Notes textarea (show for action items or if notes field exists)
          if (item.isActionItem == true || item.text.contains('[Optional]'))
            Padding(
              padding: const EdgeInsets.only(top: 12),
              child: TextField(
                maxLines: 3,
                style: const TextStyle(color: Colors.white),
                controller: TextEditingController(text: item.notes ?? '')
                  ..selection = TextSelection.fromPosition(
                    TextPosition(offset: item.notes?.length ?? 0),
                  ),
                decoration: InputDecoration(
                  labelText: 'Notes (optional)',
                  labelStyle: const TextStyle(color: Colors.grey),
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
                    borderSide: const BorderSide(
                      color: Color(0xFF2563EB), // blue-600
                      width: 2,
                    ),
                  ),
                ),
                onChanged: (value) {
                  _updateNotes(sectionId, item.id, value);
                },
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildNavigationButtons() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: const BoxDecoration(
        color: Color(0xFF1F2937), // gray-800
        border: Border(
          top: BorderSide(color: Color(0xFF374151)), // gray-700
        ),
      ),
      child: Row(
        children: [
          if (_currentSection > 1)
            Expanded(
              child: OutlinedButton(
                onPressed: () => _goToSection(_currentSection - 1),
                style: OutlinedButton.styleFrom(
                  foregroundColor: Colors.white,
                  side: const BorderSide(color: Color(0xFF374151)),
                  padding: const EdgeInsets.symmetric(vertical: 12),
                ),
                child: const Text('Previous'),
              ),
            ),
          if (_currentSection > 1) const SizedBox(width: 12),
          Expanded(
            child: ElevatedButton(
              onPressed: _checklist != null && _currentSection < _checklist!.sections.length
                  ? () {
                      // Check if we should show hypotheses before going to next section
                      _checkAndShowHypotheses();
                      // If hypotheses weren't shown, proceed to next section
                      if (!_hypothesesOpen) {
                        _goToSection(_currentSection + 1);
                      }
                    }
                  : null,
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF2563EB), // blue-600
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 12),
              ),
              child: Text(
                _checklist != null && _currentSection < _checklist!.sections.length
                    ? 'Next Section'
                    : 'Complete',
              ),
            ),
          ),
        ],
      ),
    );
  }
}

