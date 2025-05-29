const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const functions = require("firebase-functions");
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "thehungarianhighlandpiper@gmail.com",
    pass: "rydqqhjhoqtnastl"
  }
});

exports.sendBookingConfirmation = onDocumentCreated("bookings/{bookingId}", async (event) => {
  const data = event.data.data();

  const mailOptions = {
    from: '"Foglalás" <thehungarianhighlandpiper@gmail.com>',
    to: data.email,
    subject: "Foglalás visszaigazolása",
    text: `
Kedves ${data.name}!

Köszönjük foglalását!

Részletek:
• Időpont: ${data.start}
• Típus: ${data.type}
• Ár: ${data.price} HUF

Üdvözlettel:
Kiss Bálint
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log("Email elküldve: " + data.email);
  } catch (error) {
    console.error("Hiba az email küldésekor:", error);
  }
});
