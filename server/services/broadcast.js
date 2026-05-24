/**
 * Service to broadcast job alerts via Twilio WhatsApp.
 */
const twilio = require("twilio");

async function broadcastJob(phoneNumbers, job) {
  if (!process.env.TWILIO_SID || !process.env.TWILIO_AUTH) {
    console.log("Twilio credentials missing. Skipping broadcast.");
    return;
  }

  const client = twilio(process.env.TWILIO_SID, process.env.TWILIO_AUTH);

  const body =
    `📢 *${job.company} — ${job.title}*\n` +
    `CTC: ${job.ctc}\n` +
    `Deadline: ${new Date(job.deadline).toDateString()}\n` +
    `Apply: ${job.sourceUrl || "Check portal"}`;

  const results = await Promise.allSettled(
    phoneNumbers.map(to =>
      client.messages.create({
        from: `whatsapp:${process.env.TWILIO_WHATSAPP_FROM || "+14155238886"}`,
        to: `whatsapp:${to}`,
        body
      })
    )
  );

  return results;
}

module.exports = { broadcastJob };
