// メール作成ワークの画面操作と自動採点をまとめています。
const form = document.getElementById('emailForm');
const respondentNameInput = document.getElementById('respondentName');
const subjectInput = document.getElementById('subject');
const bodyInput = document.getElementById('body');
const characterCount = document.getElementById('characterCount');
const problemSection = document.getElementById('problemSection');
const composeSection = document.getElementById('composeSection');
const reviewSection = document.getElementById('reviewSection');
const resultsSection = document.getElementById('resultsSection');
const progressSteps = document.querySelectorAll('.progress-step');

// Google Apps ScriptのWebアプリURLを設定すると、提出内容がスプレッドシートへ保存されます。
const SUBMISSION_ENDPOINT = '';

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
  const missingItems = result.items.filter((item) => item.points < item.max && item.title !== '結びの言葉が適切');
  document.getElementById('feedbackList').innerHTML = missingItems.length > 0
    ? missingItems.map((item) => `<li><strong>${item.title}</strong><span>あと${item.max - item.points}点分：${item.gap}</span></li>`).join('')
    : '<li class="feedback-complete">すべての評価項目を満たしています。今回の学びを次のメール作成にも活かしましょう。</li>';
  saveSubmission(result.total);
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
    { input: respondentNameInput, error: 'respondentNameError', message: '回答者名を入力してください。' },
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

