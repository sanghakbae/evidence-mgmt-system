import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  BarChart3,
  CheckCircle2,
  ChevronRight,
  FileBarChart2,
  FilePlus2,
  FileSearch,
  FolderOpen,
  Link2,
  Search,
} from "lucide-react";

const MENUS = [
  { key: "dashboard", label: "대시보드", icon: BarChart3 },
  { key: "register", label: "카드 등록", icon: FilePlus2 },
  { key: "query", label: "카드 조회", icon: FileSearch },
  { key: "report", label: "리포트 생성", icon: FileBarChart2 },
];

const SHEET_URL = "https://docs.google.com/spreadsheets/d/1bWb8TSkOtI9E6tSXQKEutU9lOXu4IvlRPOT3jYRUGPE/edit?usp=drive_link";
const DRIVE_FOLDER_URL = "https://drive.google.com/drive/folders/1CGXuuPxTSlo4k9DY8qienmD89ilNGzUg?usp=drive_link";
const BRIDGE_URL = import.meta.env.VITE_GOOGLE_BRIDGE_URL || "";
const CATEGORY_RULES = [
  {
    category: "접근통제",
    strongKeywords: ["접근권한", "권한부여", "권한변경", "권한말소", "계정관리", "least privilege", "rbac"],
    keywords: [
      "접근", "권한", "계정", "인증", "인가", "말소", "회수", "비밀번호", "패스워드",
      "mfa", "2fa", "sso", "id", "iam", "role", "rbac", "least privilege",
      "privilege", "access", "auth", "authorization", "account",
    ],
  },
  {
    category: "로그관리",
    strongKeywords: ["접속기록", "로그보관", "로그보존", "로그분석", "siem"],
    keywords: [
      "로그", "기록", "접속기록", "이력", "추적", "보관", "모니터링", "감사",
      "로그점검", "로그검토", "로그분석",
      "위변조", "tamper", "siem", "event", "audit", "log", "trail", "retention",
    ],
  },
  {
    category: "취약점점검",
    strongKeywords: ["취약점", "취약점점검", "취약점진단", "모의해킹", "cve", "vulnerability", "pentest"],
    keywords: [
      "취약점", "취약", "보안점검", "취약점점검", "취약점진단", "점검결과", "점검항목",
      "모의해킹", "진단", "스캐너", "scan", "scanner", "vulnerability", "pentest",
      "cve", "패치", "보안패치", "업데이트",
    ],
  },
  {
    category: "재위탁관리",
    strongKeywords: ["재위탁", "재수탁", "수탁자", "third party", "vendor"],
    keywords: [
      "재위탁", "수탁자", "재수탁", "위탁", "협력사", "외주", "용역", "하도급",
      "서드파티", "third party", "vendor", "outsourcing", "subcontract",
      "계약", "실태점검", "수탁사",
    ],
  },
  {
    category: "정책관리",
    strongKeywords: ["정책", "지침", "절차", "내규", "관리계획"],
    keywords: [
      "정책", "지침", "절차", "내규", "관리계획", "기준", "표준", "문서화", "승인절차",
      "정기검토", "관리체계", "compliance", "governance",
    ],
  },
  {
    category: "암호화",
    strongKeywords: ["암호화", "암호키", "키관리", "tls", "aes", "rsa"],
    keywords: [
      "암호화", "복호화", "암호키", "키관리", "키회전", "전송구간", "저장구간",
      "tls", "ssl", "https", "aes", "rsa", "sha", "hash", "tokenization",
      "masking", "pseudonymization",
    ],
  },
  {
    category: "보존파기",
    strongKeywords: ["보존기간", "보유기간", "파기", "영구삭제"],
    keywords: [
      "파기", "폐기", "삭제", "보존기간", "보유기간", "만료", "파쇄", "영구삭제",
      "retention", "destruction", "dispose", "erase", "wipe",
    ],
  },
  {
    category: "사고대응",
    strongKeywords: ["침해사고", "유출", "incident", "breach", "csirt"],
    keywords: [
      "침해", "사고", "유출", "사이버", "대응", "비상", "신고", "보고", "통지",
      "incident", "breach", "response", "forensic", "soc", "csirt",
    ],
  },
  {
    category: "물리보안",
    strongKeywords: ["출입통제", "cctv", "서버실", "보안구역"],
    keywords: [
      "출입", "출입통제", "cctv", "물리", "보안구역", "락", "잠금", "서버실",
      "출입기록", "시설", "출입카드",
    ],
  },
  {
    category: "교육훈련",
    strongKeywords: ["보안교육", "정기교육", "훈련", "awareness"],
    keywords: [
      "교육", "훈련", "인식제고", "보안교육", "정기교육", "서약", "캠페인",
      "awareness", "training", "drill",
    ],
  },
];

