/**
 * QRコード共有機能
 * データのエクスポート/インポートをQRコードで行う
 */
(function () {
  "use strict";

  class QRShare {
    constructor() {
      this.initialized = false;
      this.qrCodeInstance = null;
      this.html5QrCode = null;
    }

    /**
     * 初期化
     */
    init() {
      if (this.initialized) return;

      // ライブラリの読み込みチェック
      if (typeof QRCode === 'undefined') {
        console.error('[QRShare] QRCodeライブラリが読み込まれていません');
        return;
      }
      if (typeof Html5Qrcode === 'undefined') {
        console.error('[QRShare] Html5Qrcodeライブラリが読み込まれていません');
        return;
      }
      if (typeof LZString === 'undefined') {
        console.error('[QRShare] LZStringライブラリが読み込まれていません');
        return;
      }
      
      console.log('[QRShare] すべてのライブラリが正常に読み込まれました');

      this.attachEventListeners();
      this.initialized = true;
    }

    /**
     * イベントリスナーを設定
     */
    attachEventListeners() {
      // エクスポートボタン
      const exportBtn = document.getElementById("share-export-btn");
      if (exportBtn) {
        exportBtn.addEventListener("click", () => this.exportAsQR());
      }

      // インポート - カメラボタン
      const importCameraBtn = document.getElementById("share-import-camera-btn");
      if (importCameraBtn) {
        importCameraBtn.addEventListener("click", () => this.startCameraImport());
      }

      // インポート - ファイルボタン
      const importFileBtn = document.getElementById("share-import-file-btn");
      const importInput = document.getElementById("share-import-file");
      if (importFileBtn && importInput) {
        importFileBtn.addEventListener("click", () => importInput.click());
        importInput.addEventListener("change", (e) => this.importFromFile(e));
      }

      // カメラ停止ボタン
      const cameraStopBtn = document.getElementById("share-camera-stop-btn");
      if (cameraStopBtn) {
        cameraStopBtn.addEventListener("click", () => this.stopCamera());
      }

      // モーダルが開かれたときにQRコードをクリア
      document.addEventListener("modal:afterOpen", (e) => {
        if (e.detail.id === "share-modal") {
          this.clearQRCode();
          this.updateStatus("");
        }
      });

      // モーダルが閉じられたときにQRコードとカメラをクリーンアップ
      document.addEventListener("modal:beforeClose", (e) => {
        if (e.detail.id === "share-modal") {
          this.clearQRCode();
          this.stopCamera();
        }
      });
    }

    /**
     * データをQRコードとしてエクスポート
     */
    exportAsQR() {
      try {
        // データを収集
        const data = {
          exportDate: new Date().toISOString(),
          version: "1.0.0",
          scores: localStorage.getItem("blackjack_scores"),
          settings: localStorage.getItem("blackjack_settings"),
          tutorial: localStorage.getItem("blackjack_tutorial"),
          hints: localStorage.getItem("blackjack_hints"),
        };

        // JSONに変換
        const jsonStr = JSON.stringify(data);
        const originalSize = new Blob([jsonStr]).size;
        
        console.log(`[QRShare] 元のデータサイズ: ${originalSize} バイト`);
        
        // データを圧縮（LZ-String使用 - URI互換形式）
        const compressed = LZString.compressToEncodedURIComponent(jsonStr);
        const compressedSize = new Blob([compressed]).size;
        
        // 圧縮が有効かチェック（小さいデータは圧縮しない方が良い場合がある）
        let dataStr;
        let finalSize;
        let compressionUsed = false;
        
        if (compressedSize < originalSize) {
          // 圧縮が効果的な場合のみ使用
          dataStr = "LZ:" + compressed;
          finalSize = new Blob([dataStr]).size;
          compressionUsed = true;
          const compressionRatio = (((originalSize - compressedSize) / originalSize) * 100).toFixed(1);
          console.log(`[QRShare] 圧縮後のサイズ: ${compressedSize} バイト (${compressionRatio}% 削減)`);
        } else {
          // 圧縮しない方が小さい場合は元のデータを使用
          dataStr = jsonStr;
          finalSize = originalSize;
          console.log(`[QRShare] 圧縮なし (元のデータの方が小さいため)`);
        }
        
        // データサイズをチェック（QRコードの推奨最大サイズは約2953バイト）
        if (finalSize > 2000) {
          const sizeKB = (finalSize / 1024).toFixed(2);
          this.updateStatus(
            `⚠️ データが大きいです (${sizeKB}KB)。読み取りに失敗する可能性があります。`,
            "warning"
          );
        }

        // QRコード生成
        this.clearQRCode();
        const qrCodeContainer = document.getElementById("share-qrcode");
        if (!qrCodeContainer) {
          throw new Error("QRコード表示領域が見つかりません");
        }

        // QRCodeインスタンスを作成（エラー訂正レベルをLに下げて容量を最大化）
        this.qrCodeInstance = new QRCode(qrCodeContainer, {
          text: dataStr,
          width: 300,
          height: 300,
          colorDark: "#000000",
          colorLight: "#ffffff",
          correctLevel: QRCode.CorrectLevel.L, // 最低レベルで容量を最大化
        });

        setTimeout(() => {
          const message = compressionUsed
            ? `✅ QRコードを生成しました (圧縮: ${(originalSize / 1024).toFixed(2)}KB → ${(finalSize / 1024).toFixed(2)}KB)`
            : `✅ QRコードを生成しました (${(finalSize / 1024).toFixed(2)}KB)`;
          this.updateStatus(message, "success");
        }, 100);

        // 効果音
        if (window.Sfx) {
          window.Sfx.playSound("win");
        }
      } catch (error) {
        console.error("[QRShare] エクスポートエラー:", error);
        this.updateStatus("❌ QRコード生成に失敗しました", "error");
        if (window.Sfx) {
          window.Sfx.playSound("lose");
        }
      }
    }

    /**
     * カメラでQRコード読み取りを開始
     */
    startCameraImport() {
      const cameraContainer = document.getElementById("share-camera-container");
      const cameraReader = document.getElementById("share-camera-reader");

      if (!cameraContainer || !cameraReader) {
        this.updateStatus("❌ カメラコンテナが見つかりません", "error");
        return;
      }

      // カメラコンテナを表示
      cameraContainer.classList.remove("hidden");
      this.updateStatus("📷 カメラを起動中...", "info");

      // Html5Qrcodeインスタンスを作成
      if (!this.html5QrCode) {
        this.html5QrCode = new Html5Qrcode("share-camera-reader");
      }

      // カメラを起動
      this.html5QrCode
        .start(
          { facingMode: "environment" }, // 背面カメラを優先
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
          },
          (decodedText, decodedResult) => {
            // QRコード検出成功
            console.log("[QRShare] QRコード検出:", decodedText);
            this.stopCamera();
            this.processImportData(decodedText);
          },
          (errorMessage) => {
            // スキャンエラー（通常は無視）
          }
        )
        .then(() => {
          this.updateStatus("📷 カメラでQRコードをスキャンしてください", "info");
        })
        .catch((err) => {
          console.error("[QRShare] カメラ起動エラー:", err);
          this.updateStatus("❌ カメラの起動に失敗しました", "error");
          cameraContainer.classList.add("hidden");
          if (window.Sfx) {
            window.Sfx.playSound("lose");
          }
        });
    }

    /**
     * ファイルからQRコードを読み取り
     */
    importFromFile(event) {
      const file = event.target.files[0];
      if (!file) return;

      // 画像ファイルかチェック
      if (!file.type.startsWith("image/")) {
        this.updateStatus("❌ 画像ファイルを選択してください", "error");
        return;
      }

      this.updateStatus("📷 QRコードを読み取り中...", "info");

      // Html5Qrcodeインスタンスを作成（ファイルスキャン用）
      const html5QrCode = new Html5Qrcode("share-qrcode");

      html5QrCode
        .scanFile(file, true)
        .then((decodedText) => {
          console.log("[QRShare] 読み取り成功:", decodedText.substring(0, 100) + "...");
          this.processImportData(decodedText);
        })
        .catch((err) => {
          console.error("[QRShare] QRコード読み取りエラー:", err);
          
          // エラーの詳細を表示
          let errorMsg = "❌ QRコードの読み取りに失敗しました";
          if (err.message && err.message.includes("No MultiFormat Readers")) {
            errorMsg = "❌ QRコードが検出できませんでした。画像が鮮明か、QRコード全体が写っているか確認してください。";
          }
          
          this.updateStatus(errorMsg, "error");
          if (window.Sfx) {
            window.Sfx.playSound("lose");
          }
        })
        .finally(() => {
          // ファイル入力をリセット
          event.target.value = "";
        });
    }

    /**
     * 読み取ったデータを処理
     */
    processImportData(dataStr) {
      try {
        // 圧縮データかチェック（"LZ:"プレフィックスで判定）
        let jsonStr = dataStr;
        if (dataStr.startsWith("LZ:")) {
          console.log("[QRShare] 圧縮データを検出、解凍中...");
          const compressed = dataStr.substring(3); // "LZ:"を除去
          try {
            jsonStr = LZString.decompressFromEncodedURIComponent(compressed);
            if (!jsonStr) {
              throw new Error("解凍に失敗しました");
            }
            console.log("[QRShare] 解凍成功");
          } catch (err) {
            throw new Error(`データの解凍に失敗しました: ${err.message}`);
          }
        }
        
        const data = JSON.parse(jsonStr);
        if (!data.exportDate || !data.version) {
          throw new Error("無効なデータ形式です");
        }

        // 確認ダイアログ
        const confirmed = confirm(
          `このデータをインポートしますか？\n\n` +
            `エクスポート日: ${new Date(data.exportDate).toLocaleString()}\n` +
            `現在のデータは上書きされます。`
        );

        if (!confirmed) {
          this.updateStatus("インポートをキャンセルしました", "info");
          return;
        }

        // データを復元
        if (data.scores) localStorage.setItem("blackjack_scores", data.scores);
        if (data.settings)
          localStorage.setItem("blackjack_settings", data.settings);
        if (data.tutorial)
          localStorage.setItem("blackjack_tutorial", data.tutorial);
        if (data.hints) localStorage.setItem("blackjack_hints", data.hints);

        this.updateStatus("✅ インポートに成功しました", "success");

        // 効果音
        if (window.Sfx) {
          window.Sfx.playSound("win");
        }

        // 成功後、再読み込みを促す
        setTimeout(() => {
          if (
            confirm(
              "データのインポートが完了しました。\nアプリを再読み込みしますか？"
            )
          ) {
            location.reload();
          }
        }, 1000);
      } catch (error) {
        console.error("[QRShare] データ処理エラー:", error);
        this.updateStatus(
          `❌ データの処理に失敗しました: ${error.message}`,
          "error"
        );
        if (window.Sfx) {
          window.Sfx.playSound("lose");
        }
      }
    }

    /**
     * QRコード表示をクリア
     */
    clearQRCode() {
      const qrCodeContainer = document.getElementById("share-qrcode");
      if (qrCodeContainer) {
        qrCodeContainer.innerHTML = "";
      }
      this.qrCodeInstance = null;
    }

    /**
     * カメラを停止
     */
    stopCamera() {
      const cameraContainer = document.getElementById("share-camera-container");
      
      if (this.html5QrCode) {
        this.html5QrCode
          .stop()
          .then(() => {
            console.log("[QRShare] カメラを停止しました");
            if (cameraContainer) {
              cameraContainer.classList.add("hidden");
            }
          })
          .catch((err) => {
            console.error("[QRShare] カメラ停止エラー:", err);
          })
          .finally(() => {
            this.html5QrCode = null;
          });
      } else if (cameraContainer) {
        cameraContainer.classList.add("hidden");
      }
    }

    /**
     * ステータスメッセージを更新
     */
    updateStatus(message, type = "info") {
      const statusEl = document.getElementById("share-status");
      if (!statusEl) return;

      let colorClass = "text-gray-300";
      if (type === "success") colorClass = "text-green-400";
      else if (type === "error") colorClass = "text-red-400";
      else if (type === "info") colorClass = "text-blue-400";

      statusEl.textContent = message;
      statusEl.className = `text-sm ${colorClass} mt-2`;
    }
  }

  // グローバルに公開
  window.QRShare = new QRShare();

  // DOMContentLoaded後に初期化
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      window.QRShare.init();
    });
  } else {
    window.QRShare.init();
  }
})();
