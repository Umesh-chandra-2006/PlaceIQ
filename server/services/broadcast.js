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

  // Process in chunks of 5 to avoid Twilio WhatsApp rate limits / HTTP timeouts
  const chunkSize = 5;
  const results = [];
  
  for (let i = 0; i < phoneNumbers.length; i += chunkSize) {
    const chunk = phoneNumbers.slice(i, i + chunkSize);
    const chunkPromises = chunk.map(to =>
      client.messages.create({
        from: `whatsapp:${process.env.TWILIO_WHATSAPP_FROM || "+14155238886"}`,
        to: `whatsapp:${to}`,
        body
      })
    );
    const chunkResults = await Promise.allSettled(chunkPromises);
    results.push(...chunkResults);
    
    // Throttle 100ms between batches to preserve Twilio's connection pool
    if (i + chunkSize < phoneNumbers.length) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  return results;
}

module.exports = { broadcastJob };
