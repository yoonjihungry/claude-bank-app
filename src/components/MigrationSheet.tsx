'use client';

// 처음 로그인했을 때 "이 기기에 있던 기록을 계정으로 옮길까요?"를 묻는 바텀시트.
// 자동으로 옮기지 않는다 — 여러 기기에서 로그인하면 각 기기의 로컬 데이터가 계정에
// 겹쳐 쌓이기 때문에, 되돌릴 수 없는 동작은 사용자 확인을 받는다(docs/decisions.md).
// 로컬 원본은 옮긴 뒤에도 지우지 않으므로 '나중에'를 골라도 잃는 것은 없다.
import type { LocalSummary } from '@/storage/migration';

const LABELS: { key: keyof LocalSummary; label: string; unit: string }[] = [
  { key: 'transactions', label: '거래', unit: '건' },
  { key: 'categories', label: '카테고리', unit: '개' },
  { key: 'budgets', label: '예산', unit: '건' },
  { key: 'recurringRules', label: '고정거래', unit: '건' },
];

export default function MigrationSheet({
  summary,
  busy,
  onMigrate,
  onSkip,
}: {
  summary: LocalSummary;
  busy: boolean;
  onMigrate: () => void;
  onSkip: () => void;
}) {
  const items = LABELS.filter(({ key }) => summary[key] > 0);

  return (
    <div className="fixed inset-0 z-50">
      {/* 스크림 — 선택 전에는 바깥 클릭으로 닫지 않는다(둘 중 하나는 골라야 화면이 채워진다). */}
      <div className="absolute inset-0 bg-foreground/45" />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="migration-sheet-title"
        style={{ paddingBottom: 'calc(1.5rem + env(safe-area-inset-bottom))' }}
        className="absolute inset-x-0 bottom-0 mx-auto w-full max-w-[480px] rounded-t-[22px] border border-border bg-card px-6 pt-2.5 shadow-[0_-10px_40px_-12px_hsl(222_47%_20%/0.3)] md:max-w-[600px]"
      >
        <div className="mx-auto mb-[18px] h-1 w-[38px] rounded-full bg-input" />

        <div className="mx-auto mb-3.5 grid h-14 w-14 place-items-center rounded-2xl bg-primary/10 text-[28px]">
          📦
        </div>

        <h3
          id="migration-sheet-title"
          className="text-center text-lg font-extrabold tracking-tight"
        >
          이 기기에 저장된 기록이 있어요
        </h3>
        <p className="mt-[7px] text-center text-[13px] leading-relaxed text-muted-foreground">
          계정으로 옮기면 다른 기기에서도 이어볼 수 있어요.
        </p>

        <ul className="my-5 divide-y divide-border rounded-xl border border-border">
          {items.map(({ key, label, unit }) => (
            <li key={key} className="flex items-center justify-between px-4 py-2.5">
              <span className="text-[13px] text-muted-foreground">{label}</span>
              <span className="text-sm font-semibold">
                {summary[key].toLocaleString()}
                {unit}
              </span>
            </li>
          ))}
        </ul>

        <button
          type="button"
          onClick={onMigrate}
          disabled={busy}
          className="h-[50px] w-full rounded-xl bg-primary text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-60"
        >
          {busy ? '옮기는 중…' : '계정으로 옮기기'}
        </button>

        <button
          type="button"
          onClick={onSkip}
          disabled={busy}
          className="mt-3 w-full py-2 text-[13px] font-semibold text-muted-foreground hover:underline disabled:opacity-60"
        >
          나중에
        </button>

        <p className="mt-3 text-center text-[11px] leading-relaxed text-muted-foreground">
          이 기기에 있는 기록은 옮긴 뒤에도 그대로 남아 있어요.
        </p>
      </div>
    </div>
  );
}
