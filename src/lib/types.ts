// Database types for the expense splitting app

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
  paid: boolean;
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