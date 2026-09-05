import { isSupabaseConfigured, showConfigMessage, supabase } from "./supabase-client.js";

const statusBox = document.getElementById("waitlistStatus");
const waitlistForm = document.getElementById("waitlistForm");
const nameInput = document.getElementById("waitlistName");
const emailInput = document.getElementById("waitlistEmail");
const experienceInput = document.getElementById("waitlistExperience");
const messageInput = document.getElementById("waitlistMessage");
const submitButton = document.getElementById("waitlistButton");
const NOTIFICATION_ENDPOINT = "https://formspree.io/f/movdzdbz";

function setStatus(message, type = "info") {
  if (!statusBox) {
    return;
  }

  statusBox.textContent = message;
  statusBox.className = `alert alert-${type} waitlist-status`;
}

function setSubmitting(isSubmitting) {
  if (!submitButton) {
    return;
  }

  submitButton.disabled = isSubmitting;
  submitButton.textContent = isSubmitting ? "Jelentkezés mentése..." : "Jelentkezés küldése";
}

async function sendEmailNotification(signup) {
  const response = await fetch(NOTIFICATION_ENDPOINT, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      subject: "Új várólista jelentkezés",
      name: signup.name,
      email: signup.email,
      experience: signup.experience,
      message: signup.message || "Nincs megadva.",
      source: signup.source_page
    })
  });

  if (!response.ok) {
    throw new Error("Az email értesítés küldése sikertelen.");
  }
}

async function submitWaitlist(event) {
  event.preventDefault();

  if (!isSupabaseConfigured) {
    showConfigMessage(statusBox);
    return;
  }

  if (!waitlistForm.checkValidity()) {
    waitlistForm.classList.add("was-validated");
    return;
  }

  setSubmitting(true);
  window.siteFeedback?.loading("Várólista jelentkezés mentése...");
  const signup = {
    name: nameInput.value.trim(),
    email: emailInput.value.trim().toLowerCase(),
    experience: experienceInput.value,
    message: messageInput.value.trim() || null,
    source_page: window.location.pathname,
    updated_at: new Date().toISOString()
  };

  const { error } = await supabase
    .from("waitlist_signups")
    .insert(signup);

  if (error) {
    setSubmitting(false);
    if (error.code === "23505") {
      setStatus("Ezzel az email címmel már szerepelsz a várólistán.", "success");
      window.siteFeedback?.success("Már rajta vagy a várólistán.");
      waitlistForm.reset();
      waitlistForm.classList.remove("was-validated");
      return;
    }

    setStatus(error.message, "danger");
    window.siteFeedback?.error(error.message);
    return;
  }

  try {
    await sendEmailNotification(signup);
  } catch (notificationError) {
    setSubmitting(false);
    console.warn("Várólista email értesítés sikertelen:", notificationError);
    setStatus("A jelentkezésedet rögzítettem, de az email értesítés küldése sikertelen volt. Köszönöm, rajta vagy a listán.", "warning");
    window.siteFeedback?.success("A jelentkezésedet rögzítettem.");
    waitlistForm.reset();
    waitlistForm.classList.remove("was-validated");
    return;
  }

  setSubmitting(false);
  setStatus("Köszönöm, felkerültél a várólistára. Emailben kereslek, amikor új hely nyílik.", "success");
  window.siteFeedback?.success("A jelentkezésedet rögzítettem.");
  window.hhpTrackMetaEvent?.("Lead", {
    content_name: "Skótduda oktatás várólista",
    content_category: "waitlist"
  });
  waitlistForm.reset();
  waitlistForm.classList.remove("was-validated");
}

if (!isSupabaseConfigured) {
  showConfigMessage(statusBox);
} else {
  setStatus("Töltsd ki az űrlapot, és rögzítem a jelentkezésedet.", "secondary");
}

waitlistForm?.addEventListener("submit", submitWaitlist);
