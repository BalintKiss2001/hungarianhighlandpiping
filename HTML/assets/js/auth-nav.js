import { isSupabaseConfigured, supabase } from "./supabase-client.js";

const ADMIN_EMAILS = (window.HHP_ADMIN_EMAILS || ["kissbalint12@gmail.com"])
  .map((email) => email.toLowerCase().trim());

function injectAuthNavStyles() {
  if (document.getElementById("authNavStyles")) {
    return;
  }

  const style = document.createElement("style");
  style.id = "authNavStyles";
  style.textContent = `
    .navbar,
    .navbar .container,
    .navbar-collapse,
    .navbar-nav {
      overflow: visible !important;
    }

    .navbar .container {
      max-width: min(1720px, calc(100% - 2rem));
    }

    .navbar-brand {
      flex: 0 0 auto;
      margin-right: clamp(1rem, 2vw, 2.5rem);
    }

    .navbar-collapse {
      flex: 1 1 auto;
    }

    .navbar-nav {
      width: 100%;
      align-items: center;
      justify-content: space-between;
      gap: clamp(0.35rem, 0.8vw, 1rem) !important;
    }

    .navbar-nav .nav-item {
      display: flex;
      align-items: center;
    }

    .navbar-nav .nav-item[hidden],
    .auth-account-item[hidden],
    .auth-admin-item[hidden],
    .auth-nav-item[hidden] {
      display: none !important;
    }

    .navbar-nav .nav-link {
      white-space: nowrap;
      padding-left: 0 !important;
      padding-right: 0 !important;
    }

    .nav-item.nav-auth-start {
      margin-left: 0;
    }

    .nav-item.nav-language-item {
      margin-left: 0;
    }

    .auth-nav-item {
      position: relative;
      display: flex;
      align-items: center;
    }

    .auth-account-item {
      position: relative;
      display: flex;
      align-items: center;
    }

    .auth-account-button {
      border: 0;
      background: transparent;
      color: rgba(255, 255, 255, 0.75);
      padding: 0;
      white-space: nowrap;
    }

    .auth-account-button:hover,
    .auth-account-button[aria-expanded="true"] {
      color: #ffffff;
    }

    .auth-account-button::after {
      content: "";
      display: inline-block;
      margin-left: 0.35rem;
      vertical-align: 0.15em;
      border-top: 0.3em solid;
      border-right: 0.3em solid transparent;
      border-left: 0.3em solid transparent;
    }

    .auth-account-menu {
      position: absolute;
      right: 0;
      top: calc(100% + 0.65rem);
      width: 190px;
      background: #ffffff;
      border-radius: 8px;
      padding: 0.5rem;
      box-shadow: 0 16px 36px rgba(0, 0, 0, 0.22);
      z-index: 5000;
    }

    .auth-account-menu[hidden] {
      display: none;
    }

    .auth-account-menu a {
      display: block;
      color: #006a51;
      text-decoration: none;
      padding: 0.65rem 0.75rem;
      border-radius: 6px;
      font-weight: 600;
    }

    .auth-account-menu a:hover {
      background: #ebdbc9;
    }

    .auth-admin-item {
      position: relative;
    }

    .auth-profile-button {
      width: 40px;
      height: 40px;
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
      z-index: 5000;
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

    @media (max-width: 1199px) {
      .navbar-nav {
        gap: 0.45rem !important;
        font-size: 0.95rem;
      }
    }

    @media (max-width: 991px) {
      .navbar-brand {
        margin-right: 0;
      }

      .navbar-nav {
        align-items: flex-start;
        justify-content: flex-start;
        gap: 0.55rem !important;
        padding-top: 1rem;
      }

      .nav-item.nav-auth-start,
      .nav-item.nav-language-item {
        margin-left: 0;
      }

      .auth-profile-menu {
        left: 0;
        right: auto;
        top: calc(100% + 0.35rem);
      }

      .auth-account-menu {
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

function findItemByHref(navList, href) {
  return navList.querySelector(`a[href="${href}"]`)?.closest(".nav-item") || null;
}

function isAdminUser(user) {
  return Boolean(user?.email && ADMIN_EMAILS.includes(user.email.toLowerCase().trim()));
}

function ensureMaterialsLink(navList) {
  let item = findItemByHref(navList, "oktatoanyagok.html");

  if (!item) {
    item = document.createElement("li");
    item.className = "nav-item";
    item.innerHTML = '<a class="nav-link" href="oktatoanyagok.html">Oktatóanyagok</a>';
  }

  const forumItem = findItemByHref(navList, "forum.html");
  if (forumItem) {
    forumItem.insertAdjacentElement("beforebegin", item);
    return item;
  }

  const blogItem = findItemByHref(navList, "blog.html");
  if (blogItem) {
    blogItem.insertAdjacentElement("afterend", item);
    return item;
  }

  navList.appendChild(item);
  return item;
}

function normalizeNavOrder(navList) {
  ensureMaterialsLink(navList);

  [
    "index.html",
    "galéria.html",
    "hanganyagok.html",
    "blog.html",
    "oktatoanyagok.html",
    "forum.html",
    "oldal_3_kapcsolat.html",
    "admin/index.html",
    "login.html",
    "register.html"
  ].forEach((href) => {
    const item = findItemByHref(navList, href);
    if (item) {
      item.classList.remove("nav-auth-start", "nav-language-item");
      navList.appendChild(item);
    }
  });

  const languageItem = findLanguageItem(navList);
  if (languageItem) {
    languageItem.classList.remove("nav-auth-start");
    languageItem.classList.add("nav-language-item");
    navList.appendChild(languageItem);
  }

  const authStart = getVisibleAuthStart(navList);
  authStart?.classList.add("nav-auth-start");
}

function getVisibleAuthStart(navList) {
  return [
    navList.querySelector(".auth-account-item"),
    findItemByHref(navList, "login.html"),
    findItemByHref(navList, "register.html"),
    findLanguageItem(navList)
  ].find((item) => item && !item.hidden) || null;
}

function createAccountItem() {
  const item = document.createElement("li");
  item.className = "nav-item auth-account-item";
  item.innerHTML = `
    <button class="auth-account-button" type="button" aria-label="Fiók menü" aria-expanded="false">Fiók</button>
    <div class="auth-account-menu" hidden>
      <a href="login.html">Bejelentkezés</a>
      <a href="register.html">Regisztráció</a>
    </div>
  `;

  return item;
}

function createAdminItem() {
  const item = document.createElement("li");
  item.className = "nav-item auth-account-item auth-admin-item";
  item.hidden = true;
  item.innerHTML = `
    <button class="auth-account-button" type="button" aria-label="Admin menü" aria-expanded="false">Admin</button>
    <div class="auth-account-menu auth-admin-menu" hidden>
      <a href="admin/index.html">Tartalomkezelő</a>
      <a href="fellepesek.html">Fellépések</a>
      <a href="rendezveny-csomagok.html">Csomagok</a>
      <a href="tanulas.html">Tanulás</a>
    </div>
  `;

  return item;
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

function getUsernameFromEmail(email) {
  return email ? email.split("@")[0] : "Nem vagy bejelentkezve.";
}

async function initAuthNav() {
  const navList = document.querySelector(".navbar-nav");
  if (!navList) {
    return;
  }

  injectAuthNavStyles();
  normalizeNavOrder(navList);

  const accountItem = createAccountItem();
  const adminItem = createAdminItem();
  const profileItem = createProfileItem();
  const languageItem = findLanguageItem(navList);

  if (languageItem) {
    languageItem.insertAdjacentElement("beforebegin", adminItem);
    languageItem.insertAdjacentElement("beforebegin", accountItem);
    languageItem.insertAdjacentElement("afterend", profileItem);
  } else {
    navList.appendChild(adminItem);
    navList.appendChild(accountItem);
    navList.appendChild(profileItem);
  }

  const accountButton = accountItem.querySelector(".auth-account-button");
  const accountMenu = accountItem.querySelector(".auth-account-menu");
  const adminButton = adminItem.querySelector(".auth-account-button");
  const adminMenu = adminItem.querySelector(".auth-account-menu");
  const button = profileItem.querySelector(".auth-profile-button");
  const menu = profileItem.querySelector(".auth-profile-menu");
  const emailValue = profileItem.querySelector("[data-auth-profile-email]");
  const actions = profileItem.querySelector("[data-auth-profile-actions]");

  setLinkHidden("login.html", true);
  setLinkHidden("register.html", true);
  adminItem.hidden = true;
  profileItem.hidden = true;

  function applyUserState(user) {
    setLinkHidden("login.html", true);
    setLinkHidden("register.html", true);
    adminItem.hidden = !isAdminUser(user);
    accountItem.hidden = Boolean(user);
    profileItem.hidden = !user;
    accountMenu.hidden = true;
    adminMenu.hidden = true;
    accountButton.setAttribute("aria-expanded", "false");
    adminButton.setAttribute("aria-expanded", "false");
    emailValue.textContent = user ? getUsernameFromEmail(user.email) : "Nem vagy bejelentkezve.";
    renderActions(actions, user);

    document.querySelectorAll(".nav-auth-start").forEach((item) => {
      item.classList.remove("nav-auth-start");
    });

    const authStart = getVisibleAuthStart(navList);
    authStart?.classList.add("nav-auth-start");
  }

  accountButton.addEventListener("click", () => {
    const isOpen = !accountMenu.hidden;
    accountMenu.hidden = isOpen;
    accountButton.setAttribute("aria-expanded", String(!isOpen));
    adminMenu.hidden = true;
    adminButton.setAttribute("aria-expanded", "false");
    menu.hidden = true;
    button.setAttribute("aria-expanded", "false");
  });

  adminButton.addEventListener("click", () => {
    const isOpen = !adminMenu.hidden;
    adminMenu.hidden = isOpen;
    adminButton.setAttribute("aria-expanded", String(!isOpen));
    accountMenu.hidden = true;
    accountButton.setAttribute("aria-expanded", "false");
    menu.hidden = true;
    button.setAttribute("aria-expanded", "false");
  });

  button.addEventListener("click", () => {
    const isOpen = !menu.hidden;
    menu.hidden = isOpen;
    button.setAttribute("aria-expanded", String(!isOpen));
    accountMenu.hidden = true;
    accountButton.setAttribute("aria-expanded", "false");
    adminMenu.hidden = true;
    adminButton.setAttribute("aria-expanded", "false");
  });

  document.addEventListener("click", (event) => {
    if (!profileItem.contains(event.target) && !accountItem.contains(event.target) && !adminItem.contains(event.target)) {
      accountMenu.hidden = true;
      accountButton.setAttribute("aria-expanded", "false");
      adminMenu.hidden = true;
      adminButton.setAttribute("aria-expanded", "false");
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
