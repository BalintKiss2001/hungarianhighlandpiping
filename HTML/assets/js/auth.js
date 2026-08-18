import { isSupabaseConfigured, showConfigMessage, supabase } from "./supabase-client.js";

const statusBox = document.getElementById("authStatus");
const authForm = document.getElementById("authForm");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const signInButton = document.getElementById("signInButton");
const resetPasswordButton = document.getElementById("resetPasswordButton");

function getUsernameFromEmail(email) {
  return email ? email.split("@")[0] : "Felhasználó";
}

function setStatus(message, type = "info") {
  if (!statusBox) {
    return;
  }

  statusBox.textContent = message;
  statusBox.className = `alert alert-${type}`;
}

async function refreshSession() {
  if (!isSupabaseConfigured) {
    showConfigMessage(statusBox);
    return;
  }

  const { data } = await supabase.auth.getUser();
  const user = data.user;

  if (user) {
    await supabase.from("profiles").upsert({
      id: user.id,
      display_name: getUsernameFromEmail(user.email)
    }, {
      onConflict: "id",
      ignoreDuplicates: true
    });
    authForm.hidden = true;
    setStatus("Be vagy jelentkezve. A profil ikon alatt tudsz kijelentkezni.", "success");
  } else {
    authForm.hidden = false;
    setStatus("A fórum írásához jelentkezz be.", "secondary");
  }
}

async function signIn() {
  if (!isSupabaseConfigured) {
    showConfigMessage(statusBox);
    return;
  }

  window.siteFeedback?.loading("Bejelentkezés folyamatban...");

  const { error } = await supabase.auth.signInWithPassword({
    email: emailInput.value,
    password: passwordInput.value
  });

  if (error) {
    setStatus(error.message, "danger");
    window.siteFeedback?.error(error.message);
    return;
  }

  await refreshSession();
  window.siteFeedback?.success("Sikeres bejelentkezés.");
}

async function requestPasswordReset() {
  if (!isSupabaseConfigured) {
    showConfigMessage(statusBox);
    return;
  }

  if (!emailInput.value.trim()) {
    setStatus("Add meg az email címedet, és elküldjük az új jelszó beállításához szükséges linket.", "warning");
    window.siteFeedback?.error("Add meg az email címedet.");
    return;
  }

  window.siteFeedback?.loading("Jelszó-visszaállító email küldése...");

  const { error } = await supabase.auth.resetPasswordForEmail(emailInput.value.trim(), {
    redirectTo: `${window.location.origin}/reset-password.html`
  });

  if (error) {
    setStatus(error.message, "danger");
    window.siteFeedback?.error(error.message);
    return;
  }

  setStatus("Ha ehhez az email címhez tartozik fiók, elküldtük az új jelszó beállító linket.", "success");
  window.siteFeedback?.success("Jelszó-visszaállító email elküldve.");
}

signInButton?.addEventListener("click", signIn);
resetPasswordButton?.addEventListener("click", requestPasswordReset);
authForm?.addEventListener("submit", (event) => {
  event.preventDefault();
  signIn();
});
refreshSession();
