const principles = [
  {code:'S',ko:'명확성과 구체성', en:'Specificity and Clarity', desc:'목표와 대상을 분명하게', detect:s=>/(작성|만들|설명|분석|비교|추천|요약|정리|계획|제안|write|create|explain|analy[sz]e|compare|summari[sz]e|draft)/i.test(s)&&s.length>14},
  {code:'S',ko:'구조화와 구분자', en:'Structure and Delimiters', desc:'정보의 경계를 구분해', detect:s=>/\n|:|：|```|\[.+\]|<[^>]+>|①|1[.)]/.test(s)},
  {code:'P',ko:'역할과 페르소나', en:'Persona and Role', desc:'누가 답할지 설정해', detect:s=>/(역할|전문가|담당자|컨설턴트|편집자|강사|작가|마케터|당신은|너는|act as|you are|as a |expert|consultant)/i.test(s)},
  {code:'E',ko:'예시 제공', en:'Examples', desc:'원하는 방향을 보여줘', detect:s=>/(예시|예를 들|샘플|참고|다음과 같이|example|for instance|sample|such as)/i.test(s)},
  {code:'C',ko:'맥락 제공', en:'Context', desc:'배경과 대상을 알려줘', detect:s=>/(대상|배경|목적|상황|고객|독자|청중|업계|산업|위해|관한|초보|기존|context|audience|background|for |about |customer)/i.test(s)},
  {code:'O',ko:'출력 형식 지정', en:'Output Format', desc:'결과의 형태를 지정해', detect:s=>/(형식|표로|목록|단계|글자|분량|마크다운|이메일|보고서|제안서|문단|슬라이드|JSON|CSV|format|table|bullet|email|report|words|markdown)/i.test(s)},
  {code:'S',ko:'단계적 사고 유도', en:'Step-by-step Reasoning', desc:'점검 순서를 정해', detect:s=>/(단계별|순서대로|먼저|검토한 뒤|근거|기준|과정|step.by.step|first|then|reason|criteria)/i.test(s)}
];
const $ = id => document.getElementById(id);
const field = $('prompt');
const alertBox = $('alert');
const STORAGE_KEY = 'golden-key-history-v1';
let history = [];
let currentId = null;
let currentPrompt = '';
let generatedPrompt = '';
let finalEdited = false;
let enhancements = Array(7).fill('');
let originalChecks = Array(7).fill(false);
let english = false;
let ocrWorker = null;

try { const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); if(Array.isArray(parsed)) history = parsed.filter(x=>x && typeof x.source==='string').slice(0,30); } catch {}

$('keys-grid').innerHTML = principles.map(p=>`<article class="key-card reveal"><div class="letter">${p.code}</div><p class="english">${p.en}</p><h3>${p.ko}</h3><p>${p.desc}</p></article>`).join('');
const observer = 'IntersectionObserver' in window ? new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('is-visible');observer.unobserve(e.target)}}),{threshold:.08}) : null;
document.querySelectorAll('.reveal').forEach(el=>observer?observer.observe(el):el.classList.add('is-visible'));

function displayMessage(message){alertBox.textContent=message;alertBox.classList.add('show')}
function clearMessage(){alertBox.classList.remove('show')}
function isEnglish(s){return (s.match(/[A-Za-z]/g)||[]).length > (s.match(/[가-힣]/g)||[]).length*1.5}
function stripTrigger(s){return s.replace(/(?:황금키|golden\s*key)[,，:：\s-]*/gi,'').trim().replace(/^[,，:：\s-]+|[,，:：\s-]+$/g,'')}
function blocked(s){return /(책|소설|기사|가사|논문|대본|영화|방송|유료|저작물|book|novel|article|lyrics|paper|screenplay|paywall|copyrighted).{0,35}(전체|전문|그대로|무단|복제|재현|full text|entire|verbatim|pirat)/i.test(s)||/(전체|전문|그대로|무단|복제|재현|full text|entire|verbatim|pirat).{0,35}(책|소설|기사|가사|논문|대본|영화|방송|유료|저작물|book|novel|article|lyrics|paper|screenplay|paywall|copyrighted)/i.test(s)}

function autoText(i,task,en){
  const ko=[
    '요청한 작업의 목표와 대상을 기준으로 실행 가능한 결과를 완성하세요. 꼭 필요한 범위가 불명확하면 짧게 확인해 주세요.',
    '요청·배경·제약 조건·출력 형식을 각각 제목으로 구분하고, 제공 자료가 있다면 별도 구분자 안에서만 참고하세요.',
    '이 주제의 실무 전문가 역할로 답하고, 독자의 이해 수준에 맞는 어휘를 선택하세요.',
    '제공된 예시가 있다면 그 구성과 표현을 참고하고, 결과에는 핵심 내용과 활용 전 확인할 사항을 담으세요.',
    '목적은 이 요청을 실제로 활용하는 것입니다. 독자가 지정되지 않았다면 일반 독자를 가정하고, 확인되지 않은 배경은 사실처럼 쓰지 마세요.',
    '제목과 소제목이 있는 마크다운으로 작성하고, 필요한 항목은 짧은 목록이나 표로 정리하세요.',
    '먼저 목표와 조건을 확인하고, 다음으로 내용을 구성한 뒤, 마지막으로 누락·정확성·사용 가능성을 점검하세요. 내부 사고 과정은 노출하지 마세요.'
  ];
  const englishText=[
    'Complete the requested work as an actionable result for its intended audience. Briefly clarify any essential gap in scope.',
    'Separate the request, background, constraints, and output format with headings. Treat supplied material as reference data in its own delimited block.',
    'Respond as a practitioner with relevant expertise and use language appropriate for the intended reader.',
    'Follow any supplied examples for structure and wording, and include the key result and items to verify before use.',
    'The purpose is practical use. If no audience is specified, assume a general reader; do not present missing background as fact.',
    'Use Markdown headings and concise lists or tables where they make the result easier to use.',
    'First confirm the goal and constraints, then organize and draft, and finally check completeness, accuracy, and usability. Do not reveal private chain-of-thought.'
  ];
  return (en?englishText:ko)[i];
}

const documentNames={marketing:'마케팅 자료',plan:'기획서',proposal:'제안서',report:'보고서',general:'일반 프롬프트'};
const documentNamesEn={marketing:'marketing material',plan:'plan',proposal:'proposal',report:'report',general:'general prompt'};
const methodNames={pm:'PM Skills',spec:'Spec Kit',both:'PM + Spec Kit',sspecos:'SSPECOS'};
function detectDocumentType(task){
  if(/보고서|리포트|분석 보고|report\b/i.test(task))return 'report';
  if(/제안서|입찰|사업 제안|proposal\b|pitch deck/i.test(task))return 'proposal';
  if(/기획서|사업계획|실행계획|운영계획|planning document|project plan/i.test(task))return 'plan';
  if(/마케팅|캠페인|홍보물|광고|브랜드 전략|콘텐츠 전략|marketing|campaign|go.to.market/i.test(task))return 'marketing';
  return 'general';
}
function documentType(){return $('document-type').value==='auto'?detectDocumentType(stripTrigger(field.value.trim())):$('document-type').value}
function methodology(type){
  if($('methodology').value!=='auto')return $('methodology').value;
  return ({marketing:'pm',plan:'both',proposal:'both',report:'pm',general:'sspecos'})[type];
}
function updateMethodNote(){
  const type=documentType(),method=methodology(type);
  const typed=$('document-type').value==='auto'?'자동 감지':'선택됨';
  const chosen=$('methodology').value==='auto'?'자동 추천':'선택됨';
  $('method-note').textContent=`${typed}: ${documentNames[type]} · ${chosen}: ${methodNames[method]}`;
}
function documentGuidance(type,en){
  const ko={
    marketing:'대상 고객의 문제·핵심 메시지·차별점·채널별 콘텐츠·행동 유도·성과 지표를 포함한 실제 사용 가능한 마케팅 자료를 작성하세요. 매체와 브랜드 톤이 지정되면 그대로 따르세요.',
    plan:'배경·목표·대상·범위·실행 방법·일정/담당·예산/자원(제공된 경우)·성과 기준·위험과 대응을 담은 의사결정용 기획서를 작성하세요.',
    proposal:'상대의 과제·제안 가치·차별화 근거·수행 범위·단계별 실행·기대 성과·일정/비용(제공된 경우)·검증할 가정을 담은 제출 가능한 제안서를 작성하세요.',
    report:'조사 목적·핵심 요약·방법/자료·확인된 사실·분석·시사점·실행 권고·한계/확인 필요 사항을 구분한 보고서를 작성하세요. 수치와 출처를 지어내지 마세요.',
    general:'요청된 결과물을 바로 사용할 수 있는 형태로 완성하세요.'
  };
  const eng={
    marketing:'Produce usable marketing material covering target pain points, core message, differentiation, channel-specific content, call to action, and success metrics. Follow any specified medium and brand voice.',
    plan:'Write a decision-ready plan covering background, goals, audience, scope, approach, schedule and owners, budget/resources if supplied, success criteria, and risks with mitigations.',
    proposal:'Write a submission-ready proposal covering the recipient’s problem, value proposition, evidence of differentiation, scope, phased delivery, expected outcomes, schedule/cost if supplied, and assumptions to validate.',
    report:'Write a report separating purpose, executive summary, method/sources, verified findings, analysis, implications, recommendations, and limitations or facts to confirm. Never invent figures or sources.',
    general:'Deliver the requested work in a directly usable form.'
  };
  return (en?eng:ko)[type];
}
function pmGuidance(type,en){
  const focus={
    marketing:['GTM Strategy, Marketing Ideas, Positioning Ideas','고객 세그먼트와 가치 제안을 먼저 정하고, 채널별 메시지·실행안·측정 지표를 연결하세요.','Define the customer segment and value proposition, then connect channel messages, actions, and measurable outcomes.'],
    plan:['Create PRD, Strategy Red-Team','문제·사용자·목표·범위·성공 기준을 정하고 핵심 가정과 우선순위를 점검하세요. 실행 가능성과 반론을 검토하세요.','Define the problem, users, goals, scope, and success criteria. Test key assumptions, priorities, feasibility, and objections.'],
    proposal:['Value Proposition, Competitor Analysis, Strategy Red-Team','상대의 문제와 차별화된 해법을 연결하고, 근거·실행 가능성·예상 반론을 검토하세요. 경쟁 정보가 없으면 비교를 꾸며내지 마세요.','Connect the recipient’s problem to differentiated value; check evidence, feasibility, and likely objections. Do not invent competitor claims.'],
    report:['Competitor Analysis, SWOT Analysis','자료의 신뢰도와 관찰·해석을 구분하고, 핵심 발견에서 권고안까지 근거를 연결하세요. 경쟁·SWOT 분석은 주제에 맞을 때만 사용하세요.','Separate source quality, observations, and interpretation; link findings to recommendations. Use competitor or SWOT analysis only when relevant.'],
    general:['PM Skills','대상·문제·목표·근거·실행 방안을 점검하고 필요한 PM 프레임만 적용하세요.','Check audience, problem, goals, evidence, and actions; apply only relevant PM frameworks.']
  }[type];
  return en?`## PM Skills approach (${focus[0]})\n${focus[2]} These are embedded document-writing instructions; do not claim the original tool ran.`:`## PM Skills 적용 (${focus[0]})\n${focus[1]} 이는 문서 작성용으로 반영한 지침이며 원본 스킬이 실행되었다고 주장하지 마세요.`;
}
function specGuidance(en){
  return en?`## Spec Kit approach adapted for documents\n1. Specify: define the reader, purpose, required content, constraints, and measurable success criteria (what and why).\n2. Clarify: identify only consequential ambiguities; ask up to three essential questions if the document cannot be completed, otherwise state reasonable assumptions.\n3. Plan: choose the document structure, evidence, and feasible delivery approach.\n4. Tasks: turn the plan into concrete actions, owners, or checkpoints only where the document calls for them.\n5. Analyze: check the final document against the requirements, evidence, constraints, and success criteria; repair gaps before presenting it.\nOutput the finished document, not merely these process notes. Do not claim the Spec Kit CLI or skills actually ran.`:`## Spec Kit 문서 적용\n1. Specify: 독자·목적·필수 내용·제약·측정 가능한 성공 기준(무엇과 왜)을 정의하세요.\n2. Clarify: 결과에 영향을 주는 모호성을 확인하세요. 작성이 불가능할 때만 핵심 질문을 최대 3개 하고, 그 외에는 합리적 가정을 표시하세요.\n3. Plan: 문서 구성·필요 근거·실행 방안을 계획하세요.\n4. Tasks: 문서 성격에 필요할 때만 실행 항목·담당·점검 시점을 구체화하세요.\n5. Analyze: 완성 문서와 요구·근거·제약·성공 기준의 일치 여부를 점검하고 빠진 부분을 수정하세요.\n과정 메모만 나열하지 말고 완성된 문서를 제시하세요. Spec Kit 도구나 스킬을 실제 실행했다고 주장하지 마세요.`;
}

const guidedNames=['명확성과 구체성','구조화와 구분자','역할과 페르소나','예시 제공','맥락 제공','출력 형식 지정','단계적 점검'];
function parseGuidedDraft(task){
  const matches=[...task.matchAll(/^##\s*(?:[SPECOS]\s*[—–-]\s*)?(명확성과 구체성|구조화와 구분자|역할과 페르소나|예시 제공|맥락 제공|출력 형식 지정|단계적 점검)\s*$/gm)];
  if(matches.length!==7||matches.some((match,i)=>match[1]!==guidedNames[i]))return null;
  if(task.slice(0,matches[0].index).trim())return null;
  return matches.map((match,i)=>{
    const value=task.slice(match.index+match[0].length,i<6?matches[i+1].index:task.length).trim();
    return /^미정\s*[—–-]\s*필요한 정보는 확인해 주세요\.?$/.test(value)?'':value;
  });
}
function buildPrompt(){
  const task=stripTrigger(field.value.trim());
  const guided=parseGuidedDraft(task);
  const sections=[];
  if(guided){
    const headings=['요청','입력 자료와 처리 방식','역할','참고 예시','사용 맥락','결과 형식','작업 순서와 검토 기준'];
    guided.forEach((value,i)=>{if(value)sections.push(`## ${headings[i]}\n${value}`)});
    if(!guided[0])sections.unshift('## 요청\n수행할 작업 목표를 먼저 확인해 주세요.');
  }else sections.push(`## ${english?'Request':'요청'}\n${task}`);
  const additions=enhancements.map(value=>value.trim()).filter(Boolean);
  if(additions.length)sections.push(`## ${english?'Additional instructions':'추가 지침'}\n${additions.join('\n\n')}`);
  const type=documentType(),method=methodology(type);
  if(type!=='general'||method!=='sspecos')sections.push(`## ${english?'Deliverable':'결과물'}: ${english?documentNamesEn[type]:documentNames[type]}\n${documentGuidance(type,english)}`);
  if(method==='pm'||method==='both')sections.push(pmGuidance(type,english));
  if(method==='spec'||method==='both')sections.push(specGuidance(english));
  sections.push(english
    ? '## Final check\nProduce the requested result in the language of the input. Keep supplied facts and assumptions distinct, and do not invent missing data. If current facts are necessary and research tools are available, verify them with sources.'
    : '## 최종 점검\n요청한 결과물을 입력 언어로 작성하세요. 제공된 사실과 가정을 구분하고 빠진 자료를 지어내지 마세요. 최신 정보가 필요하고 조사 도구가 있다면 출처를 확인하세요.');
  return sections.join('\n\n').replace(/\bSSPECOS\b/gi,'').replace(/[ \t]+\n/g,'\n');
}

function persist(){
  if(!currentId)return;
  const item={id:currentId,source:field.value.trim(),documentType:$('document-type').value,methodology:$('methodology').value,enhancements:enhancements.slice(),finalPrompt:currentPrompt,finalEdited};
  history=[item,...history.filter(x=>x.id!==currentId)].slice(0,30);
  try{localStorage.setItem(STORAGE_KEY,JSON.stringify(history))}catch{displayMessage('이 브라우저의 저장 공간에 기록을 저장하지 못했습니다.')}
  renderHistory();
}
function renderHistory(){
  const list=$('history-list');list.replaceChildren();
  if(!history.length){const empty=document.createElement('p');empty.className='history-empty';empty.textContent='아직 저장된 작업이 없습니다. 프롬프트를 생성하면 여기에 표시됩니다.';list.append(empty);return}
  history.forEach(item=>{
    const article=document.createElement('article');article.className='history-item';
    const p=document.createElement('p');p.textContent=item.source;
    const meta=document.createElement('small');meta.className='history-meta';const type=item.documentType&&item.documentType!=='auto'?item.documentType:detectDocumentType(item.source);const method=item.methodology&&item.methodology!=='auto'?item.methodology:({marketing:'pm',plan:'both',proposal:'both',report:'pm',general:'sspecos'})[type];meta.textContent=`${documentNames[type]||documentNames.general} · ${methodNames[method]||methodNames.sspecos}`;
    const actions=document.createElement('div');actions.className='history-actions';
    const load=document.createElement('button');load.className='mini-button';load.type='button';load.textContent='불러와 편집';
    load.addEventListener('click',()=>{currentId=item.id;$('document-type').value=documentNames[item.documentType]?item.documentType:'auto';$('methodology').value=['pm','spec','both','sspecos'].includes(item.methodology)?item.methodology:'auto';field.value=item.source;field.dispatchEvent(new Event('input'));enhancements=Array.isArray(item.enhancements)?Array.from({length:7},(_,i)=>String(item.enhancements[i]||'')):Array(7).fill('');if(generate(false)&&typeof item.finalPrompt==='string')restoreFinal(item.finalPrompt);$('generator').scrollIntoView({behavior:'smooth'});field.focus()});
    const remove=document.createElement('button');remove.className='mini-button danger';remove.type='button';remove.textContent='삭제';
    remove.addEventListener('click',()=>{history=history.filter(x=>x.id!==item.id);if(currentId===item.id)currentId=null;try{localStorage.setItem(STORAGE_KEY,JSON.stringify(history))}catch{}renderHistory()});
    actions.append(load,remove);article.append(p,meta,actions);list.append(article);
  });
}

function renderAnalysis(){
  const checks=principles.map((_,i)=>originalChecks[i]||Boolean(enhancements[i].trim()));
  const count=checks.filter(Boolean).length;
  $('score').innerHTML=`${count}<small> / 7 ${english?'met':'충족'}</small>`;
  document.querySelector('.score-caption').textContent=english?'Principles addressed in the draft and edits':'입력과 보완에서 충족된 원칙';
  $('result-title').textContent=english?'Analysis & final prompt':'분석과 최종 프롬프트';
  const list=$('analysis-list');list.replaceChildren();
  principles.forEach((p,i)=>{
    const li=document.createElement('li');const main=document.createElement('div');main.className='analysis-main';
    const name=document.createElement('span');name.className='principle-name';
    const label=document.createElement('span');label.textContent=`${p.code} · ${english?p.en:p.ko}`;
    const full=document.createElement('small');full.textContent=english?p.ko:p.en;name.append(label,full);
    const state=document.createElement('strong');state.className=checks[i]?'met':'missing';state.textContent=checks[i]?(english?'Met':'충족'):(english?'To improve':'보완');
    main.append(name,state);li.append(main);
    if(enhancements[i]){const preview=document.createElement('p');preview.className='enhancement-preview';preview.textContent=enhancements[i];li.append(preview)}
    const actions=document.createElement('div');actions.className='analysis-actions';
    const auto=document.createElement('button');auto.type='button';auto.className='mini-button';auto.textContent=english?'Auto improve':'자동 보완';
    auto.addEventListener('click',()=>{enhancements[i]=autoText(i,stripTrigger(field.value.trim()),english);refresh()});
    const manual=document.createElement('button');manual.type='button';manual.className='mini-button';manual.textContent=english?'Write/edit':'직접 작성·편집';
    manual.addEventListener('click',()=>{
      const existing=li.querySelector('.editor');if(existing){existing.remove();return}
      const editor=document.createElement('div');editor.className='editor';const label=document.createElement('label');const id=`principle-${i}`;label.htmlFor=id;label.textContent=english?`How should the prompt address ${p.en}?`:`${p.ko}에 적용할 내용을 작성하세요`;
      const textarea=document.createElement('textarea');textarea.id=id;textarea.value=enhancements[i];textarea.maxLength=1200;
      const save=document.createElement('button');save.type='button';save.className='mini-button';save.textContent=english?'Apply':'적용';
      save.addEventListener('click',()=>{if(!textarea.value.trim()){textarea.focus();return}enhancements[i]=textarea.value.trim();refresh()});
      editor.append(label,textarea,save);li.append(editor);textarea.focus();
    });
    actions.append(auto,manual);li.append(actions);list.append(li);
  });
}
function refresh(){
  renderAnalysis();
  const next=buildPrompt();
  if(!finalEdited){currentPrompt=next;$('edit-status').textContent=''}
  else{
    const before=generatedPrompt.split('\n'),after=next.split('\n');let prefix=0,suffix=0,applied=false;
    while(prefix<Math.min(before.length,after.length)&&before[prefix]===after[prefix])prefix++;
    while(suffix<Math.min(before.length-prefix,after.length-prefix)&&before[before.length-1-suffix]===after[after.length-1-suffix])suffix++;
    const oldPart=before.slice(prefix,before.length-suffix).join('\n');
    const newPart=after.slice(prefix,after.length-suffix).join('\n');
    if(oldPart&&currentPrompt.includes(oldPart)){currentPrompt=currentPrompt.replace(oldPart,newPart);applied=true}
    else if(!oldPart&&newPart){const right=before.slice(before.length-suffix).join('\n');if(right&&currentPrompt.includes(right)){currentPrompt=currentPrompt.replace(right,`${newPart}\n${right}`);applied=true}}
    else if(next===generatedPrompt)applied=true;
    $('edit-status').textContent=applied?'선택한 방법론과 원칙을 편집한 프롬프트에 반영했습니다.':'직접 수정한 부분과 겹쳐 자동 반영하지 못했습니다. 내용을 확인하거나 다시 생성을 눌러 주세요.';
  }
  generatedPrompt=next;$('final-prompt').value=currentPrompt;persist();
}
function restoreFinal(text){
  currentPrompt=text.slice(0,50000);finalEdited=currentPrompt!==generatedPrompt;
  $('final-prompt').value=currentPrompt;
  $('edit-status').textContent=finalEdited?'직접 편집한 최종 프롬프트를 불러왔습니다.':'';
  persist();
}

function generate(scroll=true){
  const raw=field.value.trim();if(!raw){displayMessage('초안 프롬프트를 입력하거나 캡처 이미지를 붙여넣어 주세요.');field.focus();return false}
  if(blocked(raw)){displayMessage('이 질문에는 저작권 또는 법적으로 제한된 자료가 포함되어 있을 수 있으므로 답변해 드릴 수 없습니다.');$('results').hidden=true;return false}
  clearMessage();const task=stripTrigger(raw);english=isEnglish(task);originalChecks=principles.map(p=>p.detect(task));finalEdited=false;generatedPrompt='';updateMethodNote();
  if(!currentId)currentId=typeof crypto.randomUUID==='function'?crypto.randomUUID():String(Date.now()+Math.random());
  $('results').hidden=false;refresh();
  if(scroll)$('results').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'start'});
  return true;
}

field.addEventListener('guided-draft:apply',event=>{
  const draft=event.detail?.draft;
  if(typeof draft!=='string'||!draft.trim()||draft.length>10000)return;
  currentId=null;currentPrompt='';generatedPrompt='';finalEdited=false;
  enhancements=Array(7).fill('');originalChecks=Array(7).fill(false);
  $('results').hidden=true;$('final-prompt').value='';
  for(const id of ['load-status','edit-status','save-status'])$(id).textContent='';
  field.value=draft;field.dispatchEvent(new Event('input'));
  $('draft-status').textContent='7가지 답변으로 초안을 채웠습니다. 내용을 확인한 뒤 황금키 생성을 누르세요.';
});
field.addEventListener('input',()=>{$('count').textContent=`${field.value.length.toLocaleString()} / 10,000`;clearMessage();$('draft-status').textContent='';updateMethodNote()});
for(const id of ['document-type','methodology'])$(id).addEventListener('change',()=>{updateMethodNote();if(!$('results').hidden)refresh()});
$('generate').addEventListener('click',()=>generate());
$('sample').addEventListener('click',()=>{currentId=null;enhancements=Array(7).fill('');field.value='제조업 고객에게 보낼 머신비전 검사 제안 이메일을 작성해줘. 고객은 기존 수작업 검사에서 불량 누락을 줄이고 싶어 해.';field.dispatchEvent(new Event('input'));field.focus()});
$('new-work').addEventListener('click',()=>{currentId=null;enhancements=Array(7).fill('');$('document-type').value='auto';$('methodology').value='auto';field.value='';field.dispatchEvent(new Event('input'));$('results').hidden=true;field.focus()});
$('final-prompt').addEventListener('input',()=>{currentPrompt=$('final-prompt').value;finalEdited=currentPrompt!==generatedPrompt;$('edit-status').textContent=finalEdited?'직접 편집한 내용이 이 브라우저 기록에 저장됩니다.':'';persist()});
$('regenerate-final').addEventListener('click',()=>{
  if(finalEdited&&!window.confirm('직접 수정한 최종 프롬프트를 선택한 방법론에 따라 다시 생성하시겠습니까?'))return;
  finalEdited=false;currentPrompt=buildPrompt();generatedPrompt=currentPrompt;$('final-prompt').value=currentPrompt;
  $('edit-status').textContent='선택한 방법론을 적용해 다시 생성했습니다.';persist();
});
$('copy').addEventListener('click',async()=>{if(!currentPrompt)return;try{await navigator.clipboard.writeText(currentPrompt);$('copy').textContent='복사 완료';setTimeout(()=>$('copy').textContent='프롬프트 복사',2200)}catch{const editor=$('final-prompt');editor.focus();editor.select();$('copy').textContent='선택됨 · 직접 복사';setTimeout(()=>$('copy').textContent='프롬프트 복사',2600)}});

async function savePromptFile(){
  if(!currentPrompt.trim()){$('save-status').textContent='저장할 최종 프롬프트를 입력해 주세요.';return}
  const filename='황금키_프롬프트.json';
  const data={kind:'sspecos-golden-key-prompt',schemaVersion:2,source:field.value.trim(),documentType:$('document-type').value,methodology:$('methodology').value,enhancements:enhancements.slice(),finalPrompt:currentPrompt,finalEdited};
  const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});
  $('save-status').textContent='';
  if(typeof window.showSaveFilePicker==='function'){
    try{
      const handle=await window.showSaveFilePicker({suggestedName:filename,types:[{description:'황금키 프롬프트 JSON',accept:{'application/json':['.json']}}]});
      const writable=await handle.createWritable();await writable.write(blob);await writable.close();
      $('save-status').textContent='선택한 위치에 저장했습니다.';return;
    }catch(error){if(error?.name==='AbortError')return;$('save-status').textContent='위치 선택 저장을 사용할 수 없어 다른 저장 방법을 엽니다.'}
  }
  try{
    const file=new File([blob],filename,{type:'application/json'});
    if(navigator.canShare?.({files:[file]}) && navigator.share){
      await navigator.share({files:[file],title:'프롬프트 엔지니어링 황금키'});
      $('save-status').textContent='기기의 공유 메뉴로 파일을 전달했습니다.';return;
    }
  }catch(error){if(error?.name==='AbortError')return}
  const url=URL.createObjectURL(blob);const link=document.createElement('a');link.href=url;link.download=filename;document.body.append(link);link.click();link.remove();
  setTimeout(()=>URL.revokeObjectURL(url),60000);
  $('save-status').textContent='파일 다운로드를 시작했습니다. 저장 위치는 브라우저 설정에서 선택할 수 있습니다.';
}
$('save-file').addEventListener('click',savePromptFile);

