'use client';

export type OptionValue = string | undefined;

export interface VisualContext {
	iceLocation?: OptionValue; // 'door' | 'evap fans' | 'walls near piping' | 'product' | 'other'
	boxTempBand?: OptionValue; // 'around setpoint' | '10+ above setpoint' | '10+ below setpoint'
	allEvapFansRunning?: OptionValue; // 'yes' | 'no' | 'unsure'
	coilIced?: OptionValue; // 'clear' | 'light frost' | 'heavy ice'
	standingWater?: OptionValue; // 'dry' | 'some water' | 'ice buildup'
	doorSeal?: OptionValue; // 'fully sealed' | 'partially sealed' | 'held open'
	frameHeaterStatus?: OptionValue; // 'warm to touch (normal)' | 'cold to touch (not heating)' | 'not sure / no frame heaters present'
}

export interface CondenserContext {
	suctionPsig?: number;
	dischargePsig?: number;
	condenserFan?: OptionValue; // 'Yes' | 'No' | 'Intermittent'
	compressor?: OptionValue; // 'Yes' | 'No' | 'Short-cycling'
	noises?: OptionValue; // 'None' | 'Noise' | 'Vibration' | 'Burnt smell'
	coilDirty?: OptionValue; // 'Clean' | 'Moderate debris' | 'Heavily clogged'
	refrigerant?: OptionValue; // 'R-404A' | 'R-448A/R-449A' | 'R-134a'
}

export interface DiagnosticContext {
	visual: VisualContext;
	condenser: CondenserContext;
}

export interface Hypothesis {
	id: string;
	label: string;
	reason: string;
	confidence: number; // 0..1
	nextSectionId: string;
}

// Centralized labels for easy editing
export const HYPOTHESIS_LABELS = {
	defrost: 'Defrost system not clearing coil',
	doorHeater: 'Door / frame heater failure',
	evapFan: 'Evaporator fan not running / iced',
	condenserAirflow: 'High head / condenser airflow issue',
	general: 'General walk-in diagnostics'
} as const;

export function generateHypotheses(ctx: DiagnosticContext): Hypothesis[] {
	const out: Hypothesis[] = [];

	// Rule 1: heavy iced coil and defrost heaters not energizing
	// We infer defrost heater behavior from visual.coilIced and lack of clearing; condenser rule uses separate UI usually.
	if (ctx.visual.coilIced === 'heavy ice' && ctx.condenser?.compressor === 'Yes' && ctx.condenser?.condenserFan) {
		out.push({
			id: 'defrost',
			label: HYPOTHESIS_LABELS.defrost,
			reason: 'Coil shows heavy ice and system appears to run without clearing',
			confidence: 0.9,
			nextSectionId: 'defrostDiagnostics'
		});
	}

	// Rule 2: door ice + frame heater cold
	if (ctx.visual.iceLocation === 'door' && ctx.visual.frameHeaterStatus?.includes('cold')) {
		out.push({
			id: 'doorHeater',
			label: HYPOTHESIS_LABELS.doorHeater,
			reason: 'Ice accumulates at door and frame heaters are cold',
			confidence: 0.85,
			nextSectionId: 'doorInfiltrationChecks'
		});
	}

	// Rule 3: evap fans not running
	if (ctx.visual.allEvapFansRunning === 'no') {
		out.push({
			id: 'evapFan',
			label: HYPOTHESIS_LABELS.evapFan,
			reason: 'Evaporator fans reported not running',
			confidence: 0.8,
			nextSectionId: 'evapFanChecks'
		});
	}

	// Rule 4: high head pattern
	if (
		ctx.condenser.suctionPsig !== undefined &&
		ctx.condenser.dischargePsig !== undefined &&
		ctx.condenser.suctionPsig < 15 &&
		ctx.condenser.dischargePsig > 260
	) {
		out.push({
			id: 'condenserAirflow',
			label: HYPOTHESIS_LABELS.condenserAirflow,
			reason: 'Low suction with very high head pressure',
			confidence: 0.7,
			nextSectionId: 'condenserAirflowChecks'
		});
	}

	if (out.length === 0) {
		out.push({
			id: 'general',
			label: HYPOTHESIS_LABELS.general,
			reason: 'No specific fault pattern detected',
			confidence: 0.4,
			nextSectionId: 'generalDiagnostics'
		});
	}

	// Sort by confidence desc
	return out.sort((a, b) => b.confidence - a.confidence);
}

