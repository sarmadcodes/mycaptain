import type { Metadata } from "next";

import { LegalPage } from "@/components/legal-page";

export const metadata: Metadata = { title: "Terms of service", description: "Terms for customers, partner companies and their staff." };

// Linked from the app and the partner website. Have it reviewed by a lawyer before launch.
export default function TermsPage() {
  return (
    <LegalPage
      title="Terms of service"
      updated="23 October 2026"
      sections={[
        {
          h: "About these terms",
          p: "These terms apply to everyone who uses My Captain: customers who book drivers, guards and security teams, partner companies approved to supply them, and the staff those companies register. By creating an account you agree to them.",
        },
        {
          h: "Customers: bookings",
          p: "You book through the app and see the full price before you pay. Staff are employed by an approved partner company; My Captain arranges the booking, verifies the company and its staff, and supports you during the duty. You must be 18 or older and give accurate addresses and instructions.",
        },
        {
          h: "Customers: payments, cancellations and refunds",
          p: "You pay in the app before the booking is assigned. You can cancel until the duty starts: a paid booking cancelled before staff are on the way is refunded in full to the original payment method. Never pay staff in cash or outside the app; we cannot protect payments made outside My Captain.",
        },
        {
          h: "Customers: conduct",
          p: "Treat staff with respect and do not ask them to do anything unlawful or unsafe, carry weapons outside their licence, or work beyond the booked hours without extending the booking in the app. We may end a booking or close an account to protect staff.",
        },
        {
          h: "Emergencies",
          p: "The SOS button alerts My Captain operations and the partner company. It does not replace emergency services: if anyone is hurt or in danger, call 1122 (rescue) or 15 (police) first.",
        },
        {
          h: "Partner companies",
          p: "You employ and manage your staff, keep their documents valid, and make sure every person you register is trained, licensed where required and fit for duty. Earnings for completed duties are paid to your company account weekly, less the agreed service fee, as shown in your payout statements.",
        },
        {
          h: "Staff",
          p: "Do not accept cash or side payments. Share your location while on the way and on duty, record check-ins and breaks in the app, and report accidents, complaints and security incidents as soon as they happen.",
        },
        {
          h: "Complaints and suspension",
          p: "Report problems in the app under Support. We investigate every case and may suspend staff or partners while a serious case is investigated.",
        },
        {
          h: "Liability",
          p: "We take reasonable care to verify partner companies and their staff. To the extent the law allows, My Captain is not liable for indirect losses; nothing in these terms limits liability for death or injury caused by negligence or for anything else that cannot be limited by Pakistani law.",
        },
        {
          h: "Ending the agreement",
          p: "Customers can delete their account at any time in the app. Partners may end the partnership with 30 days' written notice; bookings already confirmed will be completed or reassigned. These terms are governed by the laws of Pakistan.",
        },
        { h: "Contact", p: "support@mycaptain.pk for customers, partners@mycaptain.pk for partner companies." },
      ]}
    />
  );
}
