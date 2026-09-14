// メール作成ワークの画面操作と自動採点をまとめています。
const form = document.getElementById('emailForm');
const subjectInput = document.getElementById('subject');
const bodyInput = document.getElementById('body');
const characterCount = document.getElementById('characterCount');
const problemSection = document.getElementById('problemSection');
const composeSection = document.getElementById('composeSection');
const reviewSection = document.getElementById('reviewSection');
const resultsSection = document.getElementById('resultsSection');
const progressSteps = document.querySelectorAll('.progress-step');

// 入力中の本文文字数を更新します。
bodyInput.addEventListener('input', () => {
  characterCount.textContent = `${bodyInput.value.length}文字`;
});

// 必須項目を確認して、確認画面へ進めます。
form.addEventListener('submit', (event) => {
  event.preventDefault();
  const isValid = validateForm();
  if (!isValid) return;

  document.getElementById('previewSubject').textContent = subjectInput.value.trim();
  document.getElementById('previewBody').textContent = bodyInput.value.trim();
  reviewSection.classList.remove('hidden');
  setStep(3);
  reviewSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
});

// 確認画面から入力画面へ戻ります。入力値はそのまま保持されます。
document.getElementById('editButton').addEventListener('click', () => {
  reviewSection.classList.add('hidden');
  setStep(2);
  composeSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
});

// 提出後は採点結果と振り返りを表示します。
document.getElementById('submitButton').addEventListener('click', () => {
  const result = scoreEmail();
  document.getElementById('totalScore').textContent = result.total;
  document.getElementById('scoreList').innerHTML = result.items.map((item) => `
    <div class="score-item">
      <div class="score-item-head"><span>${item.title}</span><span class="score-points">${item.points} / ${item.max}点</span></div>
      <p class="score-comment">${item.comment}</p>
    </div>
  `).join('');
  reviewSection.classList.add('hidden');
  resultsSection.classList.remove('hidden');
  setStep(4);
  resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
});

// リセット時は確認ダイアログを出し、すべての状態を初期化します。
function resetApp() {
  if (!window.confirm('入力内容をすべて削除して最初からやり直しますか？')) return;
  form.reset();
  characterCount.textContent = '0文字';
  clearErrors();
  reviewSection.classList.add('hidden');
  resultsSection.classList.add('hidden');
  setStep(1);
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

document.getElementById('resetButton').addEventListener('click', resetApp);
document.getElementById('restartButton').addEventListener('click', resetApp);

function validateForm() {
  clearErrors();
  let isValid = true;
  const fields = [
    { input: subjectInput, error: 'subjectError', message: '件名を入力してください。' },
    { input: bodyInput, error: 'bodyError', message: '本文を入力してください。' }
  ];

  fields.forEach((field) => {
    if (!field.input.value.trim()) {
      field.input.classList.add('invalid');
      document.getElementById(field.error).textContent = field.message;
      isValid = false;
    }
  });

  if (!isValid) {
    const firstInvalid = document.querySelector('.invalid');
    firstInvalid.focus();
  }
  return isValid;
}

function clearErrors() {
  document.querySelectorAll('.field-error').forEach((error) => { error.textContent = ''; });
  document.querySelectorAll('.invalid').forEach((input) => { input.classList.remove('invalid'); });
}

function setStep(currentStep) {
  progressSteps.forEach((step) => {
    const stepNumber = Number(step.dataset.step);
    step.classList.toggle('active', stepNumber === currentStep);
    step.classList.toggle('done', stepNumber < currentStep);
  });
}

// 表現の揺れを許容するため、関連する語句を複数候補で確認します。
function includesAny(text, patterns) {
  return patterns.some((pattern) => text.includes(pattern));
}

function scoreEmail() {
  const subject = subjectInput.value.trim();
  const body = bodyInput.value.trim();
  const allText = `${subject}\n${body}`;
  const hasCandidates = ['9月19日', '9月21日', '9月22日'].filter((date) => body.includes(date)).length;
  const items = [
    {
      title: '件名が具体的で、内容が分かる', max: 20,
      earned: subject.length >= 5 && includesAny(subject, ['日程', '打ち合わせ', '変更']),
      good: '用件が伝わる具体的な件名です。', bad: '「打ち合わせ」「日程」「変更」など、用件が分かる言葉を入れましょう。'
    },
    {
      title: '適切な挨拶がある', max: 10,
      earned: includesAny(body, ['お世話になっております', 'いつもお世話になっております', 'お疲れさまです']),
      good: '丁寧な挨拶から始められています。', bad: '「お世話になっております」などの挨拶を入れましょう。'
    },
    {
      title: '自分の所属・名前を名乗っている', max: 15,
      earned: (body.includes('株式会社ルミナス') || body.includes('ルミナス')) && includesAny(body, ['です', 'と申します']),
      good: '所属と名前を名乗れています。', bad: '会社名と自分の名前を名乗る一文を入れましょう。'
    },
    {
      title: '日程変更をお願いする意図が明確', max: 15,
      earned: includesAny(allText, ['変更', '延期', '別日', '日程を改め']),
      good: '日程変更の意図が伝わります。', bad: '日程を変更したいという意図を明確に書きましょう。'
    },
    {
      title: '変更前の日程を適切に示している', max: 10,
      earned: body.includes('9月18日') && body.includes('14:00'),
      good: '変更前の日時を具体的に示せています。', bad: '変更前の「9月18日（金）14:00」を本文に入れましょう。'
    },
    {
      title: '候補日時を適切に提示している', max: 15,
      earned: hasCandidates >= 2,
      good: `${hasCandidates}件の候補日時を提示できています。`, bad: '候補日時を2件以上、具体的に提示しましょう。'
    },
    {
      title: '相手への配慮・お詫びの表現がある', max: 10,
      earned: includesAny(body, ['申し訳', '恐縮', 'お手数', 'ご迷惑']),
      good: '相手への配慮が伝わる表現です。', bad: '「申し訳ございません」「お手数をおかけします」などを入れましょう。'
    },
    {
      title: '結びの言葉が適切', max: 5,
      earned: includesAny(body, ['よろしく', '幸いです', 'お知らせいただけますと']),
      good: '丁寧な結びで締めくくれています。', bad: '最後に「よろしくお願いいたします」などの結びを入れましょう。'
    }
  ];

  return {
    total: items.reduce((total, item) => total + (item.earned ? item.max : 0), 0),
    items: items.map((item) => ({ ...item, points: item.earned ? item.max : 0, comment: item.earned ? item.good : item.bad }))
  };
}
