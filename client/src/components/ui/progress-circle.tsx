import * as React from "react";
import { cn } from "@/lib/utils";

interface ProgressCircleProps {
  value: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
  bgStrokeClassName?: string;
  strokeClassName?: string;
  textClassName?: string;
  showPercentage?: boolean;
}

export function ProgressCircle({
  value,
  size = 64,
  strokeWidth = 3,
  className,
  bgStrokeClassName,
  strokeClassName,
  textClassName,
  showPercentage = true,
}: ProgressCircleProps) {
  // Ensure value is between 0 and 100
  const safeValue = Math.min(100, Math.max(0, value));
  
  // Calculate circle properties
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (safeValue / 100) * circumference;

  return (
    <div className={cn("relative", className)} style={{ width: size, height: size }}>
      <svg className="w-full h-full" viewBox={`0 0 ${size} ${size}`}>
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          className={cn("stroke-gray-200", bgStrokeClassName)}
        />
        
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          strokeLinecap="round"
          className={cn("transition-all duration-300 ease-in-out stroke-secondary", strokeClassName)}
        />
      </svg>
      
      {showPercentage && (
        <div className="absolute inset-0 flex items-center justify-center text-sm font-medium">
          <span className={cn("text-gray-700", textClassName)}>{Math.round(safeValue)}%</span>
        </div>
      )}
    </div>
  );
}
