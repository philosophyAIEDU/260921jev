# Jev Smart Desk

고객 문의가 담긴 CSV/Excel/PDF 파일을 업로드하면, **TypeSafe Jev API**로 문의 유형·감정·긴급도·심각도·사람 검토 필요 여부를 자동 분류하고, **Google Gemini**로 한국어 답변 초안을 생성해 주는 고객센터 대시보드입니다. 선택적으로 **Gmail과 연동**해 답변을 실제 이메일로 발송할 수도 있습니다.

코딩을 몰라도 따라 할 수 있도록 설치부터 배포까지 순서대로 설명합니다.

> ⚠️ 이 앱은 **데모·교육용**입니다. 실제 결제·환불·개인정보·안전·법률 문제를 자동으로 확정 처리하지 않으며, 그런 문의는 항상 "사람 검토 필요"로 표시됩니다. Gmail 자동 발송을 켜더라도 이 문의들은 절대 자동으로 이메일이 나가지 않습니다. 실제 고객의 개인정보가 담긴 자료는 업로드하지 마세요.

---

## 1. 주요 기능

- CSV / Excel(xlsx·xls) / 텍스트 PDF 업로드 및 열 자동 매핑 (또는 수동 매핑)
- Jev API로 문의를 Noul(예/아니오), Choice(항목 선택), Score(단계 평가) 방식으로 분석
  - 문의 유형(category), 감정(sentiment), 긴급 여부(is_urgent), 사람 검토 필요(needs_human_review), 답변 필요 여부(needs_reply), 심각도(severity)
- Gemini 3.5 Flash-Lite로 한국어 답변 초안 자동 생성 (수정·승인·보류·재생성, 빠른 답변 템플릿 삽입 가능)
- 임계값 기반 정책 엔진 (긴급/사람 검토/낮은 confidence/높은 심각도 자동 판정)
- **API 비용 절감을 위한 분석 건수 선택**: 미리보기 화면에서 10/20/50/100건 또는 직접 입력한 건수만 먼저 분석하고, 결과를 확인한 뒤 "다음 N건 이어서 분석"으로 나머지를 처리
- **분석 결과 세션 캐싱**: 완전히 동일한 문의 텍스트는 같은 세션 안에서 재분석 시 Jev/Gemini를 다시 호출하지 않고 이전 결과를 재사용 (동시 처리 중에도 중복 호출 없음)
- **일괄 처리**: 목록에서 여러 문의를 체크해 한 번에 승인/보류(선택 시 일괄 이메일 발송도 가능)
- **담당자 배정 + SLA 표시**: 문의별로 담당자를 지정하고, 접수 후 일정 시간이 지나도 처리되지 않으면 목록에서 강조 표시
- 동시성 제한 + 지수 백오프 + 중단/재시도가 가능한 분석 파이프라인
- CSV(UTF-8 BOM)·Excel 내보내기 (담당자, 이메일 발송 상태 포함)
- **Gmail 연동 (선택)**: 승인된 답변을 실제 고객 이메일로 발송. 사람 검토가 필요 없다고 판정된 문의는 자동 발송, 결제·환불·안전 등 검토가 필요한 문의는 항상 수동 발송만 허용 (자세한 내용은 11장 참고)
- **Jev 학습 모드**: Noul/Choice/Score 개념 설명, 질문 설계 화면, State→Questions→Answers 흐름 시각화, 원본 요청/응답 JSON 보기, 한 건 직접 실습, 학습 확인 퀴즈
- API Key와 Gmail 연결 정보는 브라우저 탭의 메모리에만 유지되며 저장소·로그에 남지 않음

## 2. 기술 스택

- **프런트엔드**: React + TypeScript + Vite
- **백엔드**: Netlify Functions (TypeScript, `export default` + `Config` 방식, 표준 Web API `Request`/`Response` 사용)
- **파일 처리**: Papa Parse(CSV), SheetJS `xlsx`(Excel), `pdfjs-dist`(PDF)
- **Gmail 연동**: Google Identity Services(OAuth 2.0, 브라우저에서 직접 인증) + Gmail API
- **테스트**: Vitest + Testing Library

