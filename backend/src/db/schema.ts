import {
  pgTable,
  uuid,
  text,
  integer,
  timestamp,
  pgEnum,
  check,
  index,
  inet,
  customType,
  unique
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

interface GeoPoint {
  type: "Point";
  coordinates: [number, number]; // [longitude, latitude]
}

const geography = customType<{ data: GeoPoint }>({
  dataType() {
    return "geography(Point, 4326)";
  },
  toDriver(value: GeoPoint) {
    const [lng, lat] = value.coordinates;
    return sql`ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography`;
  },
  fromDriver(value: any): GeoPoint {
    if (typeof value === "string") return JSON.parse(value);
    return value;
  },
});

// Enums
export const userRole = pgEnum("user_role", ["reporter", "moderator", "admin"]);
export const issueStatus = pgEnum("issue_status", ["open", "in_progress", "resolved"]);
export const friendshipStatus = pgEnum("friendship_status", ["pending", "accepted", "blocked"]);

// Users
export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    username: text("username").notNull().unique(),
    email: text("email").unique(),
    phone: text("phone").unique(),
    passwordHash: text("password_hash").notNull(),
    role: userRole("role").notNull().default("reporter"),
    points: integer("points").notNull().default(0),
    experience: integer("experience").notNull().default(0),
    level: integer("level").generatedAlwaysAs(
      sql`FLOOR(POWER(experience::numeric / 100, 1.0 / 1.5)) + 1`
    ).notNull(),
    avatarUrl: text("avatar_url"),
    bio: text("bio"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    check(
      "email_or_phone_required",
      sql`${table.email} IS NOT NULL OR ${table.phone} IS NOT NULL`
    ),
  ]
);

// Friendships
export const friendships = pgTable(
  "friendships",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    senderId: uuid("sender_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    receiverId: uuid("receiver_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    status: friendshipStatus("status").notNull().default("pending"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    check("no_self_friend", sql`${table.senderId} != ${table.receiverId}`),
    index("idx_friendships_sender").on(table.senderId),
    index("idx_friendships_receiver").on(table.receiverId),
    index("idx_friendships_status").on(table.status),
    // unique constraint so there's only ever one row per pair in one direction
    unique("unique_friendship").on(table.senderId, table.receiverId),
  ]
);

// Sessions
export const sessions = pgTable("sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  refreshTokenHash: text("refresh_token_hash").notNull().unique(),
  userAgent: text("user_agent"),
  ipAddress: inet("ip_address"),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// User Locations
export const userLocations = pgTable("user_locations", {
  userId: uuid("user_id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  location: geography("location").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// Issues
export const issues = pgTable(
  "issues",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    description: text("description").notNull(),
    photoUrl: text("photo_url"),
    location: geography("location").notNull(),
    status: issueStatus("status").notNull().default("open"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("idx_issues_location").using("gist", sql`${table.location}`),
    index("idx_issues_status").on(table.status),
  ]
);