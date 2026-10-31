(() => {
  const dialog = document.getElementById('guided-dialog');
  const launch = document.getElementById('guided-launch');
  const answer = document.getElementById('guided-answer');
  const byId = id => document.getElementById(id);
  const questions = [
    {name:'명확성과 구체성', question:'어떤 일을 AI에게 부탁하고 싶으세요?', help:'만들 결과물과 목표를 구체적으로 알려 주세요. 아직 정하지 못했다면 건너뛰고 나중에 채울 수 있습니다.', example:'제조업 고객에게 머신비전 검사 도입을 제안하는 이메일을 작성하고 싶어요.'},
    {name:'구조화와 구분자', question:'내용을 어떻게 나누고, 어떤 자료를 참고하면 좋을까요?', help:'요청·참고 자료·필수 조건을 구분해 적어 주세요. 자료가 없다면 건너뛰어도 됩니다.', example:'요청과 참고 자료를 구분해 주세요. 구성은 고객 문제 → 제안 → 다음 행동 순서로 해 주세요.'},
    {name:'역할과 페르소나', question:'AI가 어떤 역할이나 관점으로 답하면 좋을까요?', help:'필요한 전문 분야와 말투를 적어 주세요.', example:'제조업 현장을 이해하는 기술 영업 담당자로서, 전문적이면서 친근한 말투로 작성해 주세요.'},
    {name:'예시 제공', question:'원하는 결과와 비슷한 예시가 있나요?', help:'참고 문장이나 마음에 드는 표현, 구성 예시를 알려 주세요. 없으면 건너뛸 수 있습니다.', example:'첫 문장 예시: “현재 검사 공정에서 놓치는 불량을 줄이는 방법을 제안드립니다.”'},
    {name:'맥락 제공', question:'이 결과를 누가, 어떤 상황에서 사용하나요?', help:'독자, 사용 목적, 이미 아는 사실, 일정이나 제약을 알려 주세요.', example:'수작업 검사로 불량 누락을 겪는 중소 제조업 품질팀장에게 첫 제안으로 보냅니다. 비용은 아직 정해지지 않았어요.'},
    {name:'출력 형식 지정', question:'어떤 형식과 분량으로 받고 싶으세요?', help:'이메일·표·보고서 같은 형태, 길이, 언어와 꼭 들어갈 항목을 적어 주세요.', example:'한국어 이메일로 제목 1개와 본문 500자 이내. 마지막에는 20분 미팅을 제안해 주세요.'},
    {name:'단계적 점검', question:'어떤 순서로 작성하고, 마지막에 무엇을 확인할까요?', help:'작업 순서와 검증 기준을 정해 주세요. 내부 사고 과정 대신 결과와 확인 가능한 근거를 요청합니다.', example:'먼저 고객 문제를 확인하고 제안을 작성한 뒤, 누락과 과장 표현을 점검해 주세요. 제공하지 않은 비용이나 개선율은 만들지 마세요.'}
  ];
  const codes = ['S','S','P','E','C','O','S'];
  let answers = Array(7).fill('');
  let step = 0;
  let previousOverflow = '';

  function draftText() {
    return questions.map((q,i) => `## ${codes[i]} — ${q.name}\n${answers[i].trim() || '미정 — 필요한 정보는 확인해 주세요.'}`).join('\n\n');
  }

  function render() {
    const reviewing = step === 7;
    byId('guided-error').textContent = '';
    byId('guided-question-form').hidden = reviewing;
    byId('guided-review').hidden = !reviewing;
    byId('guided-skip').hidden = reviewing;
    byId('guided-previous').disabled = step === 0;
    byId('guided-next').textContent = reviewing ? '초안 입력란에 적용' : step === 6 ? '답변 검토하기' : '다음 질문 →';
    byId('guided-progress-label').textContent = reviewing ? '7가지 답변을 확인해 주세요' : `${step + 1} / 7 · ${questions[step].name}`;
    [...byId('guided-steps').children].forEach((el,i) => {
      el.classList.toggle('is-current', i === step);
      const visited = reviewing || i < step;
      el.classList.toggle('is-complete', visited && Boolean(answers[i].trim()));
      el.classList.toggle('is-skipped', visited && !answers[i].trim());
      el.setAttribute('aria-label',`${i+1}. ${questions[i].name}${visited ? answers[i].trim() ? ' 답변 완료' : ' 건너뜀' : ''}`);
      if (i === step) el.setAttribute('aria-current','step'); else el.removeAttribute('aria-current');
    });
    if (reviewing) {
      const draft = draftText();
      byId('guided-preview').value = draft;
      byId('guided-preview-count').textContent = `${draft.length.toLocaleString()} / 10,000자`;
      byId('guided-replace-note').hidden = !byId('prompt').value.trim();
      byId('guided-empty-note').hidden = answers.some(text => text.trim());
      byId('guided-review-title').focus();
      return;
    }
    const q = questions[step];
    byId('guided-question').textContent = q.question;
    byId('guided-question-help').textContent = q.help;
    answer.placeholder = `예: ${q.example}`;
    answer.value = answers[step];
    byId('guided-answer-count').textContent = `${answer.value.length.toLocaleString()} / 1,000자`;
    const transcript = byId('guided-transcript');
    transcript.replaceChildren();
    answers.slice(0,step).forEach((text,i) => {
      const item = document.createElement('div');
      item.className = 'guided-turn';
      const question = document.createElement('p');
      question.className = 'guided-past-question';
      question.textContent = `${codes[i]} · ${questions[i].question}`;
      const reply = document.createElement('p');
      reply.className = 'guided-reply';
      reply.textContent = text || '건너뛰었어요.';
      item.append(question,reply);
      transcript.append(item);
    });
    transcript.hidden = step === 0;
    transcript.scrollTop = transcript.scrollHeight;
    answer.focus();
  }

  function saveAnswer() {
    if (step >= 7) return true;
    const value = answer.value.trim();
    if (!value) {
      byId('guided-error').textContent = '답변을 입력하거나 건너뛰기를 눌러 주세요.';
      answer.focus();
      return false;
    }
    answers[step] = value;
    return true;
  }

  function next() {
    if (step === 7) {
      const draft = draftText();
      if (draft.length > 10000) {
        byId('guided-error').textContent = '초안이 10,000자를 넘었습니다. 이전 질문에서 답변을 줄여 주세요.';
        return;
      }
      byId('prompt').dispatchEvent(new CustomEvent('guided-draft:apply',{detail:{draft}}));
      dialog.close();
      byId('prompt').focus();
      byId('prompt').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'center'});
      return;
    }
    if (!saveAnswer()) return;
    step += 1;
    render();
  }

  launch.addEventListener('click', () => {
    if (dialog.open) return;
    previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    dialog.showModal();
    render();
  });
  byId('guided-close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('cancel', () => { if (step < 7) answers[step] = answer.value.trim(); });
  dialog.addEventListener('close', () => {
    if (step < 7) answers[step] = answer.value.trim();
    document.body.style.overflow = previousOverflow;
  });
  byId('guided-next').addEventListener('click', next);
  byId('guided-question-form').addEventListener('submit', event => { event.preventDefault(); next(); });
  byId('guided-previous').addEventListener('click', () => {
    if (step === 0) return;
    if (step < 7) answers[step] = answer.value.trim();
    step -= 1;
    render();
  });
  byId('guided-skip').addEventListener('click', () => { answers[step] = ''; step += 1; render(); });
  answer.addEventListener('input', () => {
    byId('guided-answer-count').textContent = `${answer.value.length.toLocaleString()} / 1,000자`;
    byId('guided-error').textContent = '';
  });
  byId('new-work').addEventListener('click', () => { answers = Array(7).fill(''); step = 0; });
})();
