import json
from html import escape
from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import PageBreak, Paragraph, SimpleDocTemplate, Spacer


ROOT = Path(__file__).resolve().parents[1] / "dist" / "guides"
ROOT.mkdir(parents=True, exist_ok=True)
SITE = "https://prompt.hovision.co.kr"
RELEASE = json.loads((Path(__file__).resolve().parents[1] / "site-release.json").read_text(encoding="utf-8"))
VERSION = "v" + RELEASE["version"]
TOOLS = [
    ("ChatGPT", "chatgpt.com", "https://chatgpt.com/"),
    ("Claude", "claude.ai", "https://claude.ai/"),
    ("Gemini", "gemini.google.com", "https://gemini.google.com/"),
    ("Grok", "grok.com", "https://grok.com/"),
    ("Perplexity", "perplexity.ai", "https://www.perplexity.ai/"),
]

GUIDES = {
    "manual": {
        "title": "프롬프트 엔지니어링 황금키 사용 설명서",
        "short": "사용 설명서",
        "lead": "초안 입력부터 SSPECOS 진단, PM Skills·Spec Kit 방법론 선택, 최종 프롬프트 편집, 복사·저장·불러오기까지 앱의 전체 사용 흐름을 안내합니다.",
        "sections": [
            ("현재 버전과 변경 사항", [
                f"현재 버전: {VERSION}. {RELEASE['release_note']}",
                "헤더의 앱 제목과 버전 번호로 현재 사이트를 확인할 수 있습니다. 작은 화면에서는 제목을 읽기 쉽게 크게 표시하고 버전 번호를 제목 아래에 둡니다. 기능이 바뀌면 해당 사용 절차와 PDF도 새 버전에 맞춰 업데이트합니다."
            ]),
            ("1. 앱에서 무엇을 만들 수 있나요?", [
                "이 앱은 사용자가 쓴 초안 프롬프트를 7가지 SSPECOS 원칙으로 진단하고, 부족한 요소를 보완해 복사 가능한 최종 프롬프트를 만듭니다. 최종 프롬프트에는 SSPECOS 약어나 원칙 번호를 넣지 않고 실제 작업 지침만 정리합니다. 결과 창의 텍스트는 직접 편집할 수 있습니다.",
                "사이트 안에서 AI가 완성 문서나 답변을 직접 생성하는 방식은 아닙니다. 완성된 프롬프트를 복사해 ChatGPT, Claude, Gemini, Grok, Perplexity 같은 AI 도구에 붙여넣어 사용합니다."
            ]),
            ("2. 초안 입력과 캡처 이미지 사용", [
                "‘초안 프롬프트를 입력하세요’ 칸에 원하는 작업을 일상적인 문장으로 적습니다. ‘황금키’ 또는 ‘Golden key’를 따로 입력할 필요가 없습니다. 텍스트는 최대 10,000자입니다.",
                "화면 캡처의 글자를 이용하려면 입력 칸에 이미지 붙여넣기를 하거나 ‘캡처 이미지 업로드’를 누릅니다. 이미지는 15MB 이하로 사용하세요. 글자 인식은 기기에서 처리하며, 추출된 문장을 확인하고 필요하면 수정한 뒤 생성합니다.",
                "OCR 결과가 흐리거나 누락되면 선명한 캡처를 다시 사용하거나 직접 입력하세요. 이미지 자체가 AI에 전달되는 것은 아니며 추출된 텍스트가 초안에 추가됩니다."
            ]),
            ("3. 문서 유형과 방법론 선택", [
                "‘문서 유형’은 자동 감지, 마케팅 자료, 기획서, 제안서, 보고서, 일반 프롬프트 중 선택합니다. 자동 감지는 초안의 단어를 바탕으로 추천하므로 의도와 다르면 직접 고르세요.",
                "‘적용 방법론’은 자동 추천, PM Skills, Spec Kit, PM + Spec Kit, SSPECOS만 적용 중 고릅니다. 자동 추천은 마케팅 자료와 보고서에는 PM, 기획서와 제안서에는 두 방법론을, 일반 프롬프트에는 SSPECOS만 적용합니다.",
                "PM Skills는 고객·문제·가치·실행·성과 관점을 보강합니다. Spec Kit은 요구 정의, 중요한 모호성 확인, 계획, 실행 항목, 완성본 점검의 흐름을 보강합니다. 이 앱은 첨부 스킬의 방법을 문서 작성용 지침으로 재구성하며 원본 CLI나 외부 스킬을 실행하지 않습니다."
            ]),
            ("대화로 프롬프트 초안 생성", [
                "초안 입력란 위의 ‘대화로 프롬프트 초안 생성’ 버튼을 누르면 7가지 SSPECOS 질문을 차례로 묻는 대화창이 열립니다. 명확성과 구체성 → 구조화와 구분자 → 역할과 페르소나 → 예시 제공 → 맥락 제공 → 출력 형식 지정 → 단계적 점검 순서입니다.",
                "각 질문에 답하고 ‘다음 질문’을 누릅니다. 답변은 항목당 1,000자까지 입력할 수 있습니다. 모든 질문은 ‘건너뛰기’를 눌러 넘길 수 있으며, 이전 질문으로 돌아와 다시 채울 수 있습니다. 비어 있는 항목은 초안에 ‘미정 — 필요한 정보는 확인해 주세요’로 표시하며 사실을 임의로 채우지 않습니다.",
                "‘이전 질문’으로 돌아가 답변을 수정할 수 있습니다. 마지막 질문 뒤 ‘답변 검토하기’를 누르면 7가지 제목으로 정리된 초안이 보입니다. 검토 화면에서 이전 질문으로 돌아가 수정하거나 ‘초안 입력란에 적용’을 누르세요. 기존 초안이 있으면 새 초안으로 바뀐다는 안내가 표시됩니다. 적용 전에는 기존 입력과 최종 프롬프트가 유지됩니다.",
                "모든 질문을 건너뛰면 미정 항목으로 구성된 틀이 생성되며 작업 목표를 채우라는 안내가 나옵니다. 적용한 초안은 직접 편집할 수 있습니다. 문서 유형과 방법론 선택은 유지되며, ‘황금키 생성’을 누르면 기존처럼 분석과 최종 프롬프트가 만들어지고 이전 작업에 저장됩니다. 대화 초안 적용 자체는 이전 기록을 덮어쓰지 않습니다.",
                "대화는 정해진 질문과 입력한 답변을 기기에서 정리하는 방식이며 외부 AI 호출이나 전송은 없습니다. 닫기 또는 Esc로 닫아도 현재 페이지에서는 답변이 유지됩니다. ‘새 작업’은 대화 답변도 초기화하며, 새로고침하면 적용 전 답변은 사라집니다. 중요한 초안은 황금키 생성 후 JSON으로 저장하세요."
            ]),
            ("4. 황금키 생성과 7가지 진단", [
                "‘황금키 생성’ 버튼을 누르면 분석과 최종 프롬프트가 나타납니다. ‘예시 입력’은 샘플 초안을 채우고, ‘새 작업’은 입력·선택값을 초기화합니다. 새 작업을 눌러도 이미 저장된 이전 기록은 남습니다.",
                "진단 목록에는 명확성과 구체성, 구조화와 구분자, 역할과 페르소나, 예시, 맥락, 출력 형식, 단계적 점검이 표시됩니다. ‘충족’은 입력에 관련 표현이 있다는 간단 진단이며 내용의 사실성까지 확인한 것은 아닙니다.",
                "각 원칙의 ‘자동 보완’을 누르면 해당 지침이 최종 프롬프트의 ‘추가 지침’에 서술형 문장으로 반영됩니다. 원칙 이름이나 번호를 반복하지 않습니다. ‘직접 작성·편집’을 누르면 내 조건을 적어 적용할 수 있습니다. 충족으로 표시된 항목도 더 구체화할 수 있습니다."
            ]),
            ("5. 최종 프롬프트 편집과 활용", [
                "대화형 초안의 일곱 답변은 최종 프롬프트에서 요청·입력 자료·역할·참고 예시·사용 맥락·결과 형식·검토 기준으로 정리됩니다. 건너뛴 항목은 최종 프롬프트에 미정 문구로 반복하지 않습니다. 양식에 첨부 자료를 채우는 요청에는 항목과 자료를 대조하고 원본 서식을 유지하며 근거가 없는 값은 확인 대상으로 남기라는 처리 기준을 덧붙입니다. 오른쪽 ‘최종 프롬프트’ 창은 자유롭게 수정할 수 있습니다. ‘프롬프트 복사’를 누르면 현재 보이는 편집본이 복사됩니다. 복사가 제한되면 텍스트가 선택되므로 기기의 복사 기능을 사용하세요.",
                "문서 유형이나 방법론을 바꾸면 생성된 내용을 갱신합니다. 직접 고친 문장과 겹쳐 자동 반영이 어렵다면 안내 문구를 확인하고 ‘선택한 방법론으로 다시 생성’을 누르세요. 다시 생성하면 직접 수정한 내용이 대체될 수 있습니다.",
                "헤더의 다섯 AI 도구 로고는 각 서비스로 이동하는 링크입니다. 사이트가 프롬프트를 자동 전송하지 않으므로 원하는 도구에 직접 붙여넣으세요."
            ]),
            ("6. 기기에 저장하고 파일로 불러오기", [
                "생성한 작업은 이 기기의 브라우저 저장 공간에 이전 기록으로 남습니다(최근 30건). ‘불러와 편집’으로 초안·보완·문서 유형·방법론을 다시 엽니다. 자동 생성된 최종 프롬프트는 현재 버전의 규칙으로 갱신하고, 사용자가 직접 편집해 저장한 최종 프롬프트는 그대로 보존합니다. 개별 ‘삭제’로 기록을 지울 수 있습니다.",
                "‘프롬프트 저장하기’는 현재 작업을 JSON 파일로 저장합니다. 지원하는 브라우저에서는 저장 위치 선택 창이 뜨며, 모바일에서는 공유 메뉴 또는 다운로드가 열릴 수 있습니다. 저장 위치 동작은 브라우저와 기기에 따라 다릅니다.",
                "‘프롬프트 불러오기’는 저장한 JSON을 열어 편집하거나 TXT·MD 파일을 초안으로 읽습니다(1MB 이하). JSON에는 초안, 선택한 방법론, SSPECOS 보완 내용, 최종 프롬프트가 포함됩니다. 일반 텍스트 파일에는 초안만 들어옵니다.",
                "브라우저 기록은 다른 기기나 브라우저로 자동 동기화되지 않습니다. 중요한 작업은 JSON 파일로 별도 저장해 옮기세요. 시크릿 모드나 브라우저 데이터 삭제 후에는 기록이 사라질 수 있습니다."
            ]),
            ("7. 설명 자료와 PDF", [
                "헤더의 ‘사용 설명서’, ‘SSPECOS 설명’, ‘PM 스킬 설명’, ‘SPEC KIT 스킬 설명’ 버튼에서 각 안내 페이지를 엽니다. 각 페이지 상단과 하단의 PDF 다운로드 버튼으로 설명을 파일로 보관할 수 있습니다.",
                "설명 페이지는 방법론이 어떻게 프롬프트에 반영되는지 알려 줍니다. PM Skills나 Spec Kit 원본 도구의 전체 기능을 그대로 제공한다는 뜻은 아닙니다."
            ]),
            ("실전 예시: 제안서 만들기", [
                "초안에 ‘제조업 고객에게 머신비전 검사 도입 제안서를 작성해 줘. 수작업 검사에서 불량 누락을 줄이고 싶어 한다’고 입력합니다. 문서 유형을 ‘제안서’, 방법론을 ‘PM + Spec Kit’으로 선택하고 ‘황금키 생성’을 누릅니다.",
                "진단에서 고객의 현재 검사 방식·검사 대상·현장 제약을 맥락 항목에 추가합니다. 출력 형식에는 문제 정의, 제안 범위, 시범 검증 방법, 기대 효과, 비용·일정의 확인 사항을 지정합니다. 최종 프롬프트를 검토·복사해 사용할 AI 도구에 입력합니다.",
                "개선율이나 도입 비용처럼 제공되지 않은 숫자는 사실로 만들지 않도록 최종 프롬프트에 남겨 두세요."
            ]),
            ("사용 중 확인할 점", [
                "저작권이나 법적으로 제한될 수 있는 자료를 그대로 재현해 달라는 요청은 생성이 제한될 수 있습니다. AI가 만든 결과도 사용 전 사실, 수치, 법적 적합성을 직접 확인하세요.",
                "휴대폰에서 저장 위치 선택 창이 보이지 않으면 공유 메뉴 또는 다운로드 목록을 확인하세요. 캡처의 글자가 읽히지 않으면 파일 크기와 선명도를 점검하고 입력 칸에서 텍스트를 고치세요."
            ]),
        ],
        "source": "프롬프트 엔지니어링 황금키 앱의 현재 사용 흐름 및 SSPECOS·PM Skills·Spec Kit 설명",
        "source_url": SITE,
    },
    "sspecos": {
        "title": "SSPECOS · 일곱 가지 황금키",
        "short": "SSPECOS",
        "lead": "짧은 요청을 실제로 쓸 수 있는 프롬프트로 다듬는 일곱 가지 점검 기준입니다. 초안을 분석한 뒤 부족한 원칙을 자동 보완하거나 직접 작성할 수 있습니다.",
        "sections": [
            ("SSPECOS를 쓰는 순서", [
                "1) 초안을 입력하거나 캡처의 글자를 추출합니다. ‘대화로 프롬프트 초안 생성’에서 일곱 질문에 답하고 초안 입력란에 적용할 수도 있습니다. 2) 황금키 생성 후 일곱 원칙의 충족 여부를 확인합니다. 3) 부족한 항목의 ‘자동 보완’ 또는 ‘직접 작성·편집’을 선택합니다. 4) 최종 프롬프트를 고치고 복사하거나 저장합니다.",
                "진단은 초안에 드러난 표현을 기준으로 한 빠른 점검입니다. ‘충족’이 곧 내용의 정확성이나 결과의 품질을 보증하지는 않습니다. 목적·대상·자료·제약을 더 구체적으로 넣을수록 활용도가 높아집니다."
            ]),
            ("S — Specificity and Clarity | 명확성과 구체성", [
                "무엇을, 누구에게, 어느 범위까지 만들지 밝힙니다. ‘마케팅 자료 작성’보다 ‘신규 고객에게 보낼 1페이지 제품 소개문을 작성’이 더 분명합니다.",
                "목표, 독자, 결과물의 범위가 빠졌다면 짧은 확인 질문을 요청하거나 합리적인 가정을 명시하게 합니다."
            ]),
            ("S — Structure and Delimiters | 구조화와 구분자", [
                "요청, 배경, 제약, 참고 자료, 출력 형식을 제목이나 구분자로 나눕니다. 첨부 문서의 내용과 AI에 내리는 지시를 섞지 않으면 오해를 줄일 수 있습니다.",
                "예: ‘## 배경’, ‘## 참고 자료’, ‘## 요청’, ‘## 출력 형식’처럼 영역을 구분합니다."
            ]),
            ("P — Persona and Role | 역할과 페르소나", [
                "해당 업무에 맞는 관점을 정합니다. 예를 들어 기술 제안서는 ‘제조업 고객의 의사결정을 돕는 제안 담당자’, 수업 자료는 ‘초보 학습자를 가르치는 강사’ 관점이 유용합니다.",
                "역할은 표현 수준과 검토 관점을 정할 뿐, 없는 전문 자격이나 실제 조사 경험을 주장하게 해서는 안 됩니다."
            ]),
            ("E — Examples | 예시 제공", [
                "좋은 문장, 표, 목차, 톤의 예시를 제공하면 결과의 방향이 뚜렷해집니다. 예시는 구조를 보여 주는 용도로 쓰고 사실이나 출처를 임의로 늘리지 않게 합니다.",
                "예: ‘각 항목을 현황 → 문제 → 제안 → 기대 효과 순서로 작성’처럼 기대 흐름을 제시합니다."
            ]),
            ("C — Context | 맥락 제공", [
                "사용 목적, 독자, 업계, 이미 확인된 사실, 일정, 예산, 이전 결정 사항을 제공합니다. 정보가 없으면 추정으로 메우기보다 확인할 항목으로 표시하게 합니다.",
                "동일한 ‘보고서’라도 임원 결재용인지 현장 점검용인지에 따라 깊이와 용어가 달라집니다."
            ]),
            ("O — Output Format | 출력 형식", [
                "결과물의 형태와 길이를 지정합니다. 예를 들어 1페이지 요약, 5개 슬라이드의 개요, 마크다운 표, 이메일 본문, 결재용 기획서처럼 실제 사용할 형식을 적습니다.",
                "형식이 정해지지 않았다면 제목과 소제목, 짧은 목록으로 읽기 쉽게 구성하도록 요청합니다."
            ]),
            ("S — Step-by-step Reasoning | 단계적 점검", [
                "목표 확인 → 내용 구성 → 정확성·누락·활용 가능성 점검 순서로 작업을 지시합니다. 내부 사고의 상세 기록을 요구하기보다 결과와 검증 가능한 근거를 요청합니다.",
                "완성 후에는 원래 요청을 빠뜨리지 않았는지, 숫자와 출처를 지어내지 않았는지 확인하게 합니다."
            ]),
            ("적용 예시", [
                "초안: ‘머신비전 제안서를 작성해 줘.’",
                "보완: ‘당신은 제조업 기술 제안 담당자입니다. 수작업 검사에서 불량 누락을 줄이려는 고객에게 제안서를 작성하세요. ## 배경: 검사 대상과 공정 속도는 제공 자료만 사용. ## 출력: 문제 정의, 제안 구성, 도입 단계, 검증 지표, 확인 필요 사항. 비용이나 개선율이 없으면 추정 수치를 만들지 마세요.’"
            ]),
            ("문서 유형별 적용 팁", [
                "마케팅 자료: 고객군과 채널을 구체화하고 브랜드 톤, 메시지, 행동 유도, 성과 지표를 출력 형식에 넣습니다.",
                "기획서: 결재자, 추진 배경, 목적, 범위, 일정, 예산의 확정 여부를 맥락과 제약으로 명시합니다.",
                "제안서: 상대의 문제와 차별화 근거를 구분하고, 실행 범위와 검증 가능한 기대 효과를 요청합니다.",
                "보고서: 조사 질문, 사용 자료, 사실과 해석의 구분, 한계, 의사결정을 위한 권고안을 지정합니다."
            ]),
            ("마지막 확인", [
                "생성된 프롬프트가 실제 요청의 의미를 바꾸지 않았는지 읽어 보세요. 모르는 정보가 자동으로 채워졌다면 삭제하거나 ‘확인 필요’로 바꿉니다.",
                "최종 프롬프트 창에서 직접 고친 내용은 복사·저장에 반영됩니다. 이전 작업은 이 기기의 브라우저에 저장되며 JSON 파일로 별도 보관할 수 있습니다."
            ]),
        ],
        "source": "프롬프트 엔지니어링 황금키 생성기의 SSPECOS 기준",
        "source_url": SITE,
    },
    "pm-skills": {
        "title": "PM Skills · 문서 작성 방법",
        "short": "PM Skills",
        "lead": "첨부된 PM Skills의 제품·시장·실행 프레임을 마케팅 자료, 기획서, 제안서, 보고서 작성에 맞게 재구성했습니다. 목표와 고객을 먼저 정의하고 근거, 실행, 성과 지표로 이어지게 합니다.",
        "sections": [
            ("이 사이트에서의 적용 범위", [
                "사이트는 PM Skills 원본 도구를 실행하거나 외부 데이터를 자동 조사하지 않습니다. 해당 스킬의 핵심 질문과 구조를 최종 프롬프트에 담아, 복사한 프롬프트를 AI에 입력했을 때 문서 초안을 만들도록 돕습니다.",
                "PM Skills 옵션을 고르면 문서 유형에 맞는 프레임이 선택됩니다. ‘PM + Spec Kit’를 고르면 대상·가치·성과 관점과 요구 정의·검증 흐름을 함께 적용합니다."
            ]),
            ("마케팅 자료 — GTM Strategy, Marketing Ideas, Positioning Ideas", [
                "대상 고객과 해결할 문제를 정한 뒤 핵심 가치 제안과 경쟁 차별점을 한 문장으로 잡습니다. 이어 채널별 메시지, 콘텐츠 형식, 행동 유도, 도달·참여·전환 지표를 연결합니다.",
                "예: 신제품 SNS 캠페인이라면 대상 세그먼트, 채널 선택 이유, 게시물 메시지, 실행 일정, 측정할 지표를 한 흐름으로 제시합니다. 브랜드 톤과 예산이 없으면 확인 사항으로 남깁니다."
            ]),
            ("기획서 — Create PRD, Strategy Red-Team", [
                "문제와 사용자, 목표, 범위, 필수 요구, 성공 기준을 구분합니다. 우선순위를 정하고 일정·담당·자원을 연결한 뒤 가장 취약한 가정을 검토합니다.",
                "기획서가 제품 개발 PRD가 아니라 행사나 사업 계획이라면 해당 문서에 맞는 항목만 사용합니다. 개발 기능 목록을 억지로 넣지 않습니다."
            ]),
            ("제안서 — Value Proposition, Competitor Analysis, Strategy Red-Team", [
                "받는 사람의 현재 문제와 제안의 이익을 직접 연결합니다. 차별화 근거, 실행 범위, 단계별 일정, 기대 효과, 예상 반론과 대응을 작성합니다.",
                "비교 대상이나 시장 수치가 없으면 경쟁 우위나 효과를 사실처럼 꾸미지 않습니다. 제공된 자료와 확인이 필요한 가정을 분리합니다."
            ]),
            ("보고서 — Competitor Analysis, SWOT Analysis", [
                "자료의 출처와 신뢰도를 먼저 확인하고 관찰된 사실, 해석, 시사점, 권고안을 구분합니다. 경쟁 분석과 SWOT는 보고서 주제에 실제로 맞을 때만 적용합니다.",
                "의사결정자가 무엇을 결정해야 하는지 요약하고, 권고안마다 근거·제약·다음 행동을 붙입니다. 확인되지 않은 수치는 ‘추가 확인 필요’로 표기합니다."
            ]),
            ("사용 예시와 최종 점검", [
                "초안: ‘지역 축제 후원 제안서를 작성해 줘.’ 문서 유형 ‘제안서’, 방법론 ‘PM Skills’를 선택하면 고객 문제, 차별화, 실행 범위, 기대 성과와 검증할 가정을 포함하는 프롬프트가 나옵니다.",
                "마지막에는 독자에게 필요한 결론이 앞에 있는지, 각 주장에 근거가 있는지, 예산·일정·성과 수치를 지어내지 않았는지 확인합니다."
            ]),
        ],
        "source": "Pawel Huryn, PM Skills (MIT). 첨부 자료의 관련 스킬을 문서 작성용으로 요약·재구성.",
        "source_url": "https://github.com/phuryn/pm-skills",
    },
    "spec-kit": {
        "title": "Spec Kit · 문서 기획 방법",
        "short": "Spec Kit",
        "lead": "첨부된 Spec Kit의 Specify → Clarify → Plan → Tasks → Analyze 흐름을 문서 작성에 맞춰 적용합니다. 무엇을 왜 만드는지 먼저 정의하고, 모호한 점과 근거를 확인한 후 완성본의 일관성을 점검합니다.",
        "sections": [
            ("원래 용도와 문서용 적용", [
                "Spec Kit은 본래 소프트웨어 작업을 명세 중심으로 진행하기 위한 도구입니다. 이 사이트에서는 원본 CLI나 명령을 실행하지 않고, 그 단계별 사고법을 기획서·제안서·보고서 등의 프롬프트로 옮깁니다.",
                "사이트가 생성하는 것은 완성 문서가 아니라 AI에 전달할 최종 프롬프트입니다. AI에는 과정 목록만 반복하지 말고 실제 제출·검토 가능한 문서 초안을 작성하도록 지시합니다."
            ]),
            ("1. Specify — 요구를 정의", [
                "독자, 목적, 필요한 결과, 필수 내용, 제약 조건, 성공 기준을 적습니다. ‘무엇을 왜’에 집중하고, 아직 확인되지 않은 실행 방법이나 수치를 사실로 확정하지 않습니다.",
                "예: 축제 제안서라면 수신 기관, 해결하려는 과제, 제안 범위, 제출 형식, 평가 기준을 먼저 정의합니다."
            ]),
            ("2. Clarify — 중요한 모호성을 확인", [
                "예산, 대상, 기간, 평가 기준처럼 결과가 크게 달라지는 빈칸을 찾습니다. 정보가 없더라도 모든 질문을 늘어놓지 말고 작성 자체가 불가능할 때만 핵심 질문을 최대 세 개로 좁힙니다.",
                "그 외에는 가정을 명확히 표시하고 작성합니다. 가정이 확정 사실처럼 보이지 않도록 분리합니다."
            ]),
            ("3. Plan — 구성과 근거를 설계", [
                "필요한 자료, 문서 목차, 논리 흐름, 실행 가능성을 계획합니다. 제안서라면 문제 → 해결 방안 → 실행 → 성과의 흐름, 보고서라면 질문 → 자료 → 분석 → 결론의 흐름이 적합합니다.",
                "외부 조사가 필요한 경우 조사 도구가 있다면 출처와 시점을 확인하고, 없다면 검증할 사실을 표시합니다."
            ]),
            ("4. Tasks — 실행 항목으로 분해", [
                "문서에 실행 계획이 필요하면 과업, 순서, 담당, 점검 시점, 산출물을 구체화합니다. 단순 요약이나 설명 자료에는 불필요한 작업 목록을 억지로 붙이지 않습니다.",
                "예: ‘현황 조사 → 이해관계자 협의 → 시범 운영 → 효과 측정’에 각 단계의 결과물과 책임을 붙입니다."
            ]),
            ("5. Analyze — 요구와 완성본을 대조", [
                "완성된 문서가 처음 정의한 목적·대상·필수 항목·제약·성공 기준을 충족하는지 확인합니다. 주장과 근거, 일정과 자원, 제안과 기대 성과가 서로 모순되지 않는지도 살핍니다.",
                "빠진 항목이나 근거 없는 수치를 수정한 뒤 완성 문서와 필요한 확인 사항을 제시합니다."
            ]),
            ("사용 예시", [
                "초안: ‘공공기관에 제출할 디지털 전환 기획서를 작성해 줘.’ 문서 유형 ‘기획서’, 방법론 ‘Spec Kit’을 고르면 목적과 성공 기준을 명세하고, 확인이 필요한 조건을 분리하며, 실행·검증 구조를 갖춘 프롬프트가 나옵니다.",
                "두 방법론을 함께 적용하면 PM Skills가 대상·가치·성과의 설득력을 보강하고 Spec Kit이 요구부터 완성본 점검까지의 일관성을 살핍니다."
            ]),
        ],
        "source": "GitHub, Spec Kit (MIT). 첨부 자료의 단계 흐름을 문서 작성용으로 요약·재구성.",
        "source_url": "https://github.com/github/spec-kit",
    },
}


