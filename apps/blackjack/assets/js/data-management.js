/**
 * Data Management Module
 * 統計データの管理（エクスポート、インポート、リセット）
 */
(function () {
  "use strict";

  class DataManagement {
    constructor() {
      this.initialized = false;
    }

    /**
     * 初期化
     */
    init() {
      if (this.initialized) return;
      this.attachEventListeners();
      this.initialized = true;
    }

    /**
     * インポート・リセット共通の結果UI表示
     * @param {boolean} success - 成功かどうか
     * @param {string} [errorMsg] - 失敗時のエラーメッセージ
     * @param {string} [successType] - "import" or "reset" で成功時の文言を切り替え
     */
    showImportResult(success, errorMsg, successType) {
      const modal = document.getElementById("data-management-modal");
      if (!modal) return;
      // 既存の内容を一時的に隠す
      const content = modal.querySelector(
        ".modal-content, .modal__content, .modal-body, .modal__body"
      );
      if (content) content.style.display = "none";

      // 結果表示用のdiv
      let resultDiv = modal.querySelector(".import-result-message");
      if (!resultDiv) {
        resultDiv = document.createElement("div");
        resultDiv.className =
          "import-result-message flex items-center justify-center fixed inset-0 z-[12000]";
        modal.appendChild(resultDiv);
      }
      resultDiv.innerHTML = "";

      // 共通: モーダル風のラッパーdiv
      let wrapper = document.createElement("div");
      wrapper.className =
        "modal-content bg-gradient-to-br from-[#1a2332] to-[#0f1419] rounded-3xl shadow-2xl p-8 max-w-md w-full mx-4 border-4 border-[#d4af37]/30 flex flex-col items-center";

      if (success) {
        // 成功時の文言・アイコン
        let msg = "";
        let icon = "";
        let color = "text-green-400";
        if (successType === "reset") {
          msg = "データをリセットしました";
          icon = "🗑️";
        } else {
          msg = "データをインポートしました";
          icon = "✅";
        }
        wrapper.innerHTML = `
          <div class="text-center text-2xl font-bold ${color} mb-6 flex items-center gap-3">${icon}<br/>${msg}</div>
          <button id="import-reload-btn" class="w-full bg-gradient-to-r from-[#1e40af] to-[#1e3a8a] text-white py-3 rounded-lg font-bold hover:shadow-[0_0_15px_rgba(30,64,175,0.5)] transition-all flex items-center justify-center gap-2 text-lg mt-2">
            <span>🔄</span><span>アプリを再読み込み</span>
          </button>
        `;
        resultDiv.appendChild(wrapper);
        document.getElementById("import-reload-btn").onclick = () =>
          location.reload();
        // 効果音
        if (window.Sfx) window.Sfx.playSound("win");
      } else {
        let msg = "";
        if (successType === "reset") {
          msg = "リセット";
        } else {
          msg = "インポート";
        }
        wrapper.innerHTML = `
          <div class="text-2xl font-bold text-red-500 mb-4 flex items-center gap-2">❌<br/>インポートに失敗しました</div>
          <div class="mb-4 text-gray-300">${errorMsg ? errorMsg : ""}</div>
          <button id="import-fail-close-btn" class="w-full bg-gray-500 text-white py-3 rounded-lg font-bold text-lg shadow hover:bg-gray-600 transition-all focus:outline-none focus:ring-2 focus:ring-[#d4af37] focus:ring-offset-2 mt-2">OK</button>
        `;
        resultDiv.appendChild(wrapper);
        document.getElementById("import-fail-close-btn").onclick = () => {
          // 結果表示を消して元の内容を戻す
          resultDiv.remove();
          if (content) content.style.display = "";
        };
        // 効果音
        if (window.Sfx) window.Sfx.playSound("lose");
      }
    }

    /**
     * イベントリスナーを設定
     */
    attachEventListeners() {
      // エクスポートボタン
      const exportBtn = document.getElementById("export-data-btn");
      if (exportBtn) {
        exportBtn.addEventListener("click", () => this.exportData());
      }

      // インポートボタン
      const importBtn = document.getElementById("import-data-btn");
      const importInput = document.getElementById("import-data-input");
      if (importBtn && importInput) {
        importBtn.addEventListener("click", () => importInput.click());
        importInput.addEventListener("change", (e) => this.importData(e));
      }

      // リセットボタン
      const resetBtn = document.getElementById("reset-data-btn");
      if (resetBtn) {
        resetBtn.addEventListener("click", () => this.resetData());
      }

      // モーダルが開かれたときに統計情報を更新
      document.addEventListener("modal:afterOpen", (e) => {
        if (e.detail.id === "data-management-modal") {
          this.updateStats();
        }
      });
    }

    /**
     * 現在の統計情報を更新
     */
    updateStats() {
      try {
        // スコアマネージャーから統計を取得
        if (window.ScoreManager) {
          const stats = window.ScoreManager.getStatistics();

          const bestScoreEl = document.getElementById("data-mgmt-best-score");
          const totalGamesEl = document.getElementById("data-mgmt-total-games");
          const totalMatchesEl = document.getElementById(
            "data-mgmt-total-matches"
          );
          const dataSizeEl = document.getElementById("data-mgmt-size");

          if (bestScoreEl) bestScoreEl.textContent = stats.bestScore || 0;
          if (totalGamesEl) totalGamesEl.textContent = stats.totalGames || 0;
          if (totalMatchesEl)
            totalMatchesEl.textContent = stats.totalMatches || 0;

          // データサイズを計算
          if (dataSizeEl) {
            const dataSize = this.calculateDataSize();
            dataSizeEl.textContent = this.formatBytes(dataSize);
          }
        }
      } catch (error) {
        console.error("[DataManagement] 統計情報の更新エラー:", error);
      }
    }

    /**
     * データサイズを計算
     */
    calculateDataSize() {
      try {
        let totalSize = 0;
        const keys = [
          "blackjack_scores",
          "blackjack_settings",
          "blackjack_tutorial",
          "blackjack_hints",
        ];

        keys.forEach((key) => {
          const item = localStorage.getItem(key);
          if (item) {
            totalSize += new Blob([item]).size;
          }
        });

        return totalSize;
      } catch (error) {
        console.error("[DataManagement] データサイズ計算エラー:", error);
        return 0;
      }
    }

    /**
     * バイト数を人間が読める形式に変換
     */
    formatBytes(bytes) {
      if (bytes === 0) return "0 Bytes";
      const k = 1024;
      const sizes = ["Bytes", "KB", "MB"];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
    }

    /**
     * データをエクスポート
     */
    exportData() {
      try {
        // すべての関連データを収集
        const data = {
          exportDate: new Date().toISOString(),
          version: "1.0.0",
          scores: localStorage.getItem("blackjack_scores"),
          settings: localStorage.getItem("blackjack_settings"),
          tutorial: localStorage.getItem("blackjack_tutorial"),
          hints: localStorage.getItem("blackjack_hints"),
        };

        // JSONとしてダウンロード
        const dataStr = JSON.stringify(data, null, 2);
        const blob = new Blob([dataStr], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `blackjack-data-${
          new Date().toISOString().split("T")[0]
        }.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        this.showFeedback("✅ データをエクスポートしました", "success");

        // 効果音
        if (window.Sfx) {
          window.Sfx.playSound("win");
        }
      } catch (error) {
        console.error("[DataManagement] エクスポートエラー:", error);
        this.showFeedback("❌ エクスポートに失敗しました", "error");
      }
    }

    /**
     * データをインポート
     */
    importData(event) {
      const file = event.target.files[0];
      if (!file) return;

      // モーダル内の全ボタン・入力を無効化
      this.setModalDisabled(true);

      const reader = new FileReader();
      reader.onload = (e) => {
        let importSuccess = false;
        let errorMsg = "";
        try {
          const data = JSON.parse(e.target.result);
          if (!data.exportDate || !data.version) {
            throw new Error("無効なデータ形式です");
          }
          // 確認ダイアログ
          const confirmed = confirm(
            `このデータをインポートしますか？\n\n` +
              `エクスポート日: ${new Date(
                data.exportDate
              ).toLocaleString()}\n` +
              `現在のデータは上書きされます。`
          );
          if (!confirmed) {
            this.setModalDisabled(false);
            return;
          }
          // データを復元
          if (data.scores)
            localStorage.setItem("blackjack_scores", data.scores);
          if (data.settings)
            localStorage.setItem("blackjack_settings", data.settings);
          if (data.tutorial)
            localStorage.setItem("blackjack_tutorial", data.tutorial);
          if (data.hints) localStorage.setItem("blackjack_hints", data.hints);
          if (data.blackjack_score_data)
            localStorage.setItem(
              "blackjack_score_data",
              data.blackjack_score_data
            );

          importSuccess = true;
        } catch (error) {
          errorMsg = error.message || "不明なエラー";
          console.error("[DataManagement] インポートエラー:", error);
        }

        // UIを更新
        this.showImportResult(importSuccess, errorMsg);
        this.showImportResult(importSuccess, errorMsg, "import");
        this.setModalDisabled(false);
      };
      reader.readAsText(file);
      // ファイル入力をリセット
      event.target.value = "";
    }

    /**
     * モーダル内の全ボタン・入力を有効/無効化
     */
    setModalDisabled(disabled) {
      const modal = document.getElementById("data-management-modal");
      if (!modal) return;
      // ボタンとinputをすべて対象
      const elements = modal.querySelectorAll(
        "button, input, textarea, select"
      );
      elements.forEach((el) => {
        el.disabled = !!disabled;
      });
    }


    /**
     * データをリセット
     */
    resetData() {
      // 確認ダイアログ
      const confirmed = confirm(
        "⚠️ 警告\n\n" +
          "すべての統計データを削除します。\n" +
          "この操作は取り消せません。\n\n" +
          "本当に削除しますか？"
      );

      if (!confirmed) return;

      // 二重確認
      const doubleConfirmed = confirm(
        "最終確認\n\n" +
          "本当にすべてのデータを削除しますか？\n" +
          "この操作は取り消せません。"
      );

      if (!doubleConfirmed) return;

      // モーダル内の全ボタン・入力を無効化
      this.setModalDisabled(true);

      try {
        // スコアデータのみをリセット（設定は保持）
        localStorage.removeItem("blackjack_scores");

        this.showImportResult(true, undefined, "reset");

        // 効果音
        if (window.Sfx) {
          window.Sfx.playSound("stand");
        }
      } catch (error) {
        console.error("[DataManagement] リセットエラー:", error);
        this.showImportResult(false, error.message || "リセットに失敗しました");
      } finally {
        this.setModalDisabled(false);
      }
    }

    /**
     * フィードバックメッセージを表示
     */
    showFeedback(message, type = "success") {
      const feedback = document.createElement("div");
      feedback.className = `fixed top-4 left-1/2 transform -translate-x-1/2 z-[10000] px-6 py-3 rounded-lg shadow-lg text-white font-bold transition-all ${
        type === "success" ? "bg-green-600" : "bg-red-600"
      }`;
      feedback.textContent = message;
      feedback.style.animation = "fadeIn 0.3s ease-out";

      document.body.appendChild(feedback);

      setTimeout(() => {
        feedback.style.animation = "fadeOut 0.3s ease-out";
        setTimeout(() => {
          document.body.removeChild(feedback);
        }, 300);
      }, 3000);
    }
  }

  // グローバルに公開
  window.DataManagement = new DataManagement();

  // DOMContentLoaded後に初期化
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      window.DataManagement.init();
    });
  } else {
    window.DataManagement.init();
  }
})();
