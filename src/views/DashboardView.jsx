import React, { useMemo } from "react";
import { CategoryTags, SectionCard, Stat } from "../components/ui";
import { formatDateOnly, parseCardDate } from "../utils/format";

export default function DashboardView({ cards, reportCount, onSelectCategory }) {
  const statTones = [
    "bg-gradient-to-br from-rose-50 to-rose-100/60 ring-rose-200/80",
    "bg-gradient-to-br from-sky-50 to-blue-100/60 ring-sky-200/80",
    "bg-gradient-to-br from-amber-50 to-orange-100/60 ring-amber-200/80",
    "bg-gradient-to-br from-emerald-50 to-teal-100/60 ring-emerald-200/80",
  ];

  const categoryStats = useMemo(
    () =>
      cards.reduce((acc, card) => {
        const categories = card.categories?.length ? card.categories : [card.category || "기타"];
        categories.forEach((category) => {
          acc[category] = (acc[category] || 0) + 1;
        });
        return acc;
      }, {}),
    [cards]
  );

  const categoryEntries = useMemo(
    () => Object.entries(categoryStats).sort((a, b) => b[1] - a[1]),
    [categoryStats]
  );

  const totalCategoryCount = useMemo(
    () => categoryEntries.reduce((sum, [, count]) => sum + count, 0),
    [categoryEntries]
  );

  const donutPalette = [
    "#2563eb",
    "#f59e0b",
    "#10b981",
    "#8b5cf6",
    "#ef4444",
    "#06b6d4",
    "#84cc16",
    "#64748b",
  ];

  const donutGradient = useMemo(() => {
    if (!totalCategoryCount) return "";

    let cursor = 0;
    const parts = categoryEntries.map(([, count], idx) => {
      const start = (cursor / totalCategoryCount) * 360;
      cursor += count;
      const end = (cursor / totalCategoryCount) * 360;
      return `${donutPalette[idx % donutPalette.length]} ${start}deg ${end}deg`;
    });
    return `conic-gradient(${parts.join(", ")})`;
  }, [categoryEntries, totalCategoryCount]);

  const latestUpdatedAt = useMemo(() => {
    if (!cards.length) return "-";

    let latest = null;
    cards.forEach((card) => {
      const parsed = parseCardDate(card.updatedAt);
      if (!parsed) return;
      if (!latest || parsed.getTime() > latest.getTime()) {
        latest = parsed;
      }
    });

    return formatDateOnly(latest);
  }, [cards]);

  const statItems = [
    { label: "전체 카드", value: cards.length, sub: "질문·답변·증적 세트" },
    {
      label: "전체 증적",
      value: cards.reduce((sum, card) => sum + (card.evidences?.length || 0), 0),
      sub: "카드에 연결된 파일",
    },
    { label: "최근 갱신", value: latestUpdatedAt, sub: "최신 카드 기준" },
    { label: "리포트 대상", value: reportCount, sub: "선택된 카드 기준" },
  ];

  const recentCards = useMemo(() => cards.slice(0, 10), [cards]);
  const dashboardPanelHeight = useMemo(
    () => Math.max(420, 240 + categoryEntries.length * 38),
    [categoryEntries.length]
  );

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-4 gap-2 md:gap-4">
        {statItems.map((item, idx) => (
          <Stat key={item.label} label={item.label} value={item.value} sub={item.sub} tone={statTones[idx]} />
        ))}
      </div>

      <div className="grid items-stretch gap-4 xl:grid-cols-[1fr_1fr]">
        <SectionCard
          title="최근 등록 카드"
          className="flex flex-col overflow-hidden"
          bodyClassName="flex-1 overflow-auto"
          style={{ height: `min(68dvh, ${dashboardPanelHeight}px)`, minHeight: "320px" }}
        >
          {!cards.length && (
            <div className="rounded-md border border-dashed border-slate-300 p-6 text-sm text-slate-500">
              등록된 카드가 없습니다. 카드 등록 메뉴에서 새 카드를 추가하세요.
            </div>
          )}
          {!!cards.length && (
            <div className="space-y-2">
              {recentCards.map((card) => (
                <div key={card.id} className="rounded-md border border-slate-200 bg-gradient-to-r from-white to-slate-50 p-3">
                  <div className="mb-1.5 flex items-start justify-between gap-3 text-xs text-slate-500">
                    <CategoryTags categories={card.categories || [card.category]} />
                    <span className="inline-flex h-6 shrink-0 items-center text-right leading-none">{formatDateOnly(card.updatedAt)}</span>
                  </div>
                  <div className="line-clamp-2 pl-1 text-[13px] font-medium leading-5 text-slate-900">{card.question}</div>
                </div>
              ))}
            </div>
          )}
        </SectionCard>

        <SectionCard
          title="현황 요약(카테고리 분포)"
          className="flex flex-col overflow-hidden"
          bodyClassName="flex-1 overflow-hidden"
          style={{ height: `min(68dvh, ${dashboardPanelHeight}px)`, minHeight: "320px" }}
        >
          <div className="h-full">
            {!categoryEntries.length && (
              <div className="rounded-md border border-dashed border-slate-300 p-4 text-sm text-slate-500">
                표시할 데이터가 없습니다.
              </div>
            )}
            {!!categoryEntries.length && (
              <div className="grid h-full gap-1 lg:grid-cols-[minmax(0,1fr)_150px]">
                <div className="flex h-full items-center justify-center rounded-md border border-slate-200 bg-white p-0">
                  <div className="relative aspect-square w-full max-w-[21rem] md:max-w-[23rem]">
                    <div
                      className="h-full w-full rounded-full"
                      style={{
                        background: donutGradient,
                        boxShadow:
                          "0 10px 20px rgba(15,23,42,0.18), inset 0 2px 6px rgba(255,255,255,0.45), inset 0 -10px 16px rgba(15,23,42,0.12)",
                      }}
                    />
                    <div className="pointer-events-none absolute inset-0 rounded-full bg-gradient-to-br from-white/35 via-transparent to-black/10" />
                    <div className="absolute inset-[20%] z-10 flex items-center justify-center rounded-full border border-slate-200/80 bg-slate-50 text-center shadow-[inset_0_2px_6px_rgba(15,23,42,0.06)]">
                      <div>
                        <div className="text-xs text-slate-500">합계</div>
                        <div className="text-base font-bold text-slate-900">{totalCategoryCount}</div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="grid h-full auto-rows-min content-start gap-0.5">
                  {categoryEntries.map(([category, count], idx) => (
                    <button
                      key={category}
                      type="button"
                      onClick={() => onSelectCategory?.(category)}
                      className="flex min-h-[28px] items-center justify-between rounded-md border border-slate-200 bg-white px-1.5 py-0.5 text-left text-[12px] leading-none transition-colors hover:border-slate-300 hover:bg-slate-50"
                    >
                      <div className="flex min-w-0 items-center gap-1.5">
                        <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: donutPalette[idx % donutPalette.length] }} />
                        <span className="truncate text-slate-700">{category}</span>
                      </div>
                      <span className="ml-2 rounded-md bg-slate-100 px-1 py-0.5 text-[10px] font-semibold leading-none text-slate-900">{count}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
