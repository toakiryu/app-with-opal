/**
 * SFX (Sound Effects) Module
 * 効果音とBGMを管理するモジュール
 * 依存ゼロ、ネイティブWeb Audio API / HTML Audio要素を使用
 */

class SfxManager {
  constructor() {
    this.sounds = {};
    this.music = null;
    this.settings = {
      soundEnabled: true,
      musicEnabled: false,
      volume: 0.8,
      musicVolume: 0.5,
      reducedMotion: false
    };
    this.audioContext = null;
    this.initialized = false;
    
    // 音声ファイルのマッピング
    this.soundFiles = {
      'card-flip': 'assets/audio/card-flip.mp3',
      'chip': 'assets/audio/chip.mp3',
      'win': 'assets/audio/win.mp3',
      'lose': 'assets/audio/lose.mp3',
      'bust': 'assets/audio/bust.mp3',
      'stand': 'assets/audio/stand.mp3'
    };
    
    this.musicFile = 'assets/audio/bgm.mp3';
  }

  /**
   * 初期化
   * @param {Object} options - 初期化オプション
   * @returns {Promise<boolean>} 初期化の成功/失敗
   */
  async initSfx(options = {}) {
    if (this.initialized) {
      return true;
    }

    // 設定の読み込み
    this.loadSettings();
    
    // オプションで設定を上書き
    if (options.soundEnabled !== undefined) this.settings.soundEnabled = options.soundEnabled;
    if (options.musicEnabled !== undefined) this.settings.musicEnabled = options.musicEnabled;
    if (options.volume !== undefined) this.settings.volume = options.volume;
    if (options.musicVolume !== undefined) this.settings.musicVolume = options.musicVolume;
    if (options.reducedMotion !== undefined) this.settings.reducedMotion = options.reducedMotion;

    try {
      // AudioContextの初期化を試みる（オプション）
      if (typeof AudioContext !== 'undefined' || typeof webkitAudioContext !== 'undefined') {
        this.audioContext = new (AudioContext || webkitAudioContext)();
      }

      // 効果音のプリロード
      await this.preloadSounds();
      
      // BGMの準備
      this.preparMusic();
      
      this.initialized = true;
      console.log('[SFX] 初期化完了');
      return true;
    } catch (error) {
      console.error('[SFX] 初期化エラー:', error);
      return false;
    }
  }

  /**
   * 効果音をプリロード
   * @returns {Promise<void>}
   */
  async preloadSounds() {
    const promises = [];
    
    for (const [name, url] of Object.entries(this.soundFiles)) {
      promises.push(
        new Promise((resolve) => {
          const audio = new Audio();
          audio.preload = 'auto';
          audio.volume = this.settings.volume;
          
          audio.addEventListener('canplaythrough', () => {
            this.sounds[name] = audio;
            resolve();
          }, { once: true });
          
          audio.addEventListener('error', (e) => {
            console.warn(`[SFX] ${name} の読み込みに失敗:`, e);
            resolve(); // エラーでも続行
          }, { once: true });
          
          audio.src = url;
        })
      );
    }
    
    await Promise.all(promises);
  }

  /**
   * BGMの準備
   */
  preparMusic() {
    this.music = new Audio(this.musicFile);
    this.music.loop = true;
    this.music.volume = this.settings.musicVolume;
    this.music.preload = 'auto';
    
    this.music.addEventListener('error', (e) => {
      console.warn('[SFX] BGMの読み込みに失敗:', e);
    });
  }

  /**
   * 効果音を再生
   * @param {string} name - 音声名
   * @returns {boolean} 再生の成功/失敗
   */
  playSound(name) {
    if (!this.settings.soundEnabled || !this.sounds[name]) {
      return false;
    }

    try {
      const audio = this.sounds[name].cloneNode();
      audio.volume = this.settings.volume;
      audio.play().catch(err => {
        console.warn(`[SFX] ${name} の再生に失敗:`, err);
      });
      return true;
    } catch (error) {
      console.error(`[SFX] ${name} の再生エラー:`, error);
      return false;
    }
  }

  /**
   * BGMを再生
   * @returns {Promise<boolean>}
   */
  async playMusic() {
    if (!this.settings.musicEnabled || !this.music) {
      return false;
    }

    try {
      // AudioContextがサスペンド状態の場合は再開
      if (this.audioContext && this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }
      
      this.music.volume = this.settings.musicVolume;
      await this.music.play();
      console.log('[SFX] BGM再生開始');
      return true;
    } catch (error) {
      console.warn('[SFX] BGMの再生に失敗:', error);
      return false;
    }
  }

