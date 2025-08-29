import { supabase } from '@/integrations/supabase/client';
import type { Account, AccountItem, AccountParticipant } from '@/lib/types';

export const accountService = {
  async createAccount(data: {
    name: string;
    description?: string;
    items: Array<{ name: string; amount: number; participants: string[] }>;
    participants: Array<{ email: string; name?: string }>;
    tipIncluded: boolean;
    tipAmount?: number;
  }) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Usuario no autenticado');

    // Calculate totals
    const subtotal = data.items.reduce((sum, item) => sum + item.amount, 0);
    const tipAmount = data.tipAmount || 0;
    const total = subtotal + tipAmount;

    // Create account
    const { data: account, error: accountError } = await supabase
      .from('accounts')
      .insert({
        name: data.name,
        description: data.description,
        owner_id: user.id,
        subtotal,
        tip_amount: tipAmount,
        tip_included: data.tipIncluded,
        total,
      })
      .select()
      .single();

    if (accountError) throw accountError;

    // Create participants
    const participantsToInsert = data.participants.map(p => ({
      account_id: account.id,
      email: p.email,
      name: p.name,
      is_registered: false,
    }));

    const { data: participants, error: participantsError } = await supabase
      .from('account_participants')
      .insert(participantsToInsert)
      .select();

    if (participantsError) throw participantsError;

    // Create items
    const itemsToInsert = data.items.map(item => ({
      account_id: account.id,
      name: item.name,
      amount: item.amount,
    }));

    const { data: createdItems, error: itemsError } = await supabase
      .from('account_items')
      .insert(itemsToInsert)
      .select();

    if (itemsError) throw itemsError;

    // Create item-participant relationships
    const itemParticipants = [];
    for (let i = 0; i < data.items.length; i++) {
      const item = createdItems[i];
      const participantEmails = data.items[i].participants;
      
      for (const email of participantEmails) {
        const participant = participants.find(p => p.email === email);
        if (participant) {
          itemParticipants.push({
            item_id: item.id,
            participant_id: participant.id,
          });
        }
      }
    }

    if (itemParticipants.length > 0) {
      const { error: itemParticipantsError } = await supabase
        .from('item_participants')
        .insert(itemParticipants);

      if (itemParticipantsError) throw itemParticipantsError;
    }

    // Calculate participant totals
    await supabase.rpc('calculate_participant_totals', {
      p_account_id: account.id
    });

    // Send invitations
    for (const participant of data.participants) {
      try {
        await supabase.rpc('send_invitation_email', {
          p_account_id: account.id,
          p_email: participant.email,
          p_name: participant.name,
        });
      } catch (error) {
        console.error('Error sending invitation to', participant.email, error);
      }
    }

    return account;
  },

  async getAccount(id: string) {
    const { data, error } = await supabase
      .from('accounts')
      .select(`
        *,
        account_items (*),
        account_participants (*)
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  async getUserAccounts() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Usuario no autenticado');

    const { data, error } = await supabase
      .from('accounts')
      .select(`
        *,
        account_participants!inner (participant_id)
      `)
      .or(`owner_id.eq.${user.id},account_participants.participant_id.eq.${user.id}`)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  async acceptInvitation(token: string) {
    const { data, error } = await supabase.rpc('accept_invitation', {
      p_token: token
    });

    if (error) throw error;
    return data;
  }
};