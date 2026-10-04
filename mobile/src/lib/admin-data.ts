// Sample operations data for the admin area until the backend exists.
import type { ServiceType } from '@/types';

type Tone = 'blue' | 'green' | 'amber' | 'red' | 'neutral';

export const kpis = [
  { label: 'Active duties', value: '42', tone: 'green' as Tone },
  { label: 'Arriving', value: '8', tone: 'blue' as Tone },
  { label: 'Open cases', value: '3', tone: 'red' as Tone },
  { label: 'Paid today', value: 'PKR 86k', tone: 'neutral' as Tone },
];

export const liveOps = [
  {
    id: 'MC-2048',
    who: 'Ahmed Raza',
    what: 'Driver, Fortuner, DHA',
    status: 'On duty',
    tone: 'green' as Tone,
    note: '2h 15m of 4h',
  },
  {
    id: 'MC-2049',
    who: 'Usman Ali',
    what: 'Guard, Main Gate, Clifton',
    status: 'Post OK',
    tone: 'green' as Tone,
    note: '5h 20m on post',
  },
  {
    id: 'MC-2050',
    who: 'Imran Shah',
    what: 'Gunman, office, Shahrah-e-Faisal',
    status: 'Arriving',
    tone: 'blue' as Tone,
    note: 'ETA 12 min',
  },
  {
    id: 'MC-2044',
    who: 'Kashif Mehmood',
    what: 'Guard, Site B, SITE Area',
    status: 'Outside post',
    tone: 'red' as Tone,
    note: '12 min outside boundary',
  },
  {
    id: 'MC-2046',
    who: 'Zahid Hussain',
    what: 'Guard, Site C, Korangi',
    status: 'Check-in overdue',
    tone: 'amber' as Tone,
    note: '9 min late',
  },
  {
    id: 'MC-2051',
    who: 'Bilal Khan',
    what: 'Driver, BMW, Clifton',
    status: 'On break',
    tone: 'amber' as Tone,
    note: 'Break 14 min',
  },
];

export type Request = {
  id: string;
  service: ServiceType;
  title: string;
  customer: string;
  when: string;
  location: string;
  detail: string;
  amount: number;
  status: 'new' | 'assigned';
  assignedTo?: string;
};

export const requests: Request[] = [
  {
    id: 'MC-2052',
    service: 'driver',
    title: 'Driver, 4 hours',
    customer: 'Sana Qureshi',
    when: 'Today, 7:30 PM',
    location: 'Clifton Block 4',
    detail: 'Honda Civic, Automatic, sedan',
    amount: 3780,
    status: 'new',
  },
  {
    id: 'MC-2053',
    service: 'team',
    title: 'Security team, 8 hours',
    customer: 'Faisal Traders',
    when: 'Tomorrow, 8:00 PM',
    location: 'Warehouse, SITE Area',
    detail: '1 armed lead, 2 guards',
    amount: 19320,
    status: 'new',
  },
  {
    id: 'MC-2054',
    service: 'rental',
    title: 'Car rental with driver, 1 day',
    customer: 'Hamza Ilyas',
    when: 'Sat 10 Oct, 9:00 AM',
    location: 'Bahria Town',
    detail: 'Toyota Fortuner',
    amount: 17955,
    status: 'new',
  },
  {
    id: 'MC-2055',
    service: 'guard',
    title: 'Security guard (bouncer), 6 hours',
    customer: 'Lounge 21',
    when: 'Fri 9 Oct, 9:00 PM',
    location: 'Zamzama, DHA Phase 5',
    detail: '3 guards, event door',
    amount: 13230,
    status: 'assigned',
    assignedTo: 'Shield Force Security',
  },
];

export type AdminCase = {
  id: string;
  type: 'Accident' | 'Complaint' | 'Replacement';
  booking: string;
  customer: string;
  staff: string;
  opened: string;
  status: 'Open' | 'In progress' | 'Resolved';
  urgent?: boolean;
  summary: string;
  timeline: { time: string; text: string }[];
};

