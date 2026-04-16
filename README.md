# 개인정보 수탁사 점검 대응 포털

개인정보 수탁사 점검 대응을 위해 질문, 답변, 증적 파일을 카드 단위로 관리하는 React 기반 운영 포털입니다. 점검 질문을 빠르게 검색하고, 증적을 모아 리포트 형태로 정리한 뒤 브라우저 인쇄를 통해 PDF로 제출하는 흐름에 맞춰 설계되어 있습니다.

운영 접속 도메인은 `privacy.sanghak.kr` 기준으로 관리할 수 있으며, 프런트엔드는 정적 배포되고 데이터 저장은 Google Apps Script Web App을 통해 Google Sheets와 Google Drive에 위임합니다.

## 개요

이 프로젝트는 다음 상황을 줄이기 위해 만들어졌습니다.

- 반복적으로 들어오는 수탁사 점검 질문을 매번 다시 작성하는 문제
- 답변과 증적 파일이 분산되어 있어 제출 자료를 묶는 데 시간이 오래 걸리는 문제
- 비슷한 질문이 들어와도 기존 대응 이력을 재사용하기 어려운 문제
- 제출용 리포트와 운영용 원본 데이터가 분리되어 관리되는 문제

핵심 목표는 아래 3가지입니다.

- 질문, 답변, 증적을 카드 단위로 일관되게 축적
- 검색과 자동 분류를 통해 필요한 항목을 즉시 재사용
- 제출 대상 카드만 골라 출력용 리포트로 변환

## 주요 기능

### 1. 대시보드

- 전체 카드 수, 전체 증적 수, 최근 갱신일, 리포트 대상 수를 요약해서 표시합니다.
- 카테고리 분포를 도넛 차트로 보여 줍니다.
- 최근 등록 카드 10건을 빠르게 확인할 수 있습니다.
- 카테고리 항목을 클릭하면 `카드 조회` 화면으로 이동하면서 해당 카테고리 필터가 적용됩니다.

### 2. 카드 등록

- 질문과 답변을 각각 입력할 수 있습니다.
- 로컬 파일을 여러 개 선택해 증적으로 첨부할 수 있습니다.
- 선택한 파일은 저장 전에 미리보기 목록으로 확인할 수 있습니다.
- 질문과 답변 내용을 기준으로 자동 카테고리 분류가 수행됩니다.
- 저장이 성공하면 입력 필드와 임시 첨부 목록이 초기화됩니다.

### 3. 카드 조회

- 카드 목록과 카드 상세를 2패널 구조로 제공합니다.
- 검색은 현재 질문 텍스트 기준으로 동작합니다.
- 대시보드에서 넘어온 카테고리 필터를 유지한 채 목록을 탐색할 수 있습니다.
- 카드 상세에서 질문, 답변, 분류 카테고리, 증적을 확인할 수 있습니다.
- 카드 수정 시 질문/답변 변경, 새 증적 추가, 기존 증적 삭제가 가능합니다.
- 카드 삭제는 랜덤 확인값을 입력해야 실행됩니다.
- 선택한 카드를 리포트 대상 목록에 추가할 수 있습니다.

### 4. 리포트 생성

- 리포트에 포함된 카드 목록을 따로 확인할 수 있습니다.
- 리포트 화면 안에서 질문과 답변을 다시 수정할 수 있습니다.
- 출력 미리보기 HTML을 생성합니다.
- 브라우저 인쇄 기능으로 PDF 저장 또는 출력이 가능합니다.

## 사용자 흐름

일반적인 운영 순서는 아래와 같습니다.

1. 앱 진입 시 브리지 상태를 확인하고 카드 목록을 불러옵니다.
2. 카드 등록 화면에서 질문, 답변, 증적을 저장합니다.
3. 카드 조회 화면에서 검색과 카테고리 필터로 필요한 카드를 찾습니다.
4. 리포트에 포함할 카드만 선택합니다.
5. 리포트 생성 화면에서 질문/답변을 제출용 문맥에 맞게 다듬습니다.
6. 출력 미리보기를 생성하고 브라우저 인쇄로 PDF를 저장합니다.

