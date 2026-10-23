// Only the endpoints each role needs are reachable through this site. The API still checks every call.
const ALLOWED: Record<string, RegExp[]> = {
  partner: [/^companies\/me(\/.*)?$/, /^bookings(\/[a-f\d]{24}(\/(assign-staff))?)?$/i, /^rates$/, /^auth\/(me|password)$/, /^sos$/],
  admin: [
    /^admin\/(overview|payouts(\/preview|\/generate|\/[a-f\d]{24}\/paid)?)$/i,
    /^companies(\/[a-f\d]{24}(\/review)?)?$/i,
    /^bookings(\/[a-f\d]{24}(\/(assign-company|assign-staff|status|messages|payments))?)?$/i,
    /^cases(\/[a-f\d]{24})?$/i,
    /^sos(\/[a-f\d]{24}\/status)?$/i,
    /^rates$/,
    /^auth\/(me|password)$/,
    /^me\/notifications(\/read)?$/,
  ],
};

// Whether a signed-in role may reach an API path through this site. Unknown roles get partner access.
export function canProxy(role: string | undefined, path: string) {
  // No dot segments or slashes hidden in a segment: the URL must mean exactly what was checked.
  if (path.split('/').some((seg) => seg === '' || seg === '.' || seg === '..' || /[\\%]/.test(seg))) return false;
  return (ALLOWED[role ?? 'partner'] ?? ALLOWED.partner!).some((r) => r.test(path));
}
