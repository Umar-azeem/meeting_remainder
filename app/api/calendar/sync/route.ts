import { NextResponse } from "next/server";
import { google } from "googleapis";
import { saveMeeting } from "@/components/lib/meetingsStore";
import { randomUUID } from "crypto";


function getAuth() {
  const auth = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );

  auth.setCredentials({
    refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
  });

  return auth;
}


export async function GET() {

  try {

    const calendar = google.calendar({
      version:"v3",
      auth:getAuth()
    });


    const result = await calendar.events.list({

      calendarId:"primary",

      timeMin:new Date().toISOString(),

      singleEvents:true,

      orderBy:"startTime",

    });
console.log("Google Events:", result.data.items);

    const events = result.data.items || [];


    for(const event of events){

      const clientEmail =
        event.attendees?.find(
          (a)=>a.email !== process.env.GOOGLE_OWNER_EMAIL
        )?.email;


      if(!clientEmail) continue;


      const meetLink =
        event.conferenceData?.entryPoints?.find(
          e=>e.entryPointType==="video"
        )?.uri || "";


      await saveMeeting({

        id:event.id || randomUUID(),

        summary:event.summary || "Google Meeting",

        clientName:
          event.attendees?.[0]?.displayName || "",

        clientEmail,

        startTime:
          event.start?.dateTime || "",

        meetLink,

        timeZone:
          event.start?.timeZone || "Asia/Karachi",

        remindersSent:{}

      });

    }


    return NextResponse.json({

      synced:events.length

    });


  } catch (error: any) {
  console.error("FULL ERROR:", error);

  return NextResponse.json(
    {
      error: "Sync failed",
      message: error.message,
      details: error.response?.data || error.errors || null,
    },
    {
      status: 500,
    }
  );
}
}