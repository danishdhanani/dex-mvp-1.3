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


