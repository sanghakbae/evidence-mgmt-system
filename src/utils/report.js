import { escapeHtml, formatDateOnly } from "./format";

export function buildReportHtml(reportCards) {
  if (!reportCards.length) {
    return "";
  }

  const now = new Date();
  const dateLabel = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(
    now.getDate()
  ).padStart(2, "0")}`;
  const title = `개인정보 수탁사 점검 대응 포털 리포트 (${dateLabel})`;

  const sections = reportCards
    .map((card, idx) => {
      const categories = (card.categories?.length ? card.categories : [card.category || "기타"])
        .map((category) => `<span class="tag">${escapeHtml(category)}</span>`)
        .join("");

      const evidences = (card.evidences || [])
        .map((evidence) => {
          const name = escapeHtml(evidence.name || evidence.id || "증적");
          const thumbPrimary = escapeHtml(
            evidence.id
              ? `https://drive.google.com/thumbnail?id=${evidence.id}&sz=w1200`
              : evidence.thumbnail || ""
          );
          const thumbFallback = escapeHtml(
            evidence.id
              ? `https://drive.google.com/uc?export=view&id=${evidence.id}`
              : evidence.thumbnail || ""
          );
          const isImage = String(evidence.type || "").includes("이미지") || !!evidence.thumbnail;

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
}
