const nodemailer = require("nodemailer");

const json = (statusCode, body) => ({
  statusCode,
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body)
});

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") return json(405, { error: "Method not allowed" });

  let order;
  try {
    order = JSON.parse(event.body || "{}");
  } catch {
    return json(400, { error: "Invalid request" });
  }

  const { name, contact, customerEmail, model, price } = order;
  if (!name || !contact || !customerEmail || !model || !price) {
    return json(400, { error: "Missing order fields" });
  }

  const emailText = [
    "New e-tron Charging Bag order", "", `Name: ${name}`,
    `Contact: ${contact}`, `Customer email: ${customerEmail}`,
    `Model: ${model}`, `Price: ${price}`
  ].join("\n");
  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD || !process.env.ORDER_EMAIL) {
    return json(503, { error: "Missing Gmail configuration" });
  }

  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_APP_PASSWORD }
    });
    await transporter.sendMail({
      from: process.env.GMAIL_USER,
      to: process.env.ORDER_EMAIL,
      replyTo: customerEmail,
      subject: "New e-tron Charging Bag order",
      text: emailText
    });
    return json(200, { ok: true, channel: "email" });
  } catch (error) {
    console.error("Gmail delivery failed", error);
    return json(502, { error: "Gmail delivery failed" });
  }
};