function inferCategories(questionText, answerText) {
  const t = `${questionText || ""} ${answerText || ""}`.toLowerCase();
  const scored = [];
  for (const rule of CATEGORY_RULES) {
    const weakScore = (rule.keywords || []).reduce((acc, k) => (t.includes(k) ? acc + 1 : acc), 0);
    const strongScore = (rule.strongKeywords || []).reduce((acc, k) => (t.includes(k) ? acc + 3 : acc), 0);
    const score = weakScore + strongScore;
    if (score > 0) scored.push({ category: rule.category, score });
  }
  if (!scored.length) return ["기타"];
  scored.sort((a, b) => b.score - a.score);
  return scored.map((x) => x.category);
}

function CategoryTags({ categories, dark = false }) {
  const categoryTagClassMap = {
    접근통제: "border-sky-200 bg-sky-50 text-sky-700",
    로그관리: "border-amber-200 bg-amber-50 text-amber-700",
    재위탁관리: "border-emerald-200 bg-emerald-50 text-emerald-700",
    취약점점검: "border-orange-200 bg-orange-50 text-orange-700",
    정책관리: "border-indigo-200 bg-indigo-50 text-indigo-700",
    암호화: "border-violet-200 bg-violet-50 text-violet-700",
    보존파기: "border-rose-200 bg-rose-50 text-rose-700",
    사고대응: "border-red-200 bg-red-50 text-red-700",
    물리보안: "border-cyan-200 bg-cyan-50 text-cyan-700",
    교육훈련: "border-lime-200 bg-lime-50 text-lime-700",
    기타: "border-slate-200 bg-slate-50 text-slate-700",
  };
  const items = Array.isArray(categories) && categories.length ? categories : ["기타"];
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {items.map((cat) => (
        <span
          key={cat}
          className={`inline-flex rounded-md border px-2 py-0.5 text-[12px] font-semibold ${
            dark ? "border-white/20 bg-white/10 text-white" : categoryTagClassMap[cat] || categoryTagClassMap["기타"]
          }`}
        >
          {cat}
        </span>
      ))}
    </div>
  );
}

