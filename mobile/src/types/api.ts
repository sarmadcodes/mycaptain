// Shapes returned by the My Captain API (backend/src/models).

export type Role = 'customer' | 'driver' | 'guard' | 'partner' | 'admin';

export type ApiUser = {
  id: string;
  role: Role;
  name: string;
  phone: string;
  email?: string;
  staffKind?: 'driver' | 'guard' | 'gunman';
  company?: string | { id: string; legalName: string; tradingName?: string; status: string; ref: string };
  avatarUrl?: string;
  status: 'active' | 'suspended';
  available?: boolean;
  availability?: { days: string[]; shift: 'day' | 'night' | 'any' };
  documents?: { id: string; kind: string; status: 'pending' | 'verified' | 'rejected'; uploadedAt: string }[];
};

export type Session = { accessToken: string; refreshToken: string; user: ApiUser };

export type Service = 'driver' | 'rental' | 'guard' | 'gunman' | 'team';
export type Plan = 'hourly' | 'daily' | 'monthly' | 'contract';
export type BookingStatus =
  | 'pending_payment'
  | 'paid'
  | 'assigning'
  | 'confirmed'
  | 'arriving'
  | 'on_duty'
  | 'completed'
  | 'closed'
  | 'cancelled';

export type Price = { hourlyRate: number; billableHours: number; discount: number; subtotal: number; fee: number; total: number; currency: 'PKR' };

export type ApiBooking = {
  id: string;
  code: string;
  service: Service;
  plan: Plan;
  startAt: string;
  asap: boolean;
  hours?: number;
  days?: number;
  contractMonths?: 6 | 12;
  vehicle?: { class: 'small' | 'sedan' | 'suv' | 'luxury'; makeModel?: string; transmission: 'automatic' | 'manual'; notes?: string };
  car?: { id: string; name: string; class: string; seats: number; transmission: string; perDay: number } | string;
  personnel: number;
  location: { address: string; point?: string; lat?: number; lng?: number };
  instructions?: string;
  price: Price;
  status: BookingStatus;
  company?: { id: string; legalName: string; tradingName?: string } | string;
  staff: { id: string; name: string; staffKind?: string; avatarUrl?: string }[];
  customer?: { id: string; name: string } | string;
  history: { status: BookingStatus; at: string; byRole?: Role; note?: string }[];
  cancelReason?: string;
  events?: { kind: 'check_in' | 'break_start' | 'break_end' | 'sos'; at: string; by: string; lat?: number; lng?: number; note?: string }[];
  locations?: StaffLocation[];
  rating?: { stars: number; comment?: string; at: string };
  paidAt?: string;
  startedAt?: string;
  completedAt?: string;
  createdAt: string;
};

export type StaffLocation = { staff: string; lat: number; lng: number; accuracy?: number; heading?: number; at: string };

export type ChatMessage = { id: string; booking: string; from: { id: string; name: string; role: Role }; fromRole: Role; text: string; createdAt: string };

export type CaseType = 'complaint' | 'replacement' | 'accident' | 'incident' | 'payment' | 'other';
export type CaseStatus = 'open' | 'in_progress' | 'resolved';
export type CaseApi = {
  id: string;
  ref: string;
  type: CaseType;
  booking?: { id: string; code: string; staff?: { id: string; name: string }[]; customer?: { id: string; name: string } } | string;
  openedBy: { id: string; name: string; role: Role; phone?: string } | string;
  openedByRole: Role;
  details: string;
  urgent: boolean;
  status: CaseStatus;
  evidence: { id: string; url: string; uploadedAt: string }[];
  timeline: { at: string; text: string; internal: boolean }[];
  resolution?: string;
  createdAt: string;
};

export type NotificationApi = {
  id: string;
  title: string;
  body: string;
  tone: 'blue' | 'green' | 'amber' | 'red';
  link?: { kind: 'booking' | 'case' | 'sos'; id: string };
  readAt?: string;
  createdAt: string;
};

export type SosApi = {
  id: string;
  raisedBy: { id: string; name: string; phone: string; role: Role } | string;
  raisedByName?: string;
  booking?: { id: string; code: string; location: { address: string } } | string;
  bookingCode?: string;
  lat?: number;
  lng?: number;
  note?: string;
  status: 'open' | 'acknowledged' | 'resolved';
  createdAt: string;
};

export type Earnings = {
  days: number;
  total: number;
  duties: number;
  hours: number;
  rating: number | null;
  recent: { id: string; code: string; service: Service; address: string; completedAt: string; hours: number; amount: number; stars?: number }[];
};

export type Page<T> = { items: T[]; total: number; page: number };

export type RentalCarApi = {
  id: string;
  name: string;
  class: 'small' | 'sedan' | 'suv' | 'luxury';
  seats: number;
  transmission: 'automatic' | 'manual';
  perDay: number;
  features?: string;
  companyName?: string;
};

export type StaffProfileApi = {
  id: string;
  name: string;
  staffKind: 'driver' | 'guard' | 'gunman';
  avatarUrl?: string;
  companyName?: string;
  verified: boolean;
};

export type Rates = {
  driverHourly: { small: number; sedan: number; suv: number; luxury: number };
  guardHourly: number;
  gunmanHourly: number;
  planDiscount: Record<Plan, number>;
  feePercent: number;
  rentalMinHours: number;
};

export type CompanyApi = {
  id: string;
  ref: string;
  legalName: string;
  tradingName?: string;
  city: string;
  address: string;
  services: string[];
  cities: string[];
  driverCount?: number;
  guardCount?: number;
  securityLicence?: { number: string; expiry: string };
  documents: { id: string; kind: string; status: 'pending' | 'verified' | 'rejected'; viewUrl?: string; uploadedAt: string }[];
  contact: { name: string; designation: string; phone: string; email: string };
  status: 'pending' | 'changes_requested' | 'approved' | 'rejected' | 'suspended';
  reviewNote?: string;
  createdAt: string;
};
