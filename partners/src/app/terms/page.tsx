import type { Metadata } from "next";

import { LegalPage } from "@/components/legal-page";

export const metadata: Metadata = { title: "Partner terms" };

export default function TermsPage() {
  return (
    <LegalPage
      title="Partner terms"
      updated="4 October 2026"
      sections={[
        { h: "Who these terms apply to", p: "These terms apply to companies approved to supply drivers or security personnel through My Captain, and to the staff they register." },
        { h: "Your responsibilities", p: "You employ and manage your staff, keep their documents valid, and make sure every person you register is trained, licensed where required and fit for duty." },
        { h: "Bookings and payments", p: "Customers book and pay through My Captain. Staff must not accept cash or side payments. Earnings for completed duties are paid to your company account weekly, less the agreed service fee." },
        { h: "Conduct and incidents", p: "Accidents, complaints and security incidents must be reported in the app as soon as they happen. My Captain may suspend staff or partners while a serious case is investigated." },
        { h: "Ending the partnership", p: "Either side may end the partnership with 30 days' written notice. Bookings already confirmed will be completed or reassigned." },
      ]}
    />
  );
}
