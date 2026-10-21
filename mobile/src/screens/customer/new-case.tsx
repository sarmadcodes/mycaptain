import { useLocalSearchParams } from 'expo-router';

import { useBooking } from '@/features/api';
import { ReportForm } from '@/screens/shared/report-form';

export function NewCase() {
  const { type = 'complaint', bookingId } = useLocalSearchParams<{ type?: string; bookingId?: string }>();
  const { data } = useBooking(bookingId);
  const about = data ? `Booking ${data.booking.code}. ` : '';

  if (type === 'accident') {
    return (
      <ReportForm
        title="Report an accident"
        type="accident"
        bookingId={bookingId}
        withLocation
        intro={`${about}Your location and the time are attached automatically.`}
        urgentNote="If anyone is hurt or in danger, call 1122 or 15 first."
        reasonLabel="What happened?"
        reasons={['Collision', 'Injury', 'Vehicle damage', 'Theft', 'Other']}
        extra={{ label: 'Urgency', options: ['Urgent', 'Not urgent'] }}
        submitLabel="Send to operations"
      />
    );
  }

  if (type === 'replacement') {
    return (
      <ReportForm
        title="Replace staff"
        type="replacement"
        bookingId={bookingId}
        intro={`${about}Operations assigns someone new and confirms in the app before they start.`}
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
      type="complaint"
      bookingId={bookingId}
      intro={`${about}Our team reviews every complaint and replies in the app.`}
      reasonLabel="Category"
      reasons={['Conduct', 'Late arrival', 'Driving', 'Billing', 'Other']}
      extra={{ label: 'Preferred outcome', options: ['Apology', 'Refund review', 'Replacement'] }}
      submitLabel="Submit complaint"
    />
  );
}