def page_html(slug, guide):
    links = "".join(
        f'<a class="guide-link{" current" if key == slug else ""}" href="/{"guides/" + key + ".html"}"'
        + (' aria-current="page"' if key == slug else '')
        + f'>{escape(info["short"])}</a>'
        for key, info in GUIDES.items()
    )
    tool_links = "".join(
        f'<a href="{url}" target="_blank" rel="noopener noreferrer" aria-label="{name} 열기" title="{name} 열기">'
        f'<img src="https://www.google.com/s2/favicons?domain={domain}&amp;sz=128" alt="" width="20" height="20"><span>{name}</span></a>'
        for name, domain, url in TOOLS
    )
    return f'''<!doctype html>
<html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="theme-color" content="#0d111b"><meta name="description" content="{escape(guide['lead'], quote=True)}">
<title>{escape(guide['title'])} | 프롬프트 엔지니어링 황금키</title><link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="stylesheet" href="/guides/guide.css"></head><body>
<header class="site-header"><a class="brand" href="/">◆ 프롬프트 엔지니어링 황금키 <span>{VERSION}</span></a><div class="header-tools"><nav class="guide-nav" aria-label="설명 자료">{links}</nav><nav class="model-links" aria-label="AI 도구 바로가기">{tool_links}</nav></div></header>
<main class="layout"><div class="intro"><p class="kicker">GOLDEN KEY · GUIDE</p><h1>{escape(guide['title'])}</h1><p class="lead">{escape(guide['lead'])}</p>
<div class="intro-actions"><a class="download" href="/guides/{slug}.pdf" download="{slug}.pdf">PDF 다운로드 ↓</a><a class="back" href="/#generator">생성기로 돌아가기 ↗</a></div></div>
<div class="body-grid"><aside class="toc"><strong>이 페이지의 내용</strong><ol>{''.join(f'<li><a href="#section-{i}">{escape(title)}</a></li>' for i,(title,_) in enumerate(guide['sections'],1))}</ol></aside>
<article class="content">{''.join(f'<div id="section-{i}">{chapter}</div>' for i,chapter in enumerate([f'<section class="chapter"><h2>{escape(heading)}</h2>'+''.join(f'<p>{escape(text)}</p>' for text in paragraphs)+'</section>' for heading,paragraphs in guide['sections']],1))}
<div class="source"><strong>참고 자료</strong><p>{escape(guide['source'])}</p><a href="{escape(guide['source_url'], quote=True)}" target="_blank" rel="noopener noreferrer">자료 출처 ↗</a></div></article></div>
<div class="bottom-action"><a class="download" href="/guides/{slug}.pdf" download="{slug}.pdf">이 설명을 PDF로 저장 ↓</a></div></main>
<footer><a href="/">프롬프트 엔지니어링 황금키</a><span>SSPECOS · PM Skills · Spec Kit</span></footer></body></html>'''


