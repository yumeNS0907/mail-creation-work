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
  responseList.innerHTML = responses.map((response) => `
    <article class="response-card">
      <div class="response-card-head">
        <div><h3>${escapeHtml(response.name)}</h3><span class="response-score">${escapeHtml(response.score)} / 100点</span></div>
        <time class="response-date">${formatDate(response.submittedAt)}</time>
      </div>
      <div class="response-field"><span class="response-label">件名</span><p class="response-value">${escapeHtml(response.subject)}</p></div>
      <div class="response-field"><span class="response-label">本文</span><p class="response-value">${escapeHtml(response.body)}</p></div>
    </article>
  `).join('');
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
