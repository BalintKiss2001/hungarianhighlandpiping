import { isSupabaseConfigured, showConfigMessage, supabase } from "./supabase-client.js";

const statusBox = document.getElementById("registerStatus");
const registerForm = document.getElementById("registerForm");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const passwordConfirmInput = document.getElementById("passwordConfirm");
const registerButton = document.getElementById("registerButton");

function setStatus(message, type = "info") {
  if (!statusBox) {
    return;
  }

  statusBox.textContent = message;
  statusBox.className = `alert alert-${type}`;
}

function validateForm() {
  if (passwordInput.value !== passwordConfirmInput.value) {
    setStatus("A két jelszó nem egyezik.", "warning");
    window.siteFeedback?.error("A két jelszó nem egyezik.");
    return false;
  }

  return true;
}

async function register() {
  if (!isSupabaseConfigured) {
    showConfigMessage(statusBox);
    return;
  }

  if (!registerForm.checkValidity()) {
    registerForm.classList.add("was-validated");
    return;
  }

  if (!validateForm()) {
    return;
  }

  window.siteFeedback?.loading("Fiók létrehozása folyamatban...");

  const { data, error } = await supabase.auth.signUp({
    email: emailInput.value,
    password: passwordInput.value
  });

  if (error) {
    setStatus(error.message, "danger");
    window.siteFeedback?.error(error.message);
    return;
  }

  if (data.user) {
    await supabase.from("profiles").upsert({
      id: data.user.id,
      display_name: "Felhasználó"
    });
  }

  setStatus("Fiók létrehozva. Ha email megerősítés be van kapcsolva, ellenőrizd a postafiókodat.", "success");
  window.siteFeedback?.success("Fiók létrehozva.");
  registerForm.reset();
  registerForm.classList.remove("was-validated");
}

if (!isSupabaseConfigured) {
  showConfigMessage(statusBox);
} else {
  setStatus("Hozz létre fiókot a fórum írásához.", "secondary");
}

registerButton?.addEventListener("click", register);
