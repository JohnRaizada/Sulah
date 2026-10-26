'use client';

import React from 'react';
import { Scenario } from '@/data/scenarios';
import { ArrowUpRight } from 'lucide-react';

interface ScenarioCardProps {
  scenario: Scenario;
  onSelect: (scenario: Scenario) => void;
}

export const ScenarioCard: React.FC<ScenarioCardProps> = ({ scenario, onSelect }) => {
  return (
    <div
      onClick={() => onSelect(scenario)}
      className="group p-5 rounded-xl border border-zinc-900 bg-zinc-950 hover:border-zinc-700 hover:bg-zinc-900/40 transition duration-150 cursor-pointer flex flex-col justify-between"
    >
      <div>
        <div className="flex items-center justify-between text-xs text-zinc-500 mb-3">
          <span>{scenario.categoryLabel}</span>
          <span className="text-[11px] font-mono text-zinc-600">{scenario.difficulty}</span>
        </div>

        <h3 className="text-sm font-medium text-zinc-200 group-hover:text-white transition flex items-center justify-between">
          <span>{scenario.title}</span>
          <ArrowUpRight className="w-4 h-4 text-zinc-600 group-hover:text-zinc-300 transition" />
        </h3>

        <p className="text-xs text-zinc-400 mt-2 line-clamp-2 leading-relaxed">
          {scenario.description}
        </p>
      </div>

      <div className="mt-4 pt-3 border-t border-zinc-900/80 flex items-center justify-between text-[11px] text-zinc-500">
        <span>with {scenario.characterName}</span>
        <span className="text-zinc-600 font-mono">{scenario.characterRole}</span>
      </div>
    </div>
  );
};
