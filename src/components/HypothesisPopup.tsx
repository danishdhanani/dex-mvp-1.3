'use client';

import React from 'react';
import type { Hypothesis } from '@/app/service-call/checklist/rules';

interface HypothesisPopupProps {
	open: boolean;
	hypotheses: Hypothesis[];
	onClose: () => void;
	onChoose: (hypothesis: Hypothesis) => void;
}

export default function HypothesisPopup({ open, hypotheses, onClose, onChoose }: HypothesisPopupProps) {
	if (!open) return null;
	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
			<div className="w-full max-w-lg bg-gray-800 border border-gray-700 rounded-xl p-5 shadow-xl">
				<h3 className="text-white text-lg font-semibold mb-3">Suggested next steps</h3>
				<div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
					{hypotheses.map((h) => (
						<div key={h.id} className="rounded-lg border border-gray-700 p-3 bg-gray-750">
							<div className="flex items-center justify-between">
								<div>
									<div className="text-white font-medium">{h.label}</div>
									<div className="text-gray-300 text-sm">{h.reason}</div>
								</div>
								{/* Confidence intentionally hidden for demo */}
							</div>
							<div className="mt-2 flex justify-end">
								<button
									onClick={() => onChoose(h)}
									className="px-3 py-1.5 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-sm"
								>
									Check this
								</button>
							</div>
						</div>
					))}
				</div>
				<div className="mt-4 flex justify-end">
					<button onClick={onClose} className="px-3 py-1.5 rounded-md bg-gray-700 hover:bg-gray-600 text-white text-sm">Close</button>
				</div>
			</div>
		</div>
	);
}


