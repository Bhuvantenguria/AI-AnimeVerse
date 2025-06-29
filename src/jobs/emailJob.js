import nodemailer from "nodemailer"

export async function processEmailJob(data, fastify) {
  const { to, subject, template, templateData } = data

  try {
    const transporter = nodemailer.createTransporter({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      secure: process.env.EMAIL_PORT === "465",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    })

    const html = generateEmailTemplate(template, templateData)

    await transporter.sendMail({
      from: process.env.EMAIL_FROM || "noreply@mangaverse.com",
      to,
      subject,
      html,
    })

    fastify.log.info(`Email sent successfully to ${to}`)
    return { success: true }
  } catch (error) {
    fastify.log.error("Email job error:", error)
    throw error
  }
}

function generateEmailTemplate(template, data) {
  const templates = {
    welcome: `
      <h1>Welcome to MangaVerse!</h1>
      <p>Hi ${data.name},</p>
      <p>Welcome to the ultimate anime and manga experience!</p>
    `,
    achievement: `
      <h1>Achievement Unlocked!</h1>
      <p>Hi ${data.name},</p>
      <p>You've unlocked the achievement: <strong>${data.achievementName}</strong></p>
    `,
  }

  return templates[template] || "<p>Default email template</p>"
}
