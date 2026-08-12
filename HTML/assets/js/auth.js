import { isSupabaseConfigured, showConfigMessage, supabase } from "./supabase-client.js";

const statusBox = document.getElementById("authStatus");
const authForm = document.getElementById("authForm");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const signInButton = document.getElementById("signInButton");
const signOutButton = document.getElementById("signOutButton");
const userEmail = document.getElementById("userEmail");

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
    userEmail.textContent = user.email || "";
    authForm.hidden = true;
    signOutButton.hidden = false;
    setStatus("Be vagy jelentkezve.", "success");
  } else {
    userEmail.textContent = "";
    authForm.hidden = false;
    signOutButton.hidden = true;
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
signOutButton?.addEventListener("click", async () => {
  window.siteFeedback?.loading("Kijelentkezés...");
  await supabase.auth.signOut();
  await refreshSession();
  window.siteFeedback?.success("Sikeres kijelentkezés.");
});

refreshSession();