export interface CondenserFanAmpData {
	fanNumber: number;
	measuredAmps?: number;
	nameplateAmps?: number;
	ratio?: number; // calculated: measuredAmps / nameplateAmps
}

export interface CondenserFanBladeData {
	fanNumber: number;
	bladeCondition?: OptionValue; // 'Intact' | 'Damaged' | 'Hitting shroud' | 'Not checked'
}

export interface RTUCoolingChecksContext {
	supplyFanRunning?: OptionValue; // 'Yes' | 'No' | 'Intermittent' | 'Not sure'
	supplyAirflowStrength?: OptionValue; // 'Strong' | 'Weak' | 'None' | 'Not checked'
	filtersCondition?: OptionValue; // 'Clean' | 'Moderately dirty' | 'Clogged' | 'Missing'
	evapCoilCondition?: OptionValue; // 'Clean' | 'Dirty' | 'Light frost' | 'Heavily iced'
	condenserFanStatus?: OptionValue; // 'All running' | 'One or more not running' | 'Running weak' | 'Not sure'
	condenserCoilCondition?: OptionValue; // 'Clean' | 'Moderately dirty' | 'Very dirty / restricted'
	compressorStatus?: OptionValue; // 'Running normally' | 'Not running' | 'Buzzing / not starting' | 'Short-cycling' | 'Not sure'
	noiseVibration?: OptionValue; // 'None' | 'Fan noise' | 'Compressor noise' | 'Vibration' | 'Other'
	returnAirTemp?: number;
	supplyAirTemp?: number;
	condenserFanAmps?: CondenserFanAmpData[]; // Optional amp data for suspect condenser fans
	condenserFanBlades?: CondenserFanBladeData[]; // Optional blade condition data for condenser fans
}

export interface RTUHeatingChecksContext {
	heatingSystemType?: OptionValue; // 'Gas (natural or propane)' | 'Electric heat strips' | 'Heat pump' | 'Not sure'
	supplyFanRunning?: OptionValue; // 'Yes' | 'No' | 'Intermittent' | 'Not sure'
	supplyAirflowStrength?: OptionValue; // 'Strong' | 'Weak' | 'None' | 'Not checked'
	filtersCondition?: OptionValue; // 'Clean' | 'Moderately dirty' | 'Clogged' | 'Missing'
	heatingElementStatus?: OptionValue; // 'Yes - producing heat' | 'No - not operating' | 'Intermittent' | 'Not sure'
	gasValveEnergized?: OptionValue; // 'Yes' | 'No' | 'Not checked'
	burnersLit?: OptionValue; // 'Yes' | 'No' | 'Not visible'
	electricHeatOn?: OptionValue; // 'Yes' | 'No' | 'Not checked'
	heatPumpRunning?: OptionValue; // 'Yes' | 'No' | 'Not checked'
	noiseVibration?: OptionValue; // 'None' | 'Fan noise' | 'Gas valve noise' | 'Electric heat noise' | 'Vibration' | 'Other'
	returnAirTemp?: number;
	supplyAirTemp?: number;
}

