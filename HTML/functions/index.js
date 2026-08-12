const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const { defineSecret } = require("firebase-functions/params");

const resendApiKey = defineSecret("RESEND_API_KEY");
const RESEND_EMAIL_ENDPOINT = "https://api.resend.com/emails";

function getSenderAddress() {
  return process.env.RESEND_FROM || "Kiss Balint Skotdudas <ertesites@your-domain.hu>";
}

function getAdminAddress() {
  return process.env.NOTIFICATION_TO || "thehungarianhighlandpiper@gmail.com";
}

function buildBookingText(data) {
  return `
Kedves ${data.name}!

Koszonjuk foglalasat!

Reszletek:
- Idopont: ${data.start}
- Tipus: ${data.type}
- Ar: ${data.price} HUF

Udvozlettel:
Kiss Balint
  `;
}

async function sendResendEmail(apiKey, message) {
  const response = await fetch(RESEND_EMAIL_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(message)
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Resend API error ${response.status}: ${errorText}`);
  }

  return response.json();
}

exports.sendBookingConfirmation = onDocumentCreated({
  document: "bookings/{bookingId}",
  secrets: [resendApiKey]
}, async (event) => {
  if (!event.data) {
    console.warn("Booking notification skipped: missing Firestore event data.");
    return;
  }

  const data = event.data.data();
  const apiKey = resendApiKey.value();
  const from = getSenderAddress();
  const adminAddress = getAdminAddress();

  try {
    await sendResendEmail(apiKey, {
      from,
      to: [data.email],
      reply_to: adminAddress,
      subject: "Foglalas visszaigazolasa",
      text: buildBookingText(data)
    });

    await sendResendEmail(apiKey, {
      from,
      to: [adminAddress],
      reply_to: data.email,
      subject: `Uj foglalas: ${data.name}`,
      text: `
Uj foglalas erkezett.

Nev: ${data.name}
Email: ${data.email}
Idopont: ${data.start}
Tipus: ${data.type}
Ar: ${data.price} HUF
      `
    });

    console.log("Resend booking notifications sent:", data.email);
  } catch (error) {
    console.error("Resend email sending failed:", error);
  }
});
