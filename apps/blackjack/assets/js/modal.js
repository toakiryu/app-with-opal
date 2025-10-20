// 共通モーダル管理クラス
(function () {
  "use strict";

  class ModalManager {
    constructor() {
      this.modals = {};
      this.overlay = null;
      this.openModals = new Set();
      this.focusTrapCleanups = new Map();
      this._bindEsc();
      this._bindOverlayClick();
    }

    _initOverlay() {
      if (!this.overlay) {
        this.overlay = document.getElementById("modal-overlay");
      }
    }

    register(id) {
      const modal = document.getElementById(id);
      if (!modal) return;
      this.modals[id] = modal;
      modal.classList.add("hidden");
    }

    open(id) {
      this._initOverlay();

      // チュートリアル中は他モーダルを開かない
      const tutorialPanel = document.querySelector(".tutorial-panel");
      const tutorialOverlay = document.querySelector(".tutorial-overlay");
      const isTutorialActive =
        tutorialPanel && !tutorialPanel.classList.contains("hidden");
      const isOverlayActive =
        tutorialOverlay && !tutorialOverlay.classList.contains("hidden");
      if (isTutorialActive || isOverlayActive) return;

      const modal = this.modals[id];
      if (!modal) return;

      // 既に開いている場合は何もしない
      if (this.openModals.has(id)) return;

      // data-multi="false"なら他が開いていれば開かない
      const allowMulti = modal.getAttribute("data-multi") !== "false";
      if (!allowMulti && this.openModals.size > 0) return;

      // data-close-others="true"なら他を閉じてから開く
      const closeOthers = modal.getAttribute("data-close-others") === "true";
      if (closeOthers) {
        for (const otherId of Array.from(this.openModals)) {
          if (otherId !== id) this.close(otherId);
        }
      }

      // モーダルを開く前のイベント
      const beforeOpenEvent = new CustomEvent("modal:beforeOpen", {
        detail: { id },
      });
      document.dispatchEvent(beforeOpenEvent);

      this.openModals.add(id);

      // data-overlay属性でオーバーレイ表示を制御
      const showOverlay = modal.getAttribute("data-overlay") !== "false";
      if (this.overlay && showOverlay) {
        this.overlay.classList.remove("hidden");
        this.overlay.setAttribute("aria-hidden", "false");
      }

      modal.classList.remove("hidden");
      modal.setAttribute("aria-hidden", "false");

      // data-lock-scroll属性でスクロール固定を制御
      const lockScroll = modal.getAttribute("data-lock-scroll") !== "false";
      if (
        lockScroll &&
        document.body &&
        !document.body.classList.contains("no-scroll")
      ) {
        document.body.classList.add("no-scroll");
      }

      // フォーカストラップ
      const cleanup = this._trapFocus(modal);
      if (cleanup) this.focusTrapCleanups.set(id, cleanup);

      // 最初のフォーカス可能要素にフォーカス
      const focusables = this._getFocusableElements(modal);
      if (focusables.length > 0) {
        focusables[0].focus();
      } else {
        modal.focus();
      }

      // モーダルを開いた後のイベント
      const afterOpenEvent = new CustomEvent("modal:afterOpen", {
        detail: { id },
      });
      document.dispatchEvent(afterOpenEvent);
    }

    close(id) {
      const modal = this.modals[id];
      if (!modal) return;

      // 開いていない場合は何もしない
      if (!this.openModals.has(id)) return;

      // モーダルを閉じる前のイベント
      const beforeCloseEvent = new CustomEvent("modal:beforeClose", {
        detail: { id },
      });
      document.dispatchEvent(beforeCloseEvent);

      // フォーカストラップ解除
      const cleanup = this.focusTrapCleanups.get(id);
      if (cleanup) {
        cleanup();
        this.focusTrapCleanups.delete(id);
      }

      modal.classList.add("hidden");
      modal.setAttribute("aria-hidden", "true");
      this.openModals.delete(id);

      // 残っているモーダルの属性をチェック
      let anyOverlay = false;
      let anyLockScroll = false;
      for (const otherId of Array.from(this.openModals)) {
        const otherModal = this.modals[otherId];
        if (otherModal) {
          if (otherModal.getAttribute("data-overlay") !== "false")
            anyOverlay = true;
          if (otherModal.getAttribute("data-lock-scroll") !== "false")
            anyLockScroll = true;
        }
      }

      // overlay制御
      if (!anyOverlay && this.overlay) {
        this.overlay.classList.add("hidden");
        this.overlay.setAttribute("aria-hidden", "true");
      }

      // スクロール固定制御
      if (
        !anyLockScroll &&
        document.body &&
        document.body.classList.contains("no-scroll")
      ) {
        document.body.classList.remove("no-scroll");
      }

      // モーダルを閉じた後のイベント
      const afterCloseEvent = new CustomEvent("modal:afterClose", {
        detail: { id },
      });
      document.dispatchEvent(afterCloseEvent);
    }

    closeActive() {
      // 全ての開いているモーダルを閉じる
      for (const id of Array.from(this.openModals)) {
        this.close(id);
      }
    }

    _bindEsc() {
      document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && this.openModals.size > 0) {
          e.preventDefault();
          this.closeActive();
        }
      });
    }

    _bindOverlayClick() {
      document.addEventListener("click", (e) => {
        if (e.target && e.target.id === "modal-overlay") {
          this.closeActive();
        }
      });
    }

    _getFocusableElements(container) {
      if (!container) return [];
      const selector =
        'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';
      return Array.from(container.querySelectorAll(selector));
    }

    _trapFocus(modal) {
      if (!modal) return null;

      const focusables = this._getFocusableElements(modal);
      if (focusables.length === 0) return null;

      const firstFocusable = focusables[0];
      const lastFocusable = focusables[focusables.length - 1];

      const handleTab = (e) => {
        if (e.key !== "Tab") return;

        if (e.shiftKey) {
          if (document.activeElement === firstFocusable) {
            e.preventDefault();
            lastFocusable.focus();
          }
        } else {
          if (document.activeElement === lastFocusable) {
            e.preventDefault();
            firstFocusable.focus();
          }
        }
      };

      modal.addEventListener("keydown", handleTab);

      return () => {
        modal.removeEventListener("keydown", handleTab);
      };
    }
  }

  window.ModalManager = new ModalManager();
})();
