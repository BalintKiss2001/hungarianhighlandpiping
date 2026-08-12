import { isSupabaseConfigured, showConfigMessage, supabase } from "./supabase-client.js";

const statusBox = document.getElementById("authStatus");
const authForm = document.getElementById("authForm");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const signInButton = document.getElementById("signInButton");
const signUpButton = document.getElementById("signUpButton");
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
    setStatus("A forum irasahoz jelentkezz be vagy hozz letre fiokot.", "secondary");
  }
}

async function signIn() {
  window.siteFeedback?.loading("Bejelentkezes folyamatban...");

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
  window.siteFeedback?.success("Sikeres bejelentkezes.");
}

async function signUp() {
  window.siteFeedback?.loading("Fiok letrehozasa folyamatban...");

  const { error } = await supabase.auth.signUp({
    email: emailInput.value,
    password: passwordInput.value
  });

  if (error) {
    setStatus(error.message, "danger");
    window.siteFeedback?.error(error.message);
    return;
  }

  setStatus("Fiok letrehozva. Ha email megerosites be van kapcsolva, ellenorizd a postafiokodat.", "success");
  window.siteFeedback?.success("Fiok letrehozva.");
}

signInButton?.addEventListener("click", signIn);
signUpButton?.addEventListener("click", signUp);
signOutButton?.addEventListener("click", async () => {
  window.siteFeedback?.loading("Kijelentkezes...");
  await supabase.auth.signOut();
  await refreshSession();
  window.siteFeedback?.success("Sikeres kijelentkezes.");
});

refreshSession();
