import 'package:supabase_flutter/supabase_flutter.dart';

class SupabaseService {
  static SupabaseClient get client => Supabase.instance.client;
  
  static bool _initialized = false;
  
  static Future<void> initialize({
    required String supabaseUrl,
    required String supabaseAnonKey,
  }) async {
    if (supabaseUrl.isEmpty || supabaseAnonKey.isEmpty) {
      throw Exception('Supabase URL and Anon Key are required');
    }
    
    await Supabase.initialize(
      url: supabaseUrl,
      anonKey: supabaseAnonKey,
      authOptions: const FlutterAuthClientOptions(
        authFlowType: AuthFlowType.pkce,
      ),
    );
    _initialized = true;
  }
  
  static bool get isInitialized => _initialized;
  
  static void _ensureInitialized() {
    if (!_initialized) {
      throw Exception('Supabase is not initialized. Make sure SUPABASE_URL and SUPABASE_ANON_KEY are set in .env file.');
    }
  }
  
  static User? get currentUser => client.auth.currentUser;
  
  static Stream<AuthState> get authStateChanges => client.auth.onAuthStateChange;
  
  static Future<AuthResponse> signUp({
    required String email,
    required String password,
  }) async {
    _ensureInitialized();
    return await client.auth.signUp(
      email: email,
      password: password,
    );
  }
  
  static Future<AuthResponse> signIn({
    required String email,
    required String password,
  }) async {
    _ensureInitialized();
    return await client.auth.signInWithPassword(
      email: email,
      password: password,
    );
  }
  
  static Future<void> signOut() async {
    await client.auth.signOut();
  }
  
  static Future<User?> getUser() async {
    _ensureInitialized();
    try {
      final response = await client.auth.getUser();
      return response.user;
    } catch (e) {
      // If there's no session, that's okay - user is just not logged in
      if (e.toString().contains('session') || e.toString().contains('missing')) {
        return null;
      }
      rethrow;
    }
  }
  
  // Database queries
  static Future<Map<String, dynamic>?> getUserData(String userId) async {
    _ensureInitialized();
    try {
      final response = await client
          .from('users')
          .select()
          .eq('id', userId)
          .single();
      return response;
    } catch (e) {
      return null;
    }
  }
  
  static Future<List<Map<String, dynamic>>> getOrganizations() async {
    _ensureInitialized();
    final response = await client
        .from('orgs')
        .select('id, org_name')
        .order('org_name', ascending: true);
    return List<Map<String, dynamic>>.from(response);
  }
  
  static Future<void> createUserRecord({
    required String userId,
    required String name,
    required String role,
    String? orgId,
  }) async {
    _ensureInitialized();

    // Build insert payload and only include org_id when it's actually set.
    final Map<String, dynamic> payload = {
      'id': userId,
      'role': role,
      'name': name,
    };

    // Treat empty string as "no org" as well, to mirror the Next.js behavior (orgId || null).
    if (orgId != null && orgId.isNotEmpty) {
      payload['org_id'] = orgId;
    }

    await client.from('users').insert(payload);
  }
}

