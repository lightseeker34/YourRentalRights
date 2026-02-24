import React from "react";
import { Check, Minus } from "lucide-react";

interface AnalysisUnlockChecklistProps {
  hasEnoughEvidence: boolean;
  evidenceCount: number;
  remainingEvidence: number;
  hasReachedDailyLimit: boolean;
  analysisUsageCount: number;
  hasUnlockRequirements: boolean;
  ANALYSIS_DAILY_LIMIT: number;
  MIN_EVIDENCE_COUNT: number;
}

export function AnalysisUnlockChecklist({
  hasEnoughEvidence,
  evidenceCount,
  remainingEvidence,
  hasReachedDailyLimit,
  analysisUsageCount,
  hasUnlockRequirements,
  ANALYSIS_DAILY_LIMIT,
  MIN_EVIDENCE_COUNT,
}: AnalysisUnlockChecklistProps) {
  return (
    <div className="rounded-md border border-slate-200 bg-slate-50 px-2 py-2 text-[11px] text-slate-600">
      <p className="mb-1 font-semibold text-slate-700">AI Analysis unlock checklist</p>
      <div className="space-y-1">
        <div className="flex items-center gap-1.5">
          {hasEnoughEvidence ? <Check className="h-3 w-3 text-green-600" /> : <Minus className="h-3 w-3 text-slate-400" />}
          <span>
            Add evidence entries ({Math.min(evidenceCount, MIN_EVIDENCE_COUNT)}/{MIN_EVIDENCE_COUNT})
            {!hasEnoughEvidence ? ` — ${remainingEvidence} more needed` : ''}
          </span>
        </div>
      </div>
      {hasReachedDailyLimit && (
        <p className="mt-1 text-amber-700">Daily limit reached ({analysisUsageCount}/{ANALYSIS_DAILY_LIMIT}). Try again tomorrow.</p>
      )}
      {hasUnlockRequirements && !hasReachedDailyLimit && (
        <p className="mt-1 text-green-700">Ready: AI analysis is unlocked.</p>
      )}
    </div>
  );
}
