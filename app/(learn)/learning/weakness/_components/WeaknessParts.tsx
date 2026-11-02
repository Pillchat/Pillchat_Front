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
        strokeWidth={2}
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
  children,
}: {
  label: string;
  count: number | null;
  pending: boolean;
  children?: React.ReactNode;
}) {
  return (
    <section
      aria-label={label}
      aria-busy={pending}
      className="rounded-xl bg-gray-50 p-5"
    >
      <p className="text-body-medium text-muted-foreground">{label}</p>
      <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
        <p
          aria-live="polite"
          className="text-headline-large tabular-nums text-foreground"
        >
          {count === null ? "–" : count}
          <span className="ml-1 text-title-large">문제</span>
        </p>
        {children}
      </div>
      <p className="mt-1 text-body-small text-muted-foreground">
        틀린 문제와 ‘헷갈려요’를 표시한 문제 중 오늘 복습 가능한 문제예요.
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
