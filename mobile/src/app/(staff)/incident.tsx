import { ReportForm } from '@/screens/shared/report-form';

export default function IncidentRoute() {
  return (
    <ReportForm
      title="Report a problem"
      intro="Operations is notified immediately. Time and location are attached automatically."
      urgentNote="If anyone is hurt or in danger, call 1122 or 15 first."
      reasonLabel="Type"
      reasons={['Accident', 'Breakdown', 'Security threat', 'Customer issue', 'Other']}
      extra={{ label: 'Urgency', options: ['Urgent', 'Not urgent'] }}
      submitLabel="Notify operations"
      autoContext="Current location, just now"
    />
  );
}
