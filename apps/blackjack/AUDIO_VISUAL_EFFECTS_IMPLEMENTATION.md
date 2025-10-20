# オーディオ/ビジュアル効果機能 実装完了

## 実装された内容

このドキュメントでは、ブラックジャックゲームに追加されたオーディオとビジュアル効果機能の実装内容を説明します。

## 📁 追加されたファイル

### JavaScript モジュール
- **`assets/js/sfx.js`** - 効果音とBGM管理システム
  - ネイティブHTML5 Audio APIを使用
  - 依存ゼロ、軽量な実装
  - localStorageで設定を永続化

- **`assets/js/settings-sfx.js`** - 設定UI管理
  - 効果音/BGMのON/OFF切替
  - 音量調整スライダー
  - 動きを減らす設定

### CSS スタイル
- **`assets/css/effects.css`** - ビジュアルエフェクト
  - カードフリップアニメーション
  - チップ配置エフェクト
  - 勝利/敗北のパルスとシェイク
  - スコア増減アニメーション
  - prefers-reduced-motion 対応

- **`assets/css/settings.css`** - 設定UI スタイル
  - モダンなトグルボタン
  - スライダーコントロール
  - レスポンシブデザイン
  - ダークモード対応

### ドキュメント
- **`assets/audio/README.md`** - 音声ファイルの説明とガイド

## 🎵 必要な音声ファイル

以下の音声ファイルを `assets/audio/` ディレクトリに配置してください：

### 効果音（必須）
- `card-flip.mp3` - カード配布/引く音
- `chip.mp3` - ベット配置音
- `win.mp3` - 勝利時の音
- `lose.mp3` - 敗北時の音
- `bust.mp3` - バースト/破産時の音

### 効果音（オプション）
- `stand.mp3` - スタンド時の音

### BGM（オプション）
- `bgm.mp3` - 背景音楽

## 🎮 統合されたイベント

以下のゲームイベントに効果音とビジュアルエフェクトが統合されています：

### 1. ベット配置 (`placeBet`)
- **効果音**: `chip`
- **アニメーション**: チップ配置エフェクト

### 2. カード配布 (`startHand`)
- **効果音**: `card-flip`
- **アニメーション**: カードディールアニメーション

### 3. ヒット (`playerHit`)
- **効果音**: `card-flip`
- **バースト時**: `bust` + シェイクアニメーション

### 4. スタンド (`playerStand`)
- **効果音**: `stand`（オプション）

### 5. 勝利 (`resolveHand` - 勝利時)
- **効果音**: `win`
- **アニメーション**: 勝利パルス、スコア増加エフェクト

### 6. 敗北 (`resolveHand` - 敗北時)
- **効果音**: `lose`
- **アニメーション**: シェイク、スコア減少エフェクト

### 7. 破産 (`handleBankruptcy`)
- **効果音**: `bust`
- **アニメーション**: フェードアウトエフェクト

## ⚙️ 設定システム

### localStorage キー: `blackjack_settings`

```json
{
  "soundEnabled": true,
  "musicEnabled": false,
  "volume": 0.8,
  "musicVolume": 0.5,
  "reducedMotion": false
}
```

### 設定UI

画面右上の⚙️ボタンから設定パネルを開けます：

- **効果音**: ON/OFF切替
- **効果音の音量**: 0-100%スライダー
- **BGM**: ON/OFF切替
- **BGMの音量**: 0-100%スライダー
- **動きを減らす**: アニメーション無効化

## 🎨 ビジュアルエフェクト

### カードアニメーション
- **deal-in**: カードが配られる際のアニメーション
- **flipped**: カードフリップ（裏返し）
- **dealing**: カード配布時の回転とフェード

### 結果アニメーション
- **win-pulse**: 勝利時のパルスと発光
- **lose-shake**: 敗北時のシェイク
- **bust-effect**: バースト時のブライトネス変化

### スコアアニメーション
- **score-increase**: スコア増加時のバウンス（緑色）
- **score-decrease**: スコア減少時のバウンス（赤色）

### その他
- **fade-in/fade-out**: フェード効果
- **slide-in-up**: スライドイン効果

## ♿ アクセシビリティ

### prefers-reduced-motion 対応
- システム設定で「動きを減らす」が有効な場合、自動的にアニメーションを最小化
- 設定UIから手動でも切替可能

### フォールバック
- Web Audio API非対応ブラウザでは HTML5 Audio を使用
- 音声再生に失敗してもゲームは継続

### ARIA ラベル
- 設定ボタンに適切な `aria-label` と `aria-pressed` 属性
- キーボード操作対応

