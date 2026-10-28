import { Info } from "lucide-react";

export function WeaknessNotice({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <aside className="flex gap-3 rounded-xl bg-primary-980 p-4">
      <Info
        aria-hidden="true"
        className="mt-0.5 h-5 w-5 shrink-0 text-primary"
        strokeWidth={1.5}
      />
      <div className="min-w-0">
        <p className="text-title-small text-foreground">{title}</p>
        <p className="mt-1 text-body-small text-muted-foreground">{children}</p>
      </div>
    </aside>
  );
}

export function WeaknessCount({
  label,
  count,
  pending,
}: {
  label: string;
  count: number | null;
  pending: boolean;
}) {
  return (
    <section
      aria-label={label}
      aria-busy={pending}
      className="rounded-xl bg-gray-50 p-5"
    >
      <p className="text-body-medium text-muted-foreground">{label}</p>
      <p
        aria-live="polite"
        className="mt-2 text-headline-large tabular-nums text-foreground"
      >
        {count === null ? "–" : count}
        <span className="ml-1 text-title-large">문제</span>
      </p>
      <p className="mt-1 text-body-small text-muted-foreground">
        오늘 복습 가능한 오답·헷갈림 문제 기준
      </p>
    </section>
  );
}

export function WeaknessReadError({ onRetry }: { onRetry: () => void }) {
  return (
    <p role="alert" className="text-body-medium text-destructive">
      학습 기록을 불러오지 못했어요.
      <button type="button" className="ml-2 underline" onClick={onRetry}>
        다시 시도
      </button>
    </p>
  );
}
