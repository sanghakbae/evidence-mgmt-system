# 개인정보 수탁사 점검 대응 포털

개인정보 수탁사 점검 대응을 위해 질문, 답변, 증적 파일을 카드 단위로 등록하고 관리하는 React 기반 운영 포털입니다.  
카드를 조회하면서 증적을 확인하고, 필요한 항목을 리포트 대상으로 모아 출력 미리보기와 PDF 인쇄까지 진행할 수 있습니다.

## 목적

이 프로젝트는 고객사 또는 내부 점검 요청 시 아래 작업을 빠르게 처리하기 위한 용도로 만들어졌습니다.

- 수탁사 점검 질문을 카드 단위로 정리
- 질문별 표준 답변을 사전에 축적
- 이미지, 문서 등 증적 파일을 함께 보관
- 자주 요구되는 항목을 즉시 검색
- 리포트 제출용 카드만 별도로 선별
- 점검 대응 자료를 반복 재작성하지 않고 재사용

## 주요 기능

### 1. 대시보드

- 전체 카드 수, 전체 증적 수, 최근 갱신일, 리포트 대상 수 요약
- 카테고리 분포 도넛 차트
- 최근 등록 카드 목록
- 카테고리 분포 우측 항목 클릭 시 `카드 조회` 화면으로 이동하면서 해당 카테고리만 필터링

### 2. 카드 등록

- 질문 / 답변 입력
- 로컬 파일 선택으로 증적 첨부
- 첨부한 증적 파일 미리보기
- 저장 전 첨부 파일 삭제
- 질문과 답변 내용을 기반으로 자동 태그 분류

### 3. 카드 조회

- 질문, 답변, 태그, 증적명 기준 검색
- 질문 검색은 입력한 문자열 중 한 글자라도 질문에 포함되면 검색되도록 동작
- 카드 목록과 카드 상세를 좌우 2패널로 표시
- 카드 상세에서 질문 / 답변 / 증적 확인
- 카드 상세에서 카드 수정 가능
- 수정 모드에서 질문, 답변, 증적 추가, 기존 증적 삭제 가능
- 카드 삭제 시 랜덤 확인값 입력 필요
- 선택한 카드를 리포트 생성 목록에 추가 가능

### 4. 리포트 생성

- 리포트에 추가된 카드 목록 확인
- 리포트 목록 내 카드 질문 / 답변 직접 수정
- 출력 미리보기 HTML 생성
- 브라우저 인쇄 기능을 이용한 PDF 저장 / 출력

## 기술 스택

- React 18
- Vite 5
- Tailwind CSS
- Framer Motion
- Lucide React
- Google Apps Script Web App
- Google Sheets
- Google Drive

## 동작 구조

프론트엔드는 Vite/React로 구성되어 있고, 데이터 저장은 Google Apps Script Web App을 통해 처리됩니다.

### 저장 위치

- 질문/답변/증적 메타데이터: Google Sheets
- 실제 증적 파일: Google Drive 폴더

### 프론트 흐름

1. 앱 진입 시 `health`, `listCards` 호출
2. Sheets 데이터를 카드 배열로 로딩
3. 카드 등록/수정/삭제 시 Apps Script Web App 호출
4. 응답을 기준으로 프론트 상태 갱신
5. 리포트 생성 시 선택된 카드만 HTML 리포트로 변환

## 화면 구성

좌측 메뉴는 아래 4개 섹션으로 구성됩니다.

- 대시보드
- 카드 등록
- 카드 조회
- 리포트 생성

## 자동 태그 분류

질문과 답변 텍스트를 기준으로 카테고리를 자동 추론합니다.

- 약한 키워드 일치: +1
- 강한 키워드 일치: +3
- 점수가 높은 순서대로 복수 태그 반환

현재 대표 카테고리는 아래와 같습니다.

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

분류 규칙은 [src/utils/categories.js](/Users/shbae-pc/Tools/consignee-audit/src/utils/categories.js) 에 정의되어 있습니다.

