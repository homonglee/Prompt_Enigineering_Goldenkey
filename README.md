# 프롬프트 엔지니어링 황금키

7가지 황금키 원칙으로 프롬프트를 진단하고 다듬는 브라우저 앱입니다. ‘대화로 프롬프트 초안 생성’에서 SSPECOS 질문에 차례로 답하고 초안을 검토·적용할 수 있습니다.

- 앱 버전: v1.14.0
- 원본 Sites: https://prompt-golden-key.homong-lee.chatgpt.site/
- 연결 도메인: https://prompt.hovision.co.kr/
- Sites 소스 커밋: `7057ca66f2991cb8adf4cb4873ba74026e879a30`

## 실행과 배포

`dist/`를 정적 웹 서버의 루트로 제공합니다. Node 패키지 설치나 빌드는 필요하지 않습니다.

```sh
python -m http.server 4173 --directory dist
```

Vercel은 `vercel.json`의 `outputDirectory` 설정에 따라 `dist/`를 게시합니다. 기존 `main` 브랜치 연결을 사용합니다.

## 파일 구성

- `dist/index.html`, `dist/app.js`: 앱 화면과 기능
- `dist/guides/`: 사용 설명서, 방법론 안내 및 PDF
- `dist/ocr/`: 한국어·영어 OCR 런타임과 언어 파일
- `scripts/`: 설명서 생성 및 버전 일치 검사
- `assets/fonts/`: 설명서 생성용 한글 폰트와 라이선스
- `site-release.json`: 버전과 변경 내용
- `.openai/hosting.json`: 원본 Sites 프로젝트 정보
- `docs/`: 이전 GPT 소개 문서와 페이지

이전 작업 기록은 브라우저의 로컬 저장소에 보관됩니다. 도메인을 바꾸면 이전 도메인의 로컬 기록은 자동으로 이동하지 않습니다.

## 설명서 검증

Python의 `reportlab`, `pypdf`가 설치된 환경에서 실행합니다.

```sh
python scripts/build-guides.py
python scripts/check-manual.py
```

앱을 수정할 때는 `AGENTS.md`의 버전·설명서 동기화 지침을 따릅니다.
