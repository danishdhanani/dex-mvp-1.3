import 'package:flutter/material.dart';
import '../models/diagnostic_context.dart';

class HypothesisPopup extends StatelessWidget {
  final bool open;
  final List<Hypothesis> hypotheses;
  final VoidCallback onClose;
  final Function(Hypothesis) onChoose;

  const HypothesisPopup({
    super.key,
    required this.open,
    required this.hypotheses,
    required this.onClose,
    required this.onChoose,
  });

  @override
  Widget build(BuildContext context) {
    if (!open) return const SizedBox.shrink();

    // Separate wrap-up hypothesis from troubleshooting suggestions
    final wrapUpHypothesis = hypotheses.firstWhere(
      (h) => h.nextSectionId == 'wrap-up',
      orElse: () => Hypothesis(
        id: '',
        label: '',
        reason: '',
        confidence: 0,
        nextSectionId: '',
      ),
    );
    final hasWrapUp = wrapUpHypothesis.id.isNotEmpty;
    final troubleshootingHypotheses = hypotheses
        .where((h) => h.nextSectionId != 'wrap-up')
        .toList();

    return Material(
      color: Colors.black.withOpacity(0.6),
      child: Center(
        child: Container(
          margin: const EdgeInsets.all(16),
          constraints: const BoxConstraints(maxWidth: 500),
          decoration: BoxDecoration(
            color: const Color(0xFF1F2937), // gray-800
            borderRadius: BorderRadius.circular(12),
            border: Border.all(
              color: const Color(0xFF374151), // gray-700
            ),
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              // Header
              Padding(
                padding: const EdgeInsets.all(20),
                child: Row(
                  children: [
                    const Expanded(
                      child: Text(
                        'Suggested next steps',
                        style: TextStyle(
                          color: Colors.white,
                          fontSize: 18,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                    IconButton(
                      icon: const Icon(Icons.close, color: Colors.white),
                      onPressed: onClose,
                    ),
                  ],
                ),
              ),

              // Content - scrollable
              Flexible(
                child: SingleChildScrollView(
                  padding: const EdgeInsets.symmetric(horizontal: 20),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Wrap-up section
                      if (hasWrapUp) ...[
                        const Text(
                          'Wrap up if you think you\'ve resolved the root cause',
                          style: TextStyle(
                            color: Color(0xFFD1D5DB), // gray-300
                            fontSize: 14,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                        const SizedBox(height: 8),
                        Container(
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            color: const Color(0xFF065F46).withOpacity(0.2), // green-900/20
                            borderRadius: BorderRadius.circular(8),
                            border: Border.all(
                              color: const Color(0xFF16A34A), // green-700
                            ),
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                wrapUpHypothesis.label,
                                style: const TextStyle(
                                  color: Colors.white,
                                  fontSize: 16,
                                  fontWeight: FontWeight.w500,
                                ),
                              ),
                              const SizedBox(height: 4),
                              Text(
                                wrapUpHypothesis.reason,
                                style: const TextStyle(
                                  color: Color(0xFFD1D5DB), // gray-300
                                  fontSize: 14,
                                ),
                              ),
                              const SizedBox(height: 12),
                              Align(
                                alignment: Alignment.centerRight,
                                child: ElevatedButton(
                                  onPressed: () => onChoose(wrapUpHypothesis),
                                  style: ElevatedButton.styleFrom(
                                    backgroundColor: const Color(0xFF16A34A), // green-600
                                    foregroundColor: Colors.white,
                                  ),
                                  child: const Text('Go to Wrap up'),
                                ),
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(height: 24),
                      ],

                      // Troubleshooting section
                      if (troubleshootingHypotheses.isNotEmpty) ...[
                        const Text(
                          'Or continue troubleshooting',
                          style: TextStyle(
                            color: Color(0xFFD1D5DB), // gray-300
                            fontSize: 14,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                        const SizedBox(height: 12),
                        ...troubleshootingHypotheses.map((hypothesis) {
                          return Container(
                            margin: const EdgeInsets.only(bottom: 12),
                            padding: const EdgeInsets.all(12),
                            decoration: BoxDecoration(
                              color: const Color(0xFF374151), // gray-700
                              borderRadius: BorderRadius.circular(8),
                              border: Border.all(
                                color: const Color(0xFF4B5563), // gray-600
                              ),
                            ),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  hypothesis.label,
                                  style: const TextStyle(
                                    color: Colors.white,
                                    fontSize: 16,
                                    fontWeight: FontWeight.w500,
                                  ),
                                ),
                                const SizedBox(height: 4),
                                Text(
                                  hypothesis.reason,
                                  style: const TextStyle(
                                    color: Color(0xFFD1D5DB), // gray-300
                                    fontSize: 14,
                                  ),
                                ),
                                const SizedBox(height: 12),
                                Align(
                                  alignment: Alignment.centerRight,
                                  child: ElevatedButton(
                                    onPressed: () => onChoose(hypothesis),
                                    style: ElevatedButton.styleFrom(
                                      backgroundColor: const Color(0xFF2563EB), // blue-600
                                      foregroundColor: Colors.white,
                                    ),
                                    child: const Text('Check this'),
                                  ),
                                ),
                              ],
                            ),
                          );
                        }),
                      ],
                    ],
                  ),
                ),
              ),

              // Footer
              Padding(
                padding: const EdgeInsets.all(20),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.end,
                  children: [
                    TextButton(
                      onPressed: onClose,
                      style: TextButton.styleFrom(
                        foregroundColor: Colors.white,
                        backgroundColor: const Color(0xFF374151), // gray-700
                      ),
                      child: const Text('Close'),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

