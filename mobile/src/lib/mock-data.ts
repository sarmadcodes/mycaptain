// Sample data until the backend exists. Names, prices and times are illustrative.
import type { BookingStatus, ServiceType } from '@/types';

export type VehicleClass = 'small' | 'sedan' | 'suv' | 'luxury';

export type StaffProfile = {
  id: string;
  name: string;
  kind: 'driver' | 'guard' | 'gunman';
  rating: number;
  years: number;
  specialty: string;
  languages: string;
  eta: string;
  classes?: VehicleClass[];
};

export const drivers: StaffProfile[] = [
  { id: 'd1', name: 'Ahmed Raza', kind: 'driver', rating: 4.9, years: 8, specialty: 'SUV specialist', languages: 'Urdu, English', eta: '18 min', classes: ['suv', 'sedan'] },
  { id: 'd2', name: 'Bilal Khan', kind: 'driver', rating: 4.8, years: 6, specialty: 'Luxury and executive cars', languages: 'Urdu, English', eta: '30 min', classes: ['luxury', 'suv', 'sedan'] },
  { id: 'd3', name: 'Farhan Siddiqui', kind: 'driver', rating: 4.9, years: 10, specialty: 'Sedans, manual and automatic', languages: 'Urdu, Sindhi', eta: '25 min', classes: ['sedan', 'small'] },
  { id: 'd4', name: 'Naveed Akhtar', kind: 'driver', rating: 4.7, years: 4, specialty: 'City driving, small cars', languages: 'Urdu', eta: '15 min', classes: ['small', 'sedan'] },
];

export const securityStaff: StaffProfile[] = [
  { id: 'g1', name: 'Usman Ali', kind: 'guard', rating: 4.8, years: 7, specialty: 'Residential and site security', languages: 'Urdu, Punjabi', eta: '40 min' },
  { id: 'g2', name: 'Kashif Mehmood', kind: 'guard', rating: 4.7, years: 4, specialty: 'Office and reception', languages: 'Urdu, English', eta: '35 min' },
  { id: 'g3', name: 'Imran Shah', kind: 'gunman', rating: 4.9, years: 5, specialty: 'Event and VIP protection', languages: 'Urdu, Pashto', eta: '50 min' },
  { id: 'g4', name: 'Zahid Hussain', kind: 'gunman', rating: 4.8, years: 9, specialty: 'Armed site security', languages: 'Urdu, Punjabi', eta: '45 min' },
];

export const findStaff = (id?: string) => [...drivers, ...securityStaff].find((s) => s.id === id);

export type Booking = {
  id: string;
  service: ServiceType;
  title: string;
  staffId: string;
  status: BookingStatus;
  when: string;
  location: string;
  durationLabel: string;
  totalHours: number;
  elapsedMinutes: number;
};

export const bookings: Booking[] = [
  { id: 'MC-2048', service: 'driver', title: 'Driver, 4 hours', staffId: 'd1', status: 'on_duty', when: 'Today, 5:00 PM', location: 'DHA Phase 6, Karachi', durationLabel: '4 hours', totalHours: 4, elapsedMinutes: 135 },
  { id: 'MC-2049', service: 'guard', title: 'Security guard, 8 hours', staffId: 'g1', status: 'confirmed', when: 'Tomorrow, 9:00 AM', location: 'Main Gate, Clifton Block 5', durationLabel: '8 hours', totalHours: 8, elapsedMinutes: 0 },
  { id: 'MC-2031', service: 'driver', title: 'Driver, 1 day', staffId: 'd3', status: 'completed', when: '24 Sep, 9:00 AM', location: 'Gulshan-e-Iqbal, Karachi', durationLabel: '1 day', totalHours: 8, elapsedMinutes: 480 },
  { id: 'MC-2017', service: 'gunman', title: 'Armed gunman, 4 hours', staffId: 'g3', status: 'completed', when: '12 Sep, 7:00 PM', location: 'Marriott, Abdullah Haroon Rd', durationLabel: '4 hours', totalHours: 4, elapsedMinutes: 240 },
];

export const findBooking = (id?: string) => bookings.find((b) => b.id === id);

