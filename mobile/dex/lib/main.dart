import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'services/supabase_service.dart';
import 'providers/auth_provider.dart';
import 'screens/job_type/job_type_page.dart';
import 'screens/service_call/unit_selection_page.dart';
import 'screens/service_call/service_call_page.dart';
import 'screens/auth/auth_screen.dart';
import 'navigation/app_router.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  // Load environment variables
  try {
    await dotenv.load(fileName: '.env');
  } catch (e) {
    // .env file not found - will fail gracefully during Supabase initialization
  }
  
  // Get environment variables
  final supabaseUrl = dotenv.env['SUPABASE_URL'] ?? '';
  final supabaseAnonKey = dotenv.env['SUPABASE_ANON_KEY'] ?? '';
  
  // Initialize Supabase
  if (supabaseUrl.isNotEmpty && supabaseAnonKey.isNotEmpty) {
    try {
      await SupabaseService.initialize(
        supabaseUrl: supabaseUrl,
        supabaseAnonKey: supabaseAnonKey,
      );
    } catch (e) {
      // Supabase initialization failed - will be handled by auth provider
    }
  }
  
  // Set system UI overlay style for dark theme
  SystemChrome.setSystemUIOverlayStyle(
    const SystemUiOverlayStyle(
      statusBarColor: Colors.transparent,
      statusBarIconBrightness: Brightness.light,
    ),
  );
  
  runApp(const DexApp());
}

class DexApp extends StatelessWidget {
  const DexApp({super.key});

  @override
  Widget build(BuildContext context) {
    return ChangeNotifierProvider(
      create: (_) => AuthProvider(),
      child: Consumer<AuthProvider>(
        builder: (context, authProvider, _) {
          // Show auth screen if not authenticated (including during loading to prevent flash)
          Widget home = const JobTypePage();
          if (!authProvider.isAuthenticated) {
            home = const AuthScreen();
          }
          
          return MaterialApp(
            title: 'Dex Service Copilot',
            debugShowCheckedModeBanner: false,
            theme: ThemeData(
        brightness: Brightness.dark,
        primaryColor: const Color(0xFF2563EB), // blue-600
        scaffoldBackgroundColor: const Color(0xFF111827), // gray-900
        colorScheme: const ColorScheme.dark(
          primary: Color(0xFF2563EB), // blue-600
          secondary: Color(0xFF10B981), // green-600
          tertiary: Color(0xFF9333EA), // purple-600
          surface: Color(0xFF1F2937), // gray-800
          onSurface: Colors.white,
          onPrimary: Colors.white,
        ),
        cardColor: const Color(0xFF1F2937), // gray-800
        dividerColor: const Color(0xFF374151), // gray-700
        appBarTheme: const AppBarTheme(
          backgroundColor: Color(0xFF1F2937), // gray-800
          foregroundColor: Colors.white,
          elevation: 0,
        ),
        textTheme: const TextTheme(
          displayLarge: TextStyle(color: Colors.white),
          displayMedium: TextStyle(color: Colors.white),
          displaySmall: TextStyle(color: Colors.white),
          headlineLarge: TextStyle(color: Colors.white),
          headlineMedium: TextStyle(color: Colors.white),
          headlineSmall: TextStyle(color: Colors.white),
          titleLarge: TextStyle(color: Colors.white),
          titleMedium: TextStyle(color: Colors.white),
          titleSmall: TextStyle(color: Colors.white),
          bodyLarge: TextStyle(color: Colors.white),
          bodyMedium: TextStyle(color: Colors.white),
          bodySmall: TextStyle(color: Colors.white),
        ),
      ),
      home: home,
      routes: {
        AppRouter.serviceCallUnitSelection: (context) => const ServiceCallUnitSelectionPage(),
        AppRouter.serviceCall: (context) => const ServiceCallPage(),
      },
      onGenerateRoute: (settings) {
        // Handle routes with parameters
        if (settings.name == AppRouter.pmSummary) {
          // TODO: Implement PM summary page
          return MaterialPageRoute(
            builder: (context) => Scaffold(
              appBar: AppBar(
                leading: IconButton(
                  icon: const Icon(Icons.arrow_back, color: Colors.white),
                  onPressed: () => Navigator.of(context).pop(),
                ),
                title: const Text('PM Summary'),
              ),
              body: const Center(
                child: Text('PM Summary - Coming Soon'),
              ),
            ),
          );
        }
        if (settings.name == AppRouter.troubleshooting) {
          // TODO: Implement troubleshooting page
          return MaterialPageRoute(
            builder: (context) => const Scaffold(
              body: Center(
                child: Text('Troubleshooting - Coming Soon'),
              ),
            ),
          );
        }
        return null;
      },
            );
          },
        ),
      );
    }
  }
