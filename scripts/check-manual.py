"""Reject a release whose on-site manual and downloadable PDF lag the site version."""

import json
import re
from pathlib import Path

from pypdf import PdfReader


BASE = Path(__file__).resolve().parents[1]
DIST = BASE / "dist"
release = json.loads((BASE / "site-release.json").read_text(encoding="utf-8"))
version = "v" + release["version"]
note = release["release_note"].strip()
assert re.fullmatch(r"v\d+\.\d+\.\d+", version)
assert len(note) >= 20, "이번 버전의 변경 설명을 채우세요."

home = (DIST / "index.html").read_text(encoding="utf-8")
assert f'<span class="version">{version}</span>' in home, "헤더 버전 불일치"
assert 'href="/guides/manual.html"' in home, "사용 설명서 버튼 없음"

for path in sorted((DIST / "guides").glob("*.html")):
    html = path.read_text(encoding="utf-8")
    assert f"<span>{version}</span>" in html, f"{path.name} 버전 불일치"
    assert f'href="/guides/{path.stem}.pdf"' in html, f"{path.name} PDF 링크 없음"
    assert (DIST / "guides" / f"{path.stem}.pdf").is_file()

manual = (DIST / "guides/manual.html").read_text(encoding="utf-8")
assert note in manual, "현재 변경 내용이 설명서에 없습니다."
pdf = PdfReader(DIST / "guides/manual.pdf")
pdf_text = " ".join(page.extract_text() for page in pdf.pages)
pdf_text = " ".join(pdf_text.split())
assert version in pdf_text and " ".join(note.split()) in pdf_text, "PDF 설명서가 이전 버전입니다."
assert len(pdf_text) > 2500, "PDF 설명서 내용이 부족합니다."
fonts = pdf.pages[0]["/Resources"]["/Font"]
assert any(
    (descriptor := font.get_object().get("/FontDescriptor"))
    and descriptor.get_object().get("/FontFile2")
    for font in fonts.values()
), "PDF에 한글 글꼴이 포함되어 있지 않습니다."
print(f"설명서, PDF, 헤더: {version} 일치")