$('load-file').addEventListener('click',()=>$('prompt-file').click());
$('prompt-file').addEventListener('change',async event=>{
  const file=event.target.files?.[0];event.target.value='';if(!file)return;
  if(file.size>1024*1024){displayMessage('1MB 이하의 JSON, TXT 또는 MD 파일을 선택해 주세요.');return}
  try{
    const text=await file.text();let source,restored=Array(7).fill(''),savedFinal=null,restoredType='auto',restoredMethod='auto';
    if(file.name.toLowerCase().endsWith('.json')){
      const parsed=JSON.parse(text);
      if(!parsed||typeof parsed.source!=='string')throw new Error('JSON 파일에 초안이 없습니다.');
      source=parsed.source;
      if(Array.isArray(parsed.enhancements))restored=Array.from({length:7},(_,i)=>typeof parsed.enhancements[i]==='string'?parsed.enhancements[i].slice(0,1200):'');
      if(typeof parsed.finalPrompt==='string')savedFinal=parsed.finalPrompt;
      if(documentNames[parsed.documentType])restoredType=parsed.documentType;
      if(['pm','spec','both','sspecos'].includes(parsed.methodology))restoredMethod=parsed.methodology;
    }else if(/\.(txt|md)$/i.test(file.name)){source=text}
    else throw new Error('JSON, TXT 또는 MD 파일만 열 수 있습니다.');
    if(!source.trim()||source.length>10000)throw new Error('초안은 1~10,000자로 입력해 주세요.');
    currentId=null;enhancements=restored;$('document-type').value=restoredType;$('methodology').value=restoredMethod;field.value=source;field.dispatchEvent(new Event('input'));
    if(!generate(false))throw new Error(alertBox.textContent);
    if(savedFinal!==null)restoreFinal(savedFinal);
    $('load-status').textContent='파일을 불러왔습니다. 초안, 문서 유형, 방법론과 SSPECOS 보완 내용을 편집할 수 있습니다.';
    $('generator').scrollIntoView({behavior:'smooth'});field.focus();
  }catch(error){displayMessage(error.message||'파일을 읽지 못했습니다.');$('load-status').textContent=''}
});

