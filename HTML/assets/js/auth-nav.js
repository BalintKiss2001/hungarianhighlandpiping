import { isSupabaseConfigured, supabase } from "./supabase-client.js";

function injectAuthNavStyles() {
  if (document.getElementById("authNavStyles")) {
    return;
  }

  const style = document.createElement("style");
  style.id = "authNavStyles";
  style.textContent = `
    .auth-nav-item {
      position: relative;
      display: flex;
      align-items: center;
    }

    .auth-profile-button {
      width: 38px;
      height: 38px;
      border: 1px solid rgba(255, 255, 255, 0.72);
      border-radius: 50%;
      background: transparent;
      position: relative;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 0;
    }

    .auth-profile-button::before {
      content: "";
      width: 10px;
      height: 10px;
      border: 2px solid #ffffff;
      border-radius: 50%;
      position: absolute;
      top: 8px;
    }

    .auth-profile-button::after {
      content: "";
      width: 18px;
      height: 9px;
      border: 2px solid #ffffff;
      border-bottom: 0;
      border-radius: 16px 16px 0 0;
      position: absolute;
      bottom: 8px;
    }

    .auth-profile-menu {
      position: absolute;
      right: 0;
      top: calc(100% + 0.65rem);
      width: min(280px, calc(100vw - 2rem));
      background: #ffffff;
      color: #1f1f1f;
      border-radius: 8px;
      padding: 1rem;
      box-shadow: 0 16px 36px rgba(0, 0, 0, 0.22);
      z-index: 3000;
    }

    .auth-profile-menu[hidden] {
      display: none;
    }

    .auth-profile-menu__label {
      color: #006a51;
      font-size: 0.78rem;
      font-weight: 700;
      margin-bottom: 0.2rem;
    }

    .auth-profile-menu__value {
      margin: 0 0 0.85rem;
      overflow-wrap: anywhere;
    }

    @media (max-width: 991px) {
      .auth-profile-menu {
        left: 0;
        right: auto;
        top: calc(100% + 0.35rem);
      }
    }
  `;

  document.head.appendChild(style);
}

function findLanguageItem(navList) {
  return Array.from(navList.querySelectorAll("li")).find((item) => {
    const link = item.querySelector("a");
    return link && link.textContent.trim().toUpperCase() === "HU";
  });
}

function createProfileItem() {
  const item = document.createElement("li");
  item.className = "nav-item auth-nav-item";
  item.innerHTML = `
    <button class="auth-profile-button" type="button" aria-label="Profil menü" aria-expanded="false"></button>
    <div class="auth-profile-menu" hidden>
      <div class="auth-profile-menu__label">Profil</div>
      <p class="auth-profile-menu__value" data-auth-profile-email>Nem vagy bejelentkezve.</p>
      <div class="d-flex flex-wrap gap-2" data-auth-profile-actions></div>
    </div>
  `;

  return item;
}

function setLinkHidden(href, hidden) {
  document.querySelectorAll(`.navbar-nav a[href="${href}"]`).forEach((link) => {
    const item = link.closest(".nav-item");
    if (item) {
      item.hidden = hidden;
    }
  });
}

function renderActions(container, user) {
  container.innerHTML = "";

  if (user) {
    const logoutButton = document.createElement("button");
    logoutButton.type = "button";
    logoutButton.className = "btn btn-outline-danger btn-sm";
    logoutButton.textContent = "Kijelentkezés";
    logoutButton.addEventListener("click", async () => {
      window.siteFeedback?.loading("Kijelentkezés...");
      await supabase.auth.signOut();
      window.siteFeedback?.success("Sikeres kijelentkezés.");
      window.location.href = "index.html";
    });
    container.appendChild(logoutButton);
    return;
  }

  const loginLink = document.createElement("a");
  loginLink.className = "btn btn-success btn-sm";
  loginLink.href = "login.html";
  loginLink.textContent = "Bejelentkezés";

  const registerLink = document.createElement("a");
  registerLink.className = "btn btn-outline-success btn-sm";
  registerLink.href = "register.html";
  registerLink.textContent = "Regisztráció";

  container.append(loginLink, registerLink);
}

async function initAuthNav() {
  const navList = document.querySelector(".navbar-nav");
  if (!navList) {
    return;
  }

  injectAuthNavStyles();

  const profileItem = createProfileItem();
  const languageItem = findLanguageItem(navList);

  if (languageItem) {
    languageItem.insertAdjacentElement("afterend", profileItem);
  } else {
    navList.appendChild(profileItem);
  }

  const button = profileItem.querySelector(".auth-profile-button");
  const menu = profileItem.querySelector(".auth-profile-menu");
  const emailValue = profileItem.querySelector("[data-auth-profile-email]");
  const actions = profileItem.querySelector("[data-auth-profile-actions]");

  function applyUserState(user) {
    setLinkHidden("login.html", Boolean(user));
    setLinkHidden("register.html", Boolean(user));
    emailValue.textContent = user?.email || "Nem vagy bejelentkezve.";
    renderActions(actions, user);
  }

  button.addEventListener("click", () => {
    const isOpen = !menu.hidden;
    menu.hidden = isOpen;
    button.setAttribute("aria-expanded", String(!isOpen));
  });

  document.addEventListener("click", (event) => {
    if (!profileItem.contains(event.target)) {
      menu.hidden = true;
      button.setAttribute("aria-expanded", "false");
    }
  });

  if (!isSupabaseConfigured) {
    applyUserState(null);
    return;
  }

  const { data } = await supabase.auth.getUser();
  applyUserState(data.user);

  supabase.auth.onAuthStateChange((_event, session) => {
    applyUserState(session?.user || null);
  });
}

document.addEventListener("DOMContentLoaded", initAuthNav);
