export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Omit<Profile, 'created_at'>;
        Update: Partial<Omit<Profile, 'id'>>;
      };
      reviews: {
        Row: Review;
        Insert: Omit<Review, 'id' | 'created_at' | 'likes_count'>;
        Update: Partial<Omit<Review, 'id' | 'user_id'>>;
      };
      review_likes: {
        Row: ReviewLike;
        Insert: Omit<ReviewLike, 'created_at'>;
        Update: never;
      };
      ticket_scans: {
        Row: TicketScan;
        Insert: Omit<TicketScan, 'id' | 'created_at'>;
        Update: Partial<Omit<TicketScan, 'id' | 'user_id'>>;
      };
    };
  };
}

export interface Profile {
  id: string;
  display_name: string;
  avatar_emoji: string;
  total_points: number;
  tier: 'bronze' | 'silver' | 'gold' | 'diamond';
  created_at: string;
}

export interface Review {
  id: string;
  user_id: string;
  station_name: string;
  station_type: 'metro' | 'bus';
  city: 'hcmc';
  rating: number;
  text: string;
  image_url: string | null;
  likes_count: number;
  created_at: string;
}

export interface ReviewLike {
  user_id: string;
  review_id: string;
  created_at: string;
}

export interface TicketScan {
  id: string;
  user_id: string;
  image_url: string;
  ocr_text: string | null;
  route_detected: string | null;
  points_awarded: number;
  status: 'pending' | 'verified' | 'rejected';
  created_at: string;
}