// 設定済みのGoogle Apps Scriptへ提出内容を送信します。
function saveSubmission(score) {
  if (!SUBMISSION_ENDPOINT) return;
  const payload = {
    name: respondentNameInput.value.trim(),
    subject: subjectInput.value.trim(),
    body: bodyInput.value.trim(),
    score
  };
  fetch(SUBMISSION_ENDPOINT, {
    method: 'POST',
    mode: 'no-cors',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(payload)
  }).then(() => {
    document.getElementById('saveStatus').textContent = '提出内容を保存しました。これは研修上の提出で、実際のメールは送信されていません。';
  }).catch(() => {
    document.getElementById('saveStatus').textContent = '採点は完了しましたが、保存に失敗しました。担当者へお知らせください。';
  });
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

function countMatches(text, patterns) {
  return patterns.filter((pattern) => text.includes(pattern)).length;
}

function makeScoreItem(title, max, points, good, bad) {
  return { title, max, points, comment: points > 0 ? good : bad, gap: bad };
}

function scoreEmail() {
  const subject = subjectInput.value.trim();
  const body = bodyInput.value.trim();
  const allText = `${subject}\n${body}`;
  const greetingPatterns = ['お世話になっております', 'いつもお世話になっております', 'お疲れさまです', 'お疲れ様です'];
  const meetingPatterns = ['打ち合わせ', '打合せ', '商談', '会議', 'ミーティング', '面談'];
  const changePatterns = ['日程変更', '日時変更', '日程の変更', '変更', '延期', '再調整', '別日'];
  const requestPatterns = ['お願い', '可能でしょうか', 'いただけますでしょうか', 'ご相談', 'ご都合'];
  const hasGreeting = includesAny(body, greetingPatterns);
  const greetingAtStart = greetingPatterns.some((pattern) => body.startsWith(pattern));
  const candidateDates = ['9月19日', '9月21日', '9月22日'];
  const candidateDateCount = candidateDates.filter((date) => body.includes(date)).length;
  const candidateTimeCount = ['10:00', '13:00', '15:00'].filter((time) => body.includes(time)).length;
  const subjectPoints = Math.min(20,
    (subject.length >= 5 ? 3 : subject.length >= 3 ? 1 : 0)
      + (includesAny(subject, meetingPatterns) ? 5 : 0)
      + (includesAny(subject, changePatterns) ? 6 : 0)
      + (includesAny(subject, requestPatterns) ? 4 : 0)
      + (/[0-9０-９]+月|[0-9０-９]+時/.test(subject) ? 2 : 0));
  const greetingPoints = (greetingAtStart ? 6 : hasGreeting ? 4 : 0)
    + (hasGreeting && includesAny(body, ['おります', 'です']) ? 4 : 0);
  const companyMentioned = includesAny(body, ['株式会社ルミナス', 'ルミナス']);
  const nameIntroduced = includesAny(body, ['〇〇です', '○○です', 'です。', 'と申します', '申します。']);
  const affiliationPoints = (companyMentioned ? 6 : 0) + (nameIntroduced ? 5 : 0)
    + (companyMentioned && nameIntroduced ? 4 : 0);
  const changeIntentPoints = (includesAny(allText, changePatterns) ? 5 : 0)
    + (includesAny(body, ['社内の都合', '都合により', '難しく', '予定して', 'できなく']) ? 3 : 0)
    + (includesAny(body, requestPatterns) ? 4 : 0)
    + (includesAny(body, ['変更させて', '変更したく', '変更をお願い', '延期させて']) ? 3 : 0);
  const oldDatePoints = (body.includes('9月18日') ? 4 : 0)
    + (includesAny(body, ['金曜', '金）', '金曜日']) ? 2 : 0)
    + (body.includes('14:00') || body.includes('14時') ? 3 : 0)
    + (includesAny(body, ['予定', '変更前', '打ち合わせ']) ? 1 : 0);
  const candidatePoints = Math.min(15, candidateDateCount * 3 + candidateTimeCount + (candidateDateCount >= 1 && includesAny(body, requestPatterns) ? 3 : 0));
  const considerationPoints = (includesAny(body, ['申し訳', '恐縮', 'お詫び', 'おわび']) ? 4 : 0)
    + (includesAny(body, ['お手数', 'ご迷惑', 'ご負担', '恐れ入ります']) ? 3 : 0)
    + (includesAny(body, ['社内の都合', '難しくなって', '急なお願い', '勝手を申し']) ? 3 : 0);
  const closingPoints = (body.includes('よろしく') ? 3 : 0)
    + (includesAny(body, ['幸いです', 'お知らせいただけますと', 'ご連絡ください']) ? 1 : 0)
    + (/(よろしく|幸いです|ご連絡ください)[。！!]?\s*$/.test(body) ? 1 : 0);
  const items = [
    makeScoreItem('件名が具体的で、内容が分かる', 20, subjectPoints, '用件を示す要素を複数含んだ件名です。', '件名に打ち合わせ・日程変更・お願いなど、用件が分かる要素を入れましょう。'),
    makeScoreItem('適切な挨拶がある', 10, Math.min(10, greetingPoints), '丁寧な挨拶を適切な位置に入れられています。', '本文の冒頭に「お世話になっております」などの挨拶を入れましょう。'),
    makeScoreItem('自分の所属・名前を名乗っている', 15, Math.min(15, affiliationPoints), '所属と名前を名乗る要素が確認できました。', '会社名と自分の名前を「です」「と申します」などで伝えましょう。'),
    makeScoreItem('日程変更をお願いする意図が明確', 15, Math.min(15, changeIntentPoints), '変更理由と依頼の意図が文章から読み取れます。', '変更したい理由と、相手にお願いしたい内容を具体的に書きましょう。'),
    makeScoreItem('変更前の日程を適切に示している', 10, Math.min(10, oldDatePoints), '変更前の日時を具体的に示せています。', '変更前の9月18日（金）14:00を、できるだけ具体的に書きましょう。'),
    makeScoreItem('候補日時を適切に提示している', 15, candidatePoints, `${candidateDateCount}件の日付と${candidateTimeCount}件の時刻を確認できました。`, '候補日時は日付と時刻をセットにして、複数提示しましょう。'),
    makeScoreItem('相手への配慮・お詫びの表現がある', 10, Math.min(10, considerationPoints), 'お詫びや相手への負担に配慮した表現があります。', '「申し訳ございません」「お手数をおかけします」などを加えましょう。'),
    makeScoreItem('結びの言葉が適切', 5, Math.min(5, closingPoints), '「よろしくお願いいたします」などの結びを確認できました。', '文末に「よろしくお願いいたします」などの丁寧な結びを入れましょう。')
  ];

  return {
    total: items.reduce((total, item) => total + item.points, 0),
    items
  };
}
