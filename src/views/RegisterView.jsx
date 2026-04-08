import React, { useEffect, useMemo, useRef, useState } from "react";
import { SHEET_URL } from "../constants";
import { EvidenceThumb, CategoryTags, SectionCard } from "../components/ui";
import { inferCategories } from "../utils/categories";

export default function RegisterView({ onCreateCard, isSyncing }) {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [files, setFiles] = useState([]);
  const [saveDone, setSaveDone] = useState(false);
  const fileInputRef = useRef(null);
  const questionRef = useRef(null);
  const answerRef = useRef(null);

  const inferredCategories = useMemo(() => inferCategories(question, answer), [question, answer]);

  const resizeTextarea = (element) => {
    if (!element) return;
    element.style.height = "auto";
    element.style.height = `${element.scrollHeight}px`;
  };

  const evidences = useMemo(
    () =>
      files.map((file, idx) => ({
        id: `NEW-${idx + 1}`,
        name: file.name,
        type: file.type.startsWith("image/") ? "이미지" : "문서",
        thumbnail: file.type.startsWith("image/") ? URL.createObjectURL(file) : undefined,
      })),
    [files]
  );

  useEffect(
    () => () => {
      evidences.forEach((evidence) => {
        if (evidence.thumbnail) URL.revokeObjectURL(evidence.thumbnail);
      });
    },
    [evidences]
  );

  useEffect(() => {
    resizeTextarea(questionRef.current);
  }, [question]);

  useEffect(() => {
    resizeTextarea(answerRef.current);
  }, [answer]);

  useEffect(() => {
    if (question || answer || files.length) {
      setSaveDone(false);
    }
  }, [question, answer, files]);

  const handleAddEvidenceFiles = (event) => {
    const selected = Array.from(event.target.files || []);
    if (!selected.length) return;
    setFiles((prev) => [...prev, ...selected]);
    event.target.value = "";
  };

  const handleSaveCard = async () => {
    if (!question.trim() || !answer.trim()) {
      alert("질문과 답변을 입력해 주세요.");
      return;
    }

    const success = await onCreateCard({
      category: inferredCategories[0] || "기타",
      question: question.trim(),
      answer: answer.trim(),
      files,
    });

    if (success) {
      setQuestion("");
      setAnswer("");
      setFiles([]);
      setSaveDone(true);
    }
  };

  return (
    <div className="space-y-4">
      <SectionCard
        title="카드 등록"
        action={
          <a className="rounded-md border border-slate-200 px-3 py-1.5 text-[13px] text-slate-700" href={SHEET_URL} target="_blank" rel="noreferrer">
            질문 시트 열기
          </a>
        }
      >
        <div className="space-y-5">
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-700">
              <span>자동 분류 카테고리</span>
            </div>
            <CategoryTags categories={inferredCategories} />
            <div className="text-xs text-slate-500">질문/답변 내용 기반으로 자동 분류됩니다.</div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <div className="flex items-stretch gap-3">
                <div className="inline-flex min-w-[44px] flex-col items-center justify-center rounded-md border border-slate-200 bg-slate-50 px-2 py-2 text-center text-sm font-semibold leading-tight text-slate-700">
                  <span>질</span>
                  <span>문</span>
                </div>
                <textarea
                  ref={questionRef}
                  value={question}
                  onChange={(e) => {
                    setQuestion(e.target.value);
                    resizeTextarea(e.target);
                  }}
                  className="min-h-[110px] w-full resize-none overflow-hidden rounded-md border border-slate-200 p-4 text-[13px] outline-none ring-0"
                  placeholder="점검 체크리스트의 질문을 입력하세요."
                />
              </div>
            </div>
            <div>
              <div className="flex items-stretch gap-3">
                <div className="inline-flex min-w-[44px] flex-col items-center justify-center rounded-md border border-slate-200 bg-slate-50 px-2 py-2 text-center text-sm font-semibold leading-tight text-slate-700">
                  <span>답</span>
                  <span>변</span>
                </div>
                <textarea
                  ref={answerRef}
                  value={answer}
                  onChange={(e) => {
                    setAnswer(e.target.value);
                    resizeTextarea(e.target);
                  }}
                  className="min-h-[110px] w-full resize-none overflow-hidden rounded-md border border-slate-200 p-4 text-[13px] outline-none ring-0"
                  placeholder="질문에 대한 답변을 입력하세요."
                />
              </div>
            </div>
          </div>

          <div>
            <div className="mb-3 flex items-stretch gap-3">
              <div className="inline-flex min-w-[44px] flex-col items-center justify-center rounded-md border border-slate-200 bg-slate-50 px-2 py-2 text-center text-sm font-semibold leading-tight text-slate-700">
                <span className="whitespace-nowrap">증적첨부</span>
              </div>
              <div className="flex flex-1 flex-col gap-3">
                <div className="flex flex-col gap-2 md:flex-row">
                  <input
                    className="h-10 flex-1 rounded-md border border-slate-200 px-3 text-[13px]"
                    value={files.length ? `${files.length}개 파일 선택됨` : ""}
                    readOnly
                    placeholder="증적 파일 선택"
                  />
                  <button type="button" className="h-10 rounded-md bg-slate-900 px-3 text-[13px] text-white" onClick={() => fileInputRef.current?.click()}>
                    증적 추가
                  </button>
                  <input ref={fileInputRef} type="file" multiple className="hidden" onChange={handleAddEvidenceFiles} />
                  <button
                    className="h-10 rounded-md bg-slate-900 px-3 text-[13px] font-medium text-white disabled:cursor-not-allowed disabled:bg-slate-300"
                    onClick={handleSaveCard}
                    disabled={isSyncing}
                  >
                    {isSyncing ? "저장 중..." : "카드 저장"}
                  </button>
                </div>
              </div>
            </div>

            {!!evidences.length && (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {evidences.map((evidence) => (
                  <EvidenceThumb key={evidence.id} item={evidence} roundedClass="rounded-md" />
                ))}
              </div>
            )}
            <div className="mt-2 text-[13px]">
              저장 여부:{" "}
              <span className={saveDone ? "font-semibold text-emerald-600" : "text-slate-500"}>
                {saveDone ? "완료" : "미완료"}
              </span>
            </div>
          </div>
        </div>
      </SectionCard>
    </div>
  );
}
