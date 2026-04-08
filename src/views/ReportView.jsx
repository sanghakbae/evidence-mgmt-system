import React from "react";
import { CategoryTags, SectionCard } from "../components/ui";

export default function ReportView({ reportCards, onGeneratePdf }) {
  return (
    <div>
      <SectionCard
        title="리포트 포함 카드"
        action={
          <button
            className={`rounded-md px-4 py-2 text-sm text-white ${reportCards.length ? "bg-slate-900" : "cursor-not-allowed bg-slate-300"}`}
            onClick={onGeneratePdf}
            disabled={!reportCards.length}
          >
            출력 미리보기
          </button>
        }
      >
        {!reportCards.length && (
          <div className="rounded-md border border-dashed border-slate-300 p-3 text-sm text-slate-500">
            카드 조회에서 카드를 선택하고 리포트에 추가하세요.
          </div>
        )}
        {!!reportCards.length && (
          <div className="space-y-4">
            {reportCards.map((card, idx) => (
              <div key={card.id} className="rounded-md border border-slate-200 p-4">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="text-sm font-semibold text-slate-900">
                      {idx + 1}. {card.category}
                    </div>
                    <CategoryTags categories={card.categories || [card.category]} />
                  </div>
                  <div className="rounded-md border border-slate-200 px-2.5 py-1 text-xs text-slate-600">
                    증적 {(card.evidences || []).length}건
                  </div>
                </div>
                <div className="text-sm leading-5 text-slate-900">{card.question}</div>
                <div className="mt-2 text-sm leading-6 text-slate-600">{card.answer}</div>
              </div>
            ))}
          </div>
        )}
      </SectionCard>
    </div>
  );
}
