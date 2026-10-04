import { z } from "zod";

export const CITIES = ["Karachi", "Lahore", "Islamabad", "Rawalpindi", "Faisalabad", "Multan", "Peshawar", "Hyderabad", "Quetta"];

export const SERVICES = [
  { value: "drivers", label: "Drivers", hint: "For customers' own vehicles" },
  { value: "guards", label: "Unarmed guards", hint: "Homes, offices and events" },
  { value: "armed", label: "Armed guards", hint: "Licensed armed personnel" },
  { value: "teams", label: "Security teams", hint: "Gunman with additional guards" },
];

const optionalNumber = z
  .string()
  .regex(/^\d*$/, "Numbers only.")
  .optional();

export const schema = z
  .object({
    // Company
    legalName: z.string().trim().min(3, "Enter the registered company name."),
    tradingName: z.string().trim().optional(),
    companyType: z.string().min(1, "Choose a company type."),
    registrationNo: z.string().trim().min(4, "Enter the SECP or firm registration number."),
    ntn: z.string().trim().regex(/^\d{7}(-\d)?$/, "NTN looks like 1234567 or 1234567-8."),
    yearEstablished: z
      .string()
      .regex(/^(19|20)\d{2}$/, "Enter a year like 2015.")
      .refine((y) => Number(y) <= new Date().getFullYear(), "Year cannot be in the future."),
    city: z.string().min(1, "Choose your head office city."),
    address: z.string().trim().min(8, "Enter the full office address."),

    // Services
    services: z.array(z.string()).min(1, "Choose at least one service."),
    cities: z.array(z.string()).min(1, "Choose at least one city."),
    driverCount: optionalNumber,
    guardCount: optionalNumber,

    // Compliance
    securityLicenceNo: z.string().trim().optional(),
    securityLicenceExpiry: z.string().optional(),
    docRegistration: z.string({ error: "Upload the registration certificate." }).min(1, "Upload the registration certificate."),
    docNtn: z.string({ error: "Upload the NTN certificate." }).min(1, "Upload the NTN certificate."),
    docLicence: z.string().optional(),

    // Contact and account
    contactName: z.string().trim().min(3, "Enter the contact person's name."),
    designation: z.string().trim().min(2, "Enter their designation."),
    phone: z.string().regex(/^3\d{9}$/, "Enter a mobile number like 3001234567."),
    email: z.email("Enter a valid email address."),
    password: z.string().min(8, "Use at least 8 characters."),
    confirmPassword: z.string(),
    agree: z.literal(true, { error: "You need to accept the partner terms." }),
  })
  .superRefine((v, ctx) => {
    for (const [path, message] of Object.entries(conditionalErrors(v))) {
      ctx.addIssue({ code: "custom", path: [path], message });
    }
  });

type Values = {
  services: string[];
  driverCount?: string;
  guardCount?: string;
  securityLicenceNo?: string;
  securityLicenceExpiry?: string;
  docLicence?: string;
  password: string;
  confirmPassword: string;
};

// Rules that depend on other answers. Zod skips object-level refinements while any field is
// invalid, so the form also runs these per step before moving on.
export function conditionalErrors(v: Values): Record<string, string> {
  const e: Record<string, string> = {};
  const security = v.services.some((s) => s !== "drivers");
  const armed = v.services.includes("armed") || v.services.includes("teams");
  if (v.services.includes("drivers") && !v.driverCount) e.driverCount = "How many drivers can you provide?";
  if (security && !v.guardCount) e.guardCount = "How many guards can you provide?";
  if (security && !v.securityLicenceNo) e.securityLicenceNo = "Security companies need a licence number.";
  if (security && !v.securityLicenceExpiry) e.securityLicenceExpiry = "Enter the licence expiry date.";
  if (armed && !v.docLicence) e.docLicence = "Upload the security licence for armed services.";
  if (v.confirmPassword && v.password !== v.confirmPassword) e.confirmPassword = "Passwords do not match.";
  return e;
}

export type Application = z.input<typeof schema>;

export const STEPS = [
  { key: "company", title: "Company", fields: ["legalName", "tradingName", "companyType", "registrationNo", "ntn", "yearEstablished", "city", "address"] },
  { key: "services", title: "Services", fields: ["services", "cities", "driverCount", "guardCount"] },
  { key: "compliance", title: "Licences", fields: ["securityLicenceNo", "securityLicenceExpiry", "docRegistration", "docNtn", "docLicence"] },
  { key: "contact", title: "Account", fields: ["contactName", "designation", "phone", "email", "password", "confirmPassword", "agree"] },
  { key: "review", title: "Review", fields: [] },
] as const;
