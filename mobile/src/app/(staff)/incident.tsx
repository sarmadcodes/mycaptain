import { useBookings } from '@/features/api';
import { ReportForm } from '@/screens/shared/report-form';

export default function IncidentRoute() {
  // Attach the duty in progress, if any.
  const live = useBookings(['arriving', 'on_duty']);
  const current = live.data?.items[0];
  return (
    <ReportForm
      type="incident"
      bookingId={current?.id}
      withLocation
      title="Report a problem"
      intro={`${current ? `Duty ${current.code}. ` : ''}Operations is notified immediately. Your location and the time are attached.`}
      urgentNote="If anyone is hurt or in danger, call 1122 or 15 first."
      reasonLabel="Type"
      reasons={['Accident', 'Breakdown', 'Security threat', 'Customer issue', 'Other']}
      extra={{ label: 'Urgency', options: ['Urgent', 'Not urgent'] }}
      submitLabel="Notify operations"
    />
  );
}
