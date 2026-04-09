import React, { useEffect, useMemo, useRef, useState } from "react";
import { CategoryTags, SectionCard } from "../components/ui";
import { inferCategories } from "../utils/categories";

function resizeTextarea(element) {
  if (!element) return;
  element.style.height = "auto";
  element.style.height = `${element.scrollHeight}px`;
}

export default function ReportView({ reportCards, onGeneratePdf, onUpdateCard, isSyncing }) {
  const [editingCardId, setEditingCardId] = useState(null);
  const [editQuestion, setEditQuestion] = useState("");
  const [editAnswer, setEditAnswer] = useState("");
  const questionRef = useRef(null);
  const answerRef = useRef(null);

  const editingCard =
    reportCards.find((card) => String(card.id) === String(editingCardId)) || null;

  useEffect(() => {
    if (!editingCard) return;
    setEditQuestion(editingCard.question || "");
    setEditAnswer(editingCard.answer || "");
  }, [editingCardId, editingCard]);

  useEffect(() => {
    if (!editingCardId) return;
    resizeTextarea(questionRef.current);
  }, [editQuestion, editingCardId]);

  useEffect(() => {
    if (!editingCardId) return;
    resizeTextarea(answerRef.current);
  }, [editAnswer, editingCardId]);

  const editCategories = useMemo(
    () => inferCategories(editQuestion, editAnswer),
    [editAnswer, editQuestion]
  );

  const handleStartEdit = (card) => {
    setEditingCardId(String(card.id));
    setEditQuestion(card.question || "");
    setEditAnswer(card.answer || "");
  };

  const handleCancelEdit = () => {
    setEditingCardId(null);
    setEditQuestion("");
    setEditAnswer("");
  };

  const handleSaveEdit = async () => {
    if (!editingCard) return;
    if (!editQuestion.trim() || !editAnswer.trim()) {
      alert("질문과 답변을 입력해 주세요.");
      return;
    }

    const success = await onUpdateCard({
      cardId: editingCard.id,
      question: editQuestion.trim(),
      answer: editAnswer.trim(),
      newFiles: [],
      removedEvidenceIds: [],
    });

    if (success) {
      handleCancelEdit();
    }
  };

  return (
    <div>
      <SectionCard
        title="리포트 포함 카드"
        action={
          <button
            className={`rounded-md px-4 py-2 text-sm text-white ${
              reportCards.length ? "bg-slate-900" : "cursor-not-allowed bg-slate-300"
            }`}
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
            {reportCards.map((card, idx) => {
              const isEditing = String(editingCardId) === String(card.id);

              return (
                <div key={card.id} className="rounded-md border border-slate-200 p-4">
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="text-sm font-semibold text-slate-900">
                        {idx + 1}. {card.category}
                      </div>
                      <CategoryTags categories={isEditing ? editCategories : (card.categories || [card.category])} />
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="rounded-md border border-slate-200 px-2.5 py-1 text-xs text-slate-600">
                        증적 {(card.evidences || []).length}건
                      </div>
                      {!isEditing && (
                        <button
                          type="button"
                          onClick={() => handleStartEdit(card)}
                          className="rounded-md border border-slate-200 px-3 py-1.5 text-xs text-slate-700"
                        >
                          수정
                        </button>
                      )}
                    </div>
                  </div>

                  {!isEditing && (
                    <>
                      <div className="text-sm leading-5 text-slate-900">{card.question}</div>
                      <div className="mt-2 text-sm leading-6 text-slate-600">{card.answer}</div>
                    </>
                  )}

                  {isEditing && (
                    <div className="space-y-3">
                      <div>
                        <div className="mb-1.5 text-xs font-medium text-slate-600">질문</div>
                        <textarea
                          ref={questionRef}
                          value={editQuestion}
                          onChange={(event) => {
                            setEditQuestion(event.target.value);
                            resizeTextarea(event.target);
                          }}
                          className="min-h-[88px] w-full resize-none overflow-hidden rounded-md border border-slate-200 px-3 py-2 text-sm leading-5 outline-none"
                        />
                      </div>
                      <div>
                        <div className="mb-1.5 text-xs font-medium text-slate-600">답변</div>
                        <textarea
                          ref={answerRef}
                          value={editAnswer}
                          onChange={(event) => {
                            setEditAnswer(event.target.value);
                            resizeTextarea(event.target);
                          }}
                          className="min-h-[120px] w-full resize-none overflow-hidden rounded-md border border-slate-200 px-3 py-2 text-sm leading-6 outline-none"
                        />
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
                          {isSyncing ? "저장 중..." : "저장"}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </SectionCard>
    </div>
  );
}
