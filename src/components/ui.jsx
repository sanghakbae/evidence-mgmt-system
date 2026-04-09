import React, { useMemo, useState } from "react";
import { Download, FolderOpen } from "lucide-react";

function getExtensionFromName(name = "") {
  const match = String(name).match(/\.([a-z0-9]+)$/i);
  return match ? `.${match[1]}` : "";
}

function getExtensionFromMime(type = "") {
  const mimeMap = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/gif": ".gif",
    "image/webp": ".webp",
    "application/pdf": ".pdf",
  };

  return mimeMap[type] || "";
}

function buildDownloadFileName(item) {
  const baseName = String(item.name || "evidence").trim() || "evidence";
  const existingExtension = getExtensionFromName(baseName);
  if (existingExtension) return baseName;

  return `${baseName}${getExtensionFromMime(item.mimeType || item.fileType || "")}`;
}

async function saveBlobWithPicker(blob, suggestedName) {
  if (!window.showSaveFilePicker) {
    return false;
  }

  const handle = await window.showSaveFilePicker({
    suggestedName,
    types: [
      {
        description: "증적 파일",
        accept: {
          [blob.type || "application/octet-stream"]: [getExtensionFromName(suggestedName) || ".bin"],
        },
      },
    ],
  });
  const writable = await handle.createWritable();
  await writable.write(blob);
  await writable.close();
  return true;
}

function triggerBrowserDownload(blob, fileName) {
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = objectUrl;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(objectUrl);
}

export function CategoryTags({ categories, dark = false }) {
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
            dark
              ? "border-white/20 bg-white/10 text-white"
              : categoryTagClassMap[cat] || categoryTagClassMap.기타
          }`}
        >
          {cat}
        </span>
      ))}
    </div>
  );
}

export function SidebarItem({ active, icon: Icon, label, onClick, collapsed }) {
  return (
    <button
      onClick={onClick}
      title={collapsed ? label : undefined}
      className={`flex w-full items-center rounded-md px-4 py-3 text-left transition-all ${
        collapsed ? "justify-center px-3" : "gap-3"
      } ${
        active
          ? "bg-gradient-to-r from-slate-900 to-slate-700 text-white shadow-md"
          : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
      }`}
    >
      <Icon className="h-[18px] w-[18px] shrink-0" />
      {!collapsed && <span className="text-base font-semibold">{label}</span>}
    </button>
  );
}

export function SectionCard({
  title,
  children,
  action,
  className = "",
  bodyClassName = "",
  headerClassName = "",
  style,
}) {
  return (
    <div className={`rounded-md bg-white px-4 py-3 shadow-sm ring-1 ring-slate-200/80 ${className}`} style={style}>
      <div className={`mb-2.5 flex min-h-9 items-start justify-between gap-3 ${headerClassName}`}>
        <h3 className="section-header self-start text-left text-[15px] font-bold text-slate-900">{title}</h3>
        {action}
      </div>
      <div className={bodyClassName}>{children}</div>
    </div>
  );
}

export function Stat({ label, value, sub, tone = "bg-white ring-slate-200/70" }) {
  return (
    <div className={`rounded-md p-4 shadow-sm ring-1 ${tone}`}>
      <div className="stat-label text-sm text-slate-500">{label}</div>
      <div className="stat-value mt-1 text-3xl font-semibold tracking-tight text-slate-900">{value}</div>
      <div className="stat-sub mt-1 text-xs text-slate-500">{sub}</div>
    </div>
  );
}

export function EvidenceThumb({
  item,
  roundedClass = "rounded-md",
  size = "md",
  onImageClick,
  showSaveButton = false,
}) {
  const thumbnailCandidates = useMemo(() => {
    const urls = [];
    if (item.thumbnail) urls.push(item.thumbnail);
    if (item.id) {
      urls.push(`https://drive.google.com/thumbnail?id=${item.id}&sz=w1600`);
      urls.push(`https://drive.google.com/uc?export=view&id=${item.id}`);
    }
    return Array.from(new Set(urls.filter(Boolean)));
  }, [item.id, item.thumbnail]);

  const [thumbnailIndex, setThumbnailIndex] = useState(0);
  const hasNextThumbnail = thumbnailIndex < thumbnailCandidates.length - 1;
  const currentThumbnail = thumbnailCandidates[thumbnailIndex] || "";
  const isImage = !!currentThumbnail;
  const [isSaving, setIsSaving] = useState(false);
  const mediaClass =
    size === "xl"
      ? "h-[320px] md:h-[380px]"
      : size === "lg"
        ? "h-[220px]"
        : "aspect-[16/10]";

  const downloadUrl = useMemo(() => {
    if (item.downloadUrl) return item.downloadUrl;
    if (item.url) return item.url;
    if (item.id) return `https://drive.google.com/uc?export=download&id=${item.id}`;
    return currentThumbnail;
  }, [currentThumbnail, item.downloadUrl, item.id, item.url]);

  const handleSave = async () => {
    if (!downloadUrl || isSaving) return;

    setIsSaving(true);
    try {
      const response = await fetch(downloadUrl);
      if (!response.ok) {
        throw new Error(`파일을 불러오지 못했습니다. (${response.status})`);
      }

      const blob = await response.blob();
      const fileName = buildDownloadFileName(item);
      const savedWithPicker = await saveBlobWithPicker(blob, fileName).catch((error) => {
        if (error?.name === "AbortError") {
          return true;
        }
        return false;
      });

      if (!savedWithPicker) {
        triggerBrowserDownload(blob, fileName);
      }
    } catch (error) {
      console.error(error);
      alert(`파일 저장 중 오류가 발생했습니다.\n${error?.message || ""}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className={`overflow-hidden border border-slate-200 bg-white ${roundedClass}`}>
      <div className={`${mediaClass} bg-slate-100`}>
        {isImage ? (
          <button
            type="button"
            className="h-full w-full cursor-zoom-in"
            onClick={() => onImageClick && onImageClick({ ...item, thumbnail: currentThumbnail })}
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
          <div className="flex items-center gap-2">
            {showSaveButton && (
              <button
                type="button"
                onClick={handleSave}
                disabled={!downloadUrl || isSaving}
                className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-2.5 py-1 text-xs text-slate-600 disabled:cursor-not-allowed disabled:border-slate-100 disabled:bg-slate-50 disabled:text-slate-400"
              >
                <Download className="h-3.5 w-3.5" />
                {isSaving ? "저장 중..." : "저장"}
              </button>
            )}
            <div className="rounded-md border border-slate-200 px-2.5 py-1 text-xs text-slate-600">{item.type}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