CSS = '''*{box-sizing:border-box}html{scroll-behavior:smooth}body{margin:0;background:#0d111b;color:#f5f0e7;font:16px/1.75 system-ui,-apple-system,"Noto Sans KR","Malgun Gothic",sans-serif}a{color:inherit;text-decoration:none}a:focus-visible{outline:3px solid #f2d28a;outline-offset:3px}.site-header{max-width:1180px;margin:auto;padding:17px 28px;display:flex;align-items:center;justify-content:space-between;gap:16px;flex-wrap:wrap;border-bottom:1px solid #ffffff23}.brand{font-weight:800;letter-spacing:-.03em}.brand span{font-size:.72rem;border:1px solid #b99860;border-radius:20px;color:#f1cd88;padding:2px 8px;margin-left:8px;white-space:nowrap}.header-tools{margin-left:auto;display:flex;flex-direction:column;align-items:flex-end;gap:7px}.guide-nav,.model-links{display:flex;flex-wrap:wrap;gap:6px;justify-content:flex-end}.model-links a{display:inline-flex;gap:5px;align-items:center;border:1px solid #ffffff3c;background:#ffffff0b;border-radius:8px;padding:4px 7px;font-size:.7rem;font-weight:700}.model-links a:hover{border-color:#e9bc68}.model-links img{display:block;width:20px;height:20px;object-fit:contain;background:#fff;border-radius:5px;padding:2px}.guide-link{border:1px solid #7d6b4d;border-radius:9px;padding:7px 12px;font-size:.85rem;color:#ead7b1}.guide-link:hover,.guide-link.current{background:#e5bc6c;color:#141820}.layout{max-width:1180px;margin:auto;padding:55px 28px 85px}.kicker{color:#e9bc68;letter-spacing:.2em;font-size:.78rem;font-weight:800}.intro{padding:12px 0 48px;border-bottom:1px solid #ffffff25}.intro h1{font-size:clamp(2.15rem,5vw,4.2rem);line-height:1.14;letter-spacing:-.055em;margin:14px 0 20px}.lead{max-width:780px;color:#d1d5df;font-size:1.13rem;word-break:keep-all}.intro-actions,.bottom-action{display:flex;gap:12px;flex-wrap:wrap;margin-top:27px}.download,.back{display:inline-flex;align-items:center;justify-content:center;border-radius:10px;padding:12px 18px;font-weight:800}.download{background:linear-gradient(120deg,#f9dd9e,#d5a758);color:#131720}.back{border:1px solid #8790a2;color:#e7e9ee}.download:hover{filter:brightness(1.08)}.back:hover{border-color:#e9bc68}.body-grid{display:grid;grid-template-columns:235px minmax(0,1fr);gap:58px;padding-top:38px}.toc{position:sticky;top:20px;align-self:start;border:1px solid #ffffff20;border-radius:14px;background:#151e2c;padding:18px}.toc strong{color:#f1d18d}.toc ol{padding-left:20px;margin:13px 0 0;color:#bfc8d7;font-size:.86rem}.toc li{margin:7px 0}.toc a:hover{color:#f1d18d}.chapter{border-bottom:1px solid #ffffff20;padding:4px 0 24px;margin:0 0 28px;scroll-margin-top:20px}.chapter h2{font-size:1.45rem;line-height:1.35;color:#f4d594;margin:0 0 15px;word-break:keep-all}.chapter p{margin:0 0 14px;color:#e0e2e9;word-break:keep-all}.source{padding:22px;border-radius:13px;background:#192334;color:#bbc4d2;font-size:.88rem}.source strong{color:#f1d18d}.source p{margin:5px 0}.source a{color:#f4d594;text-decoration:underline;text-underline-offset:3px}.bottom-action{margin:35px 0 0}footer{border-top:1px solid #ffffff22;padding:25px max(28px,calc((100vw - 1124px)/2));display:flex;justify-content:space-between;gap:15px;color:#aeb6c3;font-size:.82rem}@media(max-width:760px){.layout{padding:30px 22px 60px}.site-header{padding:14px 22px}.header-tools{width:100%;align-items:flex-start}.guide-nav,.model-links{justify-content:flex-start}.body-grid{display:block}.toc{position:static;margin-bottom:35px}.lead{font-size:1rem}footer{display:block}footer span{display:block;margin-top:8px}}'''


