// app/privacy/page.tsx
import Link from "next/link";

export const metadata = {
  title: "Privacy Policy — MeetFlow",
  description:
    "How MeetFlow collects, uses, and protects your data when scheduling meetings and sending reminders.",
};

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-12 text-[#0B3C42]">
      <h1 className="text-3xl font-bold mb-2">Privacy Policy</h1>
      <p className="text-sm text-[#5C7D82] mb-8">
        Last updated: September 18, 2026
      </p>

      <div className="space-y-6 text-[15px] leading-relaxed">
        <section>
          <h2 className="text-xl font-semibold mb-2">1. Who we are</h2>
          <p>
            MeetFlow (&ldquo;we&rdquo;, &ldquo;us&rdquo;, &ldquo;our&rdquo;) is a
            meeting scheduling service operated at{" "}
            <a
              href="https://discoverymeetingcall.com"
              className="text-[#30ACBF] underline"
            >
              discoverymeetingcall.com
            </a>
            . It lets a business owner schedule client meetings on their Google
            Calendar, generate Google Meet links, and send reminder emails to
            attendees.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-2">
            2. What information we collect
          </h2>
          <p>When you use MeetFlow, we may collect:</p>
          <ul className="list-disc pl-6 mt-2 space-y-1">
            <li>
              <strong>Account data:</strong> name, email address, and OAuth
              tokens from the Google account you connect.
            </li>
            <li>
              <strong>Meeting data:</strong> meeting title, date, time,
              duration, time zone, and attendee name and email address.
            </li>
            <li>
              <strong>Calendar data:</strong> event details from your Google
              Calendar that are needed to schedule and sync meetings (event
              id, start/end time, attendees, Google Meet link, attendee RSVP
              status).
            </li>
            <li>
              <strong>Usage data:</strong> basic server logs (IP, timestamps,
              error traces) used for debugging.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-2">
            3. How we use your information
          </h2>
          <ul className="list-disc pl-6 space-y-1">
            <li>Create Google Calendar events with Google Meet links.</li>
            <li>
              Send calendar invitations to the attendees you specify (only
              when you enable the &ldquo;Send invitation email&rdquo; option).
            </li>
            <li>
              Send reminder emails to attendees at 72h, 48h, 24h, 12h, 30min,
              and 5min before the meeting, plus any manual reminders you
              trigger.
            </li>
            <li>
              Sync attendee RSVP status (accepted / declined / tentative /
              pending) so you can see who has confirmed.
            </li>
            <li>Diagnose errors and improve the service.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-2">
            4. Google API Services — Limited Use disclosure
          </h2>
          <p>
            MeetFlow&rsquo;s use and transfer to any other app of information
            received from Google APIs adheres to the{" "}
            <a
              href="https://developers.google.com/terms/api-services-user-data-policy"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#30ACBF] underline"
            >
              Google API Services User Data Policy
            </a>
            , including the Limited Use requirements.
          </p>
          <p className="mt-2">
            Specifically: we only access the Google Calendar data required to
            create events, send invitations, send reminders, and display RSVP
            status to the account owner. We do not sell your data, do not use
            it for advertising, and do not allow humans to read it except when
            required for security, legal, or debugging purposes with your
            explicit consent.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-2">
            5. Third-party services we use
          </h2>
          <ul className="list-disc pl-6 space-y-1">
            <li>
              <strong>Google Calendar API</strong> — to create and sync
              meetings, generate Google Meet links, and read attendee RSVP
              status.
            </li>
            <li>
              <strong>Resend</strong> — to deliver reminder and invitation
              emails to your clients.
            </li>
            <li>
              <strong>MongoDB Atlas</strong> — to store meeting records
              (title, attendee email, time, reminder schedule).
            </li>
            <li>
              <strong>Vercel</strong> — to host the application and run the
              reminder cron job.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-2">
            6. Data retention and deletion
          </h2>
          <p>
            Meeting records are stored until you delete them or request
            account deletion. To revoke MeetFlow&rsquo;s access to your Google
            account at any time, visit{" "}
            <a
              href="https://myaccount.google.com/permissions"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#30ACBF] underline"
            >
              myaccount.google.com/permissions
            </a>{" "}
            and remove MeetFlow. To request deletion of all data we hold about
            you, email{" "}
            <a
              href="mailto:support@discoverymeetingcall.com"
              className="text-[#30ACBF] underline"
            >
              support@discoverymeetingcall.com
            </a>
            .
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-2">7. Security</h2>
          <p>
            OAuth tokens are stored encrypted in transit and at rest. Access
            to the production environment is limited to the operator.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-2">
            8. Children&rsquo;s privacy
          </h2>
          <p>
            MeetFlow is not directed at children under 13 and we do not
            knowingly collect data from them.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-2">
            9. Changes to this policy
          </h2>
          <p>
            We may update this policy from time to time. The
            &ldquo;Last updated&rdquo; date at the top will change when we do.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-2">10. Contact us</h2>
          <p>
            Questions? Email{" "}
            <a
              href="mailto:support@discoverymeetingcall.com"
              className="text-[#30ACBF] underline"
            >
              support@discoverymeetingcall.com
            </a>
            .
          </p>
        </section>
      </div>

      <div className="mt-10 border-t border-[#EEF5F6] pt-6 text-sm text-[#5C7D82]">
        <Link href="/terms" className="text-[#30ACBF] underline mr-4">
          Terms of Service
        </Link>
        <Link href="/" className="text-[#30ACBF] underline">
          Back to MeetFlow
        </Link>
      </div>
    </main>
  );
}