  /**
   * BGMを一時停止
   */
  pauseMusic() {
    if (this.music) {
      this.music.pause();
    }
  }

  /**
   * 効果音の音量を設定
   * @param {number} level - 音量レベル (0.0 - 1.0)
   */
  setVolume(level) {
    this.settings.volume = Math.max(0, Math.min(1, level));
    
    // 既存の効果音の音量も更新
    for (const audio of Object.values(this.sounds)) {
      audio.volume = this.settings.volume;
    }
    
    this.saveSettings();
  }

  /**
   * BGMの音量を設定
   * @param {number} level - 音量レベル (0.0 - 1.0)
   */
  setMusicVolume(level) {
    this.settings.musicVolume = Math.max(0, Math.min(1, level));
    
    if (this.music) {
      this.music.volume = this.settings.musicVolume;
    }
    
    this.saveSettings();
  }

  /**
   * 効果音のミュート切替
   * @returns {boolean} 新しいミュート状態
   */
  toggleMute() {
    this.settings.soundEnabled = !this.settings.soundEnabled;
    this.saveSettings();
    return this.settings.soundEnabled;
  }

  /**
   * BGMのミュート切替
   * @returns {boolean} 新しいミュート状態
   */
  toggleMusicMute() {
    this.settings.musicEnabled = !this.settings.musicEnabled;
    
    if (this.settings.musicEnabled) {
      this.playMusic();
    } else {
      this.pauseMusic();
    }
    
    this.saveSettings();
    return this.settings.musicEnabled;
  }

  /**
   * 動きの軽減設定を切替
   * @returns {boolean} 新しい設定
   */
  toggleReducedMotion() {
    this.settings.reducedMotion = !this.settings.reducedMotion;
    this.saveSettings();
    
    // CSSクラスでアニメーションを制御
    if (this.settings.reducedMotion) {
      document.body.classList.add('reduced-motion');
    } else {
      document.body.classList.remove('reduced-motion');
    }
    
    return this.settings.reducedMotion;
  }

  /**
   * Web Audio / Audioの利用可否判定
   * @returns {boolean}
   */
  isAvailable() {
    return typeof Audio !== 'undefined';
  }

  /**
   * 設定を取得
   * @returns {Object} 現在の設定
   */
  getSettings() {
    return { ...this.settings };
  }

  /**
   * 設定を更新
   * @param {Object} newSettings - 新しい設定
   */
  updateSettings(newSettings) {
    this.settings = { ...this.settings, ...newSettings };
    
    // 音量の適用
    if (newSettings.volume !== undefined) {
      this.setVolume(newSettings.volume);
    }
    if (newSettings.musicVolume !== undefined) {
      this.setMusicVolume(newSettings.musicVolume);
    }
    
    // ミュート状態の適用
    if (newSettings.musicEnabled !== undefined) {
      if (newSettings.musicEnabled) {
        this.playMusic();
      } else {
        this.pauseMusic();
      }
    }
    
    // 動きの軽減の適用
    if (newSettings.reducedMotion !== undefined) {
      if (newSettings.reducedMotion) {
        document.body.classList.add('reduced-motion');
      } else {
        document.body.classList.remove('reduced-motion');
      }
    }
    
    this.saveSettings();
  }

  /**
   * 設定をlocalStorageから読み込み
   */
  loadSettings() {
    try {
      const saved = localStorage.getItem('blackjack_settings');
      if (saved) {
        const parsed = JSON.parse(saved);
        this.settings = { ...this.settings, ...parsed };
        
        // 動きの軽減の初期状態を反映
        if (this.settings.reducedMotion) {
          document.body.classList.add('reduced-motion');
        }
      }
    } catch (error) {
      console.error('[SFX] 設定の読み込みエラー:', error);
    }
    
    // システムのprefers-reduced-motionも確認
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      this.settings.reducedMotion = true;
      document.body.classList.add('reduced-motion');
    }
  }

  /**
   * 設定をlocalStorageに保存
   */
  saveSettings() {
    try {
      localStorage.setItem('blackjack_settings', JSON.stringify(this.settings));
    } catch (error) {
      console.error('[SFX] 設定の保存エラー:', error);
    }
  }
}

// グローバルインスタンスを作成
const Sfx = new SfxManager();

// モジュールとしてエクスポート（ES6モジュールとして使用する場合）
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Sfx;
}

// グローバルスコープにも公開（レガシー対応）
if (typeof window !== 'undefined') {
  window.Sfx = Sfx;
}
