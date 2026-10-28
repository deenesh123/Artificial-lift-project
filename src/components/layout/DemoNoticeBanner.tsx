import React from 'react';
import { AlertCircle, Info } from 'lucide-react';

export const DemoNoticeBanner: React.FC<{ compact?: boolean }> = ({ compact }) => {
  if (compact) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/25 text-[10px] font-medium text-amber-300 tracking-wide font-mono">
        <span>DEMO / SYNTHETIC</span>
      </span>
    );
  }

  return (
    <div className="bg-slate-950/90 border-b border-slate-800 px-4 py-1.5 flex items-center justify-between text-[11px] text-slate-400 font-sans">
      <div className="flex items-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
        <span>
          <strong className="text-amber-300 font-medium">DEMO SIMULATED DATA</strong> — Telemetry is synthesized for demonstration purposes and is not connected to physical live assets.
        </span>
      </div>
      <div className="hidden md:flex items-center gap-3 text-slate-500 font-mono text-[10px]">
        <span>Simulated Edge Modbus Stream</span>
        <span>·</span>
        <span>20 Wells Monitored</span>
      </div>
    </div>
  );
};
