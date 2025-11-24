/// Diagnostic context models for decision tree logic
/// Ported from rules.ts

class VisualContext {
  final String? iceLocation; // 'door' | 'evap fans' | 'walls near piping' | 'product' | 'other'
  final String? boxTempBand; // 'around setpoint' | '10+ above setpoint' | '10+ below setpoint'
  final String? allEvapFansRunning; // 'yes' | 'no' | 'unsure'
  final String? coilIced; // 'clear' | 'light frost' | 'heavy ice'
  final String? standingWater; // 'dry' | 'some water' | 'ice buildup'
  final String? doorSeal; // 'fully sealed' | 'partially sealed' | 'held open'
  final String? frameHeaterStatus; // 'warm to touch (normal)' | 'cold to touch (not heating)' | 'not sure / no frame heaters present'

  VisualContext({
    this.iceLocation,
    this.boxTempBand,
    this.allEvapFansRunning,
    this.coilIced,
    this.standingWater,
    this.doorSeal,
    this.frameHeaterStatus,
  });
}

class CondenserContext {
  final double? suctionPsig;
  final double? dischargePsig;
  final String? condenserFan; // 'Yes' | 'No' | 'Intermittent'
  final String? compressor; // 'Yes' | 'No' | 'Short-cycling'
  final String? noises; // 'None' | 'Noise' | 'Vibration' | 'Burnt smell'
  final String? coilDirty; // 'Clean' | 'Moderate debris' | 'Heavily clogged'
  final String? refrigerant; // 'R-404A' | 'R-448A/R-449A' | 'R-134a'

  CondenserContext({
    this.suctionPsig,
    this.dischargePsig,
    this.condenserFan,
    this.compressor,
    this.noises,
    this.coilDirty,
    this.refrigerant,
  });
}

class DiagnosticContext {
  final VisualContext visual;
  final CondenserContext condenser;

  DiagnosticContext({
    required this.visual,
    required this.condenser,
  });
}

class Hypothesis {
  final String id;
  final String label;
  final String reason;
  final double confidence; // 0..1
  final String nextSectionId;

  Hypothesis({
    required this.id,
    required this.label,
    required this.reason,
    required this.confidence,
    required this.nextSectionId,
  });
}

class CondenserFanAmpData {
  final int fanNumber;
  final double? measuredAmps;
  final double? nameplateAmps;
  final double? ratio; // calculated: measuredAmps / nameplateAmps

  CondenserFanAmpData({
    required this.fanNumber,
    this.measuredAmps,
    this.nameplateAmps,
    this.ratio,
  });
}

class CondenserFanBladeData {
  final int fanNumber;
  final String? bladeCondition; // 'Intact' | 'Damaged' | 'Hitting shroud' | 'Not checked'

  CondenserFanBladeData({
    required this.fanNumber,
    this.bladeCondition,
  });
}

class RTUCoolingChecksContext {
  final String? supplyFanRunning; // 'Yes' | 'No' | 'Intermittent' | 'Not sure'
  final String? supplyAirflowStrength; // 'Strong' | 'Weak' | 'None' | 'Not checked'
  final String? filtersCondition; // 'Clean' | 'Moderately dirty' | 'Clogged' | 'Missing'
  final String? evapCoilCondition; // 'Clean' | 'Dirty' | 'Light frost' | 'Heavily iced'
  final String? condenserFanStatus; // 'All running' | 'One or more not running' | 'Running weak' | 'Not sure'
  final String? condenserCoilCondition; // 'Clean' | 'Moderately dirty' | 'Very dirty / restricted'
  final String? compressorStatus; // 'Running normally' | 'Not running' | 'Buzzing / not starting' | 'Short-cycling' | 'Not sure'
  final String? noiseVibration; // 'None' | 'Fan noise' | 'Compressor noise' | 'Vibration' | 'Other'
  final double? returnAirTemp;
  final double? supplyAirTemp;
  final List<CondenserFanAmpData>? condenserFanAmps;
  final List<CondenserFanBladeData>? condenserFanBlades;

  RTUCoolingChecksContext({
    this.supplyFanRunning,
    this.supplyAirflowStrength,
    this.filtersCondition,
    this.evapCoilCondition,
    this.condenserFanStatus,
    this.condenserCoilCondition,
    this.compressorStatus,
    this.noiseVibration,
    this.returnAirTemp,
    this.supplyAirTemp,
    this.condenserFanAmps,
    this.condenserFanBlades,
  });
}

class RTUHeatingChecksContext {
  final String? heatingSystemType; // 'Gas (natural or propane)' | 'Electric heat strips' | 'Heat pump' | 'Not sure'
  final String? supplyFanRunning; // 'Yes' | 'No' | 'Intermittent' | 'Not sure'
  final String? supplyAirflowStrength; // 'Strong' | 'Weak' | 'None' | 'Not checked'
  final String? filtersCondition; // 'Clean' | 'Moderately dirty' | 'Clogged' | 'Missing'
  final String? heatingElementStatus; // 'Yes - producing heat' | 'No - not operating' | 'Intermittent' | 'Not sure'
  final String? gasValveEnergized; // 'Yes' | 'No' | 'Not checked'
  final String? burnersLit; // 'Yes' | 'No' | 'Not visible'
  final String? electricHeatOn; // 'Yes' | 'No' | 'Not checked'
  final String? heatPumpRunning; // 'Yes' | 'No' | 'Not checked'
  final String? noiseVibration; // 'None' | 'Fan noise' | 'Gas valve noise' | 'Electric heat noise' | 'Vibration' | 'Other'
  final double? returnAirTemp;
  final double? supplyAirTemp;

  RTUHeatingChecksContext({
    this.heatingSystemType,
    this.supplyFanRunning,
    this.supplyAirflowStrength,
    this.filtersCondition,
    this.heatingElementStatus,
    this.gasValveEnergized,
    this.burnersLit,
    this.electricHeatOn,
    this.heatPumpRunning,
    this.noiseVibration,
    this.returnAirTemp,
    this.supplyAirTemp,
  });
}

