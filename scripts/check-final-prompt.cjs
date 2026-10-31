const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const source = fs.readFileSync(require('node:path').join(__dirname,'../dist/app.js'),'utf8');
const code = source.slice(source.indexOf('const guidedNames='),source.indexOf('\nfunction persist()'));
const sample = [
  '## S — 명확성과 구체성\n양식에 자동으로 자료 채우기',
  '## S — 구조화와 구분자\n엑셀, 워드, 한글hwp, 파워포인트 등 양식을 입력하고 자료 파일을 첨부',
  '## P — 역할과 페르소나\n경영실무자',
  '## E — 예시 제공\n입력된 양식과 동일한 양식',
  '## C — 맥락 제공\n수동 입력 작업이 많은 사무직',
  '## O — 출력 형식 지정\n미정 — 필요한 정보는 확인해 주세요.',
  '## S — 단계적 점검\n폼 입력, 자료 첨부'
].join('\n\n');
const context = {
  field:{value:sample}, enhancements:Array(7).fill(''), english:false,
  stripTrigger:value=>value, documentType:()=> 'general', methodology:()=> 'sspecos',
  documentNames:{general:'일반 프롬프트'}, documentNamesEn:{general:'general prompt'},
  documentGuidance:()=>'',pmGuidance:()=>'',specGuidance:()=>''
};
vm.createContext(context);
vm.runInContext(`${code}\nthis.buildPrompt=buildPrompt;`,context);
let result = context.buildPrompt();
assert.match(result,/## 요청\n양식에 자동으로 자료 채우기/);
assert.match(result,/## 입력 자료와 처리 방식\n엑셀/);
assert.match(result,/## 역할\n경영실무자/);
assert.match(result,/## 처리 기준\n첨부한 자료에서 양식의 각 항목에 해당하는 값을 찾아 채워 주세요/);
assert.match(result,/원본 양식의 항목, 순서와 서식을 유지/);
assert.match(result,/파일을 직접 수정할 수 없는 환경이라면/);
assert.doesNotMatch(result,/SSPECOS|## [SPECOS] —|미정|7가지 황금키/);
assert.equal((result.match(/양식에 자동으로 자료 채우기/g)||[]).length,1);
context.enhancements[0]='원래 양식을 유지하면서 채울 항목을 확인하세요.';
result=context.buildPrompt();
assert.match(result,/## 추가 지침\n원래 양식을 유지하면서 채울 항목을 확인하세요\./);
assert.doesNotMatch(result,/1\. S|Specificity and Clarity/);
context.field.value='제조업 고객에게 보낼 제안 이메일을 작성해 줘.';
result=context.buildPrompt();
assert.match(result,/## 요청\n제조업 고객에게 보낼 제안 이메일을 작성해 줘\./);
assert.doesNotMatch(result,/SSPECOS|## S —/);
console.log('최종 프롬프트 생성 검증 통과');
