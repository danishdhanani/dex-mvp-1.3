import 'package:flutter/foundation.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../services/supabase_service.dart';

class AuthProvider with ChangeNotifier {
  User? _user;
  Map<String, dynamic>? _userData;
  bool _loading = true;
  String? _error;

  User? get user => _user;
  Map<String, dynamic>? get userData => _userData;
  bool get loading => _loading;
  String? get error => _error;
  bool get isAuthenticated => _user != null;
  String? get userRole => _userData?['role'] as String?;
  bool get isManager => userRole == 'manager';

  AuthProvider() {
    _initialize();
  }

  Future<void> _initialize() async {
    _loading = true;
    notifyListeners();

    try {
      // Wait a bit to ensure Supabase is fully initialized
      if (!SupabaseService.isInitialized) {
        await Future.delayed(const Duration(milliseconds: 100));
      }
      
      // Get current user
      try {
        _user = await SupabaseService.getUser();
        
        if (_user != null) {
          // Fetch user data from users table
          try {
            _userData = await SupabaseService.getUserData(_user!.id);
          } catch (e) {
            // If user data fetch fails, that's okay - user might not have a record yet
            _userData = null;
          }
        }
      } catch (e) {
        // If getUser fails, user is not logged in - that's fine
        _user = null;
        _userData = null;
      }

      // Listen for auth state changes
      SupabaseService.authStateChanges.listen((AuthState state) async {
        _user = state.session?.user;
        
        if (_user != null) {
          try {
            _userData = await SupabaseService.getUserData(_user!.id);
          } catch (e) {
            _userData = null;
          }
        } else {
          _userData = null;
        }
        
        _loading = false;
        notifyListeners();
      });
    } catch (e) {
      _error = null; // Don't show initialization errors to user
    } finally {
      _loading = false;
      notifyListeners();
    }
  }

  Future<bool> signUp({
    required String email,
    required String password,
    required String name,
    required String role,
    String? orgId,
  }) async {
    _loading = true;
    _error = null;
    notifyListeners();

    try {
      final response = await SupabaseService.signUp(
        email: email,
        password: password,
      );

      // With PKCE / mobile flows, Supabase may not always return the user directly.
      // Try multiple ways to get the newly created user so we can mirror the Next.js behavior.
      User? newUser = response.user;

      // Fallback 1: use the current auth user if signUp didn't return one
      newUser ??= SupabaseService.currentUser;

      // Fallback 2: explicitly call getUser()
      newUser ??= await SupabaseService.getUser();

      if (newUser != null) {
        // Try to create user record in users table.
        // If this fails (e.g. RLS), log it but don't block signup – same behavior as the Next.js app.
        try {
          await SupabaseService.createUserRecord(
            userId: newUser.id,
            name: name,
            role: role,
            orgId: orgId,
          );
        } catch (e) {
          if (kDebugMode) {
            print('Error creating user record: $e');
          }
          // Continue anyway – auth user exists, record can be created later/admin-side.
        }

        // Fetch user data (may still be null if insert failed or record doesn't exist yet)
        _user = newUser;
        try {
          _userData = await SupabaseService.getUserData(newUser.id);
        } catch (_) {
          _userData = null;
        }
        
        _loading = false;
        notifyListeners();
        return true;
      } else {
        _error = 'Failed to create account';
        _loading = false;
        notifyListeners();
        return false;
      }
    } catch (e) {
      // Extract user-friendly error message
      String errorMessage = 'An error occurred';
      if (e.toString().contains('Invalid login credentials')) {
        errorMessage = 'Invalid email or password';
      } else if (e.toString().contains('User already registered')) {
        errorMessage = 'An account with this email already exists';
      } else if (e.toString().contains('not initialized')) {
        errorMessage = 'Authentication service is not configured. Please check your settings.';
      } else {
        errorMessage = e.toString().replaceAll('Exception: ', '').replaceAll('Exception(', '').replaceAll(')', '');
      }
      _error = errorMessage;
      _loading = false;
      notifyListeners();
      return false;
    }
  }

  Future<bool> signIn({
    required String email,
    required String password,
  }) async {
    _loading = true;
    _error = null;
    // Don't set user to null here - keep previous state to prevent navigation flash
    notifyListeners();

    try {
      final response = await SupabaseService.signIn(
        email: email,
        password: password,
      );

      if (response.user != null && response.session != null) {
        // Only update user state if we have a valid session
        _user = response.user;
        try {
          _userData = await SupabaseService.getUserData(response.user!.id);
        } catch (e) {
          // If user data fetch fails, that's okay - user might not have a record yet
          _userData = null;
        }
        
        _loading = false;
        notifyListeners();
        return true;
      } else {
        _error = 'Failed to sign in';
        _loading = false;
        notifyListeners();
        return false;
      }
    } catch (e) {
      // Extract user-friendly error message
      String errorMessage = 'An error occurred';
      if (e.toString().contains('Invalid login credentials')) {
        errorMessage = 'Invalid email or password';
      } else if (e.toString().contains('not initialized')) {
        errorMessage = 'Authentication service is not configured. Please check your settings.';
      } else if (e.toString().contains('Auth session missing')) {
        errorMessage = 'Authentication service error. Please check your configuration.';
      } else {
        errorMessage = e.toString().replaceAll('Exception: ', '').replaceAll('Exception(', '').replaceAll(')', '');
      }
      _error = errorMessage;
      _loading = false;
      // Ensure user remains null on error to stay on auth screen
      _user = null;
      _userData = null;
      notifyListeners();
      return false;
    }
  }

  Future<void> signOut() async {
    _loading = true;
    notifyListeners();

    try {
      await SupabaseService.signOut();
      _user = null;
      _userData = null;
    } catch (e) {
      _error = e.toString();
    } finally {
      _loading = false;
      notifyListeners();
    }
  }

  void clearError() {
    _error = null;
    notifyListeners();
  }
}

