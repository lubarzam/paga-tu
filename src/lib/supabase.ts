import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database types
export interface Profile {
  id: string;
  email: string;
  name?: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

export interface Account {
  id: string;
  name: string;
  description?: string;
  owner_id: string;
  subtotal: number;
  tip_amount: number;
  tip_included: boolean;
  total: number;
  created_at: string;
  updated_at: string;
}

export interface AccountItem {
  id: string;
  account_id: string;
  name: string;
  amount: number;
  created_at: string;
}

export interface AccountParticipant {
  id: string;
  account_id: string;
  participant_id?: string;
  email: string;
  name?: string;
  is_registered: boolean;
  total_amount: number;
  created_at: string;
}

export interface ItemParticipant {
  id: string;
  item_id: string;
  participant_id: string;
  created_at: string;
}

export interface Invitation {
  id: string;
  account_id: string;
  email: string;
  name?: string;
  invited_by: string;
  status: 'pending' | 'accepted' | 'declined';
  token: string;
  expires_at: string;
  created_at: string;
}