---

## 3. 설치 방법

Node.js 18 이상이 설치되어 있어야 합니다.

```bash
git clone <이 저장소 URL>
cd 260921jev
npm install
```

## 4. 로컬 실행 방법

### 4-1. 프런트엔드만 실행 (빠른 화면 확인용)

```bash
npm run dev
```

`http://localhost:5173` 에서 화면을 확인할 수 있습니다. 다만 이 방법으로는 `/api/*` 로 연결되는 Netlify Functions(Jev 분석, Gemini 답변 생성, Gmail 발송, 연결 테스트)가 동작하지 않습니다.

### 4-2. Netlify Dev로 전체 기능 실행 (권장)

API 호출까지 포함해 실제와 동일하게 테스트하려면 Netlify CLI로 실행하세요.

```bash
npm install -g netlify-cli   # 최초 1회
netlify dev
```

`netlify dev`가 프런트엔드(Vite)와 `netlify/functions` 안의 함수들을 함께 실행하고, `netlify.toml` 설정에 따라 `/api/*` 요청을 해당 함수로 연결해 줍니다. 보통 `http://localhost:8888` 에서 접속합니다.

## 5. 테스트 실행 방법

```bash
npm test
```

Vitest로 파일 파싱, Jev 응답 정규화, 정책(임계값) 판정, Gemini 프롬프트 규칙, 분석 결과 캐싱(동시성 경쟁 상태 포함), Gmail 자동 발송 안전장치, Gmail MIME 인코딩, API Key 비저장, CSV 한글 보존 등을 검증합니다.

## 6. 빌드 방법

```bash
npm run build
```

TypeScript 타입 검사 후 `dist/` 폴더에 프로덕션 빌드 결과물이 생성됩니다.

## 7. Netlify 배포 방법