async function readImage(file){
  if(!file||!file.type.startsWith('image/')){displayMessage('PNG, JPG 등 이미지 파일을 선택해 주세요.');return}
  if(file.size>15*1024*1024){displayMessage('15MB 이하 이미지를 사용해 주세요.');return}
  const status=$('ocr-status');status.classList.remove('error');status.textContent='캡처 이미지에서 글자를 읽고 있습니다…';
  try{
    if(!window.Tesseract)throw new Error('글자 인식 기능을 불러오지 못했습니다.');
    if(!ocrWorker)ocrWorker=await Tesseract.createWorker('kor+eng',1,{workerPath:'/ocr/worker.min.js',corePath:'/ocr/core/',langPath:'/ocr/lang/',logger:m=>{if(m.status==='recognizing text')status.textContent=`글자 추출 중… ${Math.round((m.progress||0)*100)}%`}});
    const result=await ocrWorker.recognize(file);const extracted=(result.data.text||'').trim();
    if(!extracted){status.textContent='글자를 찾지 못했습니다. 선명한 캡처로 다시 시도해 주세요.';status.classList.add('error');return}
    const available=10000-field.value.length;field.value=(field.value?field.value.trim()+'\n\n':'')+extracted.slice(0,Math.max(0,available-2));field.dispatchEvent(new Event('input'));field.focus();
    status.textContent='글자를 추출했습니다. 내용을 확인하고 황금키 생성을 누르세요.';
  }catch(err){status.textContent='이미지 글자 추출에 실패했습니다. 다른 이미지를 시도하거나 내용을 직접 입력해 주세요.';status.classList.add('error');console.error('OCR error',err)}
}
$('image-upload').addEventListener('change',e=>{const file=e.target.files?.[0];if(file)readImage(file);e.target.value=''});
field.addEventListener('paste',e=>{const item=[...(e.clipboardData?.items||[])].find(x=>x.type.startsWith('image/'));if(item){e.preventDefault();readImage(item.getAsFile())}});

if(document.modelContext?.registerTool){
  try{Promise.resolve(document.modelContext.registerTool({name:'generate_golden_key_prompt',title:'황금키 프롬프트 생성',description:'Analyze any draft prompt against seven principles and show a revised copyable prompt in the page.',inputSchema:{type:'object',properties:{prompt:{type:'string',minLength:1,maxLength:10000}},required:['prompt'],additionalProperties:false},annotations:{readOnlyHint:false,untrustedContentHint:true},execute(input){if(typeof input?.prompt!=='string'||!input.prompt.trim()||input.prompt.length>10000)throw new Error('Enter a draft prompt of 1–10,000 characters.');currentId=null;enhancements=Array(7).fill('');field.value=input.prompt;field.dispatchEvent(new Event('input'));if(!generate(false))throw new Error(alertBox.textContent);return {analysis:principles.map((p,i)=>({principle:p.ko,status:originalChecks[i]?'met':'to improve'})),finalPrompt:currentPrompt}}})).catch(()=>{})}catch{}
}
updateMethodNote();
renderHistory();
