import { isSupabaseConfigured, showConfigMessage, supabase } from "./supabase-client.js";

const statusBox = document.getElementById("authStatus");
const authForm = document.getElementById("authForm");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const signInButton = document.getElementById("signInButton");

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
    authForm.hidden = true;
    setStatus("Be vagy jelentkezve. A profil ikon alatt tudsz kijelentkezni.", "success");
  } else {
    authForm.hidden = false;
    setStatus("A fórum írásához jelentkezz be.", "secondary");
  }
}

async function signIn() {
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

signInButton?.addEventListener("click", signIn);
refreshSession();
