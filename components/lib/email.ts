// lib/email.ts
// Sends reminder emails via Resend

import { Resend } from "resend";

if (!process.env.RESEND_API_KEY) {
  throw new Error("Missing RESEND_API_KEY");
}

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendReminderEmail({
  to,
  clientName,
  meetingTitle,
  startTime,
  meetLink,
  timeZone,
  stageLabel,
}: {
  to: string;
  clientName: string;
  meetingTitle: string;
  startTime: string;
  meetLink: string;
  timeZone: string;
  stageLabel: string;
}) {
  try {
    const when = new Date(startTime).toLocaleString("en-GB", {
      timeZone,
      dateStyle: "full",
      timeStyle: "short",
    });

    const urgent =
      stageLabel.includes("minute") ||
      stageLabel.includes("minutes") ||
      stageLabel.includes("hours");

    console.log("Preparing reminder email:", {
      to,
      clientName,
      meetingTitle,
      stageLabel,
    });
    console.log("RESEND API KEY EXISTS:", !!process.env.RESEND_API_KEY);
    console.log("FROM EMAIL:", process.env.REMINDER_FROM_EMAIL);
    const response = await resend.emails.send({
      from: process.env.REMINDER_FROM_EMAIL || "onboarding@resend.dev",

      to,

      subject: `${
        urgent ? "⚡" : "🗓"
      } Meeting in ${stageLabel}: ${meetingTitle}`,

      html: `
      <div style="
        font-family:Arial,sans-serif;
        max-width:500px;
        margin:auto;
        background:#ffffff;
      ">

        <div style="
          background:${urgent ? "#dc2626" : "#1a73e8"};
          padding:20px;
          border-radius:10px 10px 0 0;
          color:white;
        ">
          <h2>
            ${
              urgent
                ? `⚡ Starting in ${stageLabel}!`
                : `🗓 ${stageLabel} to go`
            }
          </h2>
        </div>


        <div style="
          padding:24px;
          border:1px solid #ddd;
        ">

          <p>
            Hi <strong>${clientName}</strong>,
          </p>


          <p>
            Your meeting reminder come on Join Us for birght future :
          </p>


          <p>
            <strong>${meetingTitle}</strong>
          </p>


          <p>
            📅 ${when}
          </p>


          <a href="${meetLink}"
             style="
             display:inline-block;
             background:#1a73e8;
             color:white;
             padding:12px 25px;
             border-radius:8px;
             text-decoration:none;
             ">
             Join Google Meet
          </a>


          <p style="
            margin-top:20px;
            font-size:12px;
            color:#777;
          ">
            ${meetLink}
          </p>


        </div>

      </div>
      `,
    });

    console.log("RESEND RESPONSE:", response);

    if (response.error) {
      console.error("RESEND FAILED:", response.error);

      throw new Error(response.error.message);
    }

    console.log("EMAIL SENT SUCCESSFULLY:", response.data?.id);

    return response;
  } catch (error: any) {
    console.error("SEND EMAIL ERROR:", error.message);

    throw error;
  }
}
