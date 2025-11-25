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
  Map<String, String> _readings = {
    'boxTemp': '',
    'setpoint': '',
  };

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

  void _toggleItemStatus(String sectionId, String itemId) {
    _updateItem(sectionId, itemId, (item) {
      // Cycle through: unchecked -> red -> yellow -> green -> na -> unchecked
      const statusOrder = ['unchecked', 'red', 'yellow', 'green', 'na'];
      final currentStatus = item.status ?? 'unchecked';
      final currentIndex = statusOrder.indexOf(currentStatus);
      final nextIndex = (currentIndex + 1) % statusOrder.length;
      final nextStatus = statusOrder[nextIndex];
      
      return item.copyWith(
        status: nextStatus == 'unchecked' ? null : nextStatus,
        checked: nextStatus != 'unchecked',
      );
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
        final selectedValue = (referencedItem.selectedOptions?.isNotEmpty == true
                ? referencedItem.selectedOptions!.first
                : null) ??
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
              (referencedItem.selectedOptions?.isNotEmpty == true
                  ? referencedItem.selectedOptions!.first
                  : null) ??
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
            title: Text(_getAppBarTitle()),
            backgroundColor: const Color(0xFF1F2937), // gray-800
            foregroundColor: Colors.white,
            leading: IconButton(
              icon: const Icon(Icons.arrow_back),
              onPressed: () => Navigator.pop(context),
            ),
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

  String _getAppBarTitle() {
    final unitTypeName = _getUnitTypeDisplayName(widget.unitType);
    final issueName = _getIssueDisplayName(widget.issueId);
    return '$unitTypeName: $issueName';
  }

  String _getUnitTypeDisplayName(String unitType) {
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

  String _getIssueDisplayName(String issueId) {
    // Special case for short-cycling: different names for RTU vs Split Unit
    if (issueId == 'short-cycling') {
      if (widget.unitType == 'splitUnit' || widget.unitType == 'split-unit') {
        return 'Cycle / Noise';
      }
      return 'Cycle / Noise Issue';
    }

    // Special case for running-constantly: different name for reach-ins and walk-ins
    if (issueId == 'running-constantly') {
      if (widget.unitType == 'reachIn' || widget.unitType == 'reach-in' ||
          widget.unitType == 'walkIn' || widget.unitType == 'walk-in') {
        return 'Cycle Issues';
      }
      return 'Constant Run / Short Cycle';
    }

    // Special case for ice machine shared issues
    if (issueId == 'water-leaking' && widget.unitType == 'iceMachine') {
      return 'Leaking';
    }
    if (issueId == 'noisy-operation' && widget.unitType == 'iceMachine') {
      return 'Noisy';
    }
    if (issueId == 'other-alarm' && widget.unitType == 'iceMachine') {
      return 'Other';
    }

    const names = {
      'not-cooling': 'Not Cooling',
      'not-heating': 'Not Heating',
      'poor-airflow': 'Poor Airflow',
      'unit-not-running': 'Not Running',
      'unit-not-running-display': 'Not Running',
      'unit-leaking': 'Water Leaking',
      'zoning-issues': 'Zoning Issues',
      'running-warm': 'Running Warm',
      'excessive-frost': 'Excessive Frost',
      'ice-frost-build-up': 'Ice Build Up',
      'water-leaking': 'Water Leaking',
      'noisy-operation': 'Noisy Operation',
      'door-gasket-issue': 'Door Issue',
      'other-alarm': 'Other / Alarm',
      'box-too-cold': 'Box Too Cold',
      'door-seal-issue': 'Door Seal Issue',
      'fan-not-working': 'Fan Not Working',
      'temperature-fluctuation': 'Temperature Fluctuation',
      'defrost-issue': 'Defrost Issue',
      'no-ice-production': 'No/slow Ice',
      'poor-ice-quality': 'Poor Quality',
      'water-leak': 'Water Leaking',
      'machine-not-cycling': 'Cycle Issue',
      'machine-icing-up': 'Icing Up',
      'water-quality-issue': 'Water Quality Issue',
      'custom-issue': 'Custom Issue',
    };
    return names[issueId] ?? issueId;
  }

  Widget _buildTimeline() {
    if (_checklist == null) return const SizedBox.shrink();
    
    // Show only first 2 sections initially, then arrow with "Next steps based on inputs"
    // For RTU not-cooling/not-heating, also show section 3 (Cooling Checks/Heating Checks)
    final isRTUWithChecks = widget.unitType == 'rtu' && 
        (widget.issueId == 'not-cooling' || widget.issueId == 'not-heating');
    
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      color: const Color(0xFF1F2937), // gray-800
      child: SingleChildScrollView(
        scrollDirection: Axis.horizontal,
        child: Row(
          children: [
            // First 2 sections
            ...List.generate(2, (index) {
              if (index >= _checklist!.sections.length) return const SizedBox.shrink();
              final sectionNumber = index + 1;
              final isActive = sectionNumber == _currentSection;
              final section = _checklist!.sections[index];
              final isCompleted = _isSectionCompleted(section);
              
              // Get shortened label
              final label = _getSectionDescriptor(section.title);
              
              return Row(
                children: [
                  _buildStepCircle(
                    number: sectionNumber,
                    label: label,
                    isActive: isActive,
                    isCompleted: isCompleted,
                  ),
                  Container(
                    width: 40,
                    height: 2,
                    color: isCompleted
                        ? const Color(0xFF2563EB) // blue-600
                        : const Color(0xFF374151), // gray-700
                    margin: const EdgeInsets.symmetric(horizontal: 4),
                  ),
                ],
              );
            }),
            // For RTU not-cooling/not-heating, show section 3 (Cooling Checks/Heating Checks)
            if (isRTUWithChecks && _checklist!.sections.length > 2) ...[
              (() {
                final section3 = _checklist!.sections[2];
                final sectionNumber = 3;
                final isActive = sectionNumber == _currentSection;
                final isCompleted = _isSectionCompleted(section3);
                
                return Row(
                  children: [
                    _buildStepCircle(
                      number: sectionNumber,
                      label: section3.title,
                      isActive: isActive,
                      isCompleted: isCompleted,
                    ),
                    Container(
                      width: 40,
                      height: 2,
                      color: isCompleted
                          ? const Color(0xFF2563EB) // blue-600
                          : const Color(0xFF374151), // gray-700
                      margin: const EdgeInsets.symmetric(horizontal: 4),
                    ),
                  ],
                );
              })(),
            ],
            // Arrow with "Next steps based on inputs"
            Container(
              width: 40,
              height: 2,
              color: const Color(0xFF374151), // gray-700
              margin: const EdgeInsets.symmetric(horizontal: 4),
            ),
            _buildArrowStep(label: 'Next steps based on inputs'),
          ],
        ),
      ),
    );
  }
  
  String _getSectionDescriptor(String title) {
    const descriptors = {
      'Safety / Prep': 'Safety',
      'box check': 'Box',
      'Condenser check': 'Condenser',
    };
    return descriptors[title] ?? title;
  }
  
  bool _isSectionCompleted(ChecklistItem section) {
    return section.items.every((item) {
      // Skip blocking messages and info messages
      if (item.isBlockingMessage == true || item.isInfoMessage == true) return true;
      
      // Skip conditionally hidden items
      if (item.conditionalOn != null) {
        final referencedItem = section.items.firstWhere(
          (i) => i.id == item.conditionalOn!.itemId,
          orElse: () => ChecklistItemData(id: '', text: '', checked: false),
        );
        if (referencedItem.id.isNotEmpty) {
          final selectedValue = (referencedItem.selectedOptions != null && 
              referencedItem.selectedOptions!.isNotEmpty) 
              ? referencedItem.selectedOptions!.first 
              : (referencedItem.selectedOption ?? '');
          if (selectedValue != item.conditionalOn!.option) {
            return true; // Item is conditionally hidden
          }
        }
      }
      
      // Skip optional photo items
      if (item.text.toLowerCase().contains('optional') && 
          item.text.toLowerCase().contains('photo')) return true;
      
      // Check numeric inputs
      if (item.numericInputs != null && item.numericInputs!.isNotEmpty) {
        if (item.id == '2-5') {
          // Pressure recording - need both values and refrigerant type
          final hasValues = item.numericInputs!.any((input) => input.value.trim().isNotEmpty);
          final hasRefrigerant = item.refrigerantType != null && 
              item.refrigerantType!.trim().isNotEmpty;
          return hasValues && hasRefrigerant;
        }
        return item.numericInputs!.any((input) => input.value.trim().isNotEmpty);
      }
      
      // Check numeric value
      if (item.numericValue != null) {
        return item.numericValue!.trim().isNotEmpty;
      }
      
      // Check options
      if (item.options != null) {
        return (item.selectedOptions != null && item.selectedOptions!.isNotEmpty) ||
            (item.selectedOption != null && item.selectedOption!.trim().isNotEmpty);
      }
      
      // Check status
      return item.status != null && item.status != 'unchecked';
    });
  }
  
  Widget _buildArrowStep({required String label}) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(
          width: 40,
          height: 40,
          decoration: const BoxDecoration(
            color: Color(0xFF374151), // gray-700
            shape: BoxShape.circle,
          ),
          child: const Center(
            child: Text(
              '→',
              style: TextStyle(
                color: Color(0xFF9CA3AF), // gray-400
                fontSize: 16,
                fontWeight: FontWeight.bold,
              ),
            ),
          ),
        ),
        const SizedBox(height: 4),
        SizedBox(
          width: 100,
          child: Text(
            label,
            style: const TextStyle(
              color: Color(0xFF9CA3AF), // gray-400
              fontSize: 10,
              fontWeight: FontWeight.normal,
            ),
            textAlign: TextAlign.center,
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
          ),
        ),
      ],
    );
  }

  Widget _buildStatusButton(String sectionId, ChecklistItemData item) {
    Color backgroundColor;
    Color borderColor;
    String label;
    
    switch (item.status) {
      case 'green':
        backgroundColor = const Color(0xFF10B981); // green-600
        borderColor = const Color(0xFF059669); // green-500
        label = 'Good';
        break;
      case 'yellow':
        backgroundColor = const Color(0xFFEAB308); // yellow-600
        borderColor = const Color(0xFFCA8A04); // yellow-500
        label = 'Ok';
        break;
      case 'red':
        backgroundColor = const Color(0xFFDC2626); // red-600
        borderColor = const Color(0xFFB91C1C); // red-500
        label = 'Bad';
        break;
      case 'na':
        backgroundColor = const Color(0xFF6B7280); // gray-500
        borderColor = const Color(0xFF4B5563); // gray-400
        label = 'N/A';
        break;
      default:
        backgroundColor = const Color(0xFF374151); // gray-700
        borderColor = const Color(0xFF4B5563); // gray-600
        label = '○';
    }
    
    return GestureDetector(
      onTap: () => _toggleItemStatus(sectionId, item.id),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
        decoration: BoxDecoration(
          color: backgroundColor,
          borderRadius: BorderRadius.circular(8),
          border: Border.all(
            color: borderColor,
            width: 2,
          ),
        ),
        child: Text(
          label,
          style: const TextStyle(
            color: Colors.white,
            fontSize: 12,
            fontWeight: FontWeight.bold,
          ),
        ),
      ),
    );
  }

  Widget _buildStepCircle({
    required int number,
    required String label,
    required bool isActive,
    required bool isCompleted,
  }) {
    final backgroundColor = isActive
        ? const Color(0xFF2563EB) // blue-600
        : isCompleted
            ? const Color(0xFF10B981) // green-600 (completed)
            : const Color(0xFF374151); // gray-700
    
    return GestureDetector(
      onTap: () => _goToSection(number),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 40,
            height: 40,
            decoration: BoxDecoration(
              color: backgroundColor,
              shape: BoxShape.circle,
            ),
            child: Center(
              child: Text(
                '$number',
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
          ),
          const SizedBox(height: 4),
          SizedBox(
            width: 80,
            child: Text(
              label,
              style: TextStyle(
                color: isActive ? Colors.white : const Color(0xFF9CA3AF), // gray-400
                fontSize: 10,
                fontWeight: isActive ? FontWeight.w600 : FontWeight.normal,
              ),
              textAlign: TextAlign.center,
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
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
        Row(
          children: [
            Container(
              width: 48,
              height: 48,
              decoration: BoxDecoration(
                color: const Color(0xFF2563EB), // blue-600
                shape: BoxShape.circle,
                boxShadow: [
                  BoxShadow(
                    color: const Color(0xFF2563EB).withOpacity(0.3),
                    blurRadius: 8,
                    spreadRadius: 2,
                  ),
                ],
              ),
              child: Center(
                child: Text(
                  '$_currentSection',
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 24,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Text(
                section.title,
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 24,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
          ],
        ),
        const SizedBox(height: 24),
        // Box temp and setpoint inputs for Safety / Prep
        if (section.title == 'Safety / Prep') ...[
          Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'Box temp (°F)',
                      style: TextStyle(
                        color: Color(0xFF9CA3AF), // gray-400
                        fontSize: 14,
                      ),
                    ),
                    const SizedBox(height: 8),
                    TextField(
                      keyboardType: TextInputType.number,
                      style: const TextStyle(color: Colors.white),
                      controller: TextEditingController(text: _readings['boxTemp'] ?? '')
                        ..selection = TextSelection.fromPosition(
                          TextPosition(offset: (_readings['boxTemp'] ?? '').length),
                        ),
                      decoration: InputDecoration(
                        hintText: 'Enter temperature',
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
                          borderSide: const BorderSide(
                            color: Color(0xFF2563EB), // blue-600
                            width: 2,
                          ),
                        ),
                      ),
                      onChanged: (value) {
                        setState(() {
                          _readings['boxTemp'] = value;
                        });
                      },
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'Setpoint (°F)',
                      style: TextStyle(
                        color: Color(0xFF9CA3AF), // gray-400
                        fontSize: 14,
                      ),
                    ),
                    const SizedBox(height: 8),
                    TextField(
                      keyboardType: TextInputType.number,
                      style: const TextStyle(color: Colors.white),
                      controller: TextEditingController(text: _readings['setpoint'] ?? '')
                        ..selection = TextSelection.fromPosition(
                          TextPosition(offset: (_readings['setpoint'] ?? '').length),
                        ),
                      decoration: InputDecoration(
                        hintText: 'Enter setpoint',
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
                          borderSide: const BorderSide(
                            color: Color(0xFF2563EB), // blue-600
                            width: 2,
                          ),
                        ),
                      ),
                      onChanged: (value) {
                        setState(() {
                          _readings['setpoint'] = value;
                        });
                      },
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 24),
        ],
        ...visibleItems.map((item) => _buildItemWidget(section.id, item)),
      ],
    );
  }

  Widget _buildItemWidget(String sectionId, ChecklistItemData item) {
    // Check if item should show status toggle (no options, no numericValue, not optional photo, not special items)
    final shouldShowStatusToggle = item.options == null &&
        item.numericValue == null &&
        !item.text.toLowerCase().contains('optional') &&
        item.id != '2-5' &&
        item.id != '2-6';

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
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Status toggle button (only for simple items)
              if (shouldShowStatusToggle) ...[
                _buildStatusButton(sectionId, item),
                const SizedBox(width: 12),
              ],
              // Item text and content
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    GestureDetector(
                      onTap: shouldShowStatusToggle
                          ? () => _toggleItemStatus(sectionId, item.id)
                          : null,
                      child: Text(
                        item.text,
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 16,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ),
                    // Notes and photo upload section (shown when status is set)
                    if (item.status != null && item.status!.isNotEmpty) ...[
                      const SizedBox(height: 12),
                      TextField(
                        controller: TextEditingController(text: item.notes ?? '')
                          ..selection = TextSelection.fromPosition(
                            TextPosition(offset: (item.notes ?? '').length),
                          ),
                        style: const TextStyle(color: Colors.white, fontSize: 14),
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
                            borderSide: const BorderSide(
                              color: Color(0xFF2563EB), // blue-600
                              width: 2,
                            ),
                          ),
                          contentPadding: const EdgeInsets.all(12),
                        ),
                        maxLines: 2,
                        onChanged: (value) {
                          _updateNotes(sectionId, item.id, value);
                        },
                      ),
                      const SizedBox(height: 8),
                      // Photo upload section
                      Row(
                        children: [
                          const Text(
                            'Attach Photos:',
                            style: TextStyle(
                              color: Color(0xFF9CA3AF), // gray-400
                              fontSize: 12,
                            ),
                          ),
                          const SizedBox(width: 8),
                          ElevatedButton.icon(
                            onPressed: () {
                              // TODO: Implement image picker
                            },
                            icon: const Icon(Icons.add_photo_alternate, size: 16),
                            label: const Text(
                              '+ Add Photo',
                              style: TextStyle(fontSize: 12),
                            ),
                            style: ElevatedButton.styleFrom(
                              backgroundColor: const Color(0xFF2563EB), // blue-600
                              foregroundColor: Colors.white,
                              padding: const EdgeInsets.symmetric(
                                horizontal: 12,
                                vertical: 8,
                              ),
                            ),
                          ),
                        ],
                      ),
                      // Display uploaded images
                      if (item.images != null && item.images!.isNotEmpty) ...[
                        const SizedBox(height: 8),
                        Wrap(
                          spacing: 8,
                          runSpacing: 8,
                          children: item.images!.asMap().entries.map((entry) {
                            final index = entry.key;
                            final image = entry.value;
                            return Stack(
                              children: [
                                ClipRRect(
                                  borderRadius: BorderRadius.circular(4),
                                  child: Image.network(
                                    image,
                                    width: 80,
                                    height: 80,
                                    fit: BoxFit.cover,
                                  ),
                                ),
                                Positioned(
                                  top: -4,
                                  right: -4,
                                  child: IconButton(
                                    icon: const Icon(Icons.close, size: 16),
                                    color: Colors.red,
                                    onPressed: () {
                                      // TODO: Implement image removal
                                    },
                                  ),
                                ),
                              ],
                            );
                          }).toList(),
                        ),
                      ],
                    ],
                  ],
                ),
              ),
            ],
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


          // Temperature rise interpretation (calculated display)
          if (item.id == 'temperatureRiseInterpretation' && sectionId == '3')
            Builder(
              builder: (context) {
                // Get current state of the section from the checklist
                final currentSectionState = _checklist!.sections.firstWhere(
                  (s) => s.id == sectionId,
                  orElse: () => ChecklistItem(id: '', title: '', items: []),
                );
                final returnAirItem = currentSectionState.items.firstWhere(
                  (i) => i.id == 'returnAirTemp',
                  orElse: () => ChecklistItemData(id: '', text: '', checked: false),
                );
                final supplyAirItem = currentSectionState.items.firstWhere(
                  (i) => i.id == 'supplyAirTemp',
                  orElse: () => ChecklistItemData(id: '', text: '', checked: false),
                );
                
                final returnTemp = returnAirItem.numericValue?.isNotEmpty == true
                    ? double.tryParse(returnAirItem.numericValue!)
                    : null;
                final supplyTemp = supplyAirItem.numericValue?.isNotEmpty == true
                    ? double.tryParse(supplyAirItem.numericValue!)
                    : null;
                
                if (returnTemp != null && supplyTemp != null) {
                  final tempRise = supplyTemp - returnTemp;
                  String tempRiseLabel;
                  Color tempRiseColor;
                  
                  if (tempRise < 15) {
                    tempRiseLabel = 'Low temperature rise (${tempRise.toStringAsFixed(1)}°F) — possible airflow or heating element issue';
                    tempRiseColor = const Color(0xFFFBBF24); // yellow-400
                  } else if (tempRise >= 15 && tempRise <= 50) {
                    tempRiseLabel = 'Normal heating temperature rise (${tempRise.toStringAsFixed(1)}°F)';
                    tempRiseColor = const Color(0xFF10B981); // green-500
                  } else {
                    tempRiseLabel = 'High temperature rise (${tempRise.toStringAsFixed(1)}°F) — possible airflow restriction';
                    tempRiseColor = const Color(0xFFF97316); // orange-500
                  }
                  
                  return Container(
                    margin: const EdgeInsets.only(top: 12),
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: const Color(0xFF374151), // gray-700
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(
                        color: tempRiseColor.withOpacity(0.5),
                        width: 2,
                      ),
                    ),
                    child: Row(
                      children: [
                        Icon(
                          Icons.info_outline,
                          color: tempRiseColor,
                          size: 20,
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Text(
                            tempRiseLabel,
                            style: TextStyle(
                              color: tempRiseColor,
                              fontSize: 14,
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                        ),
                      ],
                    ),
                  );
                } else {
                  return Container(
                    margin: const EdgeInsets.only(top: 12),
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: const Color(0xFF374151), // gray-700
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Text(
                      'Enter both return and supply air temperatures to calculate temperature rise',
                      style: TextStyle(
                        color: const Color(0xFF9CA3AF), // gray-400
                        fontSize: 14,
                        fontStyle: FontStyle.italic,
                      ),
                    ),
                  );
                }
              },
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
      child: Column(
        children: [
          // Previous and Next buttons
          Row(
            children: [
              Expanded(
                child: OutlinedButton(
                  onPressed: _currentSection > 1
                      ? () => _goToSection(_currentSection - 1)
                      : null,
                  style: OutlinedButton.styleFrom(
                    foregroundColor: _currentSection > 1
                        ? Colors.white
                        : const Color(0xFF6B7280), // gray-500 when disabled
                    side: BorderSide(
                      color: _currentSection > 1
                          ? const Color(0xFF2563EB) // blue-600 border
                          : const Color(0xFF374151), // gray-700 when disabled
                    ),
                    backgroundColor: _currentSection > 1
                        ? const Color(0xFF1F2937) // gray-800
                        : const Color(0xFF111827), // gray-900 when disabled
                    padding: const EdgeInsets.symmetric(vertical: 12),
                  ),
                  child: const Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Text('< '),
                      Text('Previous'),
                    ],
                  ),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: OutlinedButton(
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
                  style: OutlinedButton.styleFrom(
                    foregroundColor: _checklist != null && _currentSection < _checklist!.sections.length
                        ? Colors.white
                        : const Color(0xFF6B7280), // gray-500 when disabled
                    side: BorderSide(
                      color: _checklist != null && _currentSection < _checklist!.sections.length
                          ? const Color(0xFF2563EB) // blue-600 border
                          : const Color(0xFF374151), // gray-700 when disabled
                    ),
                    backgroundColor: _checklist != null && _currentSection < _checklist!.sections.length
                        ? const Color(0xFF1F2937) // gray-800
                        : const Color(0xFF111827), // gray-900 when disabled
                    padding: const EdgeInsets.symmetric(vertical: 12),
                  ),
                  child: const Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Text('Next'),
                      Text(' >'),
                    ],
                  ),
                ),
              ),
            ],
          ),
          // Save & Return button (separate row)
          if (_currentSection < (_checklist?.sections.length ?? 0)) ...[
            const SizedBox(height: 12),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: () {
                  // TODO: Implement save & return functionality
                },
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF2563EB), // blue-600
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 12),
                ),
                child: const Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(Icons.save, size: 16),
                    SizedBox(width: 4),
                    Text('Save & Return'),
                  ],
                ),
              ),
            ),
          ],
        ],
      ),
    );
  }
}

