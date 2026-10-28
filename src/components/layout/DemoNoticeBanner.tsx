import React from 'react';
import { AlertCircle, Activity, Info } from 'lucide-react';

export const DemoNoticeBanner: React.FC<{ compact?: boolean }> = ({ compact }) => {
  if (compact) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-amber-500/10 border border-amber-500/25 text-[11px] font-medium text-amber-300 tracking-wide">
        <Activity className="w-3 h-3 text-amber-400" />
        <span>DEMO SIMULATED DATA</span>
      </span>
    );
  }

  return (
    <div className="bg-slate-900/90 border-b border-amber-500/20 px-4 py-2 flex items-center justify-between text-xs text-slate-300">
      <div className="flex items-center gap-2">
        <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-semibold text-[10px] tracking-wider uppercase">
          <AlertCircle className="w-3 h-3" />
          Client Prototype
        </span>
        <span className="text-slate-300">
          Operational information and wellsite telemetry shown are <strong className="text-amber-300 font-semibold">DEMO SIMULATED DATA</strong> for client presentation.
        </span>
      </div>
      <div className="flex items-center gap-3 text-slate-400 text-[11px]">
        <span>No live SCADA equipment connected</span>
        <span>·</span>
        <span className="font-mono text-slate-300">v1.4-PREVIEW</span>
      </div>
    </div>
  );
};