export function generateRTUCoolingHypotheses(ctx: RTUCoolingChecksContext): Hypothesis[] {
	const scores: Record<string, number> = {
		airflow: 0,
		condenser: 0,
		compressor: 0,
		refrigerant: 0,
		control: 0
	};
	
	const reasons: Record<string, string[]> = {
		airflow: [],
		condenser: [],
		compressor: [],
		refrigerant: [],
		control: []
	};
	
	// Calculate delta T
	const deltaT = (ctx.returnAirTemp !== undefined && ctx.supplyAirTemp !== undefined) 
		? ctx.returnAirTemp - ctx.supplyAirTemp 
		: null;
	
	// A. Airflow issue scoring
	if (ctx.supplyFanRunning === 'No' || ctx.supplyFanRunning === 'Intermittent') {
		scores.airflow += 3;
		reasons.airflow.push(`Supply fan ${ctx.supplyFanRunning.toLowerCase()}`);
	}
	if (ctx.supplyAirflowStrength === 'Weak' || ctx.supplyAirflowStrength === 'None') {
		scores.airflow += 3;
		reasons.airflow.push(`Airflow ${ctx.supplyAirflowStrength.toLowerCase()}`);
	}
	if (ctx.filtersCondition === 'Clogged') {
		scores.airflow += 4;
		reasons.airflow.push('Filters clogged');
	}
	if (ctx.evapCoilCondition === 'Heavily iced') {
		scores.airflow += 4;
		reasons.airflow.push('Evap coil heavily iced');
	}
	if (deltaT !== null && deltaT > 25) {
		scores.airflow += 3;
		reasons.airflow.push(`High ΔT (${deltaT.toFixed(1)}°F)`);
	}
	
	// B. Condenser issue scoring
	if (ctx.condenserFanStatus === 'One or more not running') {
		scores.condenser += 4;
		reasons.condenser.push('Condenser fan(s) not running');
	}
	if (ctx.condenserFanStatus === 'Running weak') {
		scores.condenser += 2;
		reasons.condenser.push('Condenser fan running weak');
	}
	if (ctx.condenserCoilCondition === 'Very dirty / restricted') {
		scores.condenser += 4;
		reasons.condenser.push('Condenser coil very dirty');
	}
	if (ctx.noiseVibration === 'Fan noise') {
		scores.condenser += 2;
		reasons.condenser.push('Fan noise detected');
	}
	
	// B.1. Condenser fan blade condition scoring (optional, only if data is present)
	if (ctx.condenserFanBlades && ctx.condenserFanBlades.length > 0) {
		ctx.condenserFanBlades.forEach((bladeData) => {
			if (bladeData.bladeCondition === 'Damaged' || bladeData.bladeCondition === 'Hitting shroud') {
				// Bump condenser score for blade issues
				scores.condenser += 2;
				if (bladeData.bladeCondition === 'Damaged') {
					reasons.condenser.push(`Fan ${bladeData.fanNumber} blade damaged`);
				} else if (bladeData.bladeCondition === 'Hitting shroud') {
					reasons.condenser.push(`Fan ${bladeData.fanNumber} blade hitting shroud`);
				}
			}
		});
	}
	
	// B.2. Condenser fan amp scoring (optional, only if data is present)
	if (ctx.condenserFanAmps && ctx.condenserFanAmps.length > 0) {
		let hasHighAmps = false;
		let hasModerateAmps = false;
		
		ctx.condenserFanAmps.forEach((ampData) => {
			if (ampData.ratio !== undefined && ampData.measuredAmps && ampData.measuredAmps > 0 && ampData.nameplateAmps && ampData.nameplateAmps > 0) {
				if (ampData.ratio > 1.3) {
					// High amps - strong evidence of condenser problem
					scores.condenser += 4;
					hasHighAmps = true;
				} else if (ampData.ratio > 1.1) {
					// Moderate amps - moderate evidence
					scores.condenser += 2;
					hasModerateAmps = true;
				}
				// ratio <= 1.1: no additional score (normal amps don't boost condenser score)
			}
		});
		
		// Add to reason text if high amps contributed
		if (hasHighAmps) {
			reasons.condenser.push('Condenser fan amps are above nameplate, suggesting motor overload or restriction');
		} else if (hasModerateAmps) {
			reasons.condenser.push('Condenser fan amps slightly elevated');
		}
	}
	
	// C. Compressor/start issue scoring
	if (ctx.compressorStatus === 'Not running') {
		scores.compressor += 5;
		reasons.compressor.push('Compressor not running');
	}
	if (ctx.compressorStatus === 'Buzzing / not starting') {
		scores.compressor += 5;
		reasons.compressor.push('Compressor buzzing/not starting');
	}
	if (ctx.compressorStatus === 'Short-cycling') {
		scores.compressor += 4;
		reasons.compressor.push('Compressor short-cycling');
	}
	if (ctx.noiseVibration === 'Compressor noise') {
		scores.compressor += 2;
		reasons.compressor.push('Compressor noise detected');
	}
	if (ctx.noiseVibration === 'Vibration') {
		scores.compressor += 2;
		reasons.compressor.push('Vibration detected');
	}
	
	// D. Low-capacity / refrigerant-side issue scoring
	if (deltaT !== null && deltaT < 10) {
		scores.refrigerant += 4;
		reasons.refrigerant.push(`Low ΔT (${deltaT.toFixed(1)}°F)`);
		
		// Extra weight if everything else looks normal
		if (ctx.compressorStatus === 'Running normally' && 
			ctx.condenserFanStatus === 'All running' &&
			ctx.filtersCondition !== 'Clogged' &&
			ctx.evapCoilCondition !== 'Heavily iced') {
			scores.refrigerant += 3;
			reasons.refrigerant.push('System appears normal but low cooling capacity');
		}
	}
	
	// E. Control/economizer issue (fallback when everything looks normal)
	// Score control issue when mechanical components appear normal
	let normalCount = 0;
	const normalSignals: string[] = [];
	
	if (ctx.supplyFanRunning === 'Yes') {
		normalCount++;
		normalSignals.push('supply fan running');
	}
	if (ctx.condenserFanStatus === 'All running') {
		normalCount++;
		normalSignals.push('condenser fans running');
	}
	if (ctx.compressorStatus === 'Running normally') {
		normalCount++;
		normalSignals.push('compressor running normally');
	}
	if (ctx.filtersCondition === 'Clean' || ctx.filtersCondition === 'Moderately dirty') {
		normalCount++;
		normalSignals.push('filters acceptable');
	}
	if (ctx.evapCoilCondition === 'Clean') {
		normalCount++;
		normalSignals.push('evap coil clean');
	}
	if (deltaT !== null && deltaT >= 10 && deltaT <= 25) {
		normalCount++;
		normalSignals.push(`normal ΔT (${deltaT.toFixed(1)}°F)`);
	}
	
	// If most things look normal and no major issues detected, suggest control/economizer
	// This should be the fallback when no other category has a high score
	const hasMajorIssue = scores.airflow >= 4 || scores.condenser >= 4 || scores.compressor >= 4 || scores.refrigerant >= 4;
	
	if (normalCount >= 4 && !hasMajorIssue) {
		scores.control += 5;
		if (normalSignals.length > 0) {
			reasons.control.push(`Mechanical components appear normal (${normalSignals.slice(0, 3).join(', ')})`);
		} else {
			reasons.control.push('System appears normal but not cooling');
		}
	} else if (normalCount >= 3 && !hasMajorIssue) {
		scores.control += 3;
		reasons.control.push('Most components appear normal');
	}
	
	// Tie-breaker: Use amp data to favor condenser over airflow when both are plausible
	// This helps when filters are moderately dirty and condenser coil is moderately dirty
	if (ctx.condenserFanAmps && ctx.condenserFanAmps.length > 0 && 
		scores.airflow > 0 && scores.condenser > 0 && 
		Math.abs(scores.airflow - scores.condenser) <= 2) {
		// Check if any fan has elevated amps (ratio > 1.1)
		const hasElevatedAmps = ctx.condenserFanAmps.some(amp => amp.ratio !== undefined && amp.ratio > 1.1);
		if (hasElevatedAmps) {
			// Slightly favor condenser over airflow when amps are elevated
			scores.condenser += 1;
		}
		// If amps are normal (ratio <= 1.1), don't change the balance
	}
	
	// Convert scores to hypotheses
	const hypotheses: Hypothesis[] = [];
	
	if (scores.airflow > 0) {
		hypotheses.push({
			id: 'rtuAirflow',
			label: 'Could be an airflow problem',
			reason: reasons.airflow.length > 0 ? reasons.airflow.join(', ') : 'Airflow issues detected',
			confidence: Math.min(scores.airflow / 10, 1),
			nextSectionId: 'rtuAirflowDiagnostics'
		});
	}
	
	if (scores.condenser > 0) {
		hypotheses.push({
			id: 'rtuCondenser',
			label: 'Could be a condenser problem',
			reason: reasons.condenser.length > 0 ? reasons.condenser.join(', ') : 'Condenser issues detected',
			confidence: Math.min(scores.condenser / 10, 1),
			nextSectionId: 'rtuCondenserDiagnostics'
		});
	}
	
	if (scores.compressor > 0) {
		hypotheses.push({
			id: 'rtuCompressor',
			label: 'Could be a compressor or start circuit problem',
			reason: reasons.compressor.length > 0 ? reasons.compressor.join(', ') : 'Compressor issues detected',
			confidence: Math.min(scores.compressor / 10, 1),
			nextSectionId: 'rtuCompressorCircuitDiagnostics'
		});
	}
	
	if (scores.refrigerant > 0) {
		hypotheses.push({
			id: 'rtuRefrigerant',
			label: 'Could be a low-capacity or refrigerant-side issue',
			reason: reasons.refrigerant.length > 0 ? reasons.refrigerant.join(', ') : 'Low cooling capacity detected',
			confidence: Math.min(scores.refrigerant / 10, 1),
			nextSectionId: 'rtuRefrigerantDiagnostics'
		});
	}
	
	if (scores.control > 0) {
		hypotheses.push({
			id: 'rtuControl',
			label: 'Could be a control or economizer issue',
			reason: reasons.control.length > 0 ? reasons.control.join(', ') : 'System appears normal but not cooling',
			confidence: Math.min(scores.control / 10, 1),
			nextSectionId: 'rtuControlEconomizerDiagnostics'
		});
	}
	
	// If no hypotheses, add control/economizer as fallback (instead of general)
	if (hypotheses.length === 0) {
		hypotheses.push({
			id: 'rtuControl',
			label: 'Could be a control or economizer issue',
			reason: 'No obvious mechanical issues detected',
			confidence: 0.5,
			nextSectionId: 'rtuControlEconomizerDiagnostics'
		});
	}
	
	// Sort by confidence descending
	return hypotheses.sort((a, b) => b.confidence - a.confidence);
}

