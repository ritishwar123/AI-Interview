"use client";

import type { ConnectionStatus } from "@/lib/types";

interface VoiceVisualizerProps {
  status: ConnectionStatus;
}

const STATUS_CONFIG: Record<
  ConnectionStatus,
  { label: string; color: string; glow?: string }
> = {
  idle: { label: "Ready", color: "bg-muted" },
  connecting: { label: "Connecting...", color: "bg-warning animate-pulse" },
  connected: { label: "Connected", color: "bg-success" },
  speaking: {
    label: "Interviewer speaking",
    color: "bg-primary",
    glow: "speaking-glow",
  },
  listening: {
    label: "Listening to you",
    color: "bg-accent",
    glow: "listening-glow",
  },
  error: { label: "Error", color: "bg-danger" },
  ended: { label: "Session ended", color: "bg-muted" },
};

export function VoiceVisualizer({ status }: VoiceVisualizerProps) {
  const config = STATUS_CONFIG[status];
  const isActive = status === "speaking" || status === "listening";

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative flex h-32 w-32 items-center justify-center">
        {isActive && (
          <>
            <div
              className={`absolute h-full w-full rounded-full ${config.color} opacity-20 pulse-ring`}
            />
            <div
              className={`absolute h-24 w-24 rounded-full ${config.color} opacity-30 pulse-ring`}
              style={{ animationDelay: "0.3s" }}
            />
          </>
        )}
        <div
          className={`relative flex h-20 w-20 items-center justify-center rounded-full ${config.color} ${config.glow ?? ""} transition-all duration-300`}
        >
          <div className="flex gap-1">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className={`w-1 rounded-full bg-white/80 ${
                  isActive ? "animate-bounce" : "h-3"
                }`}
                style={{
                  height: isActive ? undefined : "12px",
                  animationDelay: `${i * 0.15}s`,
                  animationDuration: "0.6s",
                }}
              />
            ))}
          </div>
        </div>
      </div>
      <p className="text-sm font-medium text-muted">{config.label}</p>
    </div>
  );
}
