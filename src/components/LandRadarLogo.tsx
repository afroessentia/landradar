import { Radar } from "lucide-react";

export const LandRadarLogo = () => {
  return (
    <div className="flex items-center gap-3 select-none">
      <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/30 flex items-center justify-center text-primary shadow-[0_0_15px_rgba(0,210,133,0.15)]">
        <Radar className="w-5 h-5 animate-pulse" />
      </div>
      <div className="flex flex-col">
        <div className="flex items-center text-xl font-black tracking-wider text-foreground">
          LAND<span className="text-primary">RADAR</span>
        </div>
        <span className="text-[10px] font-mono tracking-widest uppercase text-muted-foreground">
          OTC Intelligence Terminal
        </span>
      </div>
    </div>
  );
};

export default LandRadarLogo;