export function generateRTUHeatingHypotheses(ctx: RTUHeatingChecksContext): Hypothesis[] {
	const scores: Record<string, number> = {
		airflow: 0,
		gas: 0,
		electric: 0,
		heatPump: 0,
		control: 0
	};
	
	const reasons: Record<string, string[]> = {
		airflow: [],
		gas: [],
		electric: [],
		heatPump: [],
		control: []
	};
	
	// Calculate temperature rise
	const tempRise = (ctx.returnAirTemp !== undefined && ctx.supplyAirTemp !== undefined) 
		? ctx.supplyAirTemp - ctx.returnAirTemp 
		: null;
	
	// A. Airflow issue scoring
	if (ctx.supplyFanRunning === 'No' || ctx.supplyFanRunning === 'Intermittent') {
		scores.airflow += 3;
		reasons.airflow.push(`Supply fan ${ctx.supplyFanRunning.toLowerCase()}`);
	}
	if (ctx.supplyAirflowStrength === 'Weak' || ctx.supplyAirflowStrength === 'None') {
		scores.airflow += 3;
		reasons.airflow.push(`Airflow ${ctx.supplyAirflowStrength.toLowerCase()}`);
	}
	if (ctx.filtersCondition === 'Clogged') {
		scores.airflow += 4;
		reasons.airflow.push('Filters clogged');
	}
	if (tempRise !== null && tempRise < 15) {
		scores.airflow += 3;
		reasons.airflow.push(`Low temperature rise (${tempRise.toFixed(1)}°F)`);
	}
	
	// B. Gas heating issue scoring
	if (ctx.gasValveEnergized === 'No') {
		scores.gas += 5;
		reasons.gas.push('Gas valve not energized');
	}
	if (ctx.burnersLit === 'No') {
		scores.gas += 5;
		reasons.gas.push('Burners not lit');
	}
	if (ctx.heatingElementStatus === 'No - not operating' && (ctx.gasValveEnergized === 'Yes' || ctx.gasValveEnergized === 'Not checked')) {
		scores.gas += 4;
		reasons.gas.push('Gas valve energized but no heat');
	}
	if (tempRise !== null && tempRise < 20 && (ctx.gasValveEnergized === 'Yes' || ctx.burnersLit === 'Yes')) {
		scores.gas += 3;
		reasons.gas.push(`Low temperature rise with gas system (${tempRise.toFixed(1)}°F)`);
	}
	
	// C. Electric heat issue scoring
	if (ctx.electricHeatOn === 'No') {
		scores.electric += 5;
		reasons.electric.push('Electric heat not energized');
	}
	if (ctx.heatingElementStatus === 'No - not operating' && (ctx.electricHeatOn === 'Yes' || ctx.electricHeatOn === 'Not checked')) {
		scores.electric += 4;
		reasons.electric.push('Electric heat energized but no heat');
	}
	if (tempRise !== null && tempRise < 20 && ctx.electricHeatOn === 'Yes') {
		scores.electric += 3;
		reasons.electric.push(`Low temperature rise with electric heat (${tempRise.toFixed(1)}°F)`);
	}
	
	// D. Heat pump issue scoring
	if (ctx.heatPumpRunning === 'No') {
		scores.heatPump += 5;
		reasons.heatPump.push('Heat pump not running');
	}
	if (ctx.heatingElementStatus === 'No - not operating' && (ctx.heatPumpRunning === 'Yes' || ctx.heatPumpRunning === 'Not checked')) {
		scores.heatPump += 4;
		reasons.heatPump.push('Heat pump running but no heat');
	}
	if (tempRise !== null && tempRise < 15 && ctx.heatPumpRunning === 'Yes') {
		scores.heatPump += 3;
		reasons.heatPump.push(`Low temperature rise with heat pump (${tempRise.toFixed(1)}°F)`);
	}
	
	// E. Control issue (fallback when everything looks normal)
	let normalCount = 0;
	const normalSignals: string[] = [];
	
	if (ctx.supplyFanRunning === 'Yes') {
		normalCount++;
		normalSignals.push('supply fan running');
	}
	if (ctx.filtersCondition === 'Clean' || ctx.filtersCondition === 'Moderately dirty') {
		normalCount++;
		normalSignals.push('filters acceptable');
	}
	if (ctx.heatingElementStatus === 'Yes - producing heat') {
		normalCount++;
		normalSignals.push('heating element operating');
	}
	if (tempRise !== null && tempRise >= 20 && tempRise <= 50) {
		normalCount++;
		normalSignals.push(`normal temperature rise (${tempRise.toFixed(1)}°F)`);
	}
	
	const hasMajorIssue = scores.airflow >= 4 || scores.gas >= 4 || scores.electric >= 4 || scores.heatPump >= 4;
	
	if (normalCount >= 3 && !hasMajorIssue) {
		scores.control += 5;
		if (normalSignals.length > 0) {
			reasons.control.push(`Mechanical components appear normal (${normalSignals.slice(0, 3).join(', ')})`);
		} else {
			reasons.control.push('System appears normal but not heating');
		}
	}
	
	// Convert scores to hypotheses
	const hypotheses: Hypothesis[] = [];
	
	if (scores.airflow > 0) {
		hypotheses.push({
			id: 'rtuHeatingAirflow',
			label: 'Could be an airflow problem',
			reason: reasons.airflow.length > 0 ? reasons.airflow.join(', ') : 'Airflow issues detected',
			confidence: Math.min(scores.airflow / 10, 1),
			nextSectionId: '4' // Gas Heating Diagnostics section (will be conditional)
		});
	}
	
	if (scores.gas > 0) {
		hypotheses.push({
			id: 'rtuHeatingGas',
			label: 'Could be a gas heating problem',
			reason: reasons.gas.length > 0 ? reasons.gas.join(', ') : 'Gas heating issues detected',
			confidence: Math.min(scores.gas / 10, 1),
			nextSectionId: '4' // Gas Heating Diagnostics section
		});
	}
	
	if (scores.electric > 0) {
		hypotheses.push({
			id: 'rtuHeatingElectric',
			label: 'Could be an electric heat problem',
			reason: reasons.electric.length > 0 ? reasons.electric.join(', ') : 'Electric heat issues detected',
			confidence: Math.min(scores.electric / 10, 1),
			nextSectionId: '5' // Electric Heat Diagnostics section
		});
	}
	
	if (scores.heatPump > 0) {
		hypotheses.push({
			id: 'rtuHeatingHeatPump',
			label: 'Could be a heat pump problem',
			reason: reasons.heatPump.length > 0 ? reasons.heatPump.join(', ') : 'Heat pump issues detected',
			confidence: Math.min(scores.heatPump / 10, 1),
			nextSectionId: '6' // Heat Pump Diagnostics section
		});
	}
	
	if (scores.control > 0) {
		hypotheses.push({
			id: 'rtuHeatingControl',
			label: 'Could be a control issue',
			reason: reasons.control.length > 0 ? reasons.control.join(', ') : 'System appears normal but not heating',
			confidence: Math.min(scores.control / 10, 1),
			nextSectionId: '4' // Gas Heating Diagnostics section (will be conditional)
		});
	}
	
	// If no hypotheses, proceed to next section
	if (hypotheses.length === 0) {
		hypotheses.push({
			id: 'rtuHeatingNext',
			label: 'Proceed to heating system diagnostics',
			reason: 'No obvious issues detected in initial checks',
			confidence: 0.5,
			nextSectionId: '4' // Gas Heating Diagnostics section (will be conditional)
		});
	}
	
	// Sort by confidence descending
	return hypotheses.sort((a, b) => b.confidence - a.confidence);
}

