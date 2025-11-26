import 'package:supabase_flutter/supabase_flutter.dart';
import '../services/supabase_service.dart';
import '../models/checklist_types.dart';

class ServiceCallService {
  /// Save a service call checklist to Supabase, mirroring Next.js `saveServiceCallChecklist`.
  static Future<void> saveServiceCallChecklist({
    required String unitType,
    required String issueId,
    required ServiceCallChecklist checklist,
    required Map<String, String> readings,
    required String wrapUpNotes,
    required bool chosenWrapUp,
    required Map<String, String> blockingMessageResolutions,
    required String customIssueDescription,
    required List<dynamic> hypotheses,
    required List<String> chosenPathTitles,
    required int currentSection,
  }) async {
    if (!SupabaseService.isInitialized) {
      throw Exception('Supabase is not initialized');
    }

    final client = SupabaseService.client;

    // Get current user
    User? user = SupabaseService.currentUser;
    user ??= await SupabaseService.getUser();

    if (user == null) {
      throw Exception('User must be authenticated to save checklists');
    }

    // Best-effort fetch of org_id from users table
    Map<String, dynamic>? userData;
    try {
      final response = await client
          .from('users')
          .select('org_id')
          .eq('id', user.id)
          .single();
      userData = response;
    } catch (_) {
      userData = null;
    }

    // Check for existing service call for this user/unitType/issueId
    Map<String, dynamic>? existing;
    try {
      final response = await client
          .from('service_calls')
          .select('id')
          .eq('user_id', user.id)
          .eq('details->>unitType', unitType)
          .eq('details->>issueId', issueId)
          .maybeSingle();
      if (response is Map<String, dynamic>) {
        existing = response;
      } else {
        existing = null;
      }
    } catch (_) {
      existing = null;
    }

    // Build details JSON similar to Next.js
    final details = {
      'unitType': unitType,
      'issueId': issueId,
      'sections': checklist.sections.map((section) {
        return {
          'id': section.id,
          'title': section.title,
          'items': section.items.map((item) {
            return {
              'id': item.id,
              'text': item.text,
              'checked': item.checked,
              'status': item.status,
              'notes': item.notes,
              'images': item.images,
              'options': item.options,
              'selectedOption': item.selectedOption,
              'selectedOptions': item.selectedOptions,
              'numericInputs': item.numericInputs?.map((ni) => {
                    'label': ni.label,
                    'value': ni.value,
                    'placeholder': ni.placeholder,
                    'unit': ni.unit,
                  }).toList(),
              'numericValue': item.numericValue,
              'unit': item.unit,
              'refrigerantType': item.refrigerantType,
              'pressureValidation': item.pressureValidation != null
                  ? {
                      'suction': item.pressureValidation!.suction,
                      'discharge': item.pressureValidation!.discharge,
                    }
                  : null,
              'conditionalOn': item.conditionalOn != null
                  ? {
                      'itemId': item.conditionalOn!.itemId,
                      'option': item.conditionalOn!.option,
                    }
                  : null,
              'isBlockingMessage': item.isBlockingMessage,
              'isInfoMessage': item.isInfoMessage,
              'isActionItem': item.isActionItem,
              'customCondition': item.customCondition,
            };
          }).toList(),
        };
      }).toList(),
      'readings': readings,
      'wrapUpNotes': wrapUpNotes,
      'chosenWrapUp': chosenWrapUp,
      'blockingMessageResolutions': blockingMessageResolutions,
      'customIssueDescription': customIssueDescription,
      'hypotheses': hypotheses,
      'chosenPathTitles': chosenPathTitles,
      'currentSection': currentSection,
    };

    final record = {
      'user_id': user.id,
      'org_id': userData?['org_id'],
      'details': details,
    };

    if (existing != null && existing['id'] != null) {
      await client
          .from('service_calls')
          .update(record)
          .eq('id', existing['id']);
    } else {
      await client.from('service_calls').insert(record);
    }
  }
}


