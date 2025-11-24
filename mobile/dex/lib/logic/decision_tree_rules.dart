/// Decision tree rules for generating hypotheses
/// Ported from rules.ts

import '../models/diagnostic_context.dart';

class DecisionTreeRules {
  // Centralized labels for easy editing
  static const Map<String, String> hypothesisLabels = {
    'defrost': 'Defrost system not clearing coil',
    'doorHeater': 'Door / frame heater failure',
    'evapFan': 'Evaporator fan not running / iced',
    'condenserAirflow': 'High head / condenser airflow issue',
    'general': 'General walk-in diagnostics',
  };

  /// Generate hypotheses based on diagnostic context
  static List<Hypothesis> generateHypotheses(DiagnosticContext ctx) {
    final List<Hypothesis> out = [];

    // Rule 1: heavy iced coil and defrost heaters not energizing
    if (ctx.visual.coilIced == 'heavy ice' &&
        ctx.condenser.compressor == 'Yes' &&
        ctx.condenser.condenserFan != null &&
        ctx.condenser.condenserFan!.isNotEmpty) {
      out.add(Hypothesis(
        id: 'defrost',
        label: hypothesisLabels['defrost']!,
        reason: 'Coil shows heavy ice and system appears to run without clearing',
        confidence: 0.9,
        nextSectionId: 'defrostDiagnostics',
      ));
    }

    // Rule 2: door ice + frame heater cold
    if (ctx.visual.iceLocation == 'door' &&
        ctx.visual.frameHeaterStatus != null &&
        ctx.visual.frameHeaterStatus!.contains('cold')) {
      out.add(Hypothesis(
        id: 'doorHeater',
        label: hypothesisLabels['doorHeater']!,
        reason: 'Ice accumulates at door and frame heaters are cold',
        confidence: 0.85,
        nextSectionId: 'doorInfiltrationChecks',
      ));
    }

    // Rule 3: evap fans not running
    if (ctx.visual.allEvapFansRunning == 'no') {
      out.add(Hypothesis(
        id: 'evapFan',
        label: hypothesisLabels['evapFan']!,
        reason: 'Evaporator fans reported not running',
        confidence: 0.8,
        nextSectionId: 'evapFanChecks',
      ));
    }

    // Rule 4: high head pattern
    if (ctx.condenser.suctionPsig != null &&
        ctx.condenser.dischargePsig != null &&
        ctx.condenser.suctionPsig! < 15 &&
        ctx.condenser.dischargePsig! > 260) {
      out.add(Hypothesis(
        id: 'condenserAirflow',
        label: hypothesisLabels['condenserAirflow']!,
        reason: 'Low suction with very high head pressure',
        confidence: 0.7,
        nextSectionId: 'condenserAirflowChecks',
      ));
    }

    // Default: general diagnostics if no specific pattern detected
    if (out.isEmpty) {
      out.add(Hypothesis(
        id: 'general',
        label: hypothesisLabels['general']!,
        reason: 'No specific fault pattern detected',
        confidence: 0.4,
        nextSectionId: 'generalDiagnostics',
      ));
    }

    // Sort by confidence desc
    out.sort((a, b) => b.confidence.compareTo(a.confidence));
    return out;
  }

