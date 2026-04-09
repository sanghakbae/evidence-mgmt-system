import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, ChevronRight, Link2, Menu } from "lucide-react";
import { BRIDGE_URL, DRIVE_FOLDER_URL, MENUS, SHEET_URL } from "./constants";
import { SidebarItem } from "./components/ui";
import DashboardView from "./views/DashboardView";
import QueryView from "./views/QueryView";
import RegisterView from "./views/RegisterView";
import ReportView from "./views/ReportView";
import { buildReportHtml } from "./utils/report";
import { normalizeCard } from "./utils/categories";

const CARD_CACHE_KEY = "consignee-audit.cards";
const CARD_CACHE_TTL = 1000 * 60 * 3;

function readCardCache() {
  try {
    const raw = window.localStorage.getItem(CARD_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    const savedAt = Number(parsed?.savedAt || 0);
    if (!savedAt || Date.now() - savedAt > CARD_CACHE_TTL) {
      window.localStorage.removeItem(CARD_CACHE_KEY);
      return null;
    }

    return Array.isArray(parsed?.cards) ? parsed.cards.map(normalizeCard) : null;
  } catch {
    return null;
  }
}

function writeCardCache(cards) {
  try {
    window.localStorage.setItem(
      CARD_CACHE_KEY,
      JSON.stringify({
        savedAt: Date.now(),
        cards,
      })
    );
  } catch {
    // Ignore storage failures and continue with in-memory state only.
  }
}

export default function App() {
  const [menu, setMenu] = useState("dashboard");
  const [collapsed, setCollapsed] = useState(false);
  const [cards, setCards] = useState([]);
  const [reportCardIds, setReportCardIds] = useState([]);
  const [queryCategoryFilter, setQueryCategoryFilter] = useState("");
  const [isSyncing, setIsSyncing] = useState(false);
  const [bridgeStatus, setBridgeStatus] = useState({ ok: false, message: "" });
  const [isReportPreviewOpen, setIsReportPreviewOpen] = useState(false);
  const [reportPreviewHtml, setReportPreviewHtml] = useState("");
  const current = MENUS.find((item) => item.key === menu);

  const reportCards = useMemo(
    () => cards.filter((card) => reportCardIds.includes(String(card.id))),
    [cards, reportCardIds]
  );

  const isConnected = !!BRIDGE_URL && bridgeStatus.ok;

  const loadCards = async () => {
    if (!BRIDGE_URL) return;

    setIsSyncing(true);
    try {
      const res = await fetch(`${BRIDGE_URL}?action=listCards&ts=${Date.now()}`, {
        method: "GET",
        cache: "no-store",
      });
      if (!res.ok) throw new Error("카드 조회 실패");

      const data = await res.json();
      if (!data?.ok) throw new Error(data?.message || "listCards 실패");

      const normalized = Array.isArray(data.cards) ? data.cards.map(normalizeCard) : [];
      setCards(normalized);
      writeCardCache(normalized);
      setBridgeStatus({ ok: true, message: "" });
    } catch (err) {
      console.error(err);
      setBridgeStatus({
        ok: false,
        message: `스프레드시트 데이터 로딩 실패: ${err?.message || "알 수 없는 오류"}`,
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const checkBridge = async () => {
    if (!BRIDGE_URL) {
      setBridgeStatus({
        ok: false,
        message: "VITE_GOOGLE_BRIDGE_URL이 설정되지 않아 스프레드시트 데이터를 불러올 수 없습니다.",
      });
      return;
    }

    try {
      const res = await fetch(`${BRIDGE_URL}?action=health&ts=${Date.now()}`, {
        method: "GET",
        cache: "no-store",
      });

      if (res.ok) {
        const data = await res.json();
        if (data?.ok) {
          setBridgeStatus({ ok: true, message: "" });
          await loadCards();
          return;
        }
      }

      await loadCards();
    } catch (err) {
      setBridgeStatus({
        ok: false,
        message: `브리지 연결 실패: ${err?.message || "알 수 없는 오류"}`,
      });
    }
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      const cachedCards = readCardCache();
      if (cachedCards?.length) {
        setCards(cachedCards);
      }
    }

    checkBridge();
  }, []);

  const handleAddToReport = (cardId) => {
    const normalizedId = String(cardId);
    setReportCardIds((prev) => (prev.includes(normalizedId) ? prev : [...prev, normalizedId]));
    setMenu("report");
  };

  const handleSelectDashboardCategory = (category) => {
    setQueryCategoryFilter(String(category || ""));
    setMenu("query");
  };

  const handleCreateCard = async ({ category, question, answer, files }) => {
    if (!BRIDGE_URL) {
      alert("VITE_GOOGLE_BRIDGE_URL 설정이 필요합니다. Google Apps Script Web App URL을 연결해 주세요.");
      return false;
    }

    const toBase64 = (file) =>
      new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = String(reader.result || "");
          const base64 = result.includes(",") ? result.split(",")[1] : result;
          resolve(base64);
        };
        reader.onerror = () => reject(new Error("파일 인코딩 실패"));
        reader.readAsDataURL(file);
      });

    const encodedFiles = await Promise.all(
      files.map(async (file) => ({
        name: file.name,
        mimeType: file.type || "application/octet-stream",
        base64: await toBase64(file),
      }))
    );

    setIsSyncing(true);
    try {
      const res = await fetch(BRIDGE_URL, {
        method: "POST",
        body: JSON.stringify({
          action: "createCard",
          category,
          question,
          answer,
          files: encodedFiles,
        }),
      });

      const raw = await res.text();
      let data = null;
      try {
        data = JSON.parse(raw);
      } catch {
        data = null;
      }

      if (!res.ok || !data?.ok) {
        throw new Error(data?.message || `카드 저장 실패 (${res.status})`);
      }

      if (data?.card) {
        setCards((prev) => {
          const nextCards = [normalizeCard(data.card), ...prev];
          writeCardCache(nextCards);
          return nextCards;
        });
      } else {
        await loadCards();
      }

      return true;
    } catch (err) {
      console.error(err);
      alert(`카드 저장 중 오류가 발생했습니다.\n${err?.message || ""}`);
      return false;
    } finally {
      setIsSyncing(false);
    }
  };

  const handleUpdateCard = async ({ cardId, question, answer, newFiles, removedEvidenceIds }) => {
    if (!BRIDGE_URL) {
      alert("VITE_GOOGLE_BRIDGE_URL 설정이 필요합니다. Google Apps Script Web App URL을 연결해 주세요.");
      return false;
    }

    const toBase64 = (file) =>
      new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = String(reader.result || "");
          const base64 = result.includes(",") ? result.split(",")[1] : result;
          resolve(base64);
        };
        reader.onerror = () => reject(new Error("파일 인코딩 실패"));
        reader.readAsDataURL(file);
      });

    const encodedFiles = await Promise.all(
      (newFiles || []).map(async (file) => ({
        name: file.name,
        mimeType: file.type || "application/octet-stream",
        base64: await toBase64(file),
      }))
    );

    setIsSyncing(true);
    try {
      const categories = normalizeCard({ question, answer, categories: [] }).categories;
      const res = await fetch(BRIDGE_URL, {
        method: "POST",
        body: JSON.stringify({
          action: "updateCard",
          id: String(cardId),
          cardId: String(cardId),
          category: categories[0] || "기타",
          categories,
          question,
          answer,
          files: encodedFiles,
          newFiles: encodedFiles,
          removedEvidenceIds: (removedEvidenceIds || []).map(String),
        }),
      });

      const raw = await res.text();
      let data = null;
      try {
        data = JSON.parse(raw);
      } catch {
        data = null;
      }

      if (!res.ok || !data?.ok) {
        const msg = data?.message || `카드 수정 실패 (${res.status})`;
        const lowerMsg = String(msg).toLowerCase();
        if (lowerMsg.includes("unknown action") || lowerMsg.includes("updatecard")) {
          throw new Error("백엔드에 updateCard 액션이 배포되지 않았습니다. Apps Script에 updateCard를 추가하고 새 버전으로 재배포하세요.");
        }
        throw new Error(msg);
      }

      if (data?.card) {
        setCards((prev) => {
          const nextCards = prev.map((card) =>
            String(card.id) === String(cardId) ? normalizeCard(data.card) : card
          );
          writeCardCache(nextCards);
          return nextCards;
        });
      } else {
        await loadCards();
      }

      return true;
    } catch (err) {
      console.error(err);
      alert(`카드 수정 중 오류가 발생했습니다.\n${err?.message || ""}`);
      return false;
    } finally {
      setIsSyncing(false);
    }
  };

  const handleDeleteCard = async (cardId) => {
    if (!BRIDGE_URL) {
      alert("VITE_GOOGLE_BRIDGE_URL 설정이 필요합니다. Google Apps Script Web App URL을 연결해 주세요.");
      return false;
    }

    setIsSyncing(true);
    try {
      const id = String(cardId);
      const parseJson = (text) => {
        try {
          return JSON.parse(text);
        } catch {
          return null;
        }
      };

      const ts = Date.now();
      const deleteRequests = [
        () => fetch(BRIDGE_URL, { method: "POST", body: JSON.stringify({ action: "deleteCard", id }) }),
        () => fetch(BRIDGE_URL, { method: "POST", body: JSON.stringify({ action: "deleteCard", cardId: id }) }),
        () => fetch(`${BRIDGE_URL}?action=deleteCard&id=${encodeURIComponent(id)}&ts=${ts}`, { method: "GET", cache: "no-store" }),
        () => fetch(`${BRIDGE_URL}?action=deleteCard&cardId=${encodeURIComponent(id)}&ts=${ts}`, { method: "GET", cache: "no-store" }),
      ];

      let lastErr = "";
      let deleted = false;
      let unknownActionCount = 0;

      for (const request of deleteRequests) {
        try {
          const res = await request();
          const raw = await res.text();
          const data = parseJson(raw);

          if (!res.ok) {
            lastErr = data?.message || `HTTP ${res.status}`;
            continue;
          }

          if (!data?.ok) {
            lastErr = data?.message || "삭제 실패";
            const msg = String(lastErr).toLowerCase();
            if (msg.includes("unknown action") || msg.includes("unknown")) {
              unknownActionCount += 1;
            }
            continue;
          }

          const deletedValue = data?.deleted;
          if (
            deletedValue === true ||
            deletedValue === 1 ||
            deletedValue === "1" ||
            deletedValue === "true" ||
            data?.rowDeleted === true ||
            data?.rowDeleted === 1
          ) {
            deleted = true;
            break;
          }

          if (deletedValue !== false && deletedValue !== 0 && deletedValue !== "0") {
            deleted = true;
            break;
          }

          lastErr = data?.message || "삭제되지 않음";
        } catch (err) {
          lastErr = err?.message || "요청 실패";
        }
      }

      const verifyRes = await fetch(`${BRIDGE_URL}?action=listCards&ts=${Date.now()}`, {
        method: "GET",
        cache: "no-store",
      });
      const verifyRaw = await verifyRes.text();
      const verifyData = parseJson(verifyRaw);
      const verifyCards = Array.isArray(verifyData?.cards) ? verifyData.cards.map(normalizeCard) : [];
      const stillExists = verifyCards.some((card) => card.id === id);
      setCards(verifyCards);
      writeCardCache(verifyCards);

      if (stillExists) {
        if (unknownActionCount >= deleteRequests.length - 1) {
          throw new Error("백엔드에 deleteCard 액션이 배포되지 않았습니다. Apps Script를 delete-v2 코드로 재배포하세요.");
        }
        throw new Error(lastErr || "삭제 대상 카드를 찾지 못했습니다.");
      }

      if (!deleted && !stillExists) {
        deleted = true;
      }

      setReportCardIds((prev) => prev.filter((itemId) => itemId !== id));
      return deleted;
    } catch (err) {
      console.error(err);
      alert(`카드 삭제 중 오류가 발생했습니다.\n${err?.message || ""}`);
      return false;
    } finally {
      setIsSyncing(false);
    }
  };

  const handleGenerateReportPdf = () => {
    if (!reportCards.length) {
      alert("리포트에 추가된 카드가 없습니다.");
      return;
    }

    setReportPreviewHtml(buildReportHtml(reportCards));
    setIsReportPreviewOpen(true);
  };

  const handlePrintReportPreview = () => {
    const iframe = document.getElementById("report-preview-iframe");
    const frameWindow = iframe?.contentWindow;
    if (!frameWindow) return;
    frameWindow.focus();
    frameWindow.print();
  };

  return (
    <div className="app-shell min-h-screen bg-[#f3f6fb] text-slate-900">
      <div className="flex min-h-screen">
        <aside
          className={`hidden flex-col border-r border-slate-200/70 bg-white/90 px-4 py-6 shadow-[0_18px_45px_-30px_rgba(15,23,42,0.45)] backdrop-blur transition-all duration-200 lg:flex ${
            collapsed ? "w-28" : "w-80"
          }`}
        >
          <div className={`mb-8 ${collapsed ? "flex justify-center" : "flex items-center justify-between gap-3"}`}>
            {!collapsed && (
              <div className="flex items-center gap-3 px-1">
                <div className="flex h-11 w-11 items-center justify-center rounded-md bg-gradient-to-br from-slate-900 to-slate-700 text-white shadow-md">
                  <span className="text-base font-bold">P</span>
                </div>
                <div className="min-w-0 flex-1 text-center">
                  <div className="portal-title font-semibold leading-tight">
                    <span className="block whitespace-nowrap">개인정보 수탁사 점검</span>
                    <span className="block whitespace-nowrap">대응 포털</span>
                  </div>
                </div>
              </div>
            )}
            <button
              onClick={() => setCollapsed((prev) => !prev)}
              className="rounded-md border border-slate-200 bg-white p-2 text-slate-600 hover:bg-slate-100"
              aria-label={collapsed ? "사이드바 펼치기" : "사이드바 접기"}
            >
              <ChevronRight className={`h-4 w-4 transition-transform ${collapsed ? "rotate-0" : "rotate-180"}`} />
            </button>
          </div>

          <div className="space-y-2">
            {MENUS.map((item) => (
              <SidebarItem
                key={item.key}
                icon={item.icon}
                label={item.label}
                active={menu === item.key}
                collapsed={collapsed}
                onClick={() => setMenu(item.key)}
              />
            ))}
          </div>

          <div className={`mt-auto rounded-md border border-slate-200 bg-gradient-to-br from-slate-50 to-blue-50 p-3 text-slate-700 ${collapsed ? "hidden" : "block"}`}>
            <div className="mb-2 flex items-center gap-2 text-sm font-semibold">
              <Link2 className="h-4 w-4" /> 연결 리소스
            </div>
            <div className="space-y-1.5 text-xs text-slate-600">
              <a className="flex items-center justify-between gap-2 rounded-md border border-slate-200 bg-white px-2.5 py-1.5 hover:bg-slate-50" href={SHEET_URL} target="_blank" rel="noreferrer">
                <span className="whitespace-nowrap">질문/답변: Google Sheets</span>
                <CheckCircle2 className={`h-4 w-4 ${isConnected ? "text-emerald-500" : "text-slate-300"}`} />
              </a>
              <a className="flex items-center justify-between gap-2 rounded-md border border-slate-200 bg-white px-2.5 py-1.5 hover:bg-slate-50" href={DRIVE_FOLDER_URL} target="_blank" rel="noreferrer">
                <span className="whitespace-nowrap">증적 파일: Google Drive</span>
                <CheckCircle2 className={`h-4 w-4 ${isConnected ? "text-emerald-500" : "text-slate-300"}`} />
              </a>
            </div>
          </div>
        </aside>

        <main className="w-full bg-transparent p-4 md:p-6">
          <div className="w-full">
            <div className="mb-3 flex items-center gap-2 lg:hidden">
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-slate-900 text-white">
                <Menu className="h-5 w-5" />
              </div>
              <div>
                <div className="text-sm font-semibold text-slate-900">개인정보 수탁사 점검 대응 포털</div>
                <div className="text-xs text-slate-500">모바일 메뉴</div>
              </div>
            </div>

            <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:hidden">
              {MENUS.map((item) => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setMenu(item.key)}
                  className={`rounded-md border px-3 py-2 text-sm font-medium ${
                    menu === item.key
                      ? "border-slate-900 bg-slate-900 text-white"
                      : "border-slate-200 bg-white text-slate-700"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 rounded-md bg-gradient-to-r from-slate-900 via-slate-800 to-blue-900 px-5 py-4 text-white shadow-[0_20px_45px_-30px_rgba(15,23,42,0.75)] ring-1 ring-slate-700/30"
            >
              <div className="menu-header text-2xl font-semibold tracking-tight text-white">{current?.label}</div>
            </motion.div>

            {!isConnected && !!bridgeStatus.message && (
              <div className="mb-4 rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-[13px] text-rose-700">
                {bridgeStatus.message}
              </div>
            )}

            {menu === "dashboard" && (
              <DashboardView
                cards={cards}
                reportCount={reportCards.length}
                onSelectCategory={handleSelectDashboardCategory}
              />
            )}
            {menu === "register" && <RegisterView onCreateCard={handleCreateCard} isSyncing={isSyncing} />}
            {menu === "query" && (
              <QueryView
                cards={cards}
                reportCardIds={reportCardIds}
                categoryFilter={queryCategoryFilter}
                onClearCategoryFilter={() => setQueryCategoryFilter("")}
                onAddToReport={handleAddToReport}
                onDeleteCard={handleDeleteCard}
                onUpdateCard={handleUpdateCard}
                isSyncing={isSyncing}
              />
            )}
            {menu === "report" && (
              <ReportView
                reportCards={reportCards}
                onGeneratePdf={handleGenerateReportPdf}
                onUpdateCard={handleUpdateCard}
                isSyncing={isSyncing}
              />
            )}
          </div>
        </main>
      </div>

      {isReportPreviewOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="flex h-[90vh] w-full max-w-6xl flex-col overflow-hidden rounded-md bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
              <div className="text-sm font-semibold text-slate-900">출력 미리보기</div>
              <div className="flex items-center gap-2">
                <button className="rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-700" onClick={handlePrintReportPreview}>
                  PDF 저장/인쇄
                </button>
                <button className="rounded-md bg-slate-900 px-3 py-1.5 text-sm text-white" onClick={() => setIsReportPreviewOpen(false)}>
                  닫기
                </button>
              </div>
            </div>
            <iframe id="report-preview-iframe" title="리포트 출력 미리보기" className="h-full w-full" srcDoc={reportPreviewHtml} />
          </div>
        </div>
      )}
    </div>
  );
}
