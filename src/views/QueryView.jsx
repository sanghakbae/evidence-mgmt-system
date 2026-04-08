import React, { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import { CategoryTags, EvidenceThumb, SectionCard } from "../components/ui";
import { formatDateOnly } from "../utils/format";

export default function QueryView({ cards, reportCardIds, onAddToReport, onDeleteCard, isSyncing }) {
  const [keyword, setKeyword] = useState("");
  const [selectedId, setSelectedId] = useState(cards[0]?.id ?? null);
  const [previewImage, setPreviewImage] = useState(null);

  const filtered = useMemo(() => {
    const query = keyword.trim().toLowerCase();
    if (!query) return cards;

    return cards.filter((card) =>
      [card.question, card.answer, card.category, ...(card.categories || []), ...(card.evidences || []).map((evidence) => evidence.name)]
        .join(" ")
        .toLowerCase()
        .includes(query)
    );
  }, [cards, keyword]);

  useEffect(() => {
    if (!filtered.length) {
      setSelectedId(null);
      return;
    }

    if (!filtered.some((card) => card.id === selectedId)) {
      setSelectedId(filtered[0].id);
    }
  }, [filtered, selectedId]);

  const selected = filtered.find((card) => card.id === selectedId) || null;
  const isAddedToReport = selected ? reportCardIds.includes(selected.id) : false;

  const handleDeleteSelected = async () => {
    if (!selected) return;
    const ok = window.confirm("선택한 카드를 삭제하시겠습니까?");
    if (!ok) return;
    await onDeleteCard(selected.id);
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[0.75fr_1.25fr]">
      <SectionCard
        title="카드 조회"
        headerClassName="items-center"
        action={
          <div className="relative w-full max-w-[320px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              className="h-11 w-full rounded-md border border-slate-200 pl-10 pr-4"
              placeholder="검색어 입력"
            />
          </div>
        }
      >
        {!filtered.length && (
          <div className="rounded-md border border-dashed border-slate-300 p-6 text-sm text-slate-500">검색 결과가 없습니다.</div>
        )}
        {!!filtered.length && (
          <div className="space-y-3">
            {filtered.map((card) => (
              <button
                key={card.id}
                onClick={() => setSelectedId(card.id)}
                className={`w-full rounded-md border p-4 text-left ${
                  selected?.id === card.id ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 bg-white"
                }`}
              >
                <div className="mb-2 flex items-start gap-2 text-xs">
                  <CategoryTags categories={card.categories || [card.category]} dark={selected?.id === card.id} />
                  <span className={`inline-flex h-6 items-center leading-none ${selected?.id === card.id ? "text-slate-300" : "text-slate-500"}`}>
                    {formatDateOnly(card.updatedAt)}
                  </span>
                </div>
                <div className="line-clamp-2 pl-2 text-sm font-medium leading-5">{card.question}</div>
              </button>
            ))}
          </div>
        )}
      </SectionCard>

      <SectionCard
        title="카드 상세"
        action={
          <div className="flex items-center gap-2">
            <button
              onClick={handleDeleteSelected}
              disabled={!selected || isSyncing}
              className={`rounded-md border px-3 py-2 text-sm ${
                !selected || isSyncing
                  ? "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400"
                  : "border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100"
              }`}
            >
              삭제
            </button>
            <button
              onClick={() => selected && onAddToReport(selected.id)}
              disabled={!selected || isAddedToReport}
              className={`rounded-md border px-4 py-2 text-sm ${
                !selected || isAddedToReport
                  ? "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400"
                  : "border-slate-200 text-slate-700"
              }`}
            >
              {isAddedToReport ? "리포트 추가됨" : "리포트에 추가"}
            </button>
          </div>
        }
      >
        {!selected && (
          <div className="rounded-md border border-dashed border-slate-300 p-6 text-sm text-slate-500">선택된 카드가 없습니다.</div>
        )}
        {selected && (
          <div className="space-y-5">
            <div className="flex items-stretch gap-3">
              <div className="inline-flex min-w-[44px] flex-col items-center justify-center rounded-md border border-slate-200 bg-slate-50 px-2 py-2 text-center text-sm font-semibold leading-tight text-slate-700">
                <span>질</span>
                <span>문</span>
              </div>
              <div className="flex-1 rounded-md bg-slate-50 p-4 text-sm leading-5 text-slate-800">{selected.question}</div>
            </div>
            <div className="flex items-stretch gap-3">
              <div className="inline-flex min-w-[44px] flex-col items-center justify-center rounded-md border border-slate-200 bg-slate-50 px-2 py-2 text-center text-sm font-semibold leading-tight text-slate-700">
                <span>답</span>
                <span>변</span>
              </div>
              <div className="flex-1 rounded-md bg-slate-50 p-4 text-sm leading-6 text-slate-800">{selected.answer}</div>
            </div>
            <div>
              <div className="mb-2 text-sm font-medium text-slate-700">현재 분류된 카테고리</div>
              <CategoryTags categories={selected.categories || [selected.category]} />
            </div>
            <div>
              <div className="mb-2 text-sm font-medium text-slate-700">증적</div>
              {!!selected.evidences?.length ? (
                <div className="grid grid-cols-1 gap-3">
                  {selected.evidences.map((evidence) => (
                    <EvidenceThumb
                      key={evidence.id}
                      item={evidence}
                      size="xl"
                      onImageClick={setPreviewImage}
                      showSaveButton
                    />
                  ))}
                </div>
              ) : (
                <div className="rounded-md border border-dashed border-slate-300 p-4 text-sm text-slate-500">증적 파일이 없습니다.</div>
              )}
            </div>
          </div>
        )}
      </SectionCard>

      {previewImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={() => setPreviewImage(null)}>
          <div className="relative max-h-[90vh] max-w-[90vw] overflow-hidden rounded-md bg-white" onClick={(e) => e.stopPropagation()}>
            <button type="button" className="absolute right-2 top-2 rounded-md bg-black/70 px-2 py-1 text-[13px] text-white" onClick={() => setPreviewImage(null)}>
              닫기
            </button>
            <img src={previewImage.thumbnail} alt={previewImage.name} className="max-h-[90vh] max-w-[90vw] object-contain" />
          </div>
        </div>
      )}
    </div>
  );
}
