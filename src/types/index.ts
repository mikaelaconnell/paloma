export interface User {
  id: string;
  email: string;
  display_name: string;
  avatar_url: string | null;
  created_at: string;
}

export interface Trip {
  id: string;
  name: string;
  destination: string;
  description: string | null;
  start_date: string;
  end_date: string;
  invite_code: string;
  cover_image: string | null;
  created_by: string;
  created_at: string;
}

export interface TripMember {
  id: string;
  trip_id: string;
  user_id: string;
  role: "owner" | "member";
  arrive_date: string | null;
  depart_date: string | null;
  color: string;
  joined_at: string;
  user?: User;
}

export interface ItineraryDay {
  id: string;
  trip_id: string;
  date: string;
  location: string;
  sort_order: number;
}

export interface ItineraryItem {
  id: string;
  day_id: string;
  title: string;
  note: string | null;
  time: string | null;
  type: "travel" | "food" | "activity" | "explore" | "special" | "accommodation";
  done: boolean;
  created_by: string;
  sort_order: number;
}

export interface MoodItem {
  id: string;
  trip_id: string;
  content: string;
  type: "image" | "text" | "link";
  caption: string | null;
  source: string | null;
  created_by: string;
  created_at: string;
}

export interface PackingItem {
  id: string;
  trip_id: string;
  category: string;
  text: string;
  checked: boolean;
  checked_by: string | null;
  sort_order: number;
}

export interface CostItem {
  id: string;
  trip_id: string;
  description: string;
  amount: number;
  per_person: number;
  pay_to: string | null;
  paid: boolean;
  created_by: string;
}

export interface ChatMessage {
  id: string;
  trip_id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
}

// Shared content from social media
export interface SharedContent {
  id: string;
  trip_id: string;
  source_url: string;
  source_platform: "tiktok" | "instagram" | "pinterest" | "other";
  thumbnail_url: string | null;
  video_url: string | null;
  ai_analysis: ContentAnalysis | null;
  ai_summary: string | null;
  user_notes: string | null;
  status: "pending" | "analyzed" | "added" | "dismissed";
  added_to_day_id: string | null;
  shared_by: string;
  shared_by_name: string | null;
  reactions: Reaction[];
  created_at: string;
}

export interface ContentAnalysis {
  type: "restaurant" | "hotel" | "beach" | "activity" | "landmark" | "nightlife" | "shopping" | "other";
  name: string | null;
  location: string | null;
  description: string;
  tags: string[];
  suggested_day_type: "food" | "activity" | "accommodation" | "explore" | "special";
  confidence: number;
}

export interface Reaction {
  user_id: string;
  user_name: string;
  type: "love" | "yes" | "no" | "maybe";
}

// Polls for group decisions
export interface Poll {
  id: string;
  trip_id: string;
  question: string;
  type: "single" | "multiple" | "ranked";
  status: "open" | "closed";
  created_by: string;
  created_by_name: string | null;
  created_at: string;
  closes_at: string | null;
  options: PollOption[];
}

export interface PollOption {
  id: string;
  poll_id: string;
  text: string;
  image_url: string | null;
  source_url: string | null;
  votes: PollVote[];
}

export interface PollVote {
  user_id: string;
  user_name: string;
  rank: number | null;
}
