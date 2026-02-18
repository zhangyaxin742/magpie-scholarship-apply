import { pgTable, text, uuid, timestamp, boolean, integer, decimal, date, jsonb, index, uniqueIndex } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull().unique(),
  phone: text('phone'),
  clerk_id: text('clerk_id').notNull().unique(),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
  onboarding_completed: boolean('onboarding_completed').default(false),
  last_login_at: timestamp('last_login_at', { withTimezone: true }),
  updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  clerk_id_idx: index('idx_users_clerk_id').on(table.clerk_id),
  email_idx: index('idx_users_email').on(table.email),
  onboarding_idx: index('idx_users_onboarding').on(table.onboarding_completed),
}));

export const profiles = pgTable('profiles', {
  id: uuid('id').primaryKey().defaultRandom(),
  user_id: uuid('user_id').notNull().unique().references(() => users.id, { onDelete: 'cascade' }),
  first_name: text('first_name'),
  last_name: text('last_name'),
  email: text('email'),
  phone: text('phone'),
  street_address: text('street_address'),
  city: text('city'),
  state: text('state'),
  zip: text('zip'),
  high_school: text('high_school'),
  graduation_year: integer('graduation_year'),
  gpa: decimal('gpa', { precision: 3, scale: 2 }),
  weighted_gpa: decimal('weighted_gpa', { precision: 3, scale: 2 }),
  sat_score: integer('sat_score'),
  act_score: integer('act_score'),
  class_rank: text('class_rank'),
  gender: text('gender'),
  ethnicity: text('ethnicity').array(),
  first_generation: boolean('first_generation').default(false),
  agi_range: text('agi_range'),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  user_id_idx: index('idx_profiles_user_id').on(table.user_id),
  location_idx: index('idx_profiles_location').on(table.city, table.state),
  graduation_year_idx: index('idx_profiles_graduation_year').on(table.graduation_year),
  gpa_idx: index('idx_profiles_gpa').on(table.gpa),
}));

export const essays = pgTable('essays', {
  id: uuid('id').primaryKey().defaultRandom(),
  user_id: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  topic: text('topic').notNull(),
  title: text('title'),
  word_count: integer('word_count'),
  text: text('text').notNull(),
  tags: text('tags').array(),
  times_used: integer('times_used').default(0),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  user_id_idx: index('idx_essays_user_id').on(table.user_id),
  topic_idx: index('idx_essays_topic').on(table.topic),
  word_count_idx: index('idx_essays_word_count').on(table.word_count),
}));

export const activities = pgTable('activities', {
  id: uuid('id').primaryKey().defaultRandom(),
  user_id: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  position: text('position'),
  description_short: text('description_short'),
  description_medium: text('description_medium'),
  description_long: text('description_long'),
  hours_per_week: integer('hours_per_week'),
  weeks_per_year: integer('weeks_per_year'),
  grades: integer('grades').array(),
  times_used: integer('times_used').default(0),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  user_id_idx: index('idx_activities_user_id').on(table.user_id),
}));

export const scholarships = pgTable('scholarships', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  organization: text('organization'),
  amount: integer('amount'),
  deadline: date('deadline').notNull(),
  application_url: text('application_url').notNull(),
  short_description: text('short_description'),
  full_description: text('full_description'),
  min_gpa: decimal('min_gpa', { precision: 3, scale: 2 }),
  max_gpa: decimal('max_gpa', { precision: 3, scale: 2 }),
  min_graduation_year: integer('min_graduation_year'),
  max_graduation_year: integer('max_graduation_year'),
  is_national: boolean('is_national').default(false),
  states: text('states').array(),
  cities: text('cities').array(),
  counties: text('counties').array(),
  high_schools: text('high_schools').array(),
  required_demographics: text('required_demographics').array(),
  required_major: text('required_major').array(),
  agi_max: integer('agi_max'),
  requires_essay: boolean('requires_essay').default(false),
  essay_prompts: text('essay_prompts').array(),
  essay_word_count: integer('essay_word_count'),
  requires_recommendation: boolean('requires_recommendation').default(false),
  requires_transcript: boolean('requires_transcript').default(false),
  requires_resume: boolean('requires_resume').default(false),
  source: text('source'),
  last_verified: timestamp('last_verified', { withTimezone: true }),
  is_active: boolean('is_active').default(true),
  competition_level: text('competition_level'),
  estimated_applicants: integer('estimated_applicants'),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  deadline_idx: index('idx_scholarships_deadline').on(table.deadline),
  active_idx: index('idx_scholarships_active').on(table.is_active),
  amount_idx: index('idx_scholarships_amount').on(table.amount),
  competition_idx: index('idx_scholarships_competition').on(table.competition_level),
}));

export const user_scholarships = pgTable('user_scholarships', {
  id: uuid('id').primaryKey().defaultRandom(),
  user_id: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  scholarship_id: uuid('scholarship_id').notNull().references(() => scholarships.id, { onDelete: 'cascade' }),
  status: text('status').notNull(),
  added_to_cart_at: timestamp('added_to_cart_at', { withTimezone: true }),
  applied_at: timestamp('applied_at', { withTimezone: true }),
  decision_date: date('decision_date'),
  amount_won: integer('amount_won'),
  user_notes: text('user_notes'),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  user_id_idx: index('idx_user_scholarships_user_id').on(table.user_id),
  status_idx: index('idx_user_scholarships_status').on(table.status),
  user_status_idx: index('idx_user_scholarships_user_status').on(table.user_id, table.status),
  deadline_idx: index('idx_user_scholarships_deadline').on(table.scholarship_id, table.added_to_cart_at),
  unique_idx: uniqueIndex('user_scholarships_user_id_scholarship_id_key').on(table.user_id, table.scholarship_id),
}));

export const extension_events = pgTable('extension_events', {
  id: uuid('id').primaryKey().defaultRandom(),
  user_id: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
  event_type: text('event_type').notNull(),
  page_url: text('page_url').notNull(),
  data: jsonb('data'),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  user_id_idx: index('idx_extension_events_user_id').on(table.user_id),
  type_idx: index('idx_extension_events_type').on(table.event_type),
  created_at_idx: index('idx_extension_events_created_at').on(table.created_at),
}));

// TypeScript types inferred from schema
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type Profile = typeof profiles.$inferSelect;
export type NewProfile = typeof profiles.$inferInsert;

export type Essay = typeof essays.$inferSelect;
export type NewEssay = typeof essays.$inferInsert;

export type Activity = typeof activities.$inferSelect;
export type NewActivity = typeof activities.$inferInsert;

export type Scholarship = typeof scholarships.$inferSelect;
export type NewScholarship = typeof scholarships.$inferInsert;

export type UserScholarship = typeof user_scholarships.$inferSelect;
export type NewUserScholarship = typeof user_scholarships.$inferInsert;

export type ExtensionEvent = typeof extension_events.$inferSelect;
export type NewExtensionEvent = typeof extension_events.$inferInsert;