  /// Generate RTU cooling hypotheses
  static List<Hypothesis> generateRTUCoolingHypotheses(
      RTUCoolingChecksContext ctx) {
    final Map<String, double> scores = {
      'airflow': 0,
      'condenser': 0,
      'compressor': 0,
      'refrigerant': 0,
      'control': 0,
    };

    final Map<String, List<String>> reasons = {
      'airflow': [],
      'condenser': [],
      'compressor': [],
      'refrigerant': [],
      'control': [],
    };

    // Calculate delta T
    double? deltaT;
    if (ctx.returnAirTemp != null && ctx.supplyAirTemp != null) {
      deltaT = ctx.returnAirTemp! - ctx.supplyAirTemp!;
    }

    // A. Airflow issue scoring
    if (ctx.supplyFanRunning == 'No' || ctx.supplyFanRunning == 'Intermittent') {
      scores['airflow'] = scores['airflow']! + 3;
      reasons['airflow']!.add(
          'Supply fan ${ctx.supplyFanRunning?.toLowerCase() ?? 'unknown'}');
    }
    if (ctx.supplyAirflowStrength == 'Weak' ||
        ctx.supplyAirflowStrength == 'None') {
      scores['airflow'] = scores['airflow']! + 3;
      reasons['airflow']!
          .add('Airflow ${ctx.supplyAirflowStrength?.toLowerCase() ?? 'unknown'}');
    }
    if (ctx.filtersCondition == 'Clogged') {
      scores['airflow'] = scores['airflow']! + 4;
      reasons['airflow']!.add('Filters clogged');
    }
    if (ctx.evapCoilCondition == 'Heavily iced') {
      scores['airflow'] = scores['airflow']! + 4;
      reasons['airflow']!.add('Evap coil heavily iced');
    }
    if (deltaT != null && deltaT > 25) {
      scores['airflow'] = scores['airflow']! + 3;
      reasons['airflow']!.add('High ΔT (${deltaT.toStringAsFixed(1)}°F)');
    }

    // B. Condenser issue scoring
    if (ctx.condenserFanStatus == 'One or more not running') {
      scores['condenser'] = scores['condenser']! + 4;
      reasons['condenser']!.add('Condenser fan(s) not running');
    }
    if (ctx.condenserFanStatus == 'Running weak') {
      scores['condenser'] = scores['condenser']! + 2;
      reasons['condenser']!.add('Condenser fan running weak');
    }
    if (ctx.condenserCoilCondition == 'Very dirty / restricted') {
      scores['condenser'] = scores['condenser']! + 4;
      reasons['condenser']!.add('Condenser coil very dirty');
    }
    if (ctx.noiseVibration == 'Fan noise') {
      scores['condenser'] = scores['condenser']! + 2;
      reasons['condenser']!.add('Fan noise detected');
    }

    // B.1. Condenser fan blade condition scoring
    if (ctx.condenserFanBlades != null && ctx.condenserFanBlades!.isNotEmpty) {
      for (final bladeData in ctx.condenserFanBlades!) {
        if (bladeData.bladeCondition == 'Damaged' ||
            bladeData.bladeCondition == 'Hitting shroud') {
          scores['condenser'] = scores['condenser']! + 2;
          if (bladeData.bladeCondition == 'Damaged') {
            reasons['condenser']!
                .add('Fan ${bladeData.fanNumber} blade damaged');
          } else if (bladeData.bladeCondition == 'Hitting shroud') {
            reasons['condenser']!
                .add('Fan ${bladeData.fanNumber} blade hitting shroud');
          }
        }
      }
    }

    // B.2. Condenser fan amp scoring
    if (ctx.condenserFanAmps != null && ctx.condenserFanAmps!.isNotEmpty) {
      bool hasHighAmps = false;
      bool hasModerateAmps = false;

      for (final ampData in ctx.condenserFanAmps!) {
        if (ampData.ratio != null &&
            ampData.measuredAmps != null &&
            ampData.measuredAmps! > 0 &&
            ampData.nameplateAmps != null &&
            ampData.nameplateAmps! > 0) {
          if (ampData.ratio! > 1.3) {
            scores['condenser'] = scores['condenser']! + 4;
            hasHighAmps = true;
          } else if (ampData.ratio! > 1.1) {
            scores['condenser'] = scores['condenser']! + 2;
            hasModerateAmps = true;
          }
        }
      }

      if (hasHighAmps) {
        reasons['condenser']!.add(
            'Condenser fan amps are above nameplate, suggesting motor overload or restriction');
      } else if (hasModerateAmps) {
        reasons['condenser']!.add('Condenser fan amps slightly elevated');
      }
    }

    // C. Compressor/start issue scoring
    if (ctx.compressorStatus == 'Not running') {
      scores['compressor'] = scores['compressor']! + 5;
      reasons['compressor']!.add('Compressor not running');
    }
    if (ctx.compressorStatus == 'Buzzing / not starting') {
      scores['compressor'] = scores['compressor']! + 5;
      reasons['compressor']!.add('Compressor buzzing/not starting');
    }
    if (ctx.compressorStatus == 'Short-cycling') {
      scores['compressor'] = scores['compressor']! + 4;
      reasons['compressor']!.add('Compressor short-cycling');
    }
    if (ctx.noiseVibration == 'Compressor noise') {
      scores['compressor'] = scores['compressor']! + 2;
      reasons['compressor']!.add('Compressor noise detected');
    }
    if (ctx.noiseVibration == 'Vibration') {
      scores['compressor'] = scores['compressor']! + 2;
      reasons['compressor']!.add('Vibration detected');
    }

    // D. Low-capacity / refrigerant-side issue scoring
    if (deltaT != null && deltaT < 10) {
      scores['refrigerant'] = scores['refrigerant']! + 4;
      reasons['refrigerant']!
          .add('Low ΔT (${deltaT.toStringAsFixed(1)}°F)');

      // Extra weight if everything else looks normal
      if (ctx.compressorStatus == 'Running normally' &&
          ctx.condenserFanStatus == 'All running' &&
          ctx.filtersCondition != 'Clogged' &&
          ctx.evapCoilCondition != 'Heavily iced') {
        scores['refrigerant'] = scores['refrigerant']! + 3;
        reasons['refrigerant']!
            .add('System appears normal but low cooling capacity');
      }
    }

    // E. Control/economizer issue (fallback when everything looks normal)
    int normalCount = 0;
    if (ctx.compressorStatus == 'Running normally') normalCount++;
    if (ctx.condenserFanStatus == 'All running') normalCount++;
    if (ctx.filtersCondition == 'Clean' || ctx.filtersCondition == null) {
      normalCount++;
    }
    if (ctx.evapCoilCondition == 'Clean' || ctx.evapCoilCondition == null) {
      normalCount++;
    }
    if (deltaT != null && deltaT >= 10 && deltaT <= 25) normalCount++;

    if (normalCount >= 4 && scores.values.every((s) => s < 3)) {
      scores['control'] = scores['control']! + 2;
      reasons['control']!
          .add('System components appear normal, possible control issue');
    }

    // Generate hypotheses from scores
    final List<Hypothesis> hypotheses = [];

    if (scores['airflow']! >= 3) {
      hypotheses.add(Hypothesis(
        id: 'airflow',
        label: 'Airflow restriction or fan issue',
        reason: reasons['airflow']!.join('; '),
        confidence: (scores['airflow']! / 10).clamp(0.0, 1.0),
        nextSectionId: 'airflowDiagnostics',
      ));
    }

    if (scores['condenser']! >= 3) {
      hypotheses.add(Hypothesis(
        id: 'condenser',
        label: 'Condenser fan or coil issue',
        reason: reasons['condenser']!.join('; '),
        confidence: (scores['condenser']! / 10).clamp(0.0, 1.0),
        nextSectionId: 'condenserDiagnostics',
      ));
    }

    if (scores['compressor']! >= 3) {
      hypotheses.add(Hypothesis(
        id: 'compressor',
        label: 'Compressor or start circuit issue',
        reason: reasons['compressor']!.join('; '),
        confidence: (scores['compressor']! / 10).clamp(0.0, 1.0),
        nextSectionId: 'compressorDiagnostics',
      ));
    }

    if (scores['refrigerant']! >= 3) {
      hypotheses.add(Hypothesis(
        id: 'refrigerant',
        label: 'Low refrigerant or capacity issue',
        reason: reasons['refrigerant']!.join('; '),
        confidence: (scores['refrigerant']! / 10).clamp(0.0, 1.0),
        nextSectionId: 'refrigerantDiagnostics',
      ));
    }

    if (scores['control']! >= 2) {
      hypotheses.add(Hypothesis(
        id: 'control',
        label: 'Control or economizer issue',
        reason: reasons['control']!.join('; '),
        confidence: (scores['control']! / 10).clamp(0.0, 1.0),
        nextSectionId: 'controlDiagnostics',
      ));
    }

    // Default if no specific issue found
    if (hypotheses.isEmpty) {
      hypotheses.add(Hypothesis(
        id: 'general',
        label: 'General RTU cooling diagnostics',
        reason: 'No specific fault pattern detected',
        confidence: 0.4,
        nextSectionId: 'generalDiagnostics',
      ));
    }

    // Sort by confidence desc
    hypotheses.sort((a, b) => b.confidence.compareTo(a.confidence));
    return hypotheses;
  }

