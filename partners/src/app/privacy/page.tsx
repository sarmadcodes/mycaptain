import type { Metadata } from "next";

import { LegalPage } from "@/components/legal-page";

export const metadata: Metadata = { title: "Privacy" };

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy policy"
      updated="4 October 2026"
      sections={[
        { h: "What we collect", p: "Company registration details, licences, contact information, and the documents you upload for verification. For your staff, identity documents and, while on duty only, location and duty records." },
        { h: "How we use it", p: "To verify your company, assign bookings, track active duties, process payouts and handle incidents and complaints." },
        { h: "Location data", p: "Staff location is shared only between check-in and the end of a duty. Customers see the location of their own booking; operations sees active duties." },
        { h: "Who we share it with", p: "Customers see the name, photo and rating of assigned staff. We share data with payment providers and authorities only where needed to deliver the service or required by law." },
        { h: "Your choices", p: "You can request a copy or correction of your data by writing to partners@mycaptain.pk." },
      ]}
    />
  );
}
