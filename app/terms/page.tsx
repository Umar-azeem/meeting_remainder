// app/terms/page.tsx
import Link from "next/link";

export const metadata = {
  title: "Terms of Service — MeetFlow",
  description:
    "The terms that govern your use of MeetFlow's meeting scheduling and reminder service.",
};

export default function TermsPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-12 text-[#0B3C42]">
      <h1 className="text-3xl font-bold mb-2">Terms of Service</h1>
      <p className="text-sm text-[#5C7D82] mb-8">
        Last updated: September 18, 2026
      </p>

      <div className="space-y-6 text-[15px] leading-relaxed">
        <section>
          <h2 className="text-xl font-semibold mb-2">
            1. Acceptance of terms
          </h2>
          <p>
            By accessing or using MeetFlow at{" "}
            <a
              href="https://discoverymeetingcall.com"
              className="text-[#30ACBF] underline"
            >
              discoverymeetingcall.com
            </a>{" "}
            you agree to be bound by these Terms of Service. If you do not
            agree, do not use the service.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-2">
            2. Description of service
          </h2>
          <p>
            MeetFlow is a scheduling tool that lets a business owner connect
            their Google Calendar, create meetings with clients, generate
            Google Meet links, send calendar invitations, and send reminder
            emails to attendees.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-2">3. Your account</h2>
          <p>
            You must connect a valid Google account to use MeetFlow. You are
            responsible for maintaining the confidentiality of your account
            and for all activity that occurs under it.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-2">4. Acceptable use</h2>
          <p>You agree not to use MeetFlow to:</p>
          <ul className="list-disc pl-6 mt-2 space-y-1">
            <li>
              Send unsolicited invitations or reminders to people who did not
              consent to receive them.
            </li>
            <li>
              Violate any applicable law or third-party right, including
              Google&rsquo;s terms of service.
            </li>
            <li>
              Reverse engineer, scrape, or attempt to gain unauthorized
              access to the service.
            </li>
            <li>
              Interfere with or disrupt the service or the servers or networks
              connected to it.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-2">
            5. Google Calendar integration
          </h2>
          <p>
            MeetFlow uses the Google Calendar API with your permission. You
            can revoke access at any time at{" "}
            <a
              href="https://myaccount.google.com/permissions"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#30ACBF] underline"
            >
              myaccount.google.com/permissions
            </a>
            . MeetFlow&rsquo;s use of Google user data is governed by our{" "}
            <Link href="/privacy" className="text-[#30ACBF] underline">
              Privacy Policy
            </Link>
            .
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-2">
            6. Emails sent on your behalf
          </h2>
          <p>
            When you schedule a meeting with the &ldquo;Send invitation&rdquo;
            option enabled, or when the automatic reminder schedule fires,
            MeetFlow will send emails to your attendees on your behalf. You
            are responsible for ensuring you have permission to email those
            attendees.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-2">
            7. Availability and changes
          </h2>
          <p>
            MeetFlow is provided on an &ldquo;as is&rdquo; and &ldquo;as
            available&rdquo; basis. We may modify, suspend, or discontinue the
            service at any time without notice.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-2">
            8. Limitation of liability
          </h2>
          <p>
            To the maximum extent permitted by law, MeetFlow and its operator
            are not liable for any indirect, incidental, special,
            consequential, or punitive damages, including lost profits or
            missed meetings, arising out of or related to your use of the
            service.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-2">9. Termination</h2>
          <p>
            You may stop using MeetFlow at any time. We may suspend or
            terminate your access if you violate these terms.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-2">
            10. Governing law
          </h2>
          <p>
            These terms are governed by the laws of the jurisdiction in which
            the MeetFlow operator is established, without regard to conflict
            of laws principles.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-2">11. Contact</h2>
          <p>
            Questions about these terms? Email{" "}
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
        <Link href="/privacy" className="text-[#30ACBF] underline mr-4">
          Privacy Policy
        </Link>
        <Link href="/" className="text-[#30ACBF] underline">
          Back to MeetFlow
        </Link>
      </div>
    </main>
  );
}