  /// Generate RTU heating hypotheses
  static List<Hypothesis> generateRTUHeatingHypotheses(
      RTUHeatingChecksContext ctx) {
    // Simplified implementation - full version would match the web logic
    final List<Hypothesis> hypotheses = [];

    if (ctx.heatingElementStatus == 'No - not operating' ||
        ctx.gasValveEnergized == 'No' ||
        ctx.burnersLit == 'No') {
      hypotheses.add(Hypothesis(
        id: 'heating',
        label: 'Heating element or gas valve issue',
        reason: 'Heating system not producing heat',
        confidence: 0.8,
        nextSectionId: 'heatingDiagnostics',
      ));
    }

    if (hypotheses.isEmpty) {
      hypotheses.add(Hypothesis(
        id: 'general',
        label: 'General RTU heating diagnostics',
        reason: 'No specific fault pattern detected',
        confidence: 0.4,
        nextSectionId: 'generalDiagnostics',
      ));
    }

    return hypotheses;
  }

  /// Generate next step suggestions based on context
  static List<String> generateNextStepSuggestions(
      DiagnosticContext ctx, List<Hypothesis> hypotheses) {
    // Simplified implementation
    if (hypotheses.isNotEmpty) {
      return [
        'Focus on ${hypotheses.first.label}',
        'Check ${hypotheses.first.nextSectionId}',
      ];
    }
    return ['Continue with general diagnostics'];
  }
}

