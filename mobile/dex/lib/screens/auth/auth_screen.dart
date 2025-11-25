import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/auth_provider.dart';
import '../../services/supabase_service.dart';

class AuthScreen extends StatefulWidget {
  const AuthScreen({super.key});

  @override
  State<AuthScreen> createState() => _AuthScreenState();
}

class _AuthScreenState extends State<AuthScreen> {
  final _formKey = GlobalKey<FormState>();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _confirmPasswordController = TextEditingController();
  final _nameController = TextEditingController();
  
  bool _isSignUp = false;
  String _role = 'technician';
  String? _selectedOrgId;
  bool _showOrgList = false;
  List<Map<String, dynamic>> _organizations = [];
  bool _orgsLoading = false;

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    _confirmPasswordController.dispose();
    _nameController.dispose();
    super.dispose();
  }

  Future<void> _fetchOrganizations() async {
    if (_orgsLoading || _organizations.isNotEmpty) return;
    
    setState(() {
      _orgsLoading = true;
    });

    try {
      final orgs = await SupabaseService.getOrganizations();
      if (mounted) {
        setState(() {
          _organizations = orgs;
          _orgsLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _orgsLoading = false;
        });
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to load organizations: $e')),
        );
      }
    }
  }

  Future<void> _handleAuth() async {
    if (!_formKey.currentState!.validate()) return;

    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    authProvider.clearError();

    if (_isSignUp) {
      if (_passwordController.text != _confirmPasswordController.text) {
        // Error will be shown via form validation
        return;
      }

      final success = await authProvider.signUp(
        email: _emailController.text.trim(),
        password: _passwordController.text,
        name: _nameController.text.trim(),
        role: _role,
        orgId: _selectedOrgId,
      );

      if (success && mounted) {
        // Show welcome dialog
        showDialog(
          context: context,
          barrierDismissible: false,
          builder: (context) => _WelcomeDialog(
            onGetStarted: () {
              Navigator.of(context).pop(); // Close welcome dialog
              Navigator.of(context).pop(); // Close auth screen
            },
          ),
        );
        
        setState(() {
          _emailController.clear();
          _passwordController.clear();
          _confirmPasswordController.clear();
          _nameController.clear();
          _role = 'technician';
          _selectedOrgId = null;
          _showOrgList = false;
        });
      }
    } else {
      final success = await authProvider.signIn(
        email: _emailController.text.trim(),
        password: _passwordController.text,
      );

      if (success && mounted) {
        // Navigation will be handled by the app based on auth state
        Navigator.of(context).pop();
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final authProvider = Provider.of<AuthProvider>(context);

    return Scaffold(
      backgroundColor: const Color(0xFF111827), // gray-900
      appBar: AppBar(
        title: const Text('Authentication'),
        backgroundColor: const Color(0xFF1F2937), // gray-800
        foregroundColor: Colors.white,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Text(
                _isSignUp ? 'Sign Up' : 'Sign In',
                style: const TextStyle(
                  fontSize: 32,
                  fontWeight: FontWeight.bold,
                  color: Colors.white,
                ),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 32),

              if (_isSignUp) ...[
                // Name field
                TextFormField(
                  controller: _nameController,
                  decoration: const InputDecoration(
                    labelText: 'Name',
                    labelStyle: TextStyle(color: Color(0xFF9CA3AF)),
                    hintText: 'John Doe',
                    hintStyle: TextStyle(color: Color(0xFF6B7280)),
                  ),
                  style: const TextStyle(color: Colors.white),
                  validator: (value) {
                    if (value == null || value.trim().isEmpty) {
                      return 'Name is required';
                    }
                    return null;
                  },
                ),
                const SizedBox(height: 16),

                // Role selection
                const Text(
                  'Role',
                  style: TextStyle(
                    color: Color(0xFF9CA3AF),
                    fontSize: 14,
                    fontWeight: FontWeight.w500,
                  ),
                ),
                const SizedBox(height: 8),
                Row(
                  children: [
                    Expanded(
                      child: ChoiceChip(
                        label: const Text('Technician'),
                        selected: _role == 'technician',
                        onSelected: (selected) {
                          if (selected) {
                            setState(() => _role = 'technician');
                          }
                        },
                        selectedColor: const Color(0xFF2563EB),
                        labelStyle: TextStyle(
                          color: _role == 'technician' ? Colors.white : const Color(0xFF9CA3AF),
                        ),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: ChoiceChip(
                        label: const Text('Manager'),
                        selected: _role == 'manager',
                        onSelected: (selected) {
                          if (selected) {
                            setState(() => _role = 'manager');
                          }
                        },
                        selectedColor: const Color(0xFF2563EB),
                        labelStyle: TextStyle(
                          color: _role == 'manager' ? Colors.white : const Color(0xFF9CA3AF),
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 16),
              ],

              // Email field
              TextFormField(
                controller: _emailController,
                keyboardType: TextInputType.emailAddress,
                decoration: const InputDecoration(
                  labelText: 'Email',
                  labelStyle: TextStyle(color: Color(0xFF9CA3AF)),
                  hintText: 'you@example.com',
                  hintStyle: TextStyle(color: Color(0xFF6B7280)),
                ),
                style: const TextStyle(color: Colors.white),
                validator: (value) {
                  if (value == null || value.isEmpty) {
                    return 'Email is required';
                  }
                  if (!value.contains('@')) {
                    return 'Please enter a valid email';
                  }
                  return null;
                },
              ),
              const SizedBox(height: 16),

              // Password field
              TextFormField(
                controller: _passwordController,
                obscureText: true,
                decoration: const InputDecoration(
                  labelText: 'Password',
                  labelStyle: TextStyle(color: Color(0xFF9CA3AF)),
                  hintText: '••••••••',
                  hintStyle: TextStyle(color: Color(0xFF6B7280)),
                ),
                style: const TextStyle(color: Colors.white),
                validator: (value) {
                  if (value == null || value.isEmpty) {
                    return 'Password is required';
                  }
                  if (value.length < 6) {
                    return 'Password must be at least 6 characters';
                  }
                  return null;
                },
              ),
              const SizedBox(height: 16),

              // Confirm password field (sign up only)
              if (_isSignUp) ...[
                TextFormField(
                  controller: _confirmPasswordController,
                  obscureText: true,
                  decoration: InputDecoration(
                    labelText: 'Confirm Password',
                    labelStyle: const TextStyle(color: Color(0xFF9CA3AF)),
                    hintText: '••••••••',
                    hintStyle: const TextStyle(color: Color(0xFF6B7280)),
                    errorText: _confirmPasswordController.text.isNotEmpty &&
                            _passwordController.text != _confirmPasswordController.text
                        ? 'Passwords do not match'
                        : null,
                  ),
                  style: const TextStyle(color: Colors.white),
                  validator: (value) {
                    if (value == null || value.isEmpty) {
                      return 'Please confirm your password';
                    }
                    if (value != _passwordController.text) {
                      return 'Passwords do not match';
                    }
                    return null;
                  },
                ),
                const SizedBox(height: 16),

                // Organization selection
                const Text(
                  'Organization (Optional)',
                  style: TextStyle(
                    color: Color(0xFF9CA3AF),
                    fontSize: 14,
                    fontWeight: FontWeight.w500,
                  ),
                ),
                const SizedBox(height: 8),
                if (_orgsLoading)
                  const Center(
                    child: Padding(
                      padding: EdgeInsets.all(16.0),
                      child: CircularProgressIndicator(),
                    ),
                  )
                else if (_organizations.isEmpty)
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: const Color(0xFF374151),
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(color: const Color(0xFF4B5563)),
                    ),
                    child: const Center(
                      child: Text(
                        'No organizations available',
                        style: TextStyle(color: Color(0xFF9CA3AF)),
                      ),
                    ),
                  )
                else
                  GestureDetector(
                    onTap: () {
                      if (_organizations.isEmpty) {
                        _fetchOrganizations();
                      } else {
                        setState(() => _showOrgList = !_showOrgList);
                      }
                    },
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 16),
                      decoration: BoxDecoration(
                        color: const Color(0xFF374151),
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(color: const Color(0xFF4B5563)),
                      ),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(
                            _selectedOrgId == null
                                ? 'Select an organization'
                                : _organizations
                                    .firstWhere((org) => org['id'] == _selectedOrgId)['org_name'],
                            style: TextStyle(
                              color: _selectedOrgId == null
                                  ? const Color(0xFF9CA3AF)
                                  : Colors.white,
                            ),
                          ),
                          Icon(
                            _showOrgList ? Icons.arrow_drop_up : Icons.arrow_drop_down,
                            color: const Color(0xFF9CA3AF),
                          ),
                        ],
                      ),
                    ),
                  ),
                if (_showOrgList && _organizations.isNotEmpty)
                  Container(
                    margin: const EdgeInsets.only(top: 4),
                    decoration: BoxDecoration(
                      color: const Color(0xFF374151),
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(color: const Color(0xFF4B5563)),
                    ),
                    child: Column(
                      children: [
                        ListTile(
                          title: const Text(
                            'None',
                            style: TextStyle(color: Colors.white),
                          ),
                          selected: _selectedOrgId == null,
                          selectedTileColor: const Color(0xFF4B5563),
                          onTap: () {
                            setState(() {
                              _selectedOrgId = null;
                              _showOrgList = false;
                            });
                          },
                        ),
                        ..._organizations.map((org) => ListTile(
                              title: Text(
                                org['org_name'],
                                style: const TextStyle(color: Colors.white),
                              ),
                              selected: _selectedOrgId == org['id'],
                              selectedTileColor: const Color(0xFF4B5563),
                              onTap: () {
                                setState(() {
                                  _selectedOrgId = org['id'];
                                  _showOrgList = false;
                                });
                              },
                            )),
                      ],
                    ),
                  ),
                const SizedBox(height: 16),
              ],

              // Error message
              if (authProvider.error != null) ...[
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: const Color(0xFF7F1D1D).withOpacity(0.2),
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: const Color(0xFFDC2626)),
                  ),
                  child: Text(
                    authProvider.error!,
                    style: const TextStyle(color: Color(0xFFFCA5A5)),
                  ),
                ),
                const SizedBox(height: 16),
              ],

              // Submit button
              ElevatedButton(
                onPressed: authProvider.loading ? null : _handleAuth,
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF2563EB),
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(8),
                  ),
                ),
                child: authProvider.loading
                    ? const SizedBox(
                        height: 20,
                        width: 20,
                        child: CircularProgressIndicator(
                          strokeWidth: 2,
                          valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                        ),
                      )
                    : Text(_isSignUp ? 'Sign Up' : 'Sign In'),
              ),
              const SizedBox(height: 16),

              // Toggle sign up/sign in
              TextButton(
                onPressed: () {
                  setState(() {
                    _isSignUp = !_isSignUp;
                    authProvider.clearError();
                    _nameController.clear();
                    _role = 'technician';
                    _selectedOrgId = null;
                    _showOrgList = false;
                    _confirmPasswordController.clear();
                    if (_isSignUp) {
                      _fetchOrganizations();
                    }
                  });
                },
                child: Text(
                  _isSignUp
                      ? 'Already have an account? Sign in'
                      : "Don't have an account? Sign up",
                  style: const TextStyle(color: Color(0xFF60A5FA)),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _WelcomeDialog extends StatelessWidget {
  final VoidCallback onGetStarted;

  const _WelcomeDialog({required this.onGetStarted});

  @override
  Widget build(BuildContext context) {
    return Dialog(
      backgroundColor: const Color(0xFF1F2937),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: const BorderSide(color: Color(0xFF374151)),
      ),
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 64,
              height: 64,
              decoration: const BoxDecoration(
                color: Color(0xFF10B981),
                shape: BoxShape.circle,
              ),
              child: const Icon(
                Icons.check,
                color: Colors.white,
                size: 32,
              ),
            ),
            const SizedBox(height: 16),
            const Text(
              'Welcome to Dex!',
              style: TextStyle(
                fontSize: 24,
                fontWeight: FontWeight.bold,
                color: Colors.white,
              ),
            ),
            const SizedBox(height: 8),
            const Text(
              'Your account has been created successfully. You\'re all set to start using Dex Service Copilot.',
              textAlign: TextAlign.center,
              style: TextStyle(
                color: Color(0xFF9CA3AF),
                fontSize: 14,
              ),
            ),
            const SizedBox(height: 24),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: onGetStarted,
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF2563EB),
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 12),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(8),
                  ),
                ),
                child: const Text('Get Started'),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

