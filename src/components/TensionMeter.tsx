'use client';

import React from 'react';

interface TensionMeterProps {
  tension: number; // 0 to 100
}

export const TensionMeter: React.FC<TensionMeterProps> = ({ tension }) => {
  const getLabel = () => {
    if (tension >= 75) return 'Elevated';
    if (tension >= 45) return 'Guarded';
    return 'Calm';
  };

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-1.5 text-xs">
        <span className="text-zinc-500">Tension:</span>
        <span className="font-mono text-zinc-300">{tension}%</span>
        <span className="text-zinc-500 font-mono text-[11px]">({getLabel()})</span>
      </div>

      <div className="w-24 sm:w-32 h-1 bg-zinc-900 rounded-full overflow-hidden">
        <div
          className="h-full bg-zinc-300 transition-all duration-500 ease-out"
          style={{ width: `${Math.min(100, Math.max(3, tension))}%` }}
        />
      </div>
    </div>
  );
};