## 기술 스택

- React 18
- Vite 8
- Tailwind CSS 3
- Framer Motion
- Lucide React
- Google Apps Script Web App
- Google Sheets
- Google Drive

## 아키텍처

프런트엔드는 Vite 기반 정적 애플리케이션이고, 저장과 조회는 Google Apps Script Web App을 통해 수행합니다.

### 데이터 저장 위치

- 질문/답변/증적 메타데이터: Google Sheets
- 실제 증적 파일: Google Drive

### 프런트 동작 흐름

1. 앱 시작 시 `health` 호출로 브리지 연결 가능 여부를 확인합니다.
2. 연결이 가능하면 `listCards` 호출로 카드 목록을 가져옵니다.
3. 카드 생성/수정/삭제는 모두 Apps Script Web App으로 요청합니다.
4. 응답 성공 시 프런트 상태와 로컬 캐시를 갱신합니다.
5. 리포트 생성 시 선택된 카드만 HTML 문자열로 변환합니다.

### 로컬 캐시

- 카드 목록은 브라우저 `localStorage` 에 약 3분 TTL로 캐시됩니다.
- 마지막으로 선택한 메뉴도 `localStorage` 에 저장됩니다.
- 브리지가 잠시 불안정해도 최근 카드 목록을 일정 시간 재사용할 수 있습니다.

## 메뉴 구성

좌측 메뉴는 아래 4개 섹션으로 구성됩니다.

- 대시보드
- 카드 등록
- 카드 조회
- 리포트 생성

## 자동 카테고리 분류

자동 분류는 [src/utils/categories.js](/Users/shbae-pc/Tools/evidence-mgmt-system/src/utils/categories.js:1) 에 정의되어 있습니다.

동작 방식은 아래와 같습니다.

- 질문과 답변 텍스트를 합쳐 하나의 분석 문자열로 만듭니다.
- 일반 키워드 일치 시 카테고리 점수에 `+1` 을 부여합니다.
- 강한 키워드 일치 시 카테고리 점수에 `+3` 을 부여합니다.
- 점수가 높은 순서대로 카테고리 배열을 반환합니다.
- 어떤 규칙에도 걸리지 않으면 `기타` 를 반환합니다.

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

## 검색 동작

카드 검색은 [src/views/QueryView.jsx](/Users/shbae-pc/Tools/evidence-mgmt-system/src/views/QueryView.jsx:1) 에 구현되어 있습니다.

- 현재 검색 대상은 질문 텍스트입니다.
- 검색어는 대소문자 구분 없이 포함 여부로 판별합니다.
- 카테고리 필터가 적용된 상태에서는 필터 조건을 먼저 통과한 카드만 검색됩니다.
- 검색 결과가 없으면 상세 패널도 함께 비활성화됩니다.

## 리포트 출력 방식

출력용 HTML은 [src/utils/report.js](/Users/shbae-pc/Tools/evidence-mgmt-system/src/utils/report.js:1) 에서 생성합니다.

- 카드별로 질문, 답변, 카테고리 태그, 증적 목록을 섹션 단위로 렌더링합니다.
- 이미지 증적은 Google Drive 썸네일 URL을 우선 시도합니다.
- 썸네일이 실패하면 `uc?export=view` URL로 한 번 더 대체 시도합니다.
- 그래도 이미지 로딩이 실패하면 `미리보기 불가` 상태로 출력합니다.
- 문서형 증적은 파일명 중심으로 리포트에 포함됩니다.

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

## 주요 파일 설명

- [src/App.jsx](/Users/shbae-pc/Tools/evidence-mgmt-system/src/App.jsx:1)
  앱 루트입니다. 브리지 연결 확인, 카드 로딩, 카드 생성/수정/삭제, 메뉴 상태, 리포트 미리보기 상태를 관리합니다.

- [src/constants.js](/Users/shbae-pc/Tools/evidence-mgmt-system/src/constants.js:1)
  메뉴 정의, Google Sheets 링크, Drive 폴더 링크, `VITE_GOOGLE_BRIDGE_URL` 환경 변수 연결을 담당합니다.