## 프로젝트 구조

```text
.
├─ src/
│  ├─ App.jsx
│  ├─ main.jsx
│  ├─ constants.js
│  ├─ index.css
│  ├─ components/
│  │  └─ ui.jsx
│  ├─ utils/
│  │  ├─ categories.js
│  │  ├─ format.js
│  │  └─ report.js
│  └─ views/
│     ├─ DashboardView.jsx
│     ├─ RegisterView.jsx
│     ├─ QueryView.jsx
│     └─ ReportView.jsx
├─ index.html
├─ package.json
├─ vite.config.mjs
└─ README.md
```

## 로컬 실행

### 1. 의존성 설치

```bash
npm ci
```

### 2. 환경 변수 설정

프로젝트 루트에 `.env.local` 파일을 생성합니다.

```env
VITE_GOOGLE_BRIDGE_URL=https://script.google.com/macros/s/배포ID/exec
```

설명:

- `VITE_GOOGLE_BRIDGE_URL`
  - Google Apps Script Web App의 `exec` URL
  - 반드시 `/exec` URL을 사용해야 함
  - `/dev` URL을 넣으면 운영 배포에서 정상 동작하지 않을 수 있음

### 3. 개발 서버 실행

```bash
npm run dev
```

기본 접속 주소:

- `http://localhost:5173`

### 4. 프로덕션 빌드 확인

```bash
npm run build
```

## 환경 변수

이 프로젝트에서 현재 프론트엔드에 필요한 환경 변수는 아래 하나입니다.

| 변수명 | 설명 | 예시 |
|---|---|---|
| `VITE_GOOGLE_BRIDGE_URL` | Google Apps Script Web App `exec` URL | `https://script.google.com/macros/s/AKfycb.../exec` |

## Google Apps Script 연동

프론트는 Apps Script Web App을 브리지처럼 사용합니다.

### 프론트에서 사용하는 액션

- `GET ?action=health`
- `GET ?action=listCards`
- `POST { action: "createCard", ... }`
- `POST { action: "updateCard", ... }`
- `GET/POST deleteCard`

### `health` 응답 예시

```json
{
  "ok": true,
  "version": "2026-04-09-update-v2",
  "supports": ["listCards", "createCard", "updateCard", "deleteCard"]
}
```

### Apps Script 배포 시 주의사항

- 코드 저장만으로는 Web App에 반영되지 않음
- 수정 후 반드시 `새 버전`으로 재배포 필요
- `updateCard` 추가 후에도 재배포하지 않으면 프론트 수정 기능이 실패함

권장 확인 방법:

1. Apps Script 저장
2. `배포 > 배포 관리`
3. 새 버전으로 Web App 재배포
4. 브라우저에서 `.../exec?action=health` 호출
5. `supports`에 `updateCard`가 포함되어 있는지 확인

## Google Sheets / Drive 구성

현재 연동 기준 값은 [src/constants.js](/Users/shbae-pc/Tools/consignee-audit/src/constants.js) 에 연결되어 있습니다.

- Google Sheets
  - 질문/답변/증적 메타데이터 저장
- Google Drive Folder
  - 업로드된 증적 원본 저장

Apps Script 예시 헤더:

```javascript
const HEADERS = ["id", "category", "question", "answer", "evidences_json", "updatedAt"];
```

### 저장 데이터 예시

- `id`: 카드 ID
- `category`: 대표 카테고리
- `question`: 질문
- `answer`: 답변
- `evidences_json`: 증적 파일 메타데이터 배열(JSON 문자열)
- `updatedAt`: 마지막 수정일

## 배포

### 1. Amplify 배포

Amplify에서 배포할 경우 환경 변수에 아래 값을 넣어야 합니다.

- 이름: `VITE_GOOGLE_BRIDGE_URL`
- 값: Apps Script Web App `exec` URL

예시:

```text
VITE_GOOGLE_BRIDGE_URL=https://script.google.com/macros/s/AKfycb.../exec
```

