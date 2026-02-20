export type EssayTopic =
  | 'personal_statement'
  | 'leadership'
  | 'challenge'
  | 'community_service'
  | 'diversity'
  | 'career_goals'
  | 'academic_interest'
  | 'extracurricular'
  | 'work_experience'
  | 'other';

export interface Essay {
  id: string;
  topic: EssayTopic;
  title: string | null;
  text: string;
  word_count: number | null;
  tags: string[] | null;
  times_used: number | null;
  created_at: string | null;
}

export interface Scholarship {
  id: string;
  name: string;
  organization: string | null;
  amount: number | null;
  deadline: string;
  application_url: string;
  requires_essay: boolean | null;
  essay_word_count: number | null;
  essay_prompts: string[] | null;
  requires_recommendation: boolean | null;
  requires_transcript: boolean | null;
  requires_resume: boolean | null;
}

export type CartStatus = 'in_cart' | 'applied' | 'won' | 'lost' | 'saved' | 'rejected_by_user';

export interface CartItem {
  id: string;
  user_id: string;
  scholarship_id: string;
  status: CartStatus;
  added_to_cart_at: string | null;
  applied_at: string | null;
  decision_date: string | null;
  amount_won: number | null;
  user_notes: string | null;
  scholarship: Scholarship;
}

export interface CartResponse {
  inCart: CartItem[];
  applied: CartItem[];
  won: CartItem[];
  lost: CartItem[];
}
