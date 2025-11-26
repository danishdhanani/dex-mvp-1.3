import 'package:supabase_flutter/supabase_flutter.dart';
import '../services/supabase_service.dart';
import '../config/pm_checklist_config.dart';

class PMService {
  /// Save a PM checklist to the database, mirroring Next.js `savePMChecklist`.
  static Future<void> savePMChecklist({
    required String unitId,
    required PMChecklist checklist,
    required Map<String, String> readings,
    required int currentSection,
  }) async {
    // Ensure Supabase is ready
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

    // Get user's org_id from users table (best-effort)
    Map<String, dynamic>? userData;
    try {
      final response = await client
          .from('users')
          .select('org_id')
          .eq('id', user.id)
          .single();
      userData = response;
    } catch (_) {
      // If this fails, continue without org_id (same behavior as web)
      userData = null;
    }

    // Check if a checklist already exists for this user/unit combination
    Map<String, dynamic>? existing;
    try {
      final response = await client
          .from('preventative_maintenance')
          .select('id')
          .eq('user_id', user.id)
          .eq('details->>unitId', unitId)
          .maybeSingle();
      if (response is Map<String, dynamic>) {
        existing = response;
      } else {
        existing = null;
      }
    } catch (_) {
      existing = null;
    }

    // Build details JSON, mirroring the Next.js structure
    final details = {
      'unitId': unitId,
      'sections': checklist.sections.map((s) => s.toJson()).toList(),
      'readings': readings,
      'currentSection': currentSection,
    };

    final record = {
      'user_id': user.id,
      'org_id': userData?['org_id'],
      'details': details,
    };

    if (existing != null && existing['id'] != null) {
      // Update existing record
      await client
          .from('preventative_maintenance')
          .update(record)
          .eq('id', existing['id']);
    } else {
      // Insert new record
      await client.from('preventative_maintenance').insert(record);
    }
  }
}