function formatDateOnly(value) {
  if (!value) return "-";
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) {
    const s = String(value).trim();
    const m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
    return m ? `${m[1]}-${m[2]}-${m[3]}` : s;
  }
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function escapeHtml(str) {
  return String(str || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function SidebarItem({ active, icon: Icon, label, onClick, collapsed }) {
  return (
    <button
      onClick={onClick}
      title={collapsed ? label : undefined}
      className={`flex w-full items-center rounded-md px-4 py-3 text-left transition-all ${
        collapsed ? "justify-center px-3" : "gap-3"
      } ${active ? "bg-gradient-to-r from-slate-900 to-slate-700 text-white shadow-md" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"}`}
    >
      <Icon className="h-4 w-4 shrink-0" />
      {!collapsed && <span className="text-sm font-medium">{label}</span>}
    </button>
  );
}

function SectionCard({ title, children, action, className = "", bodyClassName = "", headerClassName = "", style = undefined }) {
  return (
    <div className={`rounded-md bg-white px-5 py-4 shadow-sm ring-1 ring-slate-200/80 ${className}`} style={style}>
      <div className={`mb-3 flex min-h-10 items-start justify-between gap-3 ${headerClassName}`}>
        <h3 className="section-header self-start text-left text-[15px] font-bold text-slate-900">{title}</h3>
        {action}
      </div>
      <div className={bodyClassName}>{children}</div>
    </div>
  );
}

function Stat({ label, value, sub, tone = "bg-white ring-slate-200/70" }) {
  return (
    <div className={`rounded-md p-4 shadow-sm ring-1 ${tone}`}>
      <div className="stat-label text-sm text-slate-500">{label}</div>
      <div className="stat-value mt-1 text-3xl font-semibold tracking-tight text-slate-900">{value}</div>
      <div className="stat-sub mt-1 text-xs text-slate-500">{sub}</div>
    </div>
  );
}

function EvidenceThumb({ item, roundedClass = "rounded-md", size = "md", onImageClick }) {
  const thumbnailCandidates = useMemo(() => {
    const urls = [];
    if (item.thumbnail) urls.push(item.thumbnail);
    if (item.id) {
      urls.push(`https://drive.google.com/thumbnail?id=${item.id}&sz=w1600`);
      urls.push(`https://drive.google.com/uc?export=view&id=${item.id}`);
    }
    return Array.from(new Set(urls.filter(Boolean)));
  }, [item.thumbnail, item.id]);

  const [thumbnailIndex, setThumbnailIndex] = useState(0);
  const hasNextThumbnail = thumbnailIndex < thumbnailCandidates.length - 1;
  const currentThumbnail = thumbnailCandidates[thumbnailIndex] || "";
  const isImage = !!currentThumbnail;
  const mediaClass =
    size === "xl"
      ? "h-[320px] md:h-[380px]"
      : size === "lg"
        ? "h-[220px]"
        : "aspect-[16/10]";
  return (
    <div className={`overflow-hidden border border-slate-200 bg-white ${roundedClass}`}>
      <div className={`${mediaClass} bg-slate-100`}>
        {isImage ? (
          <button
            type="button"
            className="h-full w-full cursor-zoom-in"
            onClick={() =>
              onImageClick &&
              onImageClick({ ...item, thumbnail: currentThumbnail })
            }
          >
            <img
              src={currentThumbnail}
              alt={item.name}
              className="h-full w-full bg-slate-100 object-contain"
              onError={() => {
                if (hasNextThumbnail) {
                  setThumbnailIndex((prev) => prev + 1);
                } else {
                  setThumbnailIndex(thumbnailCandidates.length);
                }
              }}
            />
          </button>
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-slate-400">
            <FolderOpen className="h-8 w-8" />
            {!!item.thumbnail && (
              <div className="rounded-md border border-slate-300 bg-white px-2 py-1 text-[12px] text-slate-500">
                미리보기 불가
              </div>
            )}
          </div>
        )}
      </div>
      <div className="p-3">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="truncate text-sm font-medium text-slate-900">{item.name}</div>
            <div className="text-xs text-slate-500">{item.id}</div>
          </div>
          <div className="rounded-md border border-slate-200 px-2.5 py-1 text-xs text-slate-600">{item.type}</div>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [menu, setMenu] = useState("dashboard");
  const [collapsed, setCollapsed] = useState(false);
  const [cards, setCards] = useState([]);
  const [reportCardIds, setReportCardIds] = useState([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [bridgeStatus, setBridgeStatus] = useState({ ok: false, message: "" });
  const [isReportPreviewOpen, setIsReportPreviewOpen] = useState(false);
  const [reportPreviewHtml, setReportPreviewHtml] = useState("");
  const current = MENUS.find((m) => m.key === menu);

  const reportCards = useMemo(
    () => cards.filter((card) => reportCardIds.includes(card.id)),
    [cards, reportCardIds]
  );
  const isConnected = !!BRIDGE_URL && bridgeStatus.ok;

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
          return;
        }
      }

      // health 액션이 없는 구버전 Apps Script 호환: listCards 성공이면 연결됨 처리
      const listRes = await fetch(`${BRIDGE_URL}?action=listCards&ts=${Date.now()}`, {
        method: "GET",
        cache: "no-store",
      });
      if (!listRes.ok) throw new Error(`HTTP ${listRes.status}`);
      const listData = await listRes.json();
      if (!listData?.ok) throw new Error(listData?.message || "listCards 실패");
      setBridgeStatus({ ok: true, message: "" });
    } catch (err) {
      setBridgeStatus({
        ok: false,
        message: `브리지 연결 실패: ${err?.message || "알 수 없는 오류"}`,
      });
    }
  };

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
      const normalized = Array.isArray(data.cards)
        ? data.cards.map((card) => {
            const categories = inferCategories(card.question, card.answer);
            return {
              ...card,
              categories,
              category: categories[0] || "기타",
            };
          })
        : [];
      setCards(normalized);
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

  useEffect(() => {
    checkBridge().then(() => {
      loadCards();
    });
  }, []);

  const handleAddToReport = (cardId) => {
    setReportCardIds((prev) => (prev.includes(cardId) ? prev : [...prev, cardId]));
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
      } catch (_) {
        data = null;
      }
      if (!res.ok || !data?.ok) {
        throw new Error(data?.message || `카드 저장 실패 (${res.status})`);
      }

      if (data?.card) {
        const categories = inferCategories(data.card.question, data.card.answer);
        setCards((prev) => [{ ...data.card, categories, category: categories[0] || "기타" }, ...prev]);
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
        } catch (_) {
          return null;
        }
      };
      const ts = Date.now();
      const deleteRequests = [
        () =>
          fetch(BRIDGE_URL, {
            method: "POST",
            body: JSON.stringify({ action: "deleteCard", id }),
          }),
        () =>
          fetch(BRIDGE_URL, {
            method: "POST",
            body: JSON.stringify({ action: "deleteCard", cardId: id }),
          }),
        () =>
          fetch(`${BRIDGE_URL}?action=deleteCard&id=${encodeURIComponent(id)}&ts=${ts}`, {
            method: "GET",
            cache: "no-store",
          }),
        () =>
          fetch(`${BRIDGE_URL}?action=deleteCard&cardId=${encodeURIComponent(id)}&ts=${ts}`, {
            method: "GET",
            cache: "no-store",
          }),
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
              continue;
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

          // ok:true 만 반환하는 구현도 있으므로 최종 재검증으로 확정
          if (deletedValue === false || deletedValue === 0 || deletedValue === "0") {
            lastErr = data?.message || "삭제되지 않음";
          } else {
            deleted = true;
            break;
          }
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
      const verifyCards = Array.isArray(verifyData?.cards) ? verifyData.cards : [];
      const stillExists = verifyCards.some((card) => String(card.id) === id);
      setCards(verifyCards);

      if (stillExists) {
        if (unknownActionCount >= deleteRequests.length - 1) {
          throw new Error("백엔드에 deleteCard 액션이 배포되지 않았습니다. Apps Script를 delete-v2 코드로 재배포하세요.");
        }
        throw new Error(lastErr || "삭제 대상 카드를 찾지 못했습니다.");
      }
      if (!deleted && !stillExists) {
        deleted = true;
      }

      await loadCards();
      setReportCardIds((prev) => prev.filter((id) => String(id) !== String(cardId)));
      return deleted;
    } catch (err) {
      console.error(err);
      alert(`카드 삭제 중 오류가 발생했습니다.\n${err?.message || ""}`);
      return false;
    } finally {
      setIsSyncing(false);
    }
  };

  const buildReportHtml = () => {
    if (!reportCards.length) {
      return "";
    }

    const now = new Date();
    const dateLabel = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
    const title = `증적관리 시스템 리포트 (${dateLabel})`;

    const sections = reportCards
      .map((card, idx) => {
        const categories = (card.categories && card.categories.length ? card.categories : [card.category || "기타"])
          .map((c) => `<span class="tag">${escapeHtml(c)}</span>`)
          .join("");
        const evidences = (card.evidences || [])
          .map((e) => {
            const name = escapeHtml(e.name || e.id || "증적");
            const url = escapeHtml(e.url || "");
            const thumbPrimary = escapeHtml(
              e.id ? `https://drive.google.com/thumbnail?id=${e.id}&sz=w1200` : (e.thumbnail || "")
            );
            const thumbFallback = escapeHtml(
              e.id ? `https://drive.google.com/uc?export=view&id=${e.id}` : (e.thumbnail || "")
            );
            const isImage = String(e.type || "").includes("이미지") || !!e.thumbnail;

            if (isImage && (thumbPrimary || thumbFallback)) {
              return `
                <div class="evi-card">
                  <div class="evi-media">
                    <img
                      src="${thumbPrimary || thumbFallback}"
                      alt="${name}"
                      onerror="if(!this.dataset.fallback){this.dataset.fallback='1';this.src='${thumbFallback}';}else{this.onerror=null;this.style.display='none';this.parentElement.insertAdjacentHTML('beforeend','<div class=&quot;evi-noimg&quot;>미리보기 불가</div>');}"
                    />
                  </div>
                  <div class="evi-meta">
                    <div class="evi-name">${name}</div>
                  </div>
                </div>
              `;
            }

            return `
              <div class="evi-card">
                <div class="evi-meta">
                  <div class="evi-name">${name}</div>
                </div>
              </div>
            `;
          })
          .join("");

        return `
          <section class="card">
            <h2>${idx + 1}. ${escapeHtml(card.category || "기타")}</h2>
            <div class="row"><b>카테고리</b><div class="tags">${categories}</div></div>
            <div class="qa-box">
              <div class="qa-col">
                <div class="qa-title">질문</div>
                <div class="qa-body">${escapeHtml(card.question)}</div>
              </div>
              <div class="qa-col">
                <div class="qa-title">답변</div>
                <div class="qa-body">${escapeHtml(card.answer)}</div>
              </div>
            </div>
            <div class="row"><b>증적</b><div class="evi-grid">${evidences || "<div class='evi-empty'>없음</div>"}</div></div>
            <div class="meta">업데이트: ${escapeHtml(formatDateOnly(card.updatedAt))}</div>
          </section>
        `;
      })
      .join("");

    return `
      <!doctype html>
      <html lang="ko">
      <head>
        <meta charset="utf-8" />
        <title>${escapeHtml(title)}</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif; margin: 24px; color: #0f172a; }
          h1 { margin: 0 0 6px 0; font-size: 20px; }
          .sub { color: #64748b; font-size: 12px; margin-bottom: 18px; }
          .card { border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px; margin-bottom: 12px; page-break-inside: avoid; }
          .card h2 { margin: 0 0 10px 0; font-size: 16px; }
          .row { margin-bottom: 8px; }
          .row b { display: inline-block; min-width: 56px; font-size: 13px; color: #334155; vertical-align: top; }
          .row p { margin: 0; display: inline-block; width: calc(100% - 64px); line-height: 1.5; font-size: 13px; }
          .qa-box { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin: 10px 0 12px 0; }
          .qa-col { border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px; background: #f8fafc; }
          .qa-title { font-size: 12px; color: #475569; font-weight: 700; margin-bottom: 6px; }
          .qa-body { font-size: 13px; color: #0f172a; line-height: 1.55; white-space: pre-wrap; word-break: break-word; }
          .tags { display: inline-flex; gap: 6px; flex-wrap: wrap; width: calc(100% - 64px); }
          .tag { border: 1px solid #cbd5e1; border-radius: 999px; padding: 2px 8px; font-size: 12px; color: #334155; }
          .evi-grid { display: inline-grid; grid-template-columns: 1fr; gap: 12px; width: calc(100% - 64px); vertical-align: top; }
          .evi-card { border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; background: #fff; }
          .evi-media { height: 280px; background: #f8fafc; display: flex; align-items: center; justify-content: center; }
          .evi-media img { width: 100%; height: 100%; object-fit: contain; }
          .evi-noimg { font-size: 12px; color: #64748b; }
          .evi-meta { padding: 8px 10px; }
          .evi-name { font-size: 12px; margin-bottom: 4px; color: #334155; word-break: break-all; }
          .evi-empty { font-size: 13px; color: #64748b; }
          a { color: #1d4ed8; text-decoration: none; }
          .meta { margin-top: 8px; font-size: 12px; color: #64748b; }
          @media (max-width: 768px) { .qa-box { grid-template-columns: 1fr; } .evi-grid { grid-template-columns: 1fr; } }
          @media print { body { margin: 12mm; } }
        </style>
      </head>
      <body>
        <h1>${escapeHtml(title)}</h1>
        <div class="sub">생성일: ${escapeHtml(dateLabel)} / 카드 수: ${reportCards.length}</div>
        ${sections}
      </body>
      </html>
    `;
  };

  const handleGenerateReportPdf = () => {
    if (!reportCards.length) {
      alert("리포트에 추가된 카드가 없습니다.");
      return;
    }
    const html = buildReportHtml();
    setReportPreviewHtml(html);
    setIsReportPreviewOpen(true);
  };

  const handlePrintReportPreview = () => {
    const iframe = document.getElementById("report-preview-iframe");
    const frameWindow = iframe && iframe.contentWindow;
    if (!frameWindow) return;
    frameWindow.focus();
    frameWindow.print();
  };

  return (
    <div className="app-shell min-h-screen bg-[#f3f6fb] text-slate-900">
      <div className="flex min-h-screen">
        <aside
          className={`hidden flex-col border-r border-slate-200/70 bg-white/90 px-4 py-6 shadow-[0_18px_45px_-30px_rgba(15,23,42,0.45)] backdrop-blur transition-all duration-200 lg:flex ${
            collapsed ? "w-24" : "w-72"
          }`}
        >
          <div className={`mb-8 ${collapsed ? "flex justify-center" : "flex items-center justify-between gap-3"}`}>
            {!collapsed && (
              <div className="flex items-center gap-3 px-1">
                <div className="flex h-11 w-11 items-center justify-center rounded-md bg-gradient-to-br from-slate-900 to-slate-700 text-white shadow-md">
                  <span className="text-base font-bold">P</span>
                </div>
                <div>
                  <div className="text-sm font-semibold text-slate-900">증적관리 시스템</div>
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

            {menu === "dashboard" && <DashboardView cards={cards} reportCount={reportCards.length} />}
            {menu === "register" && <RegisterView onCreateCard={handleCreateCard} isSyncing={isSyncing} />}
            {menu === "query" && (
              <QueryView
                cards={cards}
                reportCardIds={reportCardIds}
                onAddToReport={handleAddToReport}
                onDeleteCard={handleDeleteCard}
                isSyncing={isSyncing}
              />
            )}
            {menu === "report" && <ReportView reportCards={reportCards} onGeneratePdf={handleGenerateReportPdf} />}
          </div>
        </main>
      </div>

      {isReportPreviewOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="flex h-[90vh] w-full max-w-6xl flex-col overflow-hidden rounded-md bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
              <div className="text-sm font-semibold text-slate-900">출력 미리보기</div>
              <div className="flex items-center gap-2">
                <button
                  className="rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-700"
                  onClick={handlePrintReportPreview}
                >
                  PDF 저장/인쇄
                </button>
                <button
                  className="rounded-md bg-slate-900 px-3 py-1.5 text-sm text-white"
                  onClick={() => setIsReportPreviewOpen(false)}
                >
                  닫기
                </button>
              </div>
            </div>
            <iframe
              id="report-preview-iframe"
              title="리포트 출력 미리보기"
              className="h-full w-full"
              srcDoc={reportPreviewHtml}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function DashboardView({ cards, reportCount }) {
  const parseCardDate = (value) => {
    if (!value) return null;
    if (value instanceof Date && !Number.isNaN(value.getTime())) return value;
    if (typeof value === "number") {
      const d = new Date(value);
      return Number.isNaN(d.getTime()) ? null : d;
    }
    if (typeof value !== "string") return null;

    const s = value.trim();
    if (!s) return null;

    // Normalize "YYYY-MM-DD" for stable parsing in all browsers.
    const isoLike = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (isoLike) {
      const d = new Date(`${isoLike[1]}-${isoLike[2]}-${isoLike[3]}T00:00:00+09:00`);
      return Number.isNaN(d.getTime()) ? null : d;
    }

    const d = new Date(s);
    return Number.isNaN(d.getTime()) ? null : d;
  };

  const formatCardDate = (date) => {
    if (!date) return "-";
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  };

  const statTones = [
    "bg-gradient-to-br from-rose-50 to-rose-100/60 ring-rose-200/80",
    "bg-gradient-to-br from-sky-50 to-blue-100/60 ring-sky-200/80",
    "bg-gradient-to-br from-amber-50 to-orange-100/60 ring-amber-200/80",
    "bg-gradient-to-br from-emerald-50 to-teal-100/60 ring-emerald-200/80",
  ];

  const categoryStats = useMemo(() => {
    return cards.reduce((acc, card) => {
      const cats = card.categories && card.categories.length ? card.categories : [card.category || "기타"];
      cats.forEach((cat) => {
        acc[cat] = (acc[cat] || 0) + 1;
      });
      return acc;
    }, {});
  }, [cards]);

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
      if (!latest || parsed.getTime() > latest.getTime()) latest = parsed;
    });
    return formatCardDate(latest);
  }, [cards]);

  const statItems = [
    { label: "전체 카드", value: cards.length, sub: "질문·답변·증적 세트" },
    { label: "전체 증적", value: cards.reduce((sum, card) => sum + (card.evidences?.length || 0), 0), sub: "카드에 연결된 파일" },
    { label: "최근 갱신", value: latestUpdatedAt, sub: "최신 카드 기준" },
    { label: "리포트 대상", value: reportCount, sub: "선택된 카드 기준" },
  ];
  const recentCards = useMemo(() => cards.slice(0, 7), [cards]);
  const dashboardPanelHeight = useMemo(
    () => Math.max(460, 260 + categoryEntries.length * 38),
    [categoryEntries.length]
  );

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {statItems.map((item, idx) => (
          <Stat
            key={item.label}
            label={item.label}
            value={item.value}
            sub={item.sub}
            tone={statTones[idx]}
          />
        ))}
      </div>

      <div className="grid items-stretch gap-4 xl:grid-cols-[1fr_1fr]">
        <SectionCard
          title="최근 등록 카드"
          className="flex flex-col overflow-hidden"
          bodyClassName="flex-1 overflow-auto"
          style={{ height: `${dashboardPanelHeight}px`, minHeight: `${dashboardPanelHeight}px`, maxHeight: `${dashboardPanelHeight}px` }}
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
                  <div className="mb-1.5 flex items-start gap-2 text-xs text-slate-500">
                    <CategoryTags categories={card.categories || [card.category]} />
                    <span className="inline-flex h-6 items-center leading-none">{formatDateOnly(card.updatedAt)}</span>
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
          style={{ height: `${dashboardPanelHeight}px`, minHeight: `${dashboardPanelHeight}px`, maxHeight: `${dashboardPanelHeight}px` }}
        >
          <div className="h-full">
              {!categoryEntries.length && (
                <div className="rounded-md border border-dashed border-slate-300 p-4 text-sm text-slate-500">표시할 데이터가 없습니다.</div>
              )}
              {!!categoryEntries.length && (
                <div className="grid h-full gap-3 lg:grid-cols-[1fr_190px]">
                  <div className="flex h-full items-center justify-center rounded-md border border-slate-200 bg-white p-2">
                    <div className="relative h-52 w-52">
                      <div
                        className="h-full w-full rounded-full"
                        style={{
                          background: donutGradient,
                          boxShadow:
                            "0 10px 20px rgba(15,23,42,0.18), inset 0 2px 6px rgba(255,255,255,0.45), inset 0 -10px 16px rgba(15,23,42,0.12)",
                        }}
                      />
                      <div className="pointer-events-none absolute inset-0 rounded-full bg-gradient-to-br from-white/35 via-transparent to-black/10" />
                      <div className="absolute inset-[22%] z-10 flex items-center justify-center rounded-full border border-slate-200/80 bg-slate-50 text-center shadow-[inset_0_2px_6px_rgba(15,23,42,0.06)]">
                        <div>
                          <div className="text-xs text-slate-500">합계</div>
                          <div className="text-sm font-bold text-slate-900">{totalCategoryCount}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="grid h-full gap-1.5" style={{ gridTemplateRows: `repeat(${Math.max(categoryEntries.length, 1)}, minmax(0, 1fr))` }}>
                    {categoryEntries.map(([category, count], idx) => (
                      <div key={category} className="flex h-full items-center justify-between rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-[13px] leading-tight">
                        <div className="flex items-center gap-2">
                          <span
                            className="inline-block h-2.5 w-2.5 rounded-full"
                            style={{ backgroundColor: donutPalette[idx % donutPalette.length] }}
                          />
                          <span className="text-slate-700">{category}</span>
                        </div>
                        <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[12px] font-semibold text-slate-900">{count}</span>
                      </div>
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

function RegisterView({ onCreateCard, isSyncing }) {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [files, setFiles] = useState([]);
  const [saveDone, setSaveDone] = useState(false);
  const fileInputRef = useRef(null);
  const questionRef = useRef(null);
  const answerRef = useRef(null);

  const inferredCategories = useMemo(
    () => inferCategories(question, answer),
    [question, answer]
  );

  const resizeTextarea = (el) => {
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  };

  const evidences = useMemo(() => {
    return files.map((file, idx) => ({
      id: `NEW-${idx + 1}`,
      name: file.name,
      type: file.type.startsWith("image/") ? "이미지" : "문서",
      thumbnail: file.type.startsWith("image/") ? URL.createObjectURL(file) : undefined,
    }));
  }, [files]);

  useEffect(() => {
    return () => {
      evidences.forEach((e) => {
        if (e.thumbnail) URL.revokeObjectURL(e.thumbnail);
      });
    };
  }, [evidences]);

  useEffect(() => {
    resizeTextarea(questionRef.current);
  }, [question]);

  useEffect(() => {
    resizeTextarea(answerRef.current);
  }, [answer]);

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
            <div className="text-xs text-slate-500">
              질문/답변 내용 기반으로 자동 분류됩니다.
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <div className="flex items-stretch gap-3">
                <div className="inline-flex min-w-[44px] flex-col items-center justify-center rounded-md border border-slate-200 bg-slate-50 px-2 py-2 text-center text-sm font-semibold text-slate-700 leading-tight">
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
                <div className="inline-flex min-w-[44px] flex-col items-center justify-center rounded-md border border-slate-200 bg-slate-50 px-2 py-2 text-center text-sm font-semibold text-slate-700 leading-tight">
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
              <div className="inline-flex min-w-[44px] flex-col items-center justify-center rounded-md border border-slate-200 bg-slate-50 px-2 py-2 text-center text-sm font-semibold text-slate-700 leading-tight">
                <span className="whitespace-nowrap">증적첨부</span>
              </div>
              <div className="flex flex-1 flex-col gap-3">
                <div className="flex flex-col gap-2 md:flex-row">
                  <input className="h-10 flex-1 rounded-md border border-slate-200 px-3 text-[13px]" value={files.length ? `${files.length}개 파일 선택됨` : ""} readOnly placeholder="증적 파일 선택" />
                  <button
                    type="button"
                    className="h-10 rounded-md bg-slate-900 px-3 text-[13px] text-white"
                    onClick={() => fileInputRef.current?.click()}
                  >
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
                {evidences.map((e) => (
                  <EvidenceThumb key={e.id} item={e} roundedClass="rounded-md" />
                ))}
              </div>
            )}
            <div className="mt-2 text-[13px]">
              저장 여부:{" "}
              <span className={saveDone ? "font-semibold text-red-600" : "text-slate-500"}>
                {saveDone ? "완료" : "미완료"}
              </span>
            </div>
          </div>
        </div>
      </SectionCard>
    </div>
  );
}

function QueryView({ cards, reportCardIds, onAddToReport, onDeleteCard, isSyncing }) {
  const [keyword, setKeyword] = useState("");
  const [selectedId, setSelectedId] = useState(cards[0]?.id ?? null);
  const [previewImage, setPreviewImage] = useState(null);

  const filtered = useMemo(() => {
    const q = keyword.trim().toLowerCase();
    if (!q) return cards;
    return cards.filter((card) =>
      [card.question, card.answer, card.category, ...((card.categories || []).map((c) => c)), ...(card.evidences || []).map((e) => e.name)]
        .join(" ")
        .toLowerCase()
        .includes(q)
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
                className={`w-full rounded-md border p-4 text-left ${selected?.id === card.id ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 bg-white"}`}
              >
                <div className="mb-2 flex items-start gap-2 text-xs">
                  <CategoryTags categories={card.categories || [card.category]} dark={selected?.id === card.id} />
                  <span className={`inline-flex h-6 items-center leading-none ${selected?.id === card.id ? "text-slate-300" : "text-slate-500"}`}>{formatDateOnly(card.updatedAt)}</span>
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
              <div className="inline-flex min-w-[44px] flex-col items-center justify-center rounded-md border border-slate-200 bg-slate-50 px-2 py-2 text-center text-sm font-semibold text-slate-700 leading-tight">
                <span>질</span>
                <span>문</span>
              </div>
              <div className="flex-1 rounded-md bg-slate-50 p-4 text-sm leading-5 text-slate-800">{selected.question}</div>
            </div>
            <div className="flex items-stretch gap-3">
              <div className="inline-flex min-w-[44px] flex-col items-center justify-center rounded-md border border-slate-200 bg-slate-50 px-2 py-2 text-center text-sm font-semibold text-slate-700 leading-tight">
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
                  {selected.evidences.map((e) => (
                    <EvidenceThumb key={e.id} item={e} size="xl" onImageClick={setPreviewImage} />
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
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={() => setPreviewImage(null)}
        >
          <div
            className="relative max-h-[90vh] max-w-[90vw] overflow-hidden rounded-md bg-white"
            onClick={(e) => e.stopPropagation()}
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

function ReportView({ reportCards, onGeneratePdf }) {
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
                    <div className="text-sm font-semibold text-slate-900">{idx + 1}. {card.category}</div>
                    <CategoryTags categories={card.categories || [card.category]} />
                  </div>
                  <div className="rounded-md border border-slate-200 px-2.5 py-1 text-xs text-slate-600">증적 {(card.evidences || []).length}건</div>
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
