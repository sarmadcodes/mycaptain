import type { Metadata } from "next";

import { LegalPage } from "@/components/legal-page";

export const metadata: Metadata = { title: "Privacy policy", description: "How My Captain collects, uses and protects personal data." };

// Linked from the app and its Play Store listing. Have it reviewed by a lawyer before launch.
export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy policy"
      updated="23 October 2026"
      sections={[
        {
          h: "Who we are",
          p: "My Captain connects customers in Pakistan with verified drivers and security staff employed by licensed partner companies. This policy covers the My Captain app and the partner website. Contact: privacy@mycaptain.pk.",
        },
        {
          h: "What we collect from customers",
          p: "Your name, mobile number and optional email; the bookings you make (service, time, address and instructions); payments and receipts; messages with assigned staff; ratings, complaints and the photos you attach to a report; and, only when you press SOS or attach your location to a report, your location at that moment.",
        },
        {
          h: "What we collect from drivers and guards",
          p: "Name, mobile number and the documents your company uploads (CNIC, licences, police and medical certificates). While a duty is on the way or in progress, your phone's location is shared about every 20 seconds, along with check-ins and breaks. Sharing stops when the duty ends. Android shows a notification the whole time it is active.",
        },
        {
          h: "What we collect from partner companies",
          p: "Company registration, NTN and security licence details, contact people, and the verification documents you upload.",
        },
        {
          h: "How we use it",
          p: "To create and secure your account, sign you in with a one-time code, price and fulfil bookings, show customers where their staff are, let customers and staff message each other without sharing phone numbers, respond to emergencies and complaints, pay partner companies, prevent fraud, and meet legal obligations.",
        },
        {
          h: "Who can see it",
          p: "Customers see the name, photo and rating of their assigned staff and, during a duty, their location. Staff see the customer's name, booking address and instructions. Partner companies see bookings assigned to them and their own staff. My Captain operations sees what it needs to run the service. We use service providers for hosting (MongoDB Atlas), file storage (Cloudinary), text messages, email, push notifications and error monitoring. We do not sell personal data.",
        },
        {
          h: "Authorities and emergencies",
          p: "When you raise an SOS we share your location and booking with operations and the partner company immediately. We disclose data to police or other authorities when the law requires it or to protect someone's life or safety.",
        },
        {
          h: "How long we keep it",
          p: "Account and booking records are kept while your account is open and for up to 5 years afterwards for tax, legal and dispute purposes. Staff locations are overwritten with each update and only the latest position per duty is kept. In-app notifications are deleted after 90 days. Verification documents are kept while the staff member or company is active and for 1 year after.",
        },
        {
          h: "Security",
          p: "Data is encrypted in transit. Passwords are hashed, one-time codes expire in 5 minutes, and documents are stored privately and opened only through short-lived links.",
        },
        {
          h: "Your rights and deleting your account",
          p: "You can ask for a copy of your data or have it corrected by writing to privacy@mycaptain.pk. Customers can delete their account in the app under Account, Delete account. We then remove your name, number and email and keep only the anonymous booking and payment records the law requires. Staff accounts are closed by their company.",
        },
        { h: "Children", p: "My Captain is not for anyone under 18." },
        { h: "Changes", p: "If we change this policy we update the date above and tell you in the app before the change applies." },
      ]}
    />
  );
}
