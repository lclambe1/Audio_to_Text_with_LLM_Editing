export type TranscriptionStatus = "pending" | "transcribing" | "editing" | "done" | "error";

export interface WordTimestamp {
  word: string;
  start: number;
  end: number;
}

export interface SubjectProfile {
  id: string;
  user_id: string;
  display_name: string;
  avatar_url: string | null;
  created_at: string;
}

export interface Transcription {
  id: string;
  user_id: string;
  title: string;
  audio_url: string;
  raw_text: string | null;
  grammar_text: string | null;
  ai_text: string | null;
  status: TranscriptionStatus;
  created_at: string;
  duration_seconds: number | null;
  deleted_at: string | null;
  word_timestamps: WordTimestamp[] | null;
  subject_profile_id: string | null;
  subject_profiles?: SubjectProfile | null;
}

export type SubscriptionPlan = "free" | "pro";
export type SubscriptionStatus = "active" | "canceled" | "past_due" | "trialing";

export interface Subscription {
  id: string;
  user_id: string;
  stripe_customer_id: string;
  stripe_subscription_id: string | null;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  current_period_end: string | null;
}
