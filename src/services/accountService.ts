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

    // Fetch accounts the user owns
    const { data: owned, error: ownedError } = await supabase
      .from('accounts')
      .select('*')
      .eq('owner_id', user.id)
      .order('created_at', { ascending: false });

    // Fetch accounts where the user is a participant via a safe join from account_participants
    const { data: participantRows, error: participantError } = await supabase
      .from('account_participants')
      .select('account_id, accounts:account_id(*)')
      .eq('participant_id', user.id);

    if (ownedError && participantError) {
      // If both queries failed, surface the ownedError by default
      throw ownedError;
    }

    const participating = (participantRows || [])
      .map((r: any) => r.accounts)
      .filter(Boolean);

    const all = [...(owned || []), ...participating];
    // De-duplicate by account id
    const unique = Array.from(new Map(all.map((a: any) => [a.id, a])).values());

    // Sort by created_at desc
    unique.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    return unique;
  },

  async updateAccount(id: string, data: {
    name: string;
    description?: string;
    items: Array<{ id?: string; name: string; amount: number; participants?: string[] }>;
    participants: Array<{ id?: string; email: string; name?: string }>;
    tipIncluded: boolean;
    tipAmount?: number;
  }) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Usuario no autenticado');

    // Calculate totals
    const subtotal = data.items.reduce((sum, item) => sum + item.amount, 0);
    const tipAmount = data.tipAmount || 0;
    const total = subtotal + tipAmount;

    // Update account
    const { error: accountError } = await supabase
      .from('accounts')
      .update({
        name: data.name,
        description: data.description,
        subtotal,
        tip_amount: tipAmount,
        tip_included: data.tipIncluded,
        total,
      })
      .eq('id', id);

    if (accountError) throw accountError;

    // Update items (simple approach - delete all and recreate)
    await supabase.from('account_items').delete().eq('account_id', id);
    
    if (data.items.length > 0) {
      const itemsToInsert = data.items.map(item => ({
        account_id: id,
        name: item.name,
        amount: item.amount,
      }));

      const { error: itemsError } = await supabase
        .from('account_items')
        .insert(itemsToInsert);

      if (itemsError) throw itemsError;
    }

    // Recalculate participant totals
    await supabase.rpc('calculate_participant_totals', {
      p_account_id: id
    });

    return { id };
  },

  async sendReminder(accountId: string) {
    const { data, error } = await supabase.functions.invoke('send-reminder', {
      body: { accountId }
    });

    if (error) throw error;
    return data;
  },

  async markAsPaid(accountId: string, participantId: string) {
    const { error } = await supabase
      .from('account_participants')
      .update({ paid: true })
      .eq('account_id', accountId)
      .eq('id', participantId);

    if (error) throw error;
    return { success: true };
  },

  async acceptInvitation(token: string) {
    const { data, error } = await supabase.rpc('accept_invitation', {
      p_token: token
    });

    if (error) throw error;
    return data;
  }
};