- [src/views/DashboardView.jsx](/Users/shbae-pc/Tools/evidence-mgmt-system/src/views/DashboardView.jsx:1)
  통계 카드, 최근 등록 카드, 카테고리 도넛 차트를 렌더링합니다.

- [src/views/RegisterView.jsx](/Users/shbae-pc/Tools/evidence-mgmt-system/src/views/RegisterView.jsx:1)
  질문/답변 입력, 증적 첨부, 자동 카테고리 분류, 카드 저장 UI를 담당합니다.

- [src/views/QueryView.jsx](/Users/shbae-pc/Tools/evidence-mgmt-system/src/views/QueryView.jsx:1)
  카드 목록 탐색, 검색, 상세 보기, 카드 수정, 카드 삭제, 리포트 추가 기능을 담당합니다.

- [src/views/ReportView.jsx](/Users/shbae-pc/Tools/evidence-mgmt-system/src/views/ReportView.jsx:1)
  리포트 포함 카드 목록, 질문/답변 편집, 출력 미리보기 버튼을 제공합니다.

- [src/utils/categories.js](/Users/shbae-pc/Tools/evidence-mgmt-system/src/utils/categories.js:1)
  자동 카테고리 규칙과 카드 정규화 로직을 정의합니다.

- [src/utils/report.js](/Users/shbae-pc/Tools/evidence-mgmt-system/src/utils/report.js:1)
  출력용 HTML 리포트 문자열을 생성합니다.

- [src/utils/format.js](/Users/shbae-pc/Tools/evidence-mgmt-system/src/utils/format.js:1)
  날짜 포맷과 HTML 이스케이프 처리를 담당합니다.

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
  Google Apps Script Web App의 `exec` URL 입니다.
- 반드시 `/exec` URL 을 사용해야 합니다.
- `/dev` URL 을 넣으면 권한 또는 동작 방식 차이로 운영 환경에서 실패할 수 있습니다.

현재 프런트엔드에서 사용하는 환경 변수는 이것 하나뿐입니다. `VITE_GOOGLE_CLIENT_ID` 는 이 코드베이스에서 사용하지 않습니다.

### 3. 개발 서버 실행

```bash
npm run dev
```

기본 포트는 `5173` 이며, 이미 사용 중이면 Vite가 다른 포트로 자동 전환합니다.

### 4. 프로덕션 빌드 확인

```bash
npm run build
```

## 스크립트

```bash
npm run dev
npm run build
```

## 환경 변수

| 변수명 | 설명 | 예시 |
|---|---|---|
| `VITE_GOOGLE_BRIDGE_URL` | Google Apps Script Web App `exec` URL | `https://script.google.com/macros/s/AKfycb.../exec` |

## Google Apps Script 연동

프런트는 Apps Script Web App을 브리지처럼 사용합니다.

### 프런트에서 호출하는 액션

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

### 배포 시 주의사항

- Apps Script는 코드 저장만으로 Web App 반영이 끝나지 않습니다.
- 수정 후 반드시 새 버전으로 다시 배포해야 합니다.
- `updateCard` 또는 `deleteCard` 를 추가해도 재배포하지 않으면 프런트에서 해당 기능이 실패합니다.

권장 확인 순서:

1. Apps Script 코드 저장
2. `배포 > 배포 관리` 로 이동
3. 새 버전으로 Web App 재배포
4. 브라우저에서 `.../exec?action=health` 호출
5. `supports` 배열에 필요한 액션이 모두 포함되어 있는지 확인

## Google Sheets / Drive 구성

연결용 상수는 [src/constants.js](/Users/shbae-pc/Tools/evidence-mgmt-system/src/constants.js:1) 에 정의되어 있습니다.

- Google Sheets
  질문, 답변, 증적 메타데이터를 저장합니다.
- Google Drive Folder
  업로드된 증적 원본을 저장합니다.

Apps Script 측 헤더 예시는 아래와 같습니다.

```javascript
const HEADERS = ["id", "category", "question", "answer", "evidences_json", "updatedAt"];
```

저장 데이터 예시:

- `id`: 카드 ID
- `category`: 대표 카테고리
- `question`: 질문
- `answer`: 답변
- `evidences_json`: 증적 파일 메타데이터 배열(JSON 문자열)
- `updatedAt`: 마지막 수정일

## 배포 가이드

프런트는 정적 호스팅에 올릴 수 있고, 백엔드는 Apps Script가 담당합니다.

### 운영 도메인

- 운영 도메인 예시: `privacy.sanghak.kr`
- 정적 호스팅은 원하는 플랫폼을 사용할 수 있지만, 빌드 시점에 `VITE_GOOGLE_BRIDGE_URL` 이 반드시 주입되어야 합니다.

### 배포 체크리스트

1. 프런트 빌드 환경에 `VITE_GOOGLE_BRIDGE_URL` 설정
2. Apps Script Web App 외부 접근 가능 여부 확인
3. `health` 응답으로 액션 배포 상태 확인
4. 정적 호스팅 서비스에 최신 브랜치 반영
5. 운영 도메인 연결 또는 DNS 설정 확인

### GitHub 기반 정적 배포

GitHub 연동 배포를 쓴다면 아래만 맞으면 됩니다.

- 저장소 연결
- 빌드 명령 `npm run build`
- 출력 디렉터리 `dist`
- 환경 변수 `VITE_GOOGLE_BRIDGE_URL` 등록

정적 배포 서비스 종류와 관계없이 프런트 요구사항은 동일합니다.

## 운영 시 자주 보는 이슈

### 1. 카드 목록이 비어 있는 경우

원인 후보:

- `VITE_GOOGLE_BRIDGE_URL` 누락
- 잘못된 `/dev` URL 사용
- Apps Script 권한 또는 배포 문제

확인 방법:

1. 브라우저 콘솔 또는 화면 상단 연결 메시지 확인
2. `.../exec?action=health` 직접 호출
3. `listCards` 가 실제 데이터를 반환하는지 확인

### 2. 카드 수정이 실패하는 경우

대표 증상:

- `카드 수정 중 오류가 발생했습니다.`
- `백엔드에 updateCard 액션이 배포되지 않았습니다.`

원인 후보:

- Apps Script 코드 수정 후 재배포 누락
- `supports` 에 `updateCard` 없음

### 3. 카드 삭제가 실패하는 경우

원인 후보:

- `deleteCard` 액션 미배포
- 카드 ID 불일치
- Apps Script 재배포 누락

### 4. 증적 이미지가 보이지 않는 경우

원인 후보:

- Google Drive 권한 문제
- 썸네일 URL 접근 제한
- 원본 파일 형식 문제

앱은 썸네일 URL과 대체 URL을 순차적으로 시도하지만, Drive 권한이 막혀 있으면 미리보기가 실패할 수 있습니다.

### 5. 로컬에서는 되는데 운영에서 안 되는 경우

원인 후보:

- 배포 환경 변수 미주입
- 오래된 프런트 빌드 배포
- Apps Script 최신 버전 미배포

## 성능 참고

카드 수가 늘어나면 현재 구조에서 병목이 생길 수 있습니다.

주요 이유:

- `listCards` 가 전체 시트를 읽습니다.
- 목록 조회 시 증적 메타데이터도 함께 내려옵니다.
- 프런트가 단일 응답으로 전체 카드를 메모리에 올립니다.

개선 방향:

- `listCards` 를 목록 조회와 상세 조회로 분리
- Apps Script `CacheService` 적용
- 증적 메타데이터 축약 응답 도입
- 카드 수가 크게 증가하면 별도 DB 전환 검토

## 개발 메모

- 브리지 URL이 없으면 앱은 연결 오류 메시지를 보여 주고 읽기/쓰기 기능이 제한됩니다.
- 카드 ID는 문자열로 정규화해서 관리합니다.
- 리포트 출력은 별도 PDF 라이브러리 없이 브라우저 인쇄 기능을 사용합니다.
- 검색 로직은 현재 질문 중심이므로, 답변/증적명 통합 검색이 필요하면 `QueryView` 확장이 필요합니다.

## 라이선스

내부 운영용 프로젝트 기준으로 사용하십시오.
