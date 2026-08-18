import { isSupabaseConfigured, showConfigMessage, supabase } from "./supabase-client.js";

const statusBox = document.getElementById("resetStatus");
const resetForm = document.getElementById("resetPasswordForm");
const passwordInput = document.getElementById("newPassword");
const passwordConfirmInput = document.getElementById("newPasswordConfirm");
const savePasswordButton = document.getElementById("savePasswordButton");

let canUpdatePassword = false;

function setStatus(message, type = "info") {
  if (!statusBox) {
    return;
  }

  statusBox.textContent = message;
  statusBox.className = `alert alert-${type}`;
}

function showResetForm() {
  canUpdatePassword = true;
  resetForm.hidden = false;
  setStatus("Add meg az új jelszavadat.", "secondary");
}

function validateForm() {
  if (!resetForm.checkValidity()) {
    resetForm.classList.add("was-validated");
    return false;
  }

  if (passwordInput.value !== passwordConfirmInput.value) {
    setStatus("A két jelszó nem egyezik.", "warning");
    window.siteFeedback?.error("A két jelszó nem egyezik.");
    return false;
  }

  return true;
}

async function savePassword() {
  if (!canUpdatePassword) {
    setStatus("A jelszó-visszaállító link hiányzik vagy lejárt. Kérj új linket a bejelentkezési oldalon.", "warning");
    window.siteFeedback?.error("Érvénytelen vagy lejárt visszaállító link.");
    return;
  }

  if (!validateForm()) {
    return;
  }

  window.siteFeedback?.loading("Új jelszó mentése...");

  const { error } = await supabase.auth.updateUser({
    password: passwordInput.value
  });

  if (error) {
    setStatus(error.message, "danger");
    window.siteFeedback?.error(error.message);
    return;
  }

  setStatus("Az új jelszó mentve. Most már be tudsz jelentkezni vele.", "success");
  window.siteFeedback?.success("Az új jelszó mentve.");
  resetForm.reset();
  resetForm.hidden = true;

  await supabase.auth.signOut();
  window.setTimeout(() => {
    window.location.href = "login.html";
  }, 1800);
}

async function initResetPassword() {
  if (!isSupabaseConfigured) {
    showConfigMessage(statusBox);
    return;
  }

  const params = new URLSearchParams(window.location.search);
  const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));
  const errorDescription = params.get("error_description") || hashParams.get("error_description");
  const hasRecoveryIntent =
    params.get("type") === "recovery" ||
    hashParams.get("type") === "recovery" ||
    params.has("code") ||
    hashParams.has("access_token");

  if (errorDescription) {
    setStatus(errorDescription, "danger");
    return;
  }

  supabase.auth.onAuthStateChange((event) => {
    if (event === "PASSWORD_RECOVERY") {
      showResetForm();
    }
  });

  const { data } = await supabase.auth.getSession();
  if (data.session && hasRecoveryIntent) {
    showResetForm();
    return;
  }

  setStatus("Nyisd meg az emailben kapott jelszó-visszaállító linket. Ha a link lejárt, kérj újat a bejelentkezési oldalon.", "warning");
}

savePasswordButton?.addEventListener("click", savePassword);
resetForm?.addEventListener("submit", (event) => {
  event.preventDefault();
  savePassword();
});
initResetPassword();
