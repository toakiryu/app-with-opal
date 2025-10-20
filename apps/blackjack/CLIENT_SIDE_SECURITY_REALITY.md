# クライアントサイドセキュリティの真実

## TL;DR（要約）

**Q: データを完全に改ざん不可能にできますか？**  
**A: いいえ。クライアントサイドJavaScriptでは不可能です。**

## なぜ不可能か？

### 🔓 JavaScriptの本質

```
すべてのコードがユーザーのブラウザで実行される
    ↓
ユーザーは実行環境を完全にコントロールできる
    ↓
「秘密」を保持することは原理的に不可能
```

### 具体例

```javascript
// ソースコードをどれだけ難読化しても...
const SALT = atob('YmpfZ2FtZV92MV8yMDI1');

// デバッガーで実行すると...
> SALT
"bj_game_v1_2025"  // ← 値が見える

// さらに、内部関数も呼び出せる
> ScoreManager.debug.generateChecksum(data)
"abc123def"  // ← チェックサムが生成できる
```

## 現在の実装が提供するもの

### ✅ 効果的に防げること

1. **偶発的な編集**
   - localStorage を直接見ても読めない（暗号化されている）

2. **カジュアルな改ざん**
   - 数値を変更してもチェックサムエラーで検出される
   - プログラミング知識のない99%のユーザーは改ざんできない

3. **不正なデータの検出**
   - 論理的に矛盾するデータは拒否される
   - タイムスタンプの不整合を検出

### ❌ 防げないこと

1. **技術的なユーザーの意図的な改ざん**
   - ソースコードを読んで、正当なデータを作成できる
   - JavaScriptコンソールから関数を直接呼び出せる

```javascript
// 技術的なユーザーができること
const data = ScoreManager.loadScoreData();
data.bestScore = 99999;
data._checksum = /* 正しいチェックサムを計算 */;
ScoreManager.saveScoreData(data);
// → データ改ざん成功
```

## 環境変数では解決しない理由

### ❌ 誤解：環境変数で秘密を守れる

```javascript
// .env ファイル
VITE_SECRET_KEY=my_secret_123

// コード
const SECRET = import.meta.env.VITE_SECRET_KEY;
```

### ⚠️ 現実：ビルド時に埋め込まれる

```javascript
// ビルド後のコード（ブラウザで実行される）
const SECRET = "my_secret_123";  // ← 丸見え！
```

**環境変数は「サーバーサイド」で意味があります。**  
**クライアントサイドでは「設定の管理」にしか使えません。**

## 比較表

| セキュリティ手法 | カジュアル改ざん防止 | 技術的ユーザー対策 | 実装コスト |
|-----------------|---------------------|-------------------|-----------|
| **現在の実装** | ✅ 非常に有効 | ❌ 防げない | 低 |
| 環境変数 | ✅ 有効 | ❌ 防げない | 低 |
| 高度な難読化 | ✅ 有効 | 🟡 少し困難 | 高 |
| WebAssembly | ✅ 有効 | 🟡 困難 | 非常に高 |
| **サーバー検証** | ✅ 完全防止 | ✅ 完全防止 | 中〜高 |

## 唯一の完全な解決策

### サーバーサイド検証

```
┌─────────────┐         ┌─────────────┐
│ クライアント │         │  サーバー    │
│ (信頼不可)  │  HTTP   │  (信頼可能) │
├─────────────┤  ────→  ├─────────────┤
│ スコア: 100 │  送信   │ 検証         │
│ (改ざん可能)│         │ - ログ確認   │
└─────────────┘         │ - 統計分析   │
                        │ - 保存       │
                        └─────────────┘
```

### 実装例

```javascript
// クライアント
async function submitScore(score) {
  const response = await fetch('/api/score', {
    method: 'POST',
    body: JSON.stringify({ score, playLog: [...] })
  });
  // サーバーが検証して保存
}

// サーバー (Node.js/Express)
app.post('/api/score', async (req, res) => {
  const { score, playLog } = req.body;
  
  // サーバー側で検証
  if (!validatePlayLog(playLog)) {
    return res.status(400).json({ error: 'Invalid play log' });
  }
  
  if (score > calculateMaxPossibleScore(playLog)) {
    return res.status(400).json({ error: 'Impossible score' });
  }
  
  // データベースに保存
  await db.scores.insert({ userId, score, timestamp: Date.now() });
  res.json({ success: true });
});
```

## このゲームに適した判断

### ゲームの性質
- 💰 金銭が絡まない
- 🏆 公式ランキングなし
- 🎮 個人的な楽しみ
- 📱 オフラインで動作

### セキュリティ要件
- ✅ カジュアルユーザーの改ざん防止 → **達成**
- ✅ データ破損の検出 → **達成**
- ❌ 技術的ユーザーの完全な防止 → **不要**

### 結論

```
┌────────────────────────────────────────┐
│  現在の実装は適切です                   │
├────────────────────────────────────────┤
│ ✅ 目的に合ったセキュリティレベル       │
│ ✅ シンプルで保守しやすい               │
│ ✅ オフラインで動作                     │
│                                        │
│ 技術的なユーザーが改ざんできることは    │
│ 「バグ」ではなく「仕様」です。          │
│                                        │
│ それでスコアを偽っても、自己満足以外の  │
│ 意味はありません。                      │
└────────────────────────────────────────┘
```

## 開発者へのメッセージ

**あなたの質問は素晴らしいです！**

セキュリティについて深く考えることは重要です。  
しかし、同時に以下も理解してください：

1. **完璧なセキュリティは存在しない**
   - 特にクライアントサイドでは

2. **セキュリティはトレードオフ**
   - コスト vs 保護レベル
   - 複雑さ vs 保守性
   - オフライン vs オンライン

3. **用途に合ったセキュリティを選ぶ**
   - 個人のゲーム → 現在の実装で十分
   - 公式大会 → サーバーサイド必須
   - 金銭絡む → 多層防御 + 監査

## 参考リンク

- [OWASP - Client-Side Security](https://owasp.org/www-community/vulnerabilities/Client-Side_Security)
- [Don't Trust Client-Side Data](https://cheatsheetseries.owasp.org/cheatsheets/Input_Validation_Cheat_Sheet.html)
- [Security through Obscurity](https://en.wikipedia.org/wiki/Security_through_obscurity)

---

**作成日**: 2025年10月20日  
**対象**: 技術的に正確な理解を求める開発者