배포 순서:

1. Amplify 앱 생성
2. GitHub 저장소 연결
3. `Environment variables`에 `VITE_GOOGLE_BRIDGE_URL` 추가
4. 배포 실행

주의:

- Apps Script Web App이 외부 접근 가능한 상태여야 함
- 환경 변수 변경 후에는 다시 빌드/배포해야 반영됨

### 2. GitHub Pages / 기타 정적 호스팅

정적 호스팅 환경에서도 핵심은 동일합니다.

- `VITE_GOOGLE_BRIDGE_URL` 환경 변수 주입 필요
- 프론트는 정적 파일로 배포 가능
- 데이터 저장은 Apps Script가 담당

## 주요 파일 설명

- [src/App.jsx](/Users/shbae-pc/Tools/consignee-audit/src/App.jsx)
  - 앱 루트
  - 브리지 연결 확인
  - 카드 로딩 / 생성 / 수정 / 삭제
  - 메뉴 전환
  - 리포트 출력 미리보기 제어

- [src/views/DashboardView.jsx](/Users/shbae-pc/Tools/consignee-audit/src/views/DashboardView.jsx)
  - 대시보드 통계
  - 카테고리 도넛 차트
  - 최근 등록 카드

- [src/views/RegisterView.jsx](/Users/shbae-pc/Tools/consignee-audit/src/views/RegisterView.jsx)
  - 카드 등록 화면
  - 질문/답변 입력
  - 증적 첨부 및 삭제

- [src/views/QueryView.jsx](/Users/shbae-pc/Tools/consignee-audit/src/views/QueryView.jsx)
  - 카드 조회 / 카드 상세
  - 검색, 필터링
  - 카드 수정
  - 증적 추가 / 삭제
  - 랜덤값 확인 삭제

- [src/views/ReportView.jsx](/Users/shbae-pc/Tools/consignee-audit/src/views/ReportView.jsx)
  - 리포트 포함 카드 목록
  - 리포트 대상 카드 질문 / 답변 수정

- [src/utils/report.js](/Users/shbae-pc/Tools/consignee-audit/src/utils/report.js)
  - 출력용 HTML 리포트 생성

## 운영 시 주의할 점

### 1. 카드 수정 기능이 안 되는 경우

증상:

- `카드 수정 중 오류가 발생했습니다.`
- `백엔드에 updateCard 액션이 배포되지 않았습니다.`

원인:

- Apps Script 코드에는 `updateCard`를 넣었지만 Web App 재배포를 하지 않은 경우

조치:

1. Apps Script 코드 저장
2. 새 버전 배포
3. `health` 응답 확인

### 2. 카드 삭제 실패

원인 후보:

- `deleteCard` 액션 누락
- Apps Script 재배포 누락
- Sheets에서 대상 카드 ID 불일치

### 3. 증적 이미지가 안 보이는 경우

원인 후보:

- Google Drive 권한 문제
- 썸네일 URL 접근 제한

현재 앱은 썸네일 URL과 대체 URL을 순차적으로 시도합니다.

### 4. 환경 변수 누락

증상:

- 카드 목록이 비어 있음
- 브리지 연결 실패 메시지 표시

조치:

- `VITE_GOOGLE_BRIDGE_URL` 값 확인
- `/exec` URL 사용 여부 확인

## 성능 관점 참고

등록 카드 수가 많아지면 현재 구조에서 느려질 수 있습니다.

주요 원인:

- `listCards`가 전체 시트를 매번 읽음
- 카드 목록 조회 시 증적 메타데이터까지 함께 내려옴

개선 방향:

- `listCards`를 목록 조회 / 상세 조회로 분리
- Apps Script `CacheService` 적용
- 카드 수가 크게 늘면 Firebase, Supabase 등 별도 DB 전환 검토

## 스크립트

```bash
npm run dev
npm run build
```

## 라이선스

내부 운영용 프로젝트 기준으로 사용하십시오.
