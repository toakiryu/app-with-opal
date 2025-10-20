# セキュリティとデータ整合性

## 概要

このブラックジャックゲームのスコアトラッキング機能では、ユーザーによるデータ改ざんを防ぐため、複数のセキュリティ対策を実装しています。

## 実装されたセキュリティ対策

### 1. データの難読化（暗号化）

#### 実装方法

- **Base64エンコーディング** + **文字列反転**
- localStorage に保存される前にデータを難読化
- 読み込み時に自動的にデコード

#### 目的

- 開発者ツールでの簡単な閲覧・編集を防止
- カジュアルな改ざんの抑止

#### コード例

```javascript
// エンコード: JSON → 反転 → Base64
function encode(str) {
  const reversed = str.split("").reverse().join("");
  return btoa(unescape(encodeURIComponent(reversed)));
}

// デコード: Base64 → 反転解除 → JSON
function decode(str) {
  const decoded = decodeURIComponent(escape(atob(str)));
  return decoded.split("").reverse().join("");
}
```

### 2. チェックサム（改ざん検知）

#### 実装方法

- データの重要な値からハッシュ値（チェックサム）を生成
- 保存時にチェックサムも一緒に保存
- 読み込み時にチェックサムを検証

#### チェックサム対象

- 現在の試合数 (`matchCount`)
- 最高記録 (`bestScore`)
- 総ゲーム数 (`totalGames`)
- 総試合数 (`totalMatches`)
- 履歴の件数 (`scoreHistory.length`)

#### コード例

```javascript
function generateChecksum(data) {
  const dataString = JSON.stringify({
    matchCount: data.currentScore.matchCount,
    bestScore: data.bestScore,
    totalGames: data.totalGames,
    totalMatches: data.totalMatches,
    historyCount: data.scoreHistory.length,
  });
  return simpleHash(dataString);
}
```

### 3. データ妥当性検証

#### 検証項目

##### A. 構造の検証

- 必須フィールドの存在確認
- データ型の検証

##### B. 数値の妥当性

- すべてのスコア関連数値が非負数
- `bestScore ≤ totalMatches`（論理的整合性）
- 個別スコアが妥当な範囲（0〜10,000試合）

##### C. タイムスタンプの検証

- 開始日時が未来でないこと
- 終了日時が未来でないこと
- プレイ時間が妥当な範囲（0〜7日）

##### D. チェックサムの検証

- 保存されたチェックサムと計算値の一致確認

#### コード例

```javascript
function validateData(data) {
  // 構造チェック
  if (!data.currentScore || !data.scoreHistory) return false;

  // 数値の妥当性
  if (data.bestScore < 0 || data.totalMatches < 0) return false;
  if (data.bestScore > data.totalMatches && data.totalGames > 0) return false;

  // タイムスタンプチェック
  if (!validateTimestamps(data)) return false;

  // チェックサム検証
  if (!verifyChecksum(data)) return false;

  return true;
}
```

### 4. ハッシュ関数

#### 実装方法

シンプルなハッシュ関数にソルト（SALT）を追加

```javascript
const SALT = "bj_game_v1_2025";

function simpleHash(str) {
  let hash = 0;
  const combined = str + SALT;
  for (let i = 0; i < combined.length; i++) {
    const char = combined.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // 32bit integer
  }
  return Math.abs(hash).toString(36);
}
```

#### 目的

- 単純な文字列置換による改ざんを防止
- ソルトにより予測不可能性を追加

## セキュリティレベル

### 🟢 防げるもの

1. **開発者ツールでの直接編集**
   - データが難読化されているため、簡単には編集できない
2. **カジュアルな改ざん**
   - チェックサムが一致しないため、単純な数値変更は検出される
3. **論理的に不正なデータ**
   - 妥当性検証により、矛盾したデータは拒否される

### 🟡 制限があるもの

1. **JavaScriptコードの解析**
   - クライアントサイドのため、コードは閲覧可能
   - 暗号化アルゴリズムとソルトは理論的には判明可能
2. **完全に決定的なユーザー**
   - ソースコードを解析すれば、正当なチェックサムを生成可能
   - ただし、相当な技術的知識が必要

### 🔴 防げないもの

1. **サーバーサイド検証の不在**
   - クライアントサイドのみの実装
   - サーバーでの追加検証はなし
2. **ブラウザAPI の直接操作**
   - JavaScriptから `ScoreManager` の関数を直接呼び出し可能

## ⚠️ 重要：クライアントサイドセキュリティの本質的な限界

### なぜ完全なセキュリティは不可能か

```
┌─────────────────────────────────────────┐
│  クライアントサイド JavaScript の現実   │
├─────────────────────────────────────────┤
│ 1. すべてのコードがブラウザに送信される │
│ 2. デバッガーで実行過程を追跡できる      │
│ 3. メモリ内の値を読み取れる             │
│ 4. 関数を直接呼び出せる                 │
│ 5. 「秘密」は存在しない                 │
└─────────────────────────────────────────┘
```

### 環境変数でも防げない理由

```javascript
// .env ファイルに書いても...
// VITE_SALT=secret_key_123

// ビルド時に埋め込まれて...
const SALT = import.meta.env.VITE_SALT;

// 最終的にブラウザで実行されるコードは：
const SALT = "secret_key_123"; // ← 結局見える！
```

