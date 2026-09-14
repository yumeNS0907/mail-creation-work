# Googleスプレッドシート保存の設定

## 1. スプレッドシートを作成

1. Googleスプレッドシートを新規作成します。
2. シート名を `回答` に変更します。
3. 1行目は空欄のままで構いません。初回送信時に見出しが自動作成されます。

## 2. Google Apps Scriptを登録

1. スプレッドシートの「拡張機能」から「Apps Script」を開きます。
2. `Code.gs` の内容を貼り付けます。
3. `ADMIN_KEY` の `change-this-key` を、推測されにくい任意の文字列へ変更します。
4. 保存します。

## 3. Webアプリとしてデプロイ

1. 「デプロイ」から「新しいデプロイ」を選択します。
2. 種類は「ウェブアプリ」を選択します。
3. 実行するユーザーは「自分」、アクセスできるユーザーは「全員」にします。
4. デプロイして、表示されたWebアプリURLをコピーします。

## 4. 研修アプリへ接続

`script.js` の次の行へWebアプリURLを貼り付けます。

```javascript
const SUBMISSION_ENDPOINT = 'ここにWebアプリURL';
```

## 5. 管理者ページへ接続

`admin.js` の次の2か所を設定します。

```javascript
const ADMIN_ENDPOINT = 'ここにWebアプリURL';
const ADMIN_KEY = 'Code.gsと同じ管理者キー';
```

設定後、変更した `index.html`、`script.js`、`admin.html`、`admin.css`、`admin.js` をGitHubへpushします。

管理者ページは次のURLです。

`https://yumens0907.github.io/mail-creation-work/admin.html`

## 注意

- Google Apps Scriptを「全員」に公開するため、管理者ページURLと管理者キーは研修担当者だけで共有してください。
- この構成にはログイン機能がありません。厳密な個人情報管理が必要な場合は、Google Workspaceのアカウント制限やログイン機能を追加してください。
- 回答本文はGoogleスプレッドシートへ保存されます。保存したくない場合は `SUBMISSION_ENDPOINT` を空欄に戻します。