export const statusLabel: Record<BookingStatus, { label: string; tone: 'blue' | 'green' | 'amber' | 'red' | 'neutral' }> = {
  draft: { label: 'Draft', tone: 'neutral' },
  pending_payment: { label: 'Awaiting payment', tone: 'amber' },
  paid: { label: 'Paid', tone: 'blue' },
  assigning: { label: 'Assigning', tone: 'amber' },
  confirmed: { label: 'Confirmed', tone: 'blue' },
  arriving: { label: 'Arriving', tone: 'blue' },
  on_duty: { label: 'On duty', tone: 'green' },
  completed: { label: 'Completed', tone: 'neutral' },
  closed: { label: 'Closed', tone: 'neutral' },
};

export const guardTimeline = [
  { time: '09:00', label: 'Arrived at post' },
  { time: '09:05', label: 'Check-in verified' },
  { time: '11:30', label: 'Break started' },
  { time: '11:50', label: 'Back on post' },
  { time: '12:45', label: 'Scheduled check-in completed' },
];

export type Case = { id: string; type: string; booking: string; status: string; tone: 'amber' | 'green' | 'blue' };

export const cases: Case[] = [
  { id: 'MC-C08', type: 'Complaint', booking: 'MC-2031', status: 'Under review', tone: 'amber' },
  { id: 'MC-R04', type: 'Replacement', booking: 'MC-2017', status: 'Resolved', tone: 'green' },
];

// Staff side
export type Assignment = {
  id: string;
  customer: string;
  service: 'driver' | 'guard';
  when: string;
  duration: string;
  location: string;
  detail: string;
  notes: string;
  status: 'new' | 'accepted' | 'completed';
};

export const driverAssignments: Assignment[] = [
  { id: 'MC-2048', customer: 'Aziz Mughal', service: 'driver', when: 'Today, 5:00 PM', duration: '4 hours', location: 'DHA Phase 6, Karachi', detail: 'Toyota Fortuner, Automatic', notes: 'Pick up from the main entrance. Two stops in Clifton.', status: 'new' },
  { id: 'MC-2055', customer: 'Sana Qureshi', service: 'driver', when: 'Tomorrow, 9:00 AM', duration: '8 hours', location: 'Clifton Block 4', detail: 'Honda Civic, Automatic', notes: 'Office drop and school pickup at 1:30 PM.', status: 'accepted' },
  { id: 'MC-2060', customer: 'Hamza Ilyas', service: 'driver', when: 'Friday, 5:00 PM', duration: '4 hours', location: 'Bahria Town', detail: 'Toyota Corolla, Manual', notes: 'Wedding event, wait at venue.', status: 'accepted' },
];

export const guardAssignments: Assignment[] = [
  { id: 'MC-2049', customer: 'Aziz Mughal', service: 'guard', when: 'Today, 9:00 AM', duration: '8-hour shift', location: 'Main Gate, Clifton Block 5', detail: 'Unarmed, uniform required', notes: 'Log all visitors. Supervisor: Tariq, ext. 204.', status: 'new' },
  { id: 'MC-2062', customer: 'Faisal Traders', service: 'guard', when: 'Tomorrow, 8:00 PM', duration: '12-hour night shift', location: 'Warehouse, SITE Area', detail: 'Unarmed, night patrol', notes: 'Hourly perimeter round.', status: 'accepted' },
];

export const earnings = {
  week: 18400,
  duties: 6,
  hours: 34,
  recent: [
    { id: 'MC-2031', label: '1-day duty, Gulshan', date: '24 Sep', amount: 4200 },
    { id: 'MC-2027', label: '4-hour duty, DHA', date: '23 Sep', amount: 2100 },
    { id: 'MC-2020', label: '8-hour duty, Clifton', date: '21 Sep', amount: 3900 },
  ],
};

export const guardAlerts = [
  { id: 'a1', title: 'Check-in due at 2:30 PM', body: 'Confirm you are at Main Gate.', time: '10 min ago', tone: 'amber' as const },
  { id: 'a2', title: 'Shift confirmed', body: 'Warehouse, SITE Area, tomorrow 8:00 PM.', time: '2 h ago', tone: 'blue' as const },
  { id: 'a3', title: 'Duty report approved', body: 'Shift MC-2041 has been closed.', time: 'Yesterday', tone: 'green' as const },
];
