# 프롬프트 엔지니어링 황금키 사이트

- 이 저장소는 기존 Sites 프로젝트입니다. `.openai/hosting.json`의 프로젝트 ID와 공개 범위를 보존합니다.
- 사이트를 수정할 때마다 `site-release.json`의 버전을 올리고 그 버전의 변경 내용을 `release_note`에 적습니다. 사용자에게 날짜를 표시하지 않습니다.
- 기능, 사용 흐름, 버튼, 파일 형식, 제한을 변경하면 `scripts/build-guides.py`의 `GUIDES["manual"]` 설명도 실제 동작과 일치하도록 수정합니다. 필요하면 다른 설명 페이지도 고칩니다.
- `python3 scripts/build-guides.py`로 모든 설명 페이지와 PDF를 다시 생성하고 `python3 scripts/check-manual.py`로 헤더·설명서·PDF 버전 및 이번 변경 내용을 확인한 뒤 게시합니다.
- 사용 설명서가 오래된 상태로 새 버전을 게시하지 않습니다.
