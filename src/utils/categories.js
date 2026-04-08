export const CATEGORY_RULES = [
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

export function inferCategories(questionText, answerText) {
  const text = `${questionText || ""} ${answerText || ""}`.toLowerCase();
  const scored = [];

  for (const rule of CATEGORY_RULES) {
    const weakScore = (rule.keywords || []).reduce(
      (acc, keyword) => (text.includes(keyword) ? acc + 1 : acc),
      0
    );
    const strongScore = (rule.strongKeywords || []).reduce(
      (acc, keyword) => (text.includes(keyword) ? acc + 3 : acc),
      0
    );
    const score = weakScore + strongScore;
    if (score > 0) {
      scored.push({ category: rule.category, score });
    }
  }

  if (!scored.length) {
    return ["기타"];
  }

  scored.sort((a, b) => b.score - a.score);
  return scored.map((item) => item.category);
}

export function normalizeCard(card) {
  const categories =
    Array.isArray(card?.categories) && card.categories.length
      ? card.categories
      : inferCategories(card?.question, card?.answer);

  return {
    ...card,
    id: String(card?.id ?? ""),
    categories,
    category: card?.category || categories[0] || "기타",
  };
}
