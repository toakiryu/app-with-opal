// Score Manager Module
// スコアトラッキング機能を管理するモジュール
//
// 【セキュリティ方針】
// このゲームはオフラインで動作する個人的な楽しみのためのものです。
// カジュアルな改ざんは防ぎますが、技術的なユーザーによる改ざんは
// 受け入れる設計です。それでスコアを偽っても自己満足以外の意味はありません。
//
// クライアントサイドJavaScriptでは、完全な改ざん防止は原理的に不可能です。
// オンラインランキングや賞金が絡む場合は、サーバーサイド検証が必須です。
(function () {
  "use strict";

  const STORAGE_KEY = "blackjack_scores";
  const DEFAULT_START_CASH = 1000;

  // セキュリティ用の秘密鍵（ゲーム内で固定）
  // 注: これは「セキュリティ through obscurity」であり、
  //     技術的なユーザーは容易に回避できます。
  //     それで構いません - これは個人的なゲームです。
  const SALT = atob("YmpfZ2FtZV92MV8yMDI1"); // 'bj_game_v1_2025'

  /**
   * シンプルな文字列のハッシュを生成（改ざん検知用）
   * @param {string} str - ハッシュ化する文字列
   * @returns {string} ハッシュ値
   */
  function simpleHash(str) {
    let hash = 0;
    const combined = str + SALT;
    for (let i = 0; i < combined.length; i++) {
      const char = combined.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * データの整合性チェックサムを生成
   * @param {object} data - スコアデータ
   * @returns {string} チェックサム
   */
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

  /**
   * データの整合性を検証
   * @param {object} data - 検証するデータ
   * @returns {boolean} データが正当かどうか
   */
  function verifyChecksum(data) {
    if (!data._checksum) return false;
    const expectedChecksum = generateChecksum(data);
    return data._checksum === expectedChecksum;
  }

  /**
   * Base64エンコード（簡易暗号化）
   * @param {string} str - エンコードする文字列
   * @returns {string} エンコードされた文字列
   */
  function encode(str) {
    try {
      // 簡易的な難読化: Base64 + 文字列反転
      const reversed = str.split("").reverse().join("");
      return btoa(unescape(encodeURIComponent(reversed)));
    } catch (e) {
      return str;
    }
  }

  /**
   * Base64デコード
   * @param {string} str - デコードする文字列
   * @returns {string} デコードされた文字列
   */
  function decode(str) {
    try {
      const decoded = decodeURIComponent(escape(atob(str)));
      return decoded.split("").reverse().join("");
    } catch (e) {
      return null;
    }
  }

  /**
   * タイムスタンプの妥当性をチェック
   * @param {object} data - スコアデータ
   * @returns {boolean} タイムスタンプが妥当かどうか
   */
  function validateTimestamps(data) {
    const now = Date.now();
    const startDate = new Date(data.currentScore.startDate).getTime();

    // 開始日が未来でないことを確認
    if (startDate > now + 60000) {
      // 1分の余裕
      return false;
    }

    // 履歴の日付が論理的であることを確認
    for (const entry of data.scoreHistory) {
      const endDate = new Date(entry.endDate).getTime();
      if (endDate > now + 60000) {
        return false;
      }
      if (entry.duration < 0 || entry.duration > 86400000 * 7) {
        // 7日以上は異常
        return false;
      }
    }

    return true;
  }

  /**
   * データの妥当性を総合的にチェック
   * @param {object} data - スコアデータ
   * @returns {boolean} データが妥当かどうか
   */
  function validateData(data) {
    // 必須フィールドの存在確認
    if (
      !data.currentScore ||
      !data.scoreHistory ||
      data.bestScore === undefined ||
      data.totalGames === undefined ||
      data.totalMatches === undefined
    ) {
      return false;
    }

    // 数値の妥当性チェック
    if (
      data.currentScore.matchCount < 0 ||
      data.bestScore < 0 ||
      data.totalGames < 0 ||
      data.totalMatches < 0
    ) {
      return false;
    }

    // bestScore は totalMatches 以下であるべき
    if (data.bestScore > data.totalMatches && data.totalGames > 0) {
      return false;
    }

    // 履歴のスコアがすべて正の数であることを確認
    for (const entry of data.scoreHistory) {
      if (entry.score < 0 || entry.score > 10000) {
        // 10000試合は異常
        return false;
      }
    }

    // タイムスタンプの妥当性チェック
    if (!validateTimestamps(data)) {
      return false;
    }

    // チェックサムの検証
    if (!verifyChecksum(data)) {
      return false;
    }

    return true;
  }

  /**
   * デフォルトのスコアデータ構造を生成
   * @returns {object} デフォルトのスコアデータ
   */
  function createDefaultData() {
    const data = {
      currentScore: {
        matchCount: 0,
        startCash: DEFAULT_START_CASH,
        currentCash: DEFAULT_START_CASH,
        startDate: new Date().toISOString(),
      },
      scoreHistory: [],
      bestScore: 0,
      totalGames: 0,
      totalMatches: 0,
      _version: 1, // データ構造のバージョン
    };
    // チェックサムを追加
    data._checksum = generateChecksum(data);
    return data;
  }

  /**
   * localStorageからスコアデータを読み込む
   * @returns {object} スコアデータ
   */
  function loadScoreData() {
    try {
      const encodedData = localStorage.getItem(STORAGE_KEY);
      if (encodedData) {
        // デコード
        const jsonString = decode(encodedData);
        if (!jsonString) {
          console.warn("Failed to decode data, resetting...");
          return createDefaultData();
        }

        const parsed = JSON.parse(jsonString);

        // データの整合性チェック
        if (parsed && typeof parsed === "object" && parsed.currentScore) {
          // バージョンチェック（将来の拡張用）
          if (!parsed._version) {
            console.warn("Old data format detected, migrating...");
            // 古いデータを新形式に移行
            parsed._version = 1;
            parsed._checksum = generateChecksum(parsed);
          }

          // データの妥当性を検証
          if (validateData(parsed)) {
            return parsed;
          } else {
            console.error(
              "Data validation failed, data may be corrupted or tampered",
            );
            // データが改ざんされている可能性がある
            if (
              confirm(
                "保存されたデータが破損しているか、不正に変更されています。データをリセットしますか？",
              )
            ) {
              return createDefaultData();
            } else {
              // ユーザーがキャンセルした場合も安全のためリセット
              return createDefaultData();
            }
          }
        }
      }
    } catch (error) {
      console.error("Error loading score data:", error);
    }
    // エラーまたはデータなしの場合はデフォルトを返す
    return createDefaultData();
  }

  /**
   * スコアデータをlocalStorageに保存
   * @param {object} data - 保存するスコアデータ
   * @returns {boolean} 保存成功の可否
   */
  function saveScoreData(data) {
    try {
      // チェックサムを更新
      data._checksum = generateChecksum(data);

      // エンコードして保存
      const jsonString = JSON.stringify(data);
      const encodedData = encode(jsonString);
      localStorage.setItem(STORAGE_KEY, encodedData);
      return true;
    } catch (error) {
      console.error("Error saving score data:", error);
      return false;
    }
  }

  /**
   * 試合数を1増やす
   * @param {object} data - 現在のスコアデータ
   * @returns {object} 更新されたスコアデータ
   */
  function incrementMatchCount(data) {
    data.currentScore.matchCount++;
    data.totalMatches++;
    saveScoreData(data);
    return data;
  }

  /**
   * 現在の所持金を更新
   * @param {object} data - 現在のスコアデータ
   * @param {number} cash - 新しい所持金
   * @returns {object} 更新されたスコアデータ
   */
  function updateCurrentCash(data, cash) {
    data.currentScore.currentCash = cash;
    saveScoreData(data);
    return data;
  }

  /**
   * 破産時の処理：スコアを記録しリセット
   * @param {object} data - 現在のスコアデータ
   * @returns {object} リセット後の新しいスコアデータ
   */
  function recordBankruptcy(data) {
    const finalScore = data.currentScore.matchCount;
    const startDate = new Date(data.currentScore.startDate);
    const endDate = new Date();
    const duration = endDate - startDate;

    // スコア履歴に追加
    const historyEntry = {
      score: finalScore,
      startCash: data.currentScore.startCash,
      endDate: endDate.toISOString(),
      duration: duration,
    };

    data.scoreHistory.unshift(historyEntry); // 最新を先頭に追加

    // 履歴は最新10件まで保持
    if (data.scoreHistory.length > 10) {
      data.scoreHistory = data.scoreHistory.slice(0, 10);
    }

    // ベストスコア更新
    if (finalScore > data.bestScore) {
      data.bestScore = finalScore;
    }

    // 総ゲーム数を増やす
    data.totalGames++;

    // 現在のスコアをリセット
    data.currentScore = {
      matchCount: 0,
      startCash: DEFAULT_START_CASH,
      currentCash: DEFAULT_START_CASH,
      startDate: new Date().toISOString(),
    };

    saveScoreData(data);
    return data;
  }

  /**
   * 平均スコアを計算
   * @param {object} data - スコアデータ
   * @returns {number} 平均スコア（小数点第1位まで）
   */
  function calculateAverageScore(data) {
    if (data.totalGames === 0) return 0;
    return Math.round((data.totalMatches / data.totalGames) * 10) / 10;
  }

  /**
   * プレイ時間を人間が読める形式に変換
   * @param {number} milliseconds - ミリ秒
   * @returns {string} フォーマットされた時間文字列
   */
  function formatDuration(milliseconds) {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours}時間${minutes % 60}分`;
    } else if (minutes > 0) {
      return `${minutes}分${seconds % 60}秒`;
    } else {
      return `${seconds}秒`;
    }
  }

  /**
   * 日時を人間が読める形式に変換
   * @param {string} isoString - ISO形式の日時文字列
   * @returns {string} フォーマットされた日時文字列
   */
  function formatDate(isoString) {
    const date = new Date(isoString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");

    return `${year}/${month}/${day} ${hours}:${minutes}`;
  }

  /**
   * 全データをリセット（デバッグ用）
   */
  function resetAllData() {
    const confirmed = confirm(
      "すべてのスコアデータをリセットしますか？この操作は取り消せません。",
    );
    if (confirmed) {
      localStorage.removeItem(STORAGE_KEY);
      return createDefaultData();
    }
    return loadScoreData();
  }

  /**
   * データの整合性チェック（デバッグ用）
   * @returns {object} チェック結果
   */
  function debugCheckIntegrity() {
    const data = loadScoreData();
    return {
      hasChecksum: !!data._checksum,
      checksumValid: verifyChecksum(data),
      timestampsValid: validateTimestamps(data),
      dataValid: validateData(data),
      version: data._version,
      data: data,
    };
  }

  /**
   * 生の保存データを確認（デバッグ用）
   * @returns {object} 生データの情報
   */
  function debugRawData() {
    const encoded = localStorage.getItem(STORAGE_KEY);
    const decoded = encoded ? decode(encoded) : null;
    return {
      encoded: encoded ? encoded.substring(0, 100) + "..." : null,
      decoded: decoded ? decoded.substring(0, 200) + "..." : null,
      size: encoded ? encoded.length : 0,
    };
  }

  /**
   * スコアデータをエクスポート（将来の拡張用）
   * @param {object} data - スコアデータ
   * @returns {string} JSON文字列
   */
  function exportData(data) {
    // エクスポート時は暗号化しない（ユーザーが読める形式）
    const exportData = {
      ...data,
      _exported: new Date().toISOString(),
      _note: "このデータは Blackjack Game からエクスポートされました",
    };
    return JSON.stringify(exportData, null, 2);
  }

  /**
   * スコアデータをインポート（将来の拡張用）
   * @param {string} jsonString - インポートするJSON文字列
   * @returns {object|null} パース成功時はデータ、失敗時はnull
   */
  function importData(jsonString) {
    try {
      const data = JSON.parse(jsonString);
      if (data && data.currentScore) {
        // インポート時にチェックサムを再生成
        data._checksum = generateChecksum(data);

        // データの妥当性を検証
        if (validateData(data)) {
          saveScoreData(data);
          return data;
        } else {
          console.error("Imported data failed validation");
          return null;
        }
      }
    } catch (error) {
      console.error("Error importing data:", error);
    }
    return null;
  }

  // Public API
  window.ScoreManager = {
    loadScoreData,
    saveScoreData,
    incrementMatchCount,
    updateCurrentCash,
    recordBankruptcy,
    calculateAverageScore,
    formatDuration,
    formatDate,
    resetAllData,
    exportData,
    importData,
    DEFAULT_START_CASH,
    /**
     * DataManagement用: 統計情報を返す
     * @returns {object} { bestScore, totalGames, totalMatches }
     */
    getStatistics: function () {
      const data = loadScoreData();
      return {
        bestScore: data && typeof data.bestScore === 'number' ? data.bestScore : 0,
        totalGames: data && typeof data.totalGames === 'number' ? data.totalGames : 0,
        totalMatches: data && typeof data.totalMatches === 'number' ? data.totalMatches : 0,
      };
    },
    // デバッグ用（本番環境では削除を検討）
    debug: {
      checkIntegrity: debugCheckIntegrity,
      rawData: debugRawData,
      verifyChecksum: verifyChecksum,
      validateData: validateData,
    },
  };
})();
