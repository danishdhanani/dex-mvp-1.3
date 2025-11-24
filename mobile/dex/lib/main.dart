import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'screens/job_type/job_type_page.dart';
import 'screens/service_call/unit_selection_page.dart';
import 'screens/service_call/service_call_page.dart';
import 'navigation/app_router.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
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
      home: const JobTypePage(),
      routes: {
        AppRouter.serviceCallUnitSelection: (context) => const ServiceCallUnitSelectionPage(),
        AppRouter.serviceCall: (context) => const ServiceCallPage(),
      },
      onGenerateRoute: (settings) {
        // Handle routes with parameters
        if (settings.name == AppRouter.pmSummary) {
          // TODO: Implement PM summary page
          return MaterialPageRoute(
            builder: (context) => const Scaffold(
              body: Center(
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
  }
}
