(function () {
  const style = document.createElement("style");
  style.textContent = `
    .site-feedback {
      position: fixed;
      inset: 0;
      z-index: 2000;
      display: grid;
      place-items: center;
      padding: 1rem;
      background: rgba(31, 31, 31, 0.34);
      opacity: 0;
      pointer-events: none;
      transition: opacity 160ms ease;
    }

    .site-feedback.is-visible {
      opacity: 1;
      pointer-events: auto;
    }

    .site-feedback__panel {
      width: min(100%, 360px);
      background: #ffffff;
      border-radius: 8px;
      padding: 1.5rem;
      text-align: center;
      box-shadow: 0 18px 45px rgba(0, 0, 0, 0.24);
    }

    .site-feedback__icon {
      width: 58px;
      height: 58px;
      margin: 0 auto 1rem;
      border-radius: 50%;
      display: grid;
      place-items: center;
      color: #ffffff;
      font-size: 1.8rem;
      font-weight: 700;
      background: #006a51;
    }

    .site-feedback__icon.is-loading {
      border: 5px solid rgba(0, 106, 81, 0.16);
      border-top-color: #006a51;
      background: transparent;
      animation: site-feedback-spin 900ms linear infinite;
    }

    .site-feedback__icon.is-success {
      background: #006a51;
    }

    .site-feedback__icon.is-error {
      background: #b42318;
    }

    .site-feedback__title {
      margin: 0 0 0.35rem;
      color: #006a51;
      font-size: 1.25rem;
      font-weight: 700;
    }

    .site-feedback__message {
      margin: 0;
      color: #333333;
      line-height: 1.5;
    }

    @keyframes site-feedback-spin {
      to {
        transform: rotate(360deg);
      }
    }
  `;

  const overlay = document.createElement("div");
  overlay.className = "site-feedback";
  overlay.setAttribute("role", "status");
  overlay.setAttribute("aria-live", "polite");
  overlay.innerHTML = `
    <div class="site-feedback__panel">
      <div class="site-feedback__icon is-loading" aria-hidden="true"></div>
      <h2 class="site-feedback__title">Betöltés...</h2>
      <p class="site-feedback__message">Kérlek várj egy pillanatot.</p>
    </div>
  `;

  function ensureOverlay() {
    if (!document.body.contains(overlay)) {
      document.body.appendChild(style);
      document.body.appendChild(overlay);
    }
  }

  function setFeedback(type, title, message, autoHideMs) {
    ensureOverlay();

    const icon = overlay.querySelector(".site-feedback__icon");
    const titleElement = overlay.querySelector(".site-feedback__title");
    const messageElement = overlay.querySelector(".site-feedback__message");

    icon.className = `site-feedback__icon is-${type}`;
    icon.textContent = type === "loading" ? "" : type === "success" ? "OK" : "!";
    titleElement.textContent = title;
    messageElement.textContent = message || "";
    overlay.classList.add("is-visible");

    if (autoHideMs) {
      window.clearTimeout(window.__siteFeedbackTimer);
      window.__siteFeedbackTimer = window.setTimeout(() => {
        overlay.classList.remove("is-visible");
      }, autoHideMs);
    }
  }

  window.siteFeedback = {
    loading(message) {
      setFeedback("loading", "Betöltés...", message || "Kérlek várj egy pillanatot.");
    },
    success(message) {
      setFeedback("success", "Sikeres művelet", message || "A művelet sikeresen lefutott.", 1800);
    },
    error(message) {
      setFeedback("error", "Hiba történt", message || "Kérlek próbáld újra.", 2600);
    },
    hide() {
      overlay.classList.remove("is-visible");
    }
  };
})();
