import { isSupabaseConfigured, supabase } from "./supabase-client.js";

const ADMIN_EMAILS = (window.HHP_ADMIN_EMAILS || ["kissbalint12@gmail.com"])
  .map((email) => email.toLowerCase().trim());

function showAdminMessage(title, text) {
  const existing = document.getElementById("adminOnlyStatus");
  if (existing) {
    existing.innerHTML = `<strong>${title}</strong><span>${text}</span>`;
    existing.hidden = false;
    return;
  }

  const box = document.createElement("div");
  box.id = "adminOnlyStatus";
  box.style.cssText = "max-width: 760px; margin: 2rem auto; padding: 1rem 1.25rem; border-radius: 8px; background: #fff; color: #1f1f1f; box-shadow: 0 4px 12px rgba(0,0,0,.12); display: grid; gap: .25rem;";
  box.innerHTML = `<strong>${title}</strong><span>${text}</span>`;
  document.body.prepend(box);
}

function isAdminUser(user) {
  return Boolean(user?.email && ADMIN_EMAILS.includes(user.email.toLowerCase().trim()));
}

async function guardAdminPage() {
  document.documentElement.classList.add("admin-checking");

  if (!isSupabaseConfigured) {
    showAdminMessage("Admin ellenőrzés sikertelen", "A Supabase beállítás hiányzik.");
    return;
  }

  const { data } = await supabase.auth.getUser();

  if (!data.user) {
    window.location.href = "login.html";
    return;
  }

  if (!isAdminUser(data.user)) {
    showAdminMessage("Nincs admin jogosultság", "Ez az oldal csak admin fiókkal érhető el.");
    setTimeout(() => {
      window.location.href = "index.html";
    }, 2200);
    return;
  }

  document.documentElement.classList.remove("admin-checking");
}

guardAdminPage();
