// API shapes used by the partner dashboard (see backend/src/models).

export type CompanyStatus = 'pending' | 'changes_requested' | 'approved' | 'rejected' | 'suspended';

export type Company = {
  id: string;
  ref: string;
  legalName: string;
  tradingName?: string;
  city: string;
  address: string;
  services: ('drivers' | 'guards' | 'armed' | 'teams' | 'rentals')[];
  cities: string[];
  driverCount?: number;
  guardCount?: number;
  securityLicence?: { number: string; expiry: string };
  documents: { id: string; kind: string; status: 'pending' | 'verified' | 'rejected'; note?: string; uploadedAt: string; viewUrl?: string }[];
  contact: { name: string; designation: string; phone: string; email: string };
  status: CompanyStatus;
  reviewNote?: string;
  approvedAt?: string;
};

export type Staff = {
  id: string;
  role: 'driver' | 'guard';
  staffKind: 'driver' | 'guard' | 'gunman';
  name: string;
  phone: string;
  status: 'active' | 'suspended';
  available: boolean;
  documents: { _id?: string; kind: string; status: string; uploadedAt: string }[];
  lastLoginAt?: string;
  createdAt: string;
};

export type Car = {
  id: string;
  name: string;
  class: 'small' | 'sedan' | 'suv' | 'luxury';
  seats: number;
  transmission: 'automatic' | 'manual';
  perDay: number;
  features?: string;
  active: boolean;
};

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

export type Booking = {
  id: string;
  code: string;
  service: 'driver' | 'rental' | 'guard' | 'gunman' | 'team';
  plan: 'hourly' | 'daily' | 'monthly' | 'contract';
  startAt: string;
  hours?: number;
  days?: number;
  contractMonths?: number;
  vehicle?: { class: string; makeModel?: string; transmission: string; notes?: string };
  car?: { id: string; name: string } | string;
  personnel: number;
  location: { address: string; point?: string };
  instructions?: string;
  price: { total: number; subtotal: number; fee: number };
  status: BookingStatus;
  staff: { id: string; name: string; staffKind?: string }[];
  customer?: { id: string; name: string } | string;
  history: { status: BookingStatus; at: string; note?: string }[];
};
