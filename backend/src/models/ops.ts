import { Schema, Types, model, type HydratedDocument } from 'mongoose';

import { fileRefSchema, toJSON, type FileRef } from './shared';
import { ROLES, type Role } from './user';

// ---------- Chat: one thread per booking ----------

export type Message = { booking: Types.ObjectId; from: Types.ObjectId; fromRole: Role; text: string; createdAt: Date };

const messageSchema = new Schema<Message>(
  {
    booking: { type: Schema.Types.ObjectId, ref: 'Booking', required: true },
    from: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    fromRole: { type: String, enum: ROLES, required: true },
    text: { type: String, required: true, trim: true, maxlength: 1000 },
  },
  { timestamps: { createdAt: true, updatedAt: false }, toJSON },
);
messageSchema.index({ booking: 1, createdAt: 1 });
export const MessageModel = model<Message>('Message', messageSchema);

// ---------- Cases: complaints, replacements, incidents ----------

export const CASE_TYPES = ['complaint', 'replacement', 'accident', 'incident', 'payment', 'other'] as const;
export const CASE_STATUS = ['open', 'in_progress', 'resolved'] as const;

export type Case = {
  ref: string;
  type: (typeof CASE_TYPES)[number];
  booking?: Types.ObjectId;
  openedBy: Types.ObjectId;
  openedByRole: Role;
  details: string;
  urgent: boolean;
  status: (typeof CASE_STATUS)[number];
  evidence: FileRef[];
  timeline: { at: Date; by?: Types.ObjectId; text: string; internal: boolean }[];
  resolution?: string;
  resolvedAt?: Date;
};
export type CaseDoc = HydratedDocument<Case>;

const caseSchema = new Schema<Case>(
  {
    ref: { type: String, required: true, unique: true },
    type: { type: String, enum: CASE_TYPES, required: true },
    booking: { type: Schema.Types.ObjectId, ref: 'Booking', index: true },
    openedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    openedByRole: { type: String, enum: ROLES, required: true },
    details: { type: String, required: true, trim: true, maxlength: 2000 },
    urgent: { type: Boolean, default: false },
    status: { type: String, enum: CASE_STATUS, default: 'open', index: true },
    evidence: { type: [fileRefSchema], default: [] },
    timeline: [
      {
        _id: false,
        at: { type: Date, default: () => new Date() },
        by: { type: Schema.Types.ObjectId, ref: 'User' },
        text: { type: String, required: true, maxlength: 1000 },
        // Admin-only notes are hidden from the person who opened the case.
        internal: { type: Boolean, default: false },
      },
    ],
    resolution: { type: String, maxlength: 1000 },
    resolvedAt: Date,
  },
  { timestamps: true, toJSON },
);
export const CaseModel = model<Case>('Case', caseSchema);

// ---------- SOS alerts ----------

export type Sos = {
  raisedBy: Types.ObjectId;
  raisedByRole: Role;
  booking?: Types.ObjectId;
  company?: Types.ObjectId;
  lat?: number;
  lng?: number;
  note?: string;
  status: 'open' | 'acknowledged' | 'resolved';
  acknowledgedBy?: Types.ObjectId;
  acknowledgedAt?: Date;
  resolvedAt?: Date;
};
const sosSchema = new Schema<Sos>(
  {
    raisedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    raisedByRole: { type: String, enum: ROLES, required: true },
    booking: { type: Schema.Types.ObjectId, ref: 'Booking' },
    company: { type: Schema.Types.ObjectId, ref: 'Company' },
    lat: Number,
    lng: Number,
    note: { type: String, maxlength: 300 },
    status: { type: String, enum: ['open', 'acknowledged', 'resolved'], default: 'open', index: true },
    acknowledgedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    acknowledgedAt: Date,
    resolvedAt: Date,
  },
  { timestamps: true, toJSON },
);
export const SosModel = model<Sos>('Sos', sosSchema);

// ---------- In-app notifications (also the source for push notifications) ----------

export type Notification = {
  user: Types.ObjectId;
  title: string;
  body: string;
  tone: 'blue' | 'green' | 'amber' | 'red';
  // Screen to open, e.g. { kind: 'booking', id }.
  link?: { kind: 'booking' | 'case' | 'sos'; id: string };
  readAt?: Date;
  createdAt: Date;
};
const notificationSchema = new Schema<Notification>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true, maxlength: 120 },
    body: { type: String, required: true, maxlength: 300 },
    tone: { type: String, enum: ['blue', 'green', 'amber', 'red'], default: 'blue' },
    link: { _id: false, kind: { type: String, enum: ['booking', 'case', 'sos'] }, id: String },
    readAt: Date,
  },
  { timestamps: { createdAt: true, updatedAt: false }, toJSON },
);
notificationSchema.index({ user: 1, createdAt: -1 });
// Old notifications clean themselves up after 90 days.
notificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 86_400 });
export const NotificationModel = model<Notification>('Notification', notificationSchema);