export const adminCases: AdminCase[] = [
  {
    id: 'MC-I17',
    type: 'Accident',
    booking: 'MC-2048',
    customer: 'Aziz Mughal',
    staff: 'Ahmed Raza',
    opened: 'Today, 3:41 PM',
    status: 'Open',
    urgent: true,
    summary: 'Minor rear-end collision at Khayaban-e-Ittehad signal. No injuries. Customer vehicle bumper damaged.',
    timeline: [
      { time: '15:41', text: 'Reported by driver with 3 photos' },
      { time: '15:43', text: 'Location and duty log attached automatically' },
      { time: '15:50', text: 'Customer called by operations' },
    ],
  },
  {
    id: 'MC-C08',
    type: 'Complaint',
    booking: 'MC-2031',
    customer: 'Aziz Mughal',
    staff: 'Farhan Siddiqui',
    opened: '25 Sep',
    status: 'In progress',
    summary: 'Driver arrived 25 minutes late without notice. Customer requests a refund review.',
    timeline: [
      { time: '25 Sep', text: 'Complaint submitted by customer' },
      { time: '26 Sep', text: 'Partner company asked for statement' },
    ],
  },
  {
    id: 'MC-R04',
    type: 'Replacement',
    booking: 'MC-2017',
    customer: 'Aziz Mughal',
    staff: 'Imran Shah',
    opened: '12 Sep',
    status: 'Resolved',
    summary: 'Customer asked for a different lead for the rest of the contract.',
    timeline: [
      { time: '12 Sep', text: 'Replacement requested' },
      { time: '13 Sep', text: 'Zahid Hussain assigned, customer approved' },
    ],
  },
];

export type Application = {
  id: string;
  company: string;
  city: string;
  services: string;
  staff: string;
  submitted: string;
  status: 'Pending' | 'Approved' | 'Changes requested';
  licence: string;
  contact: string;
  docs: { name: string; ok: boolean }[];
};

export const applications: Application[] = [
  {
    id: 'MCP-482193',
    company: 'Falcon Guard Services',
    city: 'Lahore',
    services: 'Unarmed guards, armed guards, teams',
    staff: '120 guards',
    submitted: '2 Oct',
    status: 'Pending',
    licence: 'PSRA-LHR-1187, expires Jun 2027',
    contact: 'Nadia Rehman, Operations Manager',
    docs: [
      { name: 'Registration certificate', ok: true },
      { name: 'NTN certificate', ok: true },
      { name: 'Security licence', ok: true },
    ],
  },
  {
    id: 'MCP-517760',
    company: 'Metro Chauffeurs',
    city: 'Islamabad',
    services: 'Drivers',
    staff: '35 drivers',
    submitted: '3 Oct',
    status: 'Pending',
    licence: 'Not required',
    contact: 'Omar Farooq, Director',
    docs: [
      { name: 'Registration certificate', ok: true },
      { name: 'NTN certificate', ok: false },
    ],
  },
  {
    id: 'MCP-301245',
    company: 'Shield Force Security',
    city: 'Karachi',
    services: 'Unarmed guards, armed guards',
    staff: '85 guards',
    submitted: '14 Aug',
    status: 'Approved',
    licence: 'PSRA-KHI-0412, expires Jun 2027',
    contact: 'Tariq Hussain, Supervisor',
    docs: [
      { name: 'Registration certificate', ok: true },
      { name: 'NTN certificate', ok: true },
      { name: 'Security licence', ok: true },
    ],
  },
];

export const rateCard = [
  { key: 'driver_small', label: 'Driver, small car', unit: 'per hour', value: 800 },
  { key: 'driver_sedan', label: 'Driver, sedan', unit: 'per hour', value: 900 },
  { key: 'driver_suv', label: 'Driver, SUV', unit: 'per hour', value: 1000 },
  { key: 'driver_luxury', label: 'Driver, luxury', unit: 'per hour', value: 1400 },
  { key: 'guard', label: 'Security guard (bouncer)', unit: 'per hour', value: 700 },
  { key: 'gunman', label: 'Armed gunman', unit: 'per hour', value: 1200 },
  { key: 'fee', label: 'Platform fee', unit: 'percent', value: 5 },
];

export const payouts = [
  { company: 'Karachi Chauffeurs', period: '28 Sep to 4 Oct', amount: 412600, status: 'Scheduled' },
  { company: 'Shield Force Security', period: '28 Sep to 4 Oct', amount: 655300, status: 'Scheduled' },
  { company: 'Elite Drive Services', period: '21 to 27 Sep', amount: 298400, status: 'Paid' },
  { company: 'CityLink Drivers', period: '21 to 27 Sep', amount: 121900, status: 'Paid' },
];
