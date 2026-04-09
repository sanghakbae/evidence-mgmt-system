import React, { useEffect, useMemo, useRef, useState } from "react";
import { Search } from "lucide-react";
import { CategoryTags, EvidenceThumb, SectionCard } from "../components/ui";
import { formatDateOnly } from "../utils/format";
import { inferCategories } from "../utils/categories";

function matchesQuestionByAnyCharacter(question, keyword) {
  const source = String(question || "").toLowerCase();
  const query = String(keyword || "").trim().toLowerCase();
  if (!query) return true;

  return [...new Set(query.replace(/\s+/g, "").split("").filter(Boolean))].some((char) =>
    source.includes(char)
  );
}

function resizeTextarea(element) {
  if (!element) return;
  element.style.height = "auto";
  element.style.height = `${element.scrollHeight}px`;
}

export default function QueryView({
  cards,
  reportCardIds,
  categoryFilter,
  onClearCategoryFilter,
  onAddToReport,
  onDeleteCard,
  onUpdateCard,
  isSyncing,
}) {
  const [keyword, setKeyword] = useState("");
  const [selectedId, setSelectedId] = useState(cards[0]?.id ?? null);
  const [previewImage, setPreviewImage] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editQuestion, setEditQuestion] = useState("");
  const [editAnswer, setEditAnswer] = useState("");
  const [newEvidenceFiles, setNewEvidenceFiles] = useState([]);
  const [removedEvidenceIds, setRemovedEvidenceIds] = useState([]);
  const editQuestionRef = useRef(null);
  const editAnswerRef = useRef(null);
  const editFileInputRef = useRef(null);

  const filtered = useMemo(() => {
    const query = keyword.trim().toLowerCase();

    return cards.filter((card) => {
      const matchesCategory =
        !categoryFilter || [card.category, ...(card.categories || [])].some((item) => String(item).includes(categoryFilter));
      if (!matchesCategory) return false;
      if (!query) return true;

      const matchesQuestion = matchesQuestionByAnyCharacter(card.question, query);
      const matchesOthers = [
        card.answer,
        card.category,
        ...(card.categories || []),
        ...(card.evidences || []).map((evidence) => evidence.name),
      ]
        .join(" ")
        .toLowerCase()
        .includes(query);

      return matchesQuestion || matchesOthers;
    });
  }, [cards, categoryFilter, keyword]);

  useEffect(() => {
    if (!filtered.length) {
      setSelectedId(null);
      setIsEditing(false);
      return;
    }

    if (!filtered.some((card) => card.id === selectedId)) {
      setSelectedId(filtered[0].id);
      setIsEditing(false);
    }
  }, [filtered, selectedId]);

  const selected = filtered.find((card) => card.id === selectedId) || null;
  const isAddedToReport = selected ? reportCardIds.includes(selected.id) : false;

  useEffect(() => {
    if (!isEditing || !selected) return;
    setEditQuestion(selected.question || "");
    setEditAnswer(selected.answer || "");
    setNewEvidenceFiles([]);
    setRemovedEvidenceIds([]);
  }, [isEditing, selected]);

  useEffect(() => {
    if (!isEditing) return;
    resizeTextarea(editQuestionRef.current);
  }, [editQuestion, isEditing]);

  useEffect(() => {
    if (!isEditing) return;
    resizeTextarea(editAnswerRef.current);
  }, [editAnswer, isEditing]);

  const editCategories = useMemo(
    () => inferCategories(editQuestion, editAnswer),
    [editAnswer, editQuestion]
  );

  const newEvidencePreviews = useMemo(
    () =>
      newEvidenceFiles.map((file, index) => ({
        id: `NEW-${index + 1}`,
        name: file.name,
        type: file.type.startsWith("image/") ? "이미지" : "문서",
        thumbnail: file.type.startsWith("image/") ? URL.createObjectURL(file) : "",
      })),
    [newEvidenceFiles]
  );

  useEffect(
    () => () => {
      newEvidencePreviews.forEach((item) => {
        if (item.thumbnail) URL.revokeObjectURL(item.thumbnail);
      });
    },
    [newEvidencePreviews]
  );

  const visibleSelectedEvidences = useMemo(() => {
    if (!selected) return [];
    return (selected.evidences || []).filter(
      (evidence) => !removedEvidenceIds.includes(String(evidence.id))
    );
  }, [removedEvidenceIds, selected]);

  const handleDeleteSelected = async () => {
    if (!selected) return;
    const randomCode = Math.random().toString(36).slice(2, 8).toUpperCase();
    const input = window.prompt(
      `선택한 카드를 삭제하려면 확인값 ${randomCode} 를 입력하세요.`,
      ""
    );
    if (input !== randomCode) {
      if (input !== null) {
        alert("확인값이 일치하지 않아 삭제가 취소되었습니다.");
      }
      return;
    }

    await onDeleteCard(selected.id);
  };

  const handleStartEdit = () => {
    if (!selected) return;
    setEditQuestion(selected.question || "");
    setEditAnswer(selected.answer || "");
    setNewEvidenceFiles([]);
    setRemovedEvidenceIds([]);
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditQuestion("");
    setEditAnswer("");
    setNewEvidenceFiles([]);
    setRemovedEvidenceIds([]);
  };

  const handleAddEvidenceFiles = (event) => {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;
    setNewEvidenceFiles((prev) => [...prev, ...files]);
    event.target.value = "";
  };

  const handleRemoveNewEvidence = (index) => {
    setNewEvidenceFiles((prev) => prev.filter((_, itemIndex) => itemIndex !== index));
  };

  const handleToggleRemoveExistingEvidence = (evidenceId) => {
    const id = String(evidenceId);
    setRemovedEvidenceIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSaveEdit = async () => {
    if (!selected) return;
    if (!editQuestion.trim() || !editAnswer.trim()) {
      alert("질문과 답변을 입력해 주세요.");
      return;
    }

    const success = await onUpdateCard({
      cardId: selected.id,
      question: editQuestion.trim(),
      answer: editAnswer.trim(),
      newFiles: newEvidenceFiles,
      removedEvidenceIds,
    });

    if (success) {
      setIsEditing(false);
      setNewEvidenceFiles([]);
      setRemovedEvidenceIds([]);
    }
  };

  return (
    <div className="query-layout-shell sm:h-[calc(100dvh-13.5rem)]">
      <div className="query-layout h-full">
        <SectionCard
          title="카드 조회"
          className="flex h-full min-h-0 flex-col overflow-hidden"
          bodyClassName="min-h-0 flex-1 overflow-auto"
          headerClassName="items-center"
          action={
            <div className="w-full max-w-[320px] space-y-2">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                className="h-9 w-full rounded-md border border-slate-200 pl-10 pr-3 text-sm"
                placeholder="검색어 입력"
              />
            </div>
            {!!categoryFilter && (
              <div className="flex items-center justify-between gap-2 rounded-md border border-sky-200 bg-sky-50 px-2 py-1 text-[12px] text-sky-700">
                <span className="truncate">{categoryFilter} 카테고리만 표시 중</span>
                <button
                  type="button"
                  onClick={onClearCategoryFilter}
                  className="shrink-0 rounded-md border border-sky-200 bg-white px-2 py-0.5 text-[11px] font-medium text-sky-700"
                >
                  필터 해제
                </button>
              </div>
            )}
            </div>
          }
        >
          {!filtered.length && (
            <div className="rounded-md border border-dashed border-slate-300 p-6 text-sm text-slate-500">
              검색 결과가 없습니다.
            </div>
          )}
          {!!filtered.length && (
            <div className="space-y-3">
              {filtered.map((card) => (
                <button
                  key={card.id}
                  type="button"
                  onClick={() => {
                    setSelectedId(card.id);
                    setIsEditing(false);
                  }}
                  className={`w-full rounded-md border p-4 text-left ${
                    selected?.id === card.id
                      ? "border-slate-900 bg-slate-900 text-white"
                      : "border-slate-200 bg-white"
                  }`}
                >
                  <div className="mb-2 flex items-start justify-between gap-3 text-xs">
                    <CategoryTags
                      categories={card.categories || [card.category]}
                      dark={selected?.id === card.id}
                    />
                    <span
                      className={`inline-flex h-6 shrink-0 items-center text-right leading-none ${
                        selected?.id === card.id ? "text-slate-300" : "text-slate-500"
                      }`}
                    >
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
          className="flex h-full min-h-0 flex-col overflow-hidden"
          bodyClassName="min-h-0 flex-1 overflow-auto"
          action={
            <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleStartEdit}
              disabled={!selected || isSyncing || isEditing}
              className={`rounded-md border px-3 py-2 text-sm ${
                !selected || isSyncing || isEditing
                  ? "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400"
                  : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
              }`}
            >
              수정
            </button>
            <button
              type="button"
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
              type="button"
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
            <div className="rounded-md border border-dashed border-slate-300 p-6 text-sm text-slate-500">
              선택된 카드가 없습니다.
            </div>
          )}

          {selected && !isEditing && (
            <div className="space-y-5">
            <div className="flex items-stretch gap-3">
              <div className="inline-flex min-w-[44px] flex-col items-center justify-center rounded-md border border-slate-200 bg-slate-50 px-2 py-2 text-center text-sm font-semibold leading-tight text-slate-700">
                <span>질</span>
                <span>문</span>
              </div>
              <div className="flex-1 rounded-md bg-slate-50 p-4 text-sm leading-5 text-slate-800">
                {selected.question}
              </div>
            </div>
            <div className="flex items-stretch gap-3">
              <div className="inline-flex min-w-[44px] flex-col items-center justify-center rounded-md border border-slate-200 bg-slate-50 px-2 py-2 text-center text-sm font-semibold leading-tight text-slate-700">
                <span>답</span>
                <span>변</span>
              </div>
              <div className="flex-1 rounded-md bg-slate-50 p-4 text-sm leading-6 text-slate-800">
                {selected.answer}
              </div>
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
                <div className="rounded-md border border-dashed border-slate-300 p-4 text-sm text-slate-500">
                  증적 파일이 없습니다.
                </div>
              )}
            </div>
            </div>
          )}

          {selected && isEditing && (
            <div className="space-y-5">
            <div>
              <div className="mb-2 text-sm font-medium text-slate-700">자동 분류 태그</div>
              <CategoryTags categories={editCategories} />
            </div>

            <div className="flex items-stretch gap-3">
              <div className="inline-flex min-w-[44px] flex-col items-center justify-center rounded-md border border-slate-200 bg-slate-50 px-2 py-2 text-center text-sm font-semibold leading-tight text-slate-700">
                <span>질</span>
                <span>문</span>
              </div>
              <textarea
                ref={editQuestionRef}
                value={editQuestion}
                onChange={(event) => {
                  setEditQuestion(event.target.value);
                  resizeTextarea(event.target);
                }}
                className="min-h-[110px] w-full resize-none overflow-hidden rounded-md border border-slate-200 p-4 text-[13px] outline-none"
              />
            </div>

            <div className="flex items-stretch gap-3">
              <div className="inline-flex min-w-[44px] flex-col items-center justify-center rounded-md border border-slate-200 bg-slate-50 px-2 py-2 text-center text-sm font-semibold leading-tight text-slate-700">
                <span>답</span>
                <span>변</span>
              </div>
              <textarea
                ref={editAnswerRef}
                value={editAnswer}
                onChange={(event) => {
                  setEditAnswer(event.target.value);
                  resizeTextarea(event.target);
                }}
                className="min-h-[140px] w-full resize-none overflow-hidden rounded-md border border-slate-200 p-4 text-[13px] outline-none"
              />
            </div>

            <div>
              <div className="mb-3 flex items-center justify-between gap-2">
                <div className="text-sm font-medium text-slate-700">증적</div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => editFileInputRef.current?.click()}
                    className="rounded-md border border-slate-200 px-3 py-1.5 text-[13px] text-slate-700"
                  >
                    증적 추가
                  </button>
                  <input
                    ref={editFileInputRef}
                    type="file"
                    multiple
                    className="hidden"
                    onChange={handleAddEvidenceFiles}
                  />
                </div>
              </div>

              {!!selected.evidences?.length && (
                <div className="mb-4 grid grid-cols-1 gap-3">
                  {selected.evidences.map((evidence) => {
                    const isRemoved = removedEvidenceIds.includes(String(evidence.id));
                    return (
                      <div key={evidence.id} className={isRemoved ? "opacity-50" : ""}>
                        <div className="mb-2 flex justify-end">
                          <button
                            type="button"
                            onClick={() => handleToggleRemoveExistingEvidence(evidence.id)}
                            className={`rounded-md border px-2.5 py-1 text-[12px] ${
                              isRemoved
                                ? "border-slate-200 bg-white text-slate-600"
                                : "border-rose-200 bg-rose-50 text-rose-700"
                            }`}
                          >
                            {isRemoved ? "삭제 취소" : "삭제"}
                          </button>
                        </div>
                        <EvidenceThumb
                          item={evidence}
                          size="xl"
                          onImageClick={setPreviewImage}
                          showSaveButton
                        />
                      </div>
                    );
                  })}
                </div>
              )}

              {!!newEvidencePreviews.length && (
                <div className="grid grid-cols-1 gap-3">
                  {newEvidencePreviews.map((evidence, index) => (
                    <div key={evidence.id}>
                      <div className="mb-2 flex justify-end">
                        <button
                          type="button"
                          onClick={() => handleRemoveNewEvidence(index)}
                          className="rounded-md border border-rose-200 bg-rose-50 px-2.5 py-1 text-[12px] text-rose-700"
                        >
                          삭제
                        </button>
                      </div>
                      <EvidenceThumb item={evidence} size="xl" onImageClick={setPreviewImage} />
                    </div>
                  ))}
                </div>
              )}

              {!visibleSelectedEvidences.length && !newEvidencePreviews.length && (
                <div className="rounded-md border border-dashed border-slate-300 p-4 text-sm text-slate-500">
                  증적 파일이 없습니다.
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={handleCancelEdit}
                className="rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-700"
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleSaveEdit}
                disabled={isSyncing}
                className="rounded-md bg-slate-900 px-4 py-2 text-sm text-white disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                {isSyncing ? "저장 중..." : "수정 저장"}
              </button>
            </div>
            </div>
          )}
        </SectionCard>
      </div>

      {previewImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={() => setPreviewImage(null)}
        >
          <div
            className="relative max-h-[90vh] max-w-[90vw] overflow-hidden rounded-md bg-white"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              className="absolute right-2 top-2 rounded-md bg-black/70 px-2 py-1 text-[13px] text-white"
              onClick={() => setPreviewImage(null)}
            >
              닫기
            </button>
            <img
              src={previewImage.thumbnail}
              alt={previewImage.name}
              className="max-h-[90vh] max-w-[90vw] object-contain"
            />
          </div>
        </div>
      )}
    </div>
  );
}
