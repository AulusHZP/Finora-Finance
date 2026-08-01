/**
 * ProgressBar — reutilizado em Dashboard, Limites e Categorias.
 *
 * Muda de cor automaticamente:
 *   0–alertThreshold%   → verde  (safe)
 *   alertThreshold–99%  → laranja (warning)
 *   ≥100%               → vermelho (danger)
 *
 * Aceita um `status` explícito (vindo do backend) ou calcula internamente.
 */

type ProgressStatus = "safe" | "warning" | "danger" | null;

interface ProgressBarProps {
  /** 0 to 100+ (can exceed 100 for overspend) */
  value: number;
  /** Explicit status from backend. If provided, overrides auto-calculation. */
  status?: ProgressStatus;
  /** Threshold % for warning state (default 80) */
  alertThreshold?: number;
  /** Height in pixels (default 6) */
  height?: number;
  className?: string;
  animated?: boolean;
}

function resolveStatus(
  value: number,
  threshold: number,
  explicit?: ProgressStatus
): ProgressStatus {
  if (explicit !== undefined) return explicit;
  if (value >= 100) return "danger";
  if (value >= threshold) return "warning";
  return "safe";
}

const COLOR: Record<NonNullable<ProgressStatus>, string> = {
  safe: "bg-emerald-500",
  warning: "bg-amber-500",
  danger: "bg-red-500",
};

const TRACK: Record<NonNullable<ProgressStatus>, string> = {
  safe: "bg-emerald-100",
  warning: "bg-amber-100",
  danger: "bg-red-100",
};

export function ProgressBar({
  value,
  status,
  alertThreshold = 80,
  height = 6,
  className = "",
  animated = true,
}: ProgressBarProps) {
  const resolved = resolveStatus(value, alertThreshold, status) ?? "safe";
  const clamped = Math.min(value, 100);

  return (
    <div
      className={`w-full rounded-full overflow-hidden ${TRACK[resolved]} ${className}`}
      style={{ height }}
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className={`h-full rounded-full ${COLOR[resolved]} ${animated ? "transition-all duration-500 ease-out" : ""}`}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}
