/**
 * Settings UI for SFX and Visual Effects
 * 音声と視覚効果の設定UIを管理（モーダル形式）
 */

class SettingsUI {
  constructor(sfxManager) {
    this.sfx = sfxManager;
    this.initialized = false;
  }

  /**
   * 設定UIを初期化
   */
  init() {
    if (this.initialized) return;

    this.attachEventListeners();
    this.updateUI();
    this.initialized = true;
  }

  /**
   * イベントリスナーを設定
   */
  attachEventListeners() {
    // 効果音ON/OFF
    const soundToggle = document.getElementById('sound-enabled');
    if (soundToggle) {
      soundToggle.addEventListener('click', () => {
        const enabled = this.sfx.toggleMute();
        this.updateToggleButton(soundToggle, enabled, '🔊', '🔇');
        this.showFeedback(enabled ? '効果音をONにしました' : '効果音をOFFにしました');
      });
    }

    // 効果音の音量
    const soundVolume = document.getElementById('sound-volume');
    const soundVolumeValue = document.getElementById('sound-volume-value');
    if (soundVolume && soundVolumeValue) {
      soundVolume.addEventListener('input', (e) => {
        const value = parseInt(e.target.value);
        this.sfx.setVolume(value / 100);
        soundVolumeValue.textContent = `${value}%`;
      });
    }

    // BGM ON/OFF
    const musicToggle = document.getElementById('music-enabled');
    if (musicToggle) {
      musicToggle.addEventListener('click', () => {
        const enabled = this.sfx.toggleMusicMute();
        this.updateToggleButton(musicToggle, enabled, '🎵', '🔇');
        this.showFeedback(enabled ? 'BGMをONにしました' : 'BGMをOFFにしました');
      });
    }

    // BGMの音量
    const musicVolume = document.getElementById('music-volume');
    const musicVolumeValue = document.getElementById('music-volume-value');
    if (musicVolume && musicVolumeValue) {
      musicVolume.addEventListener('input', (e) => {
        const value = parseInt(e.target.value);
        this.sfx.setMusicVolume(value / 100);
        musicVolumeValue.textContent = `${value}%`;
      });
    }

    // 動きを減らす
    const reducedMotionToggle = document.getElementById('reduced-motion');
    if (reducedMotionToggle) {
      reducedMotionToggle.addEventListener('click', () => {
        const enabled = this.sfx.toggleReducedMotion();
        this.updateToggleButton(reducedMotionToggle, enabled, '⏸️', '🎬');
        this.showFeedback(enabled ? 'アニメーションを減らしました' : 'アニメーションを有効にしました');
      });
    }
  }

  /**
   * UIを現在の設定で更新
   */
  updateUI() {
    const settings = this.sfx.getSettings();

    // 効果音トグル
    const soundToggle = document.getElementById('sound-enabled');
    if (soundToggle) {
      this.updateToggleButton(soundToggle, settings.soundEnabled, '🔊', '🔇');
    }

    // 効果音の音量
    const soundVolume = document.getElementById('sound-volume');
    const soundVolumeValue = document.getElementById('sound-volume-value');
    if (soundVolume && soundVolumeValue) {
      const volumePercent = Math.round(settings.volume * 100);
      soundVolume.value = volumePercent;
      soundVolumeValue.textContent = `${volumePercent}%`;
    }

    // BGMトグル
    const musicToggle = document.getElementById('music-enabled');
    if (musicToggle) {
      this.updateToggleButton(musicToggle, settings.musicEnabled, '🎵', '🔇');
    }

    // BGMの音量
    const musicVolume = document.getElementById('music-volume');
    const musicVolumeValue = document.getElementById('music-volume-value');
    if (musicVolume && musicVolumeValue) {
      const volumePercent = Math.round(settings.musicVolume * 100);
      musicVolume.value = volumePercent;
      musicVolumeValue.textContent = `${volumePercent}%`;
    }

    // 動きを減らす
    const reducedMotionToggle = document.getElementById('reduced-motion');
    if (reducedMotionToggle) {
      this.updateToggleButton(reducedMotionToggle, settings.reducedMotion, '⏸️', '🎬');
    }
  }

  /**
   * トグルボタンの表示を更新
   * @param {HTMLElement} button - ボタン要素
   * @param {boolean} enabled - 有効/無効状態
   * @param {string} onIcon - ONアイコン
   * @param {string} offIcon - OFFアイコン
   */
  updateToggleButton(button, enabled, onIcon, offIcon) {
    button.setAttribute('aria-pressed', enabled);
    button.classList.toggle('active', enabled);
    const icon = button.querySelector('.toggle-icon');
    if (icon) {
      icon.textContent = enabled ? onIcon : offIcon;
    }
  }

  /**
   * フィードバックメッセージを表示
   * @param {string} message - メッセージ
   */
  showFeedback(message) {
    // 既存のフィードバックを削除
    const existingFeedback = document.querySelector('.settings-feedback');
    if (existingFeedback) {
      existingFeedback.remove();
    }

    // 新しいフィードバックを作成
    const feedback = document.createElement('div');
    feedback.className = 'settings-feedback';
    feedback.textContent = message;
    feedback.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: rgba(0, 0, 0, 0.85);
      color: white;
      padding: 15px 25px;
      border-radius: 8px;
      font-size: 0.95em;
      z-index: 10000;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
      pointer-events: none;
      animation: fadeIn 0.3s ease;
    `;
    
    document.body.appendChild(feedback);
    
    // 2秒後に削除
    setTimeout(() => {
      feedback.style.animation = 'fadeOut 0.3s ease';
      setTimeout(() => feedback.remove(), 300);
    }, 2000);
  }

  /**
   * 設定モーダルを開く
   */
  open() {
    if (window.ModalManager) {
      window.ModalManager.open('settings-modal');
      this.updateUI(); // モーダルを開くときに最新の設定を反映
    }
  }

  /**
   * 設定モーダルを閉じる
   */
  close() {
    if (window.ModalManager) {
      window.ModalManager.close('settings-modal');
    }
  }

  /**
   * 設定モーダルの表示/非表示を切替
   */
  toggle() {
    this.open(); // 常に開く（モーダルシステムが状態管理）
  }
}

// グローバルインスタンスを作成（Sfxが利用可能な場合）
if (typeof window !== 'undefined' && window.Sfx) {
  window.SettingsUI = new SettingsUI(window.Sfx);
}

// モジュールとしてエクスポート
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SettingsUI;
}