/**
 * Generate next-step suggestions when primary cause is not found in a diagnostic section
 */
export function generateNextStepSuggestions(
	currentSectionTitle: string,
	sectionData: any,
	coolingChecksData?: RTUCoolingChecksContext
): Hypothesis[] {
	const suggestions: Hypothesis[] = [];
	const scores: Record<string, number> = {
		airflow: 0,
		condenser: 0,
		compressor: 0,
		refrigerant: 0,
		control: 0
	};
	const reasons: Record<string, string[]> = {
		airflow: [],
		condenser: [],
		compressor: [],
		refrigerant: [],
		control: []
	};

	// Get deltaT from Cooling Checks if available
	const deltaT = coolingChecksData && coolingChecksData.returnAirTemp !== undefined && coolingChecksData.supplyAirTemp !== undefined
		? coolingChecksData.returnAirTemp - coolingChecksData.supplyAirTemp
		: null;

	// Helper to get value from section data
	const getValue = (itemId: string) => {
		const item = sectionData?.items?.find((i: any) => i.id === itemId);
		return item?.selectedOptions?.[0] || item?.selectedOption;
	};

	// Analyze based on current section
	if (currentSectionTitle === 'Airflow diagnostics') {
		const airflowImproved = getValue('af-airflow-improved');
		const deltatImproved = getValue('af-deltat-improved');
		
		// If airflow is good but ΔT is still low → suggest Refrigerant
		if (airflowImproved === 'Yes' && deltaT !== null && deltaT < 10) {
			scores.refrigerant += 5;
			reasons.refrigerant.push('Airflow normal but ΔT is low');
		}
		// If airflow is good and ΔT is normal → suggest Control/Economizer
		if (airflowImproved === 'Yes' && deltaT !== null && deltaT >= 10 && deltaT <= 25) {
			scores.control += 4;
			reasons.control.push('Airflow and ΔT appear normal');
		}
		// Always suggest other mechanical sections
		scores.condenser += 2;
		reasons.condenser.push('Check condenser fans and coil');
		scores.compressor += 2;
		reasons.compressor.push('Check compressor operation');
	} else if (currentSectionTitle === 'Condenser diagnostics') {
		const fansRunning = getValue('cd-fans-running');
		const coilClear = getValue('cd-coil-clear');
		
		// If condenser is good but ΔT is low → suggest Refrigerant
		if (fansRunning === 'Yes' && coilClear === 'Yes' && deltaT !== null && deltaT < 10) {
			scores.refrigerant += 5;
			reasons.refrigerant.push('Condenser normal but ΔT is low');
		}
		// If condenser is good and ΔT is normal → suggest Control/Economizer
		if (fansRunning === 'Yes' && coilClear === 'Yes' && deltaT !== null && deltaT >= 10 && deltaT <= 25) {
			scores.control += 4;
			reasons.control.push('Condenser and ΔT appear normal');
		}
		// Always suggest other sections
		scores.airflow += 2;
		reasons.airflow.push('Check airflow and filters');
		scores.compressor += 2;
		reasons.compressor.push('Check compressor operation');
	} else if (currentSectionTitle === 'Compressor circuit diagnostics') {
		const compressorRunning = getValue('cc-compressor-running');
		
		// If compressor is running but ΔT is low → suggest Refrigerant
		if (compressorRunning === 'Yes' && deltaT !== null && deltaT < 10) {
			scores.refrigerant += 5;
			reasons.refrigerant.push('Compressor running but ΔT is low');
		}
		// If compressor is running and ΔT is normal → suggest Control/Economizer
		if (compressorRunning === 'Yes' && deltaT !== null && deltaT >= 10 && deltaT <= 25) {
			scores.control += 4;
			reasons.control.push('Compressor and ΔT appear normal');
		}
		// Always suggest other sections
		scores.airflow += 2;
		reasons.airflow.push('Check airflow and filters');
		scores.condenser += 2;
		reasons.condenser.push('Check condenser fans and coil');
	} else if (currentSectionTitle === 'Refrigerant diagnostics') {
		const suctionInterpretation = getValue('rf-suction-interpretation');
		const headInterpretation = getValue('rf-head-interpretation');
		
		// If pressures are normal → suggest Control/Economizer
		if (suctionInterpretation === 'Normal' && headInterpretation === 'Normal') {
			scores.control += 5;
			reasons.control.push('Pressures appear normal');
		}
		// Always suggest other sections
		scores.airflow += 2;
		reasons.airflow.push('Check airflow and filters');
		scores.condenser += 2;
		reasons.condenser.push('Check condenser fans and coil');
		scores.compressor += 2;
		reasons.compressor.push('Check compressor operation');
	} else if (currentSectionTitle === 'Control / economizer diagnostics') {
		// If control/economizer doesn't solve it, suggest mechanical sections
		scores.airflow += 3;
		reasons.airflow.push('Re-check airflow and filters');
		scores.condenser += 3;
		reasons.condenser.push('Re-check condenser fans and coil');
		scores.compressor += 3;
		reasons.compressor.push('Re-check compressor operation');
		if (deltaT !== null && deltaT < 10) {
			scores.refrigerant += 4;
			reasons.refrigerant.push('Low ΔT suggests refrigerant issue');
		}
	}

	// Convert scores to hypotheses, excluding the current section
	const sectionIdMap: Record<string, string> = {
		airflow: 'rtuAirflowDiagnostics',
		condenser: 'rtuCondenserDiagnostics',
		compressor: 'rtuCompressorCircuitDiagnostics',
		refrigerant: 'rtuRefrigerantDiagnostics',
		control: 'rtuControlEconomizerDiagnostics'
	};

	const currentSectionId = 
		currentSectionTitle === 'Airflow diagnostics' ? 'rtuAirflowDiagnostics' :
		currentSectionTitle === 'Condenser diagnostics' ? 'rtuCondenserDiagnostics' :
		currentSectionTitle === 'Compressor circuit diagnostics' ? 'rtuCompressorCircuitDiagnostics' :
		currentSectionTitle === 'Refrigerant diagnostics' ? 'rtuRefrigerantDiagnostics' :
		currentSectionTitle === 'Control / economizer diagnostics' ? 'rtuControlEconomizerDiagnostics' :
		'';

	if (scores.airflow > 0 && sectionIdMap.airflow !== currentSectionId) {
		suggestions.push({
			id: 'next-airflow',
			label: 'Could be an airflow problem',
			reason: reasons.airflow.length > 0 ? reasons.airflow.join(', ') : 'Check airflow and filters',
			confidence: Math.min(scores.airflow / 10, 1),
			nextSectionId: sectionIdMap.airflow
		});
	}

	if (scores.condenser > 0 && sectionIdMap.condenser !== currentSectionId) {
		suggestions.push({
			id: 'next-condenser',
			label: 'Could be a condenser problem',
			reason: reasons.condenser.length > 0 ? reasons.condenser.join(', ') : 'Check condenser fans and coil',
			confidence: Math.min(scores.condenser / 10, 1),
			nextSectionId: sectionIdMap.condenser
		});
	}

	if (scores.compressor > 0 && sectionIdMap.compressor !== currentSectionId) {
		suggestions.push({
			id: 'next-compressor',
			label: 'Could be a compressor or start circuit problem',
			reason: reasons.compressor.length > 0 ? reasons.compressor.join(', ') : 'Check compressor operation',
			confidence: Math.min(scores.compressor / 10, 1),
			nextSectionId: sectionIdMap.compressor
		});
	}

	if (scores.refrigerant > 0 && sectionIdMap.refrigerant !== currentSectionId) {
		suggestions.push({
			id: 'next-refrigerant',
			label: 'Could be a low-capacity or refrigerant-side issue',
			reason: reasons.refrigerant.length > 0 ? reasons.refrigerant.join(', ') : 'Check refrigerant system',
			confidence: Math.min(scores.refrigerant / 10, 1),
			nextSectionId: sectionIdMap.refrigerant
		});
	}

	if (scores.control > 0 && sectionIdMap.control !== currentSectionId) {
		suggestions.push({
			id: 'next-control',
			label: 'Could be a control or economizer issue',
			reason: reasons.control.length > 0 ? reasons.control.join(', ') : 'Check controls and economizer',
			confidence: Math.min(scores.control / 10, 1),
			nextSectionId: sectionIdMap.control
		});
	}

	// Sort by confidence descending
	return suggestions.sort((a, b) => b.confidence - a.confidence);
}





