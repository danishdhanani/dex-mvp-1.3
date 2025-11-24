/// Type definitions for service call checklists
/// Ported from TypeScript types.ts

class ChecklistItemData {
  final String id;
  final String text;
  final bool checked;
  final String? status; // 'red' | 'yellow' | 'green' | 'na' | 'unchecked'
  final String? notes;
  final List<String>? images;
  final List<String>? options;
  final String? selectedOption;
  final List<String>? selectedOptions;
  final List<NumericInput>? numericInputs;
  final String? numericValue;
  final String? unit;
  final String? refrigerantType;
  final PressureValidation? pressureValidation;
  final ConditionalOn? conditionalOn;
  final bool? isBlockingMessage;
  final bool? isInfoMessage;
  final bool? isActionItem;
  final bool? customCondition;

  ChecklistItemData({
    required this.id,
    required this.text,
    this.checked = false,
    this.status,
    this.notes,
    this.images,
    this.options,
    this.selectedOption,
    this.selectedOptions,
    this.numericInputs,
    this.numericValue,
    this.unit,
    this.refrigerantType,
    this.pressureValidation,
    this.conditionalOn,
    this.isBlockingMessage,
    this.isInfoMessage,
    this.isActionItem,
    this.customCondition,
  });

  ChecklistItemData copyWith({
    String? id,
    String? text,
    bool? checked,
    String? status,
    String? notes,
    List<String>? images,
    List<String>? options,
    String? selectedOption,
    List<String>? selectedOptions,
    List<NumericInput>? numericInputs,
    String? numericValue,
    String? unit,
    String? refrigerantType,
    PressureValidation? pressureValidation,
    ConditionalOn? conditionalOn,
    bool? isBlockingMessage,
    bool? isInfoMessage,
    bool? isActionItem,
    bool? customCondition,
  }) {
    return ChecklistItemData(
      id: id ?? this.id,
      text: text ?? this.text,
      checked: checked ?? this.checked,
      status: status ?? this.status,
      notes: notes ?? this.notes,
      images: images ?? this.images,
      options: options ?? this.options,
      selectedOption: selectedOption ?? this.selectedOption,
      selectedOptions: selectedOptions ?? this.selectedOptions,
      numericInputs: numericInputs ?? this.numericInputs,
      numericValue: numericValue ?? this.numericValue,
      unit: unit ?? this.unit,
      refrigerantType: refrigerantType ?? this.refrigerantType,
      pressureValidation: pressureValidation ?? this.pressureValidation,
      conditionalOn: conditionalOn ?? this.conditionalOn,
      isBlockingMessage: isBlockingMessage ?? this.isBlockingMessage,
      isInfoMessage: isInfoMessage ?? this.isInfoMessage,
      isActionItem: isActionItem ?? this.isActionItem,
      customCondition: customCondition ?? this.customCondition,
    );
  }
}

class ChecklistItem {
  final String id;
  final String title;
  final List<ChecklistItemData> items;

  ChecklistItem({
    required this.id,
    required this.title,
    required this.items,
  });
}

class ServiceCallChecklist {
  final String unitType;
  final String issueType;
  final List<ChecklistItem> sections;

  ServiceCallChecklist({
    required this.unitType,
    required this.issueType,
    required this.sections,
  });
}

class NumericInput {
  final String label;
  final String value;
  final String? placeholder;
  final String? unit;

  NumericInput({
    required this.label,
    required this.value,
    this.placeholder,
    this.unit,
  });
}

class PressureValidation {
  final String suction;
  final String discharge;

  PressureValidation({
    required this.suction,
    required this.discharge,
  });
}

class ConditionalOn {
  final String itemId;
  final String? option;
  // Note: In Dart, we'll use a function type for custom conditions
  // final bool Function(String)? condition;

  ConditionalOn({
    required this.itemId,
    this.option,
  });
}

