// App-wide settings from the build environment (see .env.example).
export const SUPPORT_PHONE = process.env.EXPO_PUBLIC_SUPPORT_PHONE ?? '+922111222333';
export const PARTNER_PORTAL_URL = process.env.EXPO_PUBLIC_PARTNER_URL ?? 'https://partners.mycaptain.pk';
// Pakistan emergency numbers, shown with the SOS button.
export const EMERGENCY = { rescue: '1122', police: '15' };