**技術的なユーザーができること：**

```javascript
// 開発者ツールのコンソールで
const data = ScoreManager.loadScoreData();
data.bestScore = 99999;

// 内部関数を直接呼び出してチェックサムを更新
// (本来は隠したい処理も呼び出せる)
data._checksum = ScoreManager.debug.generateChecksum(data);
ScoreManager.saveScoreData(data);
```

### 本当の解決策

```
┌────────────────────────────────────┐
│  完全な改ざん防止が必要な場合      │
├────────────────────────────────────┤
│ ✅ サーバーサイド検証が必須        │
│ ✅ データベースでの集中管理        │
│ ✅ APIを通じた操作のみ許可         │
│ ✅ プレイログの記録と分析          │
└────────────────────────────────────┘
```

### 例：オンラインランキングの場合

```
[クライアント]                [サーバー]
     ↓                            ↓
スコア送信  ────────→     サーバー側で検証
(改ざん可能)                  ├─ プレイログ確認
                              ├─ 統計的分析
                              ├─ レート制限
                              └─ 妥当性判定
                                    ↓
                              データベース保存
                              (信頼できる記録)
```

## 改ざん検出時の動作

### ケース1: データ読み込み時

```javascript
if (!validateData(parsed)) {
  // ユーザーに通知
  alert("保存されたデータが破損しているか、不正に変更されています。");

  // データをリセット
  return createDefaultData();
}
```

### ケース2: デコード失敗時

```javascript
const jsonString = decode(encodedData);
if (!jsonString) {
  console.warn("Failed to decode data, resetting...");
  return createDefaultData();
}
```

## デバッグツール

開発者は以下のコマンドでデータの整合性を確認できます：

```javascript
// ブラウザのコンソールで実行

// データの整合性チェック
ScoreManager.debug.checkIntegrity();

// 生データの確認
ScoreManager.debug.rawData();

// チェックサムの手動検証
const data = ScoreManager.loadScoreData();
ScoreManager.debug.verifyChecksum(data);

// データの妥当性検証
ScoreManager.debug.validateData(data);
```

## 推奨される追加対策（将来の拡張）

### 1. サーバーサイド検証

オンラインランキングなどを実装する場合：

- サーバー側でスコアの妥当性を再検証
- プレイログの記録と検証
- レート制限（異常に早いスコア更新の検出）

### 2. より高度な暗号化

- Web Crypto API の使用
- AES などの対称鍵暗号化
- 定期的なキーの更新

### 3. プレイセッションの記録

- 各アクションのタイムスタンプ記録
- プレイパターンの異常検知
- 統計的な分析

### 4. デバイス指紋認証

- ブラウザ指紋の記録
- デバイス変更の検知

## セキュリティポリシー

### 本実装の位置づけ

このセキュリティ実装は、**カジュアルな改ざん防止**を目的としています。

#### 適切な用途

- ✅ 個人的なゲームプレイの記録
- ✅ 友人同士での非公式なスコア比較
- ✅ 自己満足のための記録保持

#### 不適切な用途

- ❌ 公式なランキング・リーダーボード
- ❌ 賞金が絡むコンテスト
- ❌ 絶対的な信頼性が必要な記録

### 重要な注意事項

> **このゲームはクライアントサイドのみで動作します。**  
> 完全な改ざん防止を保証することはできません。  
> 真剣な競技やランキングには、サーバーサイドの検証が必須です。

## テスト方法

### 正常系テスト

1. 通常のゲームプレイ
2. データの保存と読み込み
3. ブラウザのリロード

### 異常系テスト

#### テスト1: localStorage の直接編集

```javascript
// 開発者ツールのコンソールで実行
localStorage.setItem("blackjack_score_data", "invalid_data");
// ページをリロード → データリセットされるべき
```

#### テスト2: 数値の改ざん

```javascript
const data = ScoreManager.loadScoreData();
data.bestScore = 999999; // 異常な値に変更
ScoreManager.saveScoreData(data);
// ページをリロード → チェックサム不一致で検出されるべき
```

#### テスト3: タイムスタンプの改ざん

```javascript
const data = ScoreManager.loadScoreData();
data.currentScore.startDate = "2030-01-01T00:00:00Z"; // 未来の日付
ScoreManager.saveScoreData(data);
// ページをリロード → タイムスタンプ検証で検出されるべき
```

## まとめ

### 実装の強み

- ✅ 多層防御（難読化 + チェックサム + 妥当性検証）
- ✅ 自動的な改ざん検出
- ✅ 透過的な動作（ユーザーは意識不要）
- ✅ デバッグツールの提供

### 既知の制限

- ⚠️ クライアントサイドのみ
- ⚠️ 技術的なユーザーは回避可能
- ⚠️ 暗号学的に安全ではない

### 結論

この実装は、**一般的なユーザーによる偶発的・意図的な改ざんを効果的に防ぎ**、
ゲームの公平性とデータの整合性を大幅に向上させます。

---

**最終更新日**: 2025年10月20日  
**バージョン**: 2.0.0（セキュリティ強化版）
