// Google Apps ScriptのWebアプリURLと管理者キーを設定します。
const ADMIN_ENDPOINT = 'https://script.google.com/macros/s/AKfycbxDSZzuVekQ8qhJqwNFa0DhKvC4QCzMPcPQFG7F8e6sUaCIgUZ-LzX2anQ_hTZ_3haA/exec';
const ADMIN_KEY = 'change-this-key';
const responseList = document.getElementById('responseList');
const adminStatus = document.getElementById('adminStatus');

function loadResponses() {
  if (!ADMIN_ENDPOINT) {
    adminStatus.textContent = 'admin.jsのADMIN_ENDPOINTを設定すると回答を表示できます。';
    responseList.innerHTML = '<p class="empty-state">Google Apps Scriptの接続設定がまだありません。</p>';
    return;
  }

  adminStatus.textContent = '回答を読み込んでいます。';
  const callbackName = `receiveResponses_${Date.now()}`;
  window[callbackName] = (result) => {
    delete window[callbackName];
    if (result.error) {
      adminStatus.textContent = '回答を読み込めませんでした。管理者キーを確認してください。';
      return;
    }
    renderResponses(result.responses || []);
  };

  const script = document.createElement('script');
  script.src = `${ADMIN_ENDPOINT}?callback=${callbackName}&key=${encodeURIComponent(ADMIN_KEY)}`;
  script.onerror = () => {
    adminStatus.textContent = '回答を読み込めませんでした。URLと公開設定を確認してください。';
    delete window[callbackName];
  };
  document.body.appendChild(script);
}

function renderResponses(responses) {
  adminStatus.textContent = `${responses.length}件の回答`;
  if (responses.length === 0) {
    responseList.innerHTML = '<p class="empty-state">まだ回答はありません。</p>';
    return;
  }
  const monthlyGroups = responses.reduce((groups, response) => {
    const month = getMonthLabel(response.submittedAt);
    if (!groups[month]) groups[month] = [];
    groups[month].push(response);
    return groups;
  }, {});
  responseList.innerHTML = Object.entries(monthlyGroups).map(([month, monthResponses]) => `
    <details class="month-folder" open>
      <summary><span>${month}</span><b>${monthResponses.length}件</b></summary>
      <div class="month-responses">${monthResponses.map(renderResponseCard).join('')}</div>
    </details>
  `).join('');
  document.querySelectorAll('.delete-button').forEach((button) => {
    button.addEventListener('click', () => deleteResponse(button.dataset.rowNumber));
  });
}

function renderResponseCard(response) {
  return `
    <article class="response-card">
      <div class="response-card-head">
        <div><h3>${escapeHtml(response.name)}</h3><span class="response-score">${escapeHtml(response.score)} / 100点</span></div>
        <div class="response-card-actions"><time class="response-date">${formatDate(response.submittedAt)}</time><button class="delete-button" type="button" data-row-number="${escapeHtml(response.rowNumber)}" aria-label="${escapeHtml(response.name)}さんの回答を削除">この回答を削除</button></div>
      </div>
      <div class="response-field"><span class="response-label">件名</span><p class="response-value">${escapeHtml(response.subject)}</p></div>
      <div class="response-field"><span class="response-label">本文</span><p class="response-value">${escapeHtml(response.body)}</p></div>
    </article>
  `;
}

function getMonthLabel(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '日時不明' : `${date.getFullYear()}年${date.getMonth() + 1}月`;
}

function deleteResponse(rowNumber) {
  if (!window.confirm('この回答を削除しますか？削除した回答は元に戻せません。')) return;
  fetch(ADMIN_ENDPOINT, {
    method: 'POST',
    mode: 'no-cors',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ action: 'delete', key: ADMIN_KEY, rowNumber: Number(rowNumber) })
  }).then(() => {
    adminStatus.textContent = '回答を削除しました。一覧を更新しています。';
    window.setTimeout(() => window.location.reload(), 700);
  }).catch(() => {
    adminStatus.textContent = '削除に失敗しました。時間をおいて再度お試しください。';
  });
}

function formatDate(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? String(value || '') : date.toLocaleString('ja-JP');
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>'"]/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
  }[character]));
}

document.getElementById('reloadButton').addEventListener('click', loadResponses);
loadResponses();
