import { google } from "googleapis";
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



export async function createMeeting(data: {
  summary: string;
  startTime: string;
  endTime: string;
  clientEmail: string;
  clientName?: string;
  timeZone?: string;
}) {

  const calendar = google.calendar({
    version: "v3",
    auth: getAuth(),
  });


  const response = await calendar.events.insert({

    calendarId: "primary",

    conferenceDataVersion: 1,


    requestBody: {

      summary: data.summary,


      description: data.clientName
        ? `Client: ${data.clientName}`
        : "Meeting",


      start: {
        dateTime: data.startTime,
        timeZone: data.timeZone || "Asia/Karachi",
      },


      end: {
        dateTime: data.endTime,
        timeZone: data.timeZone || "Asia/Karachi",
      },


      attendees: [
        {
          email: data.clientEmail,
        },
      ],


      conferenceData: {
        createRequest: {
          requestId: randomUUID(),

          conferenceSolutionKey: {
            type: "hangoutsMeet",
          },
        },
      },

    },

  });



  return {

    meetLink: response.data.hangoutLink || "",

    htmlLink: response.data.htmlLink || "",

  };

}