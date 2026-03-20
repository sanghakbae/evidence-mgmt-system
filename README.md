# 증적관리 시스템 (Evidence Management System)

개인정보 수탁사 점검을 위한 카드형 증적 관리 웹앱입니다.  
질문/답변/증적(이미지·문서)을 등록하고, 조회 후 리포트에 추가하여 출력 미리보기(PDF 인쇄)까지 수행할 수 있습니다.

## 주요 기능
- 대시보드
  - 전체 카드/증적/최근 갱신/리포트 대상 요약
  - 카테고리 분포 도넛 차트
  - 최근 등록 카드 목록
- 카드 등록
  - 질문/답변 입력
  - 파일 선택(로컬 탐색기)로 증적 첨부
  - 질문+답변 기반 자동 카테고리 분류(복수 태그)
- 카드 조회
  - 검색
  - 카드 상세(질문/답변/증적)
  - 리포트에 추가
  - 카드 삭제
- 리포트 생성
  - 리포트 포함 카드 목록
  - 인라인 출력 미리보기 모달
  - PDF 저장/인쇄

## 기술 스택
- React 18
- Vite 5
- Tailwind CSS
- Framer Motion
- Lucide Icons
- Google Apps Script(Web App) + Google Sheets + Google Drive

## 프로젝트 구조
```text
.
├─ src/
│  ├─ App.jsx
│  ├─ main.jsx
│  └─ index.css
├─ .github/workflows/
│  └─ deploy-pages.yml
├─ vite.config.mjs
├─ package.json
└─ README.md
```

## 로컬 실행
```bash
npm ci
npm run dev
```

기본 접속: `http://localhost:5173`

## 환경 변수
`.env.local` 파일 생성:

```env
VITE_GOOGLE_BRIDGE_URL=https://script.google.com/macros/s/배포ID/exec
```

설명:
- `VITE_GOOGLE_BRIDGE_URL`: Google Apps Script Web App URL

## Google Apps Script 연동 요약
앱은 아래 액션을 사용합니다.
- `GET ?action=listCards`
- `POST { action: "createCard", ... }`
- `GET/POST deleteCard`

필수:
- Web App으로 배포
- 접근 권한: `액세스 권한이 있는 사용자` 또는 운영 정책에 맞는 범위
- 최신 코드 반영 후 반드시 `새 버전`으로 재배포

## GitHub Pages 자동 배포 (GitHub Actions)
이 저장소는 `main` 브랜치 푸시 시 자동 배포됩니다.

워크플로우:
- `.github/workflows/deploy-pages.yml`

사전 설정:
1. GitHub 저장소 `Settings > Pages`
2. Build and deployment Source를 `GitHub Actions`로 설정
3. `Settings > Secrets and variables > Actions > New repository secret`
4. 아래 시크릿 추가
   - `VITE_GOOGLE_BRIDGE_URL` = Apps Script Web App URL

배포 URL:
- `https://<github-id>.github.io/<repo-name>/`

## 카테고리 분류 규칙
자동 분류는 질문+답변 텍스트를 기준으로 점수화합니다.
- 약한 키워드: +1
- 강한 키워드: +3
- 복수 카테고리 태그 반환(점수 높은 순)

대표 카테고리:
- 접근통제
- 로그관리
- 취약점점검
- 재위탁관리
- 정책관리
- 암호화
- 보존파기
- 사고대응
- 물리보안
- 교육훈련
- 기타

## 출력 미리보기(PDF)
- `리포트 생성 > 출력 미리보기` 버튼 클릭
- 화면 내 모달에서 문서 확인
- `PDF 저장/인쇄` 버튼으로 브라우저 인쇄 창 호출

## 자주 발생하는 문제
- 삭제 실패 (`Unknown action`)
  - Apps Script `deleteCard` 액션 누락 배포 가능성 높음
  - 스크립트 저장 후 `새 버전`으로 재배포 필요
- 이미지 미리보기 불가
  - Drive 권한 또는 썸네일 URL 접근 제한 문제
  - 앱에서 썸네일/대체 URL 순차 시도
- GitHub Pages에서 API 호출 실패
  - `VITE_GOOGLE_BRIDGE_URL` 시크릿 미설정 또는 오타 확인

## 스크립트
```bash
npm run dev
npm run build
```

## 라이선스
내부 운영용(Private) 기준으로 사용하십시오.

