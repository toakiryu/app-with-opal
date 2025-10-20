# PWA (Progressive Web App) セットアップガイド

## 📱 PWAとは？

Progressive Web App (PWA) は、ウェブアプリをネイティブアプリのように動作させる技術です。以下の特徴があります:

- **ホーム画面に追加**: モバイルデバイスのホーム画面にアプリアイコンを追加できます
- **フルスクリーン表示**: ブラウザのUIなし(検索バー、URLバーなど)で実行
- **オフライン対応**: Service Workerによるキャッシングでオフライン時も動作
- **高速読み込み**: キャッシュされたリソースで素早く起動

## 🚀 セットアップ手順

### 1. アイコンの生成

1. ブラウザで `assets/images/icon-generator.html` を開く
2. 「アイコンを生成」ボタンをクリック
3. 「すべてダウンロード」ボタンで全アイコンをダウンロード
4. ダウンロードしたアイコンを `assets/images/` フォルダに配置

必要なアイコンサイズ:

- 16×16, 32×32 (ファビコン)
- 57×57, 60×60, 72×72, 76×76 (iOS旧バージョン)
- 96×96, 114×114, 120×120 (iOS、Android)
- 128×128, 144×144, 152×152 (Android、Windows)
- 180×180 (iOS最新)
- 192×192, 384×384, 512×512 (Android、PWA標準)

### 2. ファイル構成

以下のファイルが追加されました:

```
apps/blackjack/
├── manifest.json           # PWAマニフェストファイル
├── service-worker.js       # Service Workerスクリプト
├── index.html             # PWA設定を追加済み
└── assets/
    └── images/
        ├── icon-generator.html  # アイコン生成ツール
        └── icon-*.png          # 各サイズのアイコン(要生成)
```

### 3. ローカルでのテスト

PWAは以下の条件で動作します:

- **HTTPS接続** または **localhost**
- Service Workerの登録が成功

#### ローカルサーバーの起動

```bash
# Python 3を使用する場合
cd apps/blackjack
python -m http.server 8000

# Node.jsのhttp-serverを使用する場合
npx http-server -p 8000
```

その後、ブラウザで `http://localhost:8000` にアクセス。

### 4. モバイルへのインストール

#### iOS (Safari)

1. Safariでアプリを開く
2. 共有ボタン(□↑)をタップ
3. 「ホーム画面に追加」を選択
4. アイコンと名前を確認して「追加」をタップ

#### Android (Chrome)

1. Chromeでアプリを開く
2. メニュー(⋮)を開く
3. 「ホーム画面に追加」または「アプリをインストール」を選択
4. 「インストール」をタップ

#### デスクトップ (Chrome/Edge)

1. URLバーの右側に表示されるインストールアイコン(⊕)をクリック
2. 「インストール」をクリック

## 🔧 カスタマイズ

### manifest.jsonの編集

アプリの表示設定をカスタマイズできます:

```json
{
  "name": "アプリの正式名称",
  "short_name": "短縮名(ホーム画面に表示)",
  "theme_color": "#0d5e3a", // テーマカラー
  "background_color": "#0d5e3a", // スプラッシュ画面の背景色
  "display": "standalone", // 表示モード
  "orientation": "portrait" // 画面の向き
}
```

#### displayモードの選択

- `standalone`: フルスクリーン(推奨)
- `fullscreen`: 完全フルスクリーン(ステータスバーも非表示)
- `minimal-ui`: 最小限のブラウザUI
- `browser`: 通常のブラウザ

#### orientationの選択

- `portrait`: 縦向き固定
- `landscape`: 横向き固定
- `any`: 自動回転(デフォルト)

### Service Workerのキャッシュ戦略

`service-worker.js` のキャッシュ戦略を変更できます:

#### Cache First (現在の設定)

```javascript
// キャッシュを優先、なければネットワーク
caches.match(event.request) || fetch(event.request);
```

#### Network First

```javascript
// ネットワークを優先、失敗したらキャッシュ
fetch(event.request).catch(() => caches.match(event.request));
```

## 🧪 デバッグとテスト

### Chrome DevTools

1. F12でDevToolsを開く
2. **Application** タブを選択
3. 以下を確認:
   - **Manifest**: マニフェストの内容と警告
   - **Service Workers**: 登録状態とステータス
   - **Cache Storage**: キャッシュされたファイル

### Service Workerのアップデート

Service Workerを更新した場合:

1. `CACHE_NAME` のバージョン番号を変更

```javascript
const CACHE_NAME = "blackjack-pwa-v2"; // v1 → v2
```

2. ページをリロードすると新しいWorkerがインストールされる

### トラブルシューティング

#### Service Workerが登録されない

- コンソールでエラーを確認
- HTTPSまたはlocalhostで実行されているか確認
- service-worker.jsのパスが正しいか確認

#### アイコンが表示されない

- アイコンファイルが正しい場所にあるか確認
- manifest.jsonのパスが正しいか確認
- キャッシュをクリアして再読み込み

#### インストールボタンが表示されない

- manifest.jsonが正しく設定されているか確認
- すべての必須フィールドが入力されているか確認
- アイコンが192×192と512×512のサイズで存在するか確認

## 📊 パフォーマンス最適化

### Lighthouse監査

1. Chrome DevToolsで **Lighthouse** タブを開く
2. **Progressive Web App** をチェック
3. **Generate report** をクリック
4. スコアと改善提案を確認

### 推奨事項

- ✅ 最小192×192と512×512のアイコンを提供
- ✅ Service Workerを登録
- ✅ HTTPSでサーブ
- ✅ レスポンシブデザイン
- ✅ 高速な初回読み込み
- ✅ オフライン対応

## 🌐 デプロイ

### GitHub Pages

すでにHTTPSで配信されているため、追加の設定は不要です。

### その他のホスティング

以下のサービスは自動的にHTTPSを提供します:

- Netlify
- Vercel
- Firebase Hosting
- Cloudflare Pages

## 📖 参考リンク

- [MDN: Progressive Web Apps](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps)
- [Web.dev: PWA Guide](https://web.dev/progressive-web-apps/)
- [Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [Web App Manifest](https://developer.mozilla.org/en-US/docs/Web/Manifest)

## 🎯 チェックリスト

セットアップが完了したら、以下を確認してください:

- [ ] manifest.jsonが作成され、index.htmlにリンクされている
- [ ] service-worker.jsが作成され、登録スクリプトが追加されている
- [ ] 必要なサイズのアイコンがすべて生成され配置されている
- [ ] ローカルでテストし、Service Workerが正常に登録されている
- [ ] モバイルデバイスでインストールできることを確認
- [ ] オフライン時も基本機能が動作することを確認
- [ ] Lighthouse PWA監査でスコア90以上を達成

---

**作成日**: 2025年10月18日
**バージョン**: 1.0.0
