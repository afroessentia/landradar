import { Radar } from "lucide-react";
import { cn } from "@/lib/utils";

type LandRadarLogoProps = {
  className?: string;
  iconClassName?: string;
  textClassName?: string;
  showText?: boolean;
};

export function LandRadarLogo({
  className,
  iconClassName,
  textClassName,
  showText = true,
}: LandRadarLogoProps) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <Radar className={cn("h-4 w-4 shrink-0 text-primary", iconClassName)} />
      {showText && (
        <span
          className={cn(
            "text-sm font-semibold tracking-[0.18em] text-foreground",
            textClassName,
          )}
        >
          LANDRADAR
        </span>
      )}
    </span>
  );
}

export default LandRadarLogo;
