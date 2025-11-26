import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../navigation/app_router.dart';
import '../../providers/auth_provider.dart';

class JobTypePage extends StatelessWidget {
  const JobTypePage({super.key});

  void _handleJobTypeSelect(BuildContext context, String jobType) {
    switch (jobType) {
      case 'PM':
        // Navigate to PM summary page
        Navigator.pushNamed(context, AppRouter.pmSummary);
        break;
      case 'service':
        // Navigate to service call unit selection
        Navigator.pushNamed(context, AppRouter.serviceCallUnitSelection);
        break;
      case 'chatbot':
        // Navigate to chatbot page
        Navigator.pushNamed(context, AppRouter.serviceCall);
        break;
    }
  }

  void _handleSignOut(BuildContext context, AuthProvider authProvider) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: const Color(0xFF1F2937),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(12),
          side: const BorderSide(color: Color(0xFF374151)),
        ),
        title: const Row(
          children: [
            Icon(
              Icons.warning_amber_rounded,
              color: Color(0xFFEAB308),
              size: 32,
            ),
            SizedBox(width: 12),
            Expanded(
              child: Text(
                'Sign Out?',
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 24,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
          ],
        ),
        content: const Text(
          'Are you sure you want to sign out? You\'ll need to sign in again to access your account.',
          style: TextStyle(
            color: Color(0xFF9CA3AF),
            fontSize: 14,
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            style: TextButton.styleFrom(
              foregroundColor: Colors.white,
              backgroundColor: const Color(0xFF374151),
            ),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () async {
              Navigator.of(context).pop();
              await authProvider.signOut();
              // Navigation will be handled automatically by the auth state change
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFFDC2626),
              foregroundColor: Colors.white,
            ),
            child: const Text('Sign Out'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: Column(
          children: [
            // Top bar with sign out button
            Consumer<AuthProvider>(
              builder: (context, authProvider, _) {
                return Padding(
                  padding: const EdgeInsets.all(16.0),
                  child: Align(
                    alignment: Alignment.topRight,
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        // User email (hidden on small screens)
                        if (MediaQuery.of(context).size.width > 400)
                          Padding(
                            padding: const EdgeInsets.only(right: 12.0),
                            child: Text(
                              authProvider.user?.email ?? '',
                              style: const TextStyle(
                                fontSize: 14,
                                color: Color(0xFF9CA3AF),
                              ),
                            ),
                          ),
                        // Sign out button
                        TextButton(
                          onPressed: () => _handleSignOut(context, authProvider),
                          style: TextButton.styleFrom(
                            backgroundColor: const Color(0xFF374151), // gray-700
                            foregroundColor: Colors.white,
                            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(8),
                            ),
                          ),
                          child: const Text(
                            'Sign Out',
                            style: TextStyle(
                              fontSize: 14,
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                );
              },
            ),
            
            // Main content - scrollable
            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.symmetric(horizontal: 16.0),
                child: ConstrainedBox(
                  constraints: BoxConstraints(
                    minHeight: MediaQuery.of(context).size.height - 
                              MediaQuery.of(context).padding.top - 
                              MediaQuery.of(context).padding.bottom - 
                              100, // Account for top bar and safe area
                  ),
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      // Header
                      const Column(
                        children: [
                          // Logo icon
                          CircleAvatar(
                            radius: 24,
                            backgroundColor: Color(0xFF374151), // gray-600
                            child: Icon(
                              Icons.settings,
                              color: Colors.white,
                              size: 24,
                            ),
                          ),
                          SizedBox(height: 12),
                          const Text(
                            'Dex Service Copilot',
                            style: TextStyle(
                              fontSize: 24,
                              fontWeight: FontWeight.bold,
                              color: Colors.white,
                            ),
                          ),
                          const SizedBox(height: 8),
                          const Text(
                            'What type of job are you on today?',
                            style: TextStyle(
                              fontSize: 16,
                              color: Color(0xFF9CA3AF), // gray-400
                            ),
                          ),
                        ],
                      ),
                      
                      const SizedBox(height: 32),
                      
                      // Job Type Selection Grid
                      LayoutBuilder(
                        builder: (context, constraints) {
                          final isTablet = constraints.maxWidth > 600;
                          return GridView.count(
                            shrinkWrap: true,
                            physics: const NeverScrollableScrollPhysics(),
                            crossAxisCount: isTablet ? 3 : 1,
                            mainAxisSpacing: 16,
                            crossAxisSpacing: 16,
                            childAspectRatio: isTablet ? 1.0 : 2.2,
                            children: [
                              // PM Job Type
                              _JobTypeCard(
                                title: 'Preventive Maintenance (PM)',
                                icon: Icons.check_circle,
                                color: const Color(0xFF2563EB), // blue-600
                                onTap: () => _handleJobTypeSelect(context, 'PM'),
                              ),
                              
                              // Service Call Job Type
                              _JobTypeCard(
                                title: 'Service Call',
                                icon: Icons.phone,
                                color: const Color(0xFF10B981), // green-600
                                onTap: () => _handleJobTypeSelect(context, 'service'),
                              ),
                              
                              // Chatbot Job Type
                              _JobTypeCard(
                                title: 'Ad hoc Chatbot',
                                icon: Icons.chat_bubble,
                                color: const Color(0xFF9333EA), // purple-600
                                onTap: () => _handleJobTypeSelect(context, 'chatbot'),
                              ),
                            ],
                          );
                        },
                      ),
                      
                      const SizedBox(height: 24),
                      
                      // Footer Note
                      const Padding(
                        padding: EdgeInsets.only(bottom: 16.0),
                        child: Text(
                          'Select the type of job to access the right tools and resources',
                          style: TextStyle(
                            fontSize: 12,
                            color: Color(0xFF6B7280), // gray-500
                          ),
                          textAlign: TextAlign.center,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _JobTypeCard extends StatelessWidget {
  final String title;
  final IconData icon;
  final Color color;
  final VoidCallback onTap;

  const _JobTypeCard({
    required this.title,
    required this.icon,
    required this.color,
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
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 20),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(12),
            border: Border.all(
              color: const Color(0xFF374151), // gray-700
              width: 2,
            ),
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              CircleAvatar(
                radius: 28,
                backgroundColor: color,
                child: Icon(
                  icon,
                  color: Colors.white,
                  size: 28,
                ),
              ),
              const SizedBox(height: 10),
              Flexible(
                child: Text(
                  title,
                  style: const TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                    color: Colors.white,
                  ),
                  textAlign: TextAlign.center,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