## 📱 モバイル対応

### 自動再生制限への対応
- モバイルブラウザの自動再生ポリシーに準拠
- ユーザー操作後にBGMを再生
- 効果音は常に再生可能

### レスポンシブデザイン
- 設定UIはモバイル画面に最適化
- タッチ操作に適したボタンサイズ

## 🔧 開発者向け情報

### SFX API

```javascript
// 初期化
await Sfx.initSfx({
  soundEnabled: true,
  volume: 0.8
});

// 効果音再生
Sfx.playSound('card-flip');

// BGM制御
await Sfx.playMusic();
Sfx.pauseMusic();

// 音量設定
Sfx.setVolume(0.8);
Sfx.setMusicVolume(0.5);

// ミュート切替
Sfx.toggleMute();
Sfx.toggleMusicMute();

// 設定取得
const settings = Sfx.getSettings();

// 動きの軽減
Sfx.toggleReducedMotion();
```

### ビジュアルエフェクト関数

```javascript
// 勝利エフェクト
addWinEffect();

// 敗北エフェクト
addLoseEffect();

// カードアニメーション
addCardDealAnimation(cardElement, delay);

// チップアニメーション
addChipPlaceAnimation();
```

## 🧪 テスト方法

### 1. 効果音テスト
1. ゲームを開始
2. チップを配置（`chip` 音が鳴る）
3. ディール（`card-flip` 音が鳴る）
4. ヒット（`card-flip` 音が鳴る）
5. 勝利/敗北（`win` または `lose` 音が鳴る）

### 2. 設定テスト
1. 右上の⚙️ボタンをクリック
2. 各設定を変更し、即座に反映されることを確認
3. ページをリロードし、設定が保持されていることを確認

### 3. アニメーションテスト
1. カード配布時にアニメーションが表示されることを確認
2. 勝利時にパルスエフェクトが表示されることを確認
3. 「動きを減らす」を有効にし、アニメーションが無効化されることを確認

### 4. モバイルテスト
1. モバイルデバイスでゲームを開く
2. ユーザー操作後にBGMが再生可能か確認
3. 設定UIがタッチ操作で使いやすいか確認

## 📝 次のステップ

### Phase 3 完了時に必要な作業
- [ ] 実際の音声ファイルを `assets/audio/` に配置
- [ ] すべてのブラウザで動作確認（Chrome, Firefox, Safari, Edge）
- [ ] モバイルデバイスでテスト（iOS Safari, Android Chrome）
- [ ] パフォーマンス確認（音声読み込み時間、メモリ使用量）

### 将来の改善案
- [ ] 音声ファイルの遅延読み込み
- [ ] より多くの効果音バリエーション
- [ ] カスタム音声テーマ
- [ ] ボリュームプリセット（静か、普通、にぎやか）
- [ ] 効果音のフェードイン/アウト

## 🐛 既知の問題

現時点で既知の問題はありません。問題が発生した場合は、以下をご確認ください：

1. 音声ファイルが正しく配置されているか
2. ブラウザがWeb Audio APIをサポートしているか
3. 音量設定が0になっていないか
4. ブラウザの自動再生ポリシーに注意

## 📚 参考リソース

- [Web Audio API - MDN](https://developer.mozilla.org/ja/docs/Web/API/Web_Audio_API)
- [HTML Audio Element - MDN](https://developer.mozilla.org/ja/docs/Web/HTML/Element/audio)
- [prefers-reduced-motion - MDN](https://developer.mozilla.org/ja/docs/Web/CSS/@media/prefers-reduced-motion)
- [Autoplay Policy - Chrome](https://developer.chrome.com/blog/autoplay/)

## ✅ 受け入れ条件チェックリスト

- [x] 効果音が該当イベントで再生される機能を実装
- [x] 設定UIでサウンドのON/OFFとボリュームが操作可能
- [x] 設定はlocalStorageで永続化
- [x] reducedMotionによるフォールバックが存在
- [x] 既存ゲーム動作を壊さない実装
- [x] カードフリップアニメーションを実装
- [x] 勝利/敗北のビジュアルエフェクトを実装
- [x] モバイル対応とレスポンシブデザイン
- [x] アクセシビリティ対応（ARIA、キーボード操作）
- [x] ドキュメント作成

## 🎉 完了

オーディオ/ビジュアル効果機能の実装が完了しました！
音声ファイルを配置すれば、すぐに使用可能です。

---

**作成日**: 2025年10月20日  
**バージョン**: 1.0.0  
**ブランチ**: `apps/blackjack/feature/audio-visual-effects`
