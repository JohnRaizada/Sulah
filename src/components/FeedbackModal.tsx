'use client';

import React from 'react';
import { EvaluationResult, Scenario } from '@/data/scenarios';
import { RotateCcw, ArrowLeft } from 'lucide-react';

interface FeedbackModalProps {
  evaluation: EvaluationResult;
  scenario: Scenario;
  onRetry: () => void;
  onExit: () => void;
}

export const FeedbackModal: React.FC<FeedbackModalProps> = ({
  evaluation,
  scenario,
  onRetry,
  onExit,
}) => {
  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-zinc-950 border border-zinc-800 rounded-2xl max-w-xl w-full p-6 sm:p-7 space-y-6 shadow-2xl my-6">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-zinc-900 pb-5">
          <div>
            <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-500">Debrief</span>
            <h2 className="text-base font-semibold text-zinc-100 mt-0.5">{scenario.title}</h2>
            <p className="text-xs text-zinc-500 mt-0.5">{scenario.characterName} ({scenario.characterRole})</p>
          </div>

          <div className="text-right">
            <span className="text-[11px] font-mono text-zinc-500 uppercase block">Score</span>
            <span className="text-2xl font-mono font-medium text-zinc-100">{evaluation.score}</span>
            <span className="text-xs text-zinc-600 font-mono">/100</span>
          </div>
        </div>

        {/* Verdict & Summary */}
        <div className="space-y-1.5">
          <span className="text-xs font-medium text-zinc-300 font-mono">
            Outcome: {evaluation.overallVerdict}
          </span>
          <p className="text-xs text-zinc-400 leading-relaxed">
            {evaluation.summary}
          </p>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-zinc-900">
          <div className="p-2.5 rounded-lg bg-zinc-900/50 border border-zinc-900">
            <span className="text-[10px] text-zinc-500 block uppercase">Listening</span>
            <span className="text-sm font-mono text-zinc-200 mt-1 block">
              {evaluation.techniqueBreakdown.activeListening}%
            </span>
          </div>
          <div className="p-2.5 rounded-lg bg-zinc-900/50 border border-zinc-900">
            <span className="text-[10px] text-zinc-500 block uppercase">Empathy</span>
            <span className="text-sm font-mono text-zinc-200 mt-1 block">
              {evaluation.techniqueBreakdown.empathyValidation}%
            </span>
          </div>
          <div className="p-2.5 rounded-lg bg-zinc-900/50 border border-zinc-900">
            <span className="text-[10px] text-zinc-500 block uppercase">Regulation</span>
            <span className="text-sm font-mono text-zinc-200 mt-1 block">
              {evaluation.techniqueBreakdown.emotionalRegulation}%
            </span>
          </div>
          <div className="p-2.5 rounded-lg bg-zinc-900/50 border border-zinc-900">
            <span className="text-[10px] text-zinc-500 block uppercase">Solutions</span>
            <span className="text-sm font-mono text-zinc-200 mt-1 block">
              {evaluation.techniqueBreakdown.solutionOrientation}%
            </span>
          </div>
        </div>

        {/* Strengths & Observations */}
        <div className="space-y-3 pt-2 text-xs">
          <div>
            <span className="text-[11px] font-mono text-zinc-400 block mb-1.5">Strengths</span>
            <ul className="space-y-1 text-zinc-400">
              {evaluation.strengths.map((s, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-zinc-600">—</span>
                  <span>{s}</span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <span className="text-[11px] font-mono text-zinc-400 block mb-1.5">Areas for reflection</span>
            <ul className="space-y-1 text-zinc-400">
              {evaluation.areasToImprove.map((a, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-zinc-600">—</span>
                  <span>{a}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Actions */}
        <div className="pt-4 border-t border-zinc-900 flex items-center justify-between text-xs">
          <button
            onClick={onExit}
            className="flex items-center gap-1.5 text-zinc-400 hover:text-zinc-200 transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to scenarios
          </button>

          <button
            onClick={onRetry}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-zinc-100 hover:bg-white text-zinc-900 font-medium rounded-lg transition"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Try again
          </button>
        </div>
      </div>
    </div>
  );
};
