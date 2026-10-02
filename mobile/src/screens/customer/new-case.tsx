import { useLocalSearchParams } from 'expo-router';

import { ReportForm } from '@/screens/shared/report-form';

export function NewCase() {
  const { type = 'complaint', booking = 'MC-2048' } = useLocalSearchParams<{ type?: string; booking?: string }>();

  if (type === 'accident') {
    return (
      <ReportForm
        title="Report an accident"
        intro={`Booking ${booking}. Time and location are captured automatically.`}
        urgentNote="If anyone is hurt or in danger, call 1122 or 15 first."
        reasonLabel="What happened?"
        reasons={['Collision', 'Injury', 'Vehicle damage', 'Theft', 'Other']}
        extra={{ label: 'Urgency', options: ['Urgent', 'Not urgent'] }}
        submitLabel="Send to operations"
        autoContext="DHA Phase 6, Karachi, just now"
      />
    );
  }

  if (type === 'replacement') {
    return (
      <ReportForm
        title="Replace staff"
        intro={`Booking ${booking}. A new captain is assigned and you review their profile before they start.`}
        reasonLabel="Reason"
        reasons={['Late arrival', 'Conduct', 'Skill mismatch', 'Personal preference', 'Other']}
        extra={{ label: 'Applies to', options: ['This duty', 'Next shift', 'Whole contract'] }}
        submitLabel="Request replacement"
      />
    );
  }

  return (
    <ReportForm
      title="Make a complaint"
      intro={`Booking ${booking}. Our team reviews every complaint and replies in the app.`}
      reasonLabel="Category"
      reasons={['Conduct', 'Late arrival', 'Driving', 'Billing', 'Other']}
      extra={{ label: 'Preferred outcome', options: ['Apology', 'Refund review', 'Replacement'] }}
      submitLabel="Submit complaint"
    />
  );
}
