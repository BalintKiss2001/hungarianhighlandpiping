const META_PIXEL_ID = "833325489807247";
const CONSENT_KEY = "hhpMetaPixelConsent";

function hasConsent() {
  return window.localStorage.getItem(CONSENT_KEY) === "accepted";
}

function loadMetaPixel() {
  if (!hasConsent() || window.fbq) {
    return;
  }

  window.fbq = function () {
    window.fbq.callMethod
      ? window.fbq.callMethod.apply(window.fbq, arguments)
      : window.fbq.queue.push(arguments);
  };

  if (!window._fbq) {
    window._fbq = window.fbq;
  }

  window.fbq.push = window.fbq;
  window.fbq.loaded = true;
  window.fbq.version = "2.0";
  window.fbq.queue = [];

  const script = document.createElement("script");
  script.async = true;
  script.src = "https://connect.facebook.net/en_US/fbevents.js";

  const firstScript = document.getElementsByTagName("script")[0];
  firstScript.parentNode.insertBefore(script, firstScript);

  window.fbq("init", META_PIXEL_ID);
  window.fbq("track", "PageView");
}

function createConsentBanner() {
  if (hasConsent() || document.getElementById("metaPixelConsent")) {
    return;
  }

  const banner = document.createElement("div");
  banner.id = "metaPixelConsent";
  banner.style.cssText = "position:fixed;left:1rem;right:1rem;bottom:1rem;z-index:6000;max-width:720px;margin:auto;background:#fff;color:#1f1f1f;border-radius:8px;padding:1rem;box-shadow:0 14px 34px rgba(0,0,0,.22);display:grid;gap:.75rem;";
  banner.innerHTML = `
    <p style="margin:0;line-height:1.55;">Az oldal alapvető működéséhez szükséges sütiket használ. Marketing és elemzési sütiket, például a Meta Pixel mérését, csak hozzájárulásod után kapcsolok be.</p>
    <div style="display:flex;flex-wrap:wrap;gap:.5rem;">
      <button type="button" data-meta-consent="accepted" style="border:0;border-radius:8px;background:#006a51;color:#fff;padding:.55rem .85rem;font-weight:700;">Elfogadom</button>
      <button type="button" data-meta-consent="declined" style="border:1px solid #006a51;border-radius:8px;background:#fff;color:#006a51;padding:.55rem .85rem;font-weight:700;">Nem kérem</button>
    </div>
  `;

  banner.addEventListener("click", (event) => {
    const button = event.target.closest("[data-meta-consent]");
    if (!button) {
      return;
    }

    window.localStorage.setItem(CONSENT_KEY, button.dataset.metaConsent);
    banner.remove();
    loadMetaPixel();
  });

  document.body.appendChild(banner);
}

window.hhpTrackMetaEvent = function (eventName, parameters = {}) {
  if (!hasConsent()) {
    return;
  }

  loadMetaPixel();
  window.fbq?.("track", eventName, parameters);
};

document.addEventListener("DOMContentLoaded", () => {
  loadMetaPixel();
  createConsentBanner();
});
