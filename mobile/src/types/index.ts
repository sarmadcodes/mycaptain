export type Role = 'customer' | 'driver' | 'guard';

export type User = {
  id: string;
  name: string;
  phone: string;
  email?: string;
  role: Role;
};

export type ServiceType = 'driver' | 'guard' | 'gunman' | 'team';

export type BookingStatus =
  | 'draft'
  | 'pending_payment'
  | 'paid'
  | 'assigning'
  | 'confirmed'
  | 'arriving'
  | 'on_duty'
  | 'completed'
  | 'closed';
