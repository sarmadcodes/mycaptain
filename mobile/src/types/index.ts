export type Role = 'customer' | 'driver' | 'guard' | 'admin';

export type User = {
  id: string;
  name: string;
  phone: string;
  email?: string;
  role: Role;
};

// 'rental' is a company car that comes with a driver.
export type ServiceType = 'driver' | 'rental' | 'guard' | 'gunman' | 'team';

export type BookingStatus =
  'draft' | 'pending_payment' | 'paid' | 'assigning' | 'confirmed' | 'arriving' | 'on_duty' | 'completed' | 'closed';
