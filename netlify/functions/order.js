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
  const results = [];

  if (process.env.RESEND_API_KEY && process.env.ORDER_EMAIL) {
    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM || "Website orders <onboarding@resend.dev>",
        to: [process.env.ORDER_EMAIL],
        reply_to: customerEmail,
        subject: "New e-tron Charging Bag order",
        text: emailText
      })
    });
    results.push({ channel: "email", ok: emailResponse.ok });
  }

  if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_FROM_PHONE && process.env.ORDER_PHONE) {
    const smsResponse = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${process.env.TWILIO_ACCOUNT_SID}/Messages.json`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`${process.env.TWILIO_ACCOUNT_SID}:${process.env.TWILIO_AUTH_TOKEN}`).toString("base64")}`,
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: new URLSearchParams({
        From: process.env.TWILIO_FROM_PHONE,
        To: process.env.ORDER_PHONE,
        Body: `New order: ${name}; ${contact}; ${model}; ${price}`
      })
    });
    results.push({ channel: "sms", ok: smsResponse.ok });
  }

  if (!results.length || results.some((result) => !result.ok)) return json(502, { error: "Delivery failed" });
  return json(200, { ok: true });
};