FONT = Path(__file__).resolve().parents[1] / "assets" / "fonts" / "NanumGothic-Regular.ttf"
if not FONT.is_file():
    raise FileNotFoundError(f"Korean PDF font is required: {FONT}")
pdfmetrics.registerFont(TTFont("GuideKorean", str(FONT)))
PDF_FONT = "GuideKorean"


def make_pdf(slug, guide):
    path = ROOT / f"{slug}.pdf"
    pdf = SimpleDocTemplate(str(path), pagesize=A4, rightMargin=21*mm, leftMargin=21*mm, topMargin=21*mm, bottomMargin=19*mm,
                            title=guide["title"], author="프롬프트 엔지니어링 황금키")
    styles = getSampleStyleSheet()
    title = ParagraphStyle("GoldTitle", parent=styles["Title"], fontName=PDF_FONT, fontSize=21, leading=29, textColor=colors.HexColor("#13243A"), spaceAfter=9)
    lead = ParagraphStyle("Lead", fontName=PDF_FONT, fontSize=9.5, leading=15, textColor=colors.HexColor("#34475B"), spaceAfter=12)
    heading = ParagraphStyle("Heading", fontName=PDF_FONT, fontSize=11.5, leading=17, textColor=colors.HexColor("#9B6924"), spaceBefore=9, spaceAfter=5, keepWithNext=True)
    body = ParagraphStyle("Body", fontName=PDF_FONT, fontSize=9, leading=14, textColor=colors.HexColor("#1F2937"), spaceAfter=5)
    small = ParagraphStyle("Small", fontName=PDF_FONT, fontSize=8, leading=13, textColor=colors.HexColor("#66788A"))
    story = [Paragraph(escape(guide["title"]), title), Paragraph(escape(guide["lead"]), lead)]
    for head, paragraphs in guide["sections"]:
        if slug == "sspecos" and head.startswith("C — Context"):
            story.append(PageBreak())
        story.append(Paragraph(escape(head), heading))
        story.extend(Paragraph(escape(text), body) for text in paragraphs)
    story.extend([Spacer(1, 9), Paragraph("참고 자료: " + escape(guide["source"]), small), Paragraph(escape(guide["source_url"]), small)])

    def decorate(canvas, doc):
        canvas.saveState()
        w, h = A4
        canvas.setStrokeColor(colors.HexColor("#D4AA61"))
        canvas.line(21*mm, h-16*mm, w-21*mm, h-16*mm)
        canvas.setFont(PDF_FONT, 8)
        canvas.setFillColor(colors.HexColor("#9B6924"))
        canvas.drawString(21*mm, h-13*mm, "PROMPT ENGINEERING · GOLDEN KEY")
        canvas.setStrokeColor(colors.HexColor("#DCE2E9"))
        canvas.line(21*mm, 17*mm, w-21*mm, 17*mm)
        canvas.setFont(PDF_FONT, 7.7)
        canvas.setFillColor(colors.HexColor("#66788A"))
        canvas.drawString(21*mm, 12*mm, guide["short"])
        canvas.drawRightString(w-21*mm, 12*mm, str(doc.page))
        canvas.restoreState()

    pdf.build(story, onFirstPage=decorate, onLaterPages=decorate)


(ROOT / "guide.css").write_text(CSS, encoding="utf-8")
for slug, guide in GUIDES.items():
    (ROOT / f"{slug}.html").write_text(page_html(slug, guide), encoding="utf-8")
    make_pdf(slug, guide)
    print(f"{slug}: HTML and PDF created")