1. 이 저장소를 GitHub 등에 올린 뒤 [Netlify](https://app.netlify.com)에서 "Add new site → Import an existing project"로 연결합니다.
2. 빌드 설정은 `netlify.toml`에 이미 포함되어 있습니다.
   - Build command: `npm run build`
   - Publish directory: `dist`
   - Functions directory: `netlify/functions`
3. 별도로 설정해야 하는 **환경변수(비밀 키)는 없습니다.** API Key는 사용자가 배포된 사이트의 "설정" 화면에서 직접 입력하며, 요청마다 서버로 일시적으로 전달될 뿐 어디에도 저장되지 않습니다.
4. "Deploy site"를 누르면 배포가 완료됩니다.
5. Gmail 연동을 사용하려면 배포된 사이트의 실제 도메인을 Google Cloud Console의 OAuth 클라이언트에 "승인된 자바스크립트 원본"으로 추가해야 합니다 (11장 참고).

CLI로 배포하려면:

```bash
netlify deploy --build --prod
```

## 8. API Key 입력 방법 (중요)

1. 배포된(또는 로컬) 앱 화면 우측 상단 **"설정"** 버튼을 누릅니다.
2. **TypeSafe Jev API Key**와 **Google Gemini API Key**를 각각 입력합니다. (비밀번호 입력란이며 표시/숨김 버튼이 있습니다)
3. 각 키 옆의 **"연결 테스트"** 버튼으로 키가 유효한지 확인할 수 있습니다.
4. 분석을 시작하려면 두 키가 모두 입력되어 있어야 합니다.

### API Key는 어디에도 저장되지 않습니다

- 입력한 키는 **오직 현재 브라우저 탭의 메모리(React state)**에만 유지됩니다.
- `localStorage`, `sessionStorage`, `IndexedDB`, 쿠키 등 어디에도 저장하지 않습니다.
- **새로고침하면 키가 사라지며** 다시 입력해야 합니다.
- 브라우저는 TypeSafe·Google API를 직접 호출하지 않고, Netlify Functions로 요청을 보낼 때만 키를 함께 전달합니다.
- Netlify Functions는 키를 사용해 외부 API를 호출한 뒤 **키를 저장하거나 로그에 남기지 않습니다.**
- Gmail 연결(access token)도 동일하게 탭 메모리에만 유지됩니다.
- **공용 컴퓨터에서는 키를 입력하지 마세요.**

## 9. CSV/Excel 필수 열

문의 내용에 해당하는 열 하나는 반드시 있어야 합니다 (`inquiry_text`, `고객문의`, `문의내용`, `내용`, `message` 등 자동 인식). 그 외 인식 가능한 열:

| 항목 | 인식되는 열 이름 예시 |
| --- | --- |
| 문의 ID | `inquiry_id`, `문의ID`, `문의번호` |
| 접수일시 | `received_at`, `접수일시`, `날짜` |
| 채널 | `channel`, `채널` |
| 고객명 | `customer_name`, `고객명`, `이름` |
| 고객 이메일 | `customer_email`, `이메일`, `고객이메일`, `email` (Gmail 자동/수동 발송에 사용) |
| 주문번호 | `order_id`, `주문번호` |
| 문의 내용 (필수) | `inquiry_text`, `고객문의`, `문의내용`, `내용`, `message` |
| 언어 | `language`, `언어` |

자동으로 열을 찾지 못하면 미리보기 화면에서 직접 매핑할 수 있습니다. Excel 파일에 시트가 여러 개면 시트를 선택할 수 있습니다.

파일 제한(기본값): 최대 5MB, 최대 200건, 문의 1건당 최대 5,000자.

## 10. PDF 관련 안내

- **텍스트가 포함된 PDF만 지원합니다.** 스캔한 이미지 PDF는 텍스트를 추출할 수 없으므로 "이미지로 된 PDF는 현재 읽을 수 없습니다. CSV 또는 Excel로 변환해 주세요."라는 안내가 표시됩니다. (OCR은 지원하지 않으며 가짜로 흉내 내지 않습니다.)
- 여러 건의 문의가 담긴 PDF는 빈 줄, 번호 매김(`1.`, `1)` 등) 또는 사용자가 지정한 구분자를 기준으로 나눌 수 있습니다. 분리 전 전체 텍스트 미리보기를 제공합니다.

## 11. Gmail 자동 발송 설정 (선택 기능)

승인된 답변을 실제 Gmail 계정으로 발송할 수 있습니다. **기본값은 꺼짐**이며, 연결하지 않으면 기존과 동일하게 동작합니다.

### 11-1. 동작 방식과 안전장치

- Gmail을 연결하고 "자동 발송" 옵션을 켜면, **사람 검토가 필요 없다고(`needs_human_review`가 낮게) 판정된 문의만** Gemini 답변 생성과 동시에 자동으로 이메일이 발송됩니다.
- **결제·환불·안전·개인정보 등 사람 검토가 필요하다고 판정된 문의는 이 설정과 무관하게 절대 자동 발송되지 않습니다.** 이 문의들은 항상 사람이 내용을 확인하고 상세 화면의 "이메일 발송" 버튼을 직접 눌러야만 발송됩니다. 이 안전장치는 Vitest 테스트(`tests/pipelineAutoSend.test.ts`)로 검증되어 있습니다.
- 목록에서 여러 문의를 선택해 "일괄 이메일 발송"을 누르면, 이메일 주소와 답변이 준비된 문의에 한해 발송됩니다 (이 경우도 needs_human_review 문의는 발송 대상에서 제외되지 않으니, 일괄 발송 전 검토 필요 문의는 목록에서 제외하고 선택하세요).
- 발송은 연결된 Google 계정 명의로 나가며, 별도의 발신 서버나 대량 발송 서비스를 사용하지 않습니다.

### 11-2. Google OAuth 클라이언트 ID 만드는 방법

Gmail 발송에는 Google Cloud의 OAuth 2.0 클라이언트 ID가 필요합니다 (비밀 값이 아니라 공개 가능한 ID이며, 앱 코드에는 포함되어 있지 않으므로 직접 발급해야 합니다).

1. [Google Cloud Console](https://console.cloud.google.com/)에서 새 프로젝트를 만들거나 기존 프로젝트를 선택합니다.
2. "API 및 서비스 → 라이브러리"에서 **Gmail API**를 검색해 사용 설정합니다.
3. "API 및 서비스 → OAuth 동의 화면"에서 User Type을 "외부"로 선택하고 앱 이름 등 기본 정보를 입력합니다. 테스트 단계에서는 "테스트 사용자"에 본인 Gmail 주소를 추가해야 로그인할 수 있습니다.
4. "API 및 서비스 → 사용자 인증 정보 → 사용자 인증 정보 만들기 → OAuth 클라이언트 ID"를 선택하고, 애플리케이션 유형은 **"웹 애플리케이션"**을 선택합니다.
5. "승인된 자바스크립트 원본"에 앱이 실행되는 주소를 추가합니다.
   - 로컬 개발: `http://localhost:8888` (netlify dev 기준 포트에 맞게)
   - 배포 후: `https://내사이트.netlify.app` 등 실제 배포 도메인
   - 리디렉션 URI는 별도로 설정하지 않아도 됩니다 (팝업 방식의 토큰 클라이언트를 사용).
6. 생성된 **클라이언트 ID**(`xxxxxxxx.apps.googleusercontent.com` 형태)를 복사합니다.
7. 앱의 "설정 → Gmail 자동 발송" 섹션에 붙여넣고 **"Google 계정 연결"**을 누릅니다. 팝업에서 발송 권한(gmail.send)에 동의하면 연결됩니다.

앱이 "테스트" 상태인 동안에는 3번에서 등록한 테스트 사용자 계정으로만 로그인할 수 있습니다. 조직 내 여러 사람이 사용하려면 Google의 앱 게시(확인) 절차를 거치거나, 각자 테스트 사용자로 등록해야 합니다.

### 11-3. Gmail 관련 권한 범위

앱은 `https://www.googleapis.com/auth/gmail.send` 범위만 요청합니다. 이 권한으로는 이메일 발송만 가능하며, 받은 편지함을 읽거나 기존 메일을 수정·삭제할 수 없습니다.

## 12. 개인정보 관련 주의사항

이 앱은 BYOK(Bring Your Own Key) 방식으로 동작하며, 입력한 API Key와 업로드한 문의 내용은 분석을 위해 서버(Netlify Function)를 거쳐 외부 API(TypeSafe, Google)로 전달됩니다. Gmail 연동을 켜면 실제 이메일이 발송되므로 더욱 주의가 필요합니다. **실제 고객의 개인정보(이름, 연락처, 이메일, 주문 내역 등)가 담긴 자료는 업로드하지 말고**, 테스트/교육 목적의 가상 데이터를 사용해 주세요.

## 13. 자주 발생하는 오류와 해결 방법

| 오류 메시지 | 원인 및 해결 방법 |
| --- | --- |
| API Key가 올바르지 않습니다 | 설정 화면에서 키를 다시 확인하고 "연결 테스트"로 검증하세요. |
| API 잔액 또는 할당량이 부족합니다 | TypeSafe / Google 콘솔에서 결제·할당량 상태를 확인하세요. |
| 요청이 너무 많습니다 | 잠시 후 다시 시도하거나 동시 처리 중인 문의 수를 줄이세요. |
| 지원하지 않는 모델입니다 | 설정 화면에서 사용 가능한 모델 ID로 변경하세요 (예: Gemini 모델이 계정에서 지원되지 않는 경우). |
| 고객 문의 열을 찾지 못함 | 미리보기 화면에서 "고객 문의 내용" 열을 직접 선택하세요. |
| 이미지로 된 PDF는 읽을 수 없습니다 | CSV 또는 Excel로 변환 후 다시 업로드하세요. |
| Gemini JSON 파싱 오류 | 1회 자동 재시도 후에도 실패하면 원문 텍스트가 그대로 표시됩니다. "다시 생성"을 눌러 재시도할 수 있습니다. |
| Google 계정 연결이 만료되었거나 권한이 없습니다 | 설정에서 "연결 해제" 후 다시 연결하세요. OAuth 클라이언트의 "승인된 자바스크립트 원본"에 현재 접속 주소가 등록되어 있는지도 확인하세요. |
| 고객 이메일 주소가 없거나 형식이 올바르지 않습니다 | 열 매핑에서 "고객 이메일" 열을 지정했는지, 값이 올바른 이메일 형식인지 확인하세요. |
| `netlify dev` 없이 실행 시 API가 동작하지 않음 | `npm run dev`는 프런트엔드만 실행합니다. API까지 테스트하려면 `netlify dev`를 사용하세요. |

## 14. 폴더 구조

```
src/
  components/        공통 UI 컴포넌트 (헤더, 설정 패널, 아이콘, JSON 뷰어, 경과시간 배지 등)
  pages/              워크스페이스(대시보드+목록+상세) 페이지
  features/
    upload/           파일 업로드, 파서 훅, 미리보기/매핑 UI
    classification/    대시보드, 필터, 목록(일괄 처리 포함), 상세 패널, Noul/Choice/Score 결과 뷰
    replies/           Gemini 답변 편집 + 템플릿 삽입 + 이메일 발송 UI
    learning/          Jev 학습 모드 (개념 카드, 질문 설계, 실습, 퀴즈 등)
  lib/
    fileParsers/       CSV/Excel/PDF 파서, 열 매핑, 파일 검증
    api/                Jev/Gemini/Gmail 클라이언트, 정규화, 정책 엔진, 캐시, 파이프라인 실행기
    gmail/              Gmail OAuth 연결 컨텍스트 (Google Identity Services)
    export/             CSV/Excel 내보내기
  types/               공용 타입 정의
  styles/               테마 및 레이아웃 CSS
netlify/
  functions/
    _shared/            공통 HTTP/오류 처리/MIME 유틸
    jev-analyze.ts       POST /api/jev/analyze
    gemini-reply.ts       POST /api/gemini/reply
    gmail-verify.ts        POST /api/gmail/verify (Gmail 연결 확인)
    gmail-send.ts          POST /api/gmail/send (이메일 발송)
    test-connection.ts    POST /api/test-connection
tests/                  Vitest 테스트
```

## 15. 알려진 제한사항

- Jev/Gemini는 데모 목적의 API 스펙을 기준으로 구현되어 있으므로, 실제 TypeSafe/Google 계정과 모델 지원 여부에 따라 요청 형식·모델명을 조정해야 할 수 있습니다.
- `xlsx`(SheetJS) 패키지는 npm 공개 배포판 기준으로 알려진 보안 권고가 있습니다(사용자 자신이 업로드한 파일만 처리하는 클라이언트 사이드 파싱 용도로 사용). 프로덕션에 민감한 환경에서 사용한다면 최신 SheetJS 공식 배포판으로 교체를 권장합니다.
- PDF 문의 자동 분리는 완벽하지 않을 수 있어 사용자가 분리 기준(빈 줄/번호/사용자 지정)을 직접 선택할 수 있게 했습니다.
- 동시성 제한은 기본 3건으로 고정되어 있으며 설정 화면에서 변경할 수 없습니다.
- 분석 결과 캐시와 Gmail 연결은 세션(탭) 메모리에만 유지되며 새로고침하면 초기화됩니다.
- Gmail 연동은 Google Cloud 프로젝트를 사용자가 직접 만들어야 하며, 앱이 "테스트" 상태인 동안에는 등록한 테스트 사용자 계정으로만 로그인할 수 있습니다.
- 빠른 답변 템플릿은 브라우저의 `localStorage`에 저장됩니다 (API Key와 달리 민감정보가 아니므로 편의를 위해 저장). 다른 브라우저·기기와는 공유되지 않습니다.
