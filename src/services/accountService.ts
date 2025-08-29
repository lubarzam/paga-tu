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

    // Get current user profile
    const { data: userProfile } = await supabase
      .from('profiles')
      .select('name, email')
      .eq('id', user.id)
      .single();

    // Create temporary profiles for unregistered participants
    for (const participant of data.participants) {
      await supabase.rpc('create_temporary_profile', {
        p_email: participant.email,
        p_name: participant.name
      });
    }

    // Create participants (including the owner)
    const participantsToInsert = [
      // Add the owner as a participant
      {
        account_id: account.id,
        participant_id: user.id,
        email: userProfile?.email || user.email,
        name: userProfile?.name || 'Tu',
        is_registered: true,
      },
      // Add other participants
      ...data.participants.map(p => ({
        account_id: account.id,
        email: p.email,
        name: p.name,
        is_registered: false,
        participant_id: null, // Will be filled when user registers
      }))
    ];

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
    const ownerParticipant = participants.find(p => p.participant_id === user.id);

    for (let i = 0; i < data.items.length; i++) {
      const item = createdItems[i];
      const participantNames = data.items[i].participants;
      
      for (const participantName of participantNames) {
        let participant;
        
        if (participantName === "Tu") {
          // Use owner participant
          participant = ownerParticipant;
        } else {
          // Find participant by name
          participant = participants.find(p => p.name === participantName);
        }
        
        if (participant) {
          itemParticipants.push({
            item_id: item.id,
            participant_id: participant.id, // Use account_participants.id
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

    // Link any existing registered participants
    await supabase.rpc('link_registered_participants', {
      p_account_id: account.id
    });

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
    
    // Get item participants for each item
    const accountWithItemParticipants = {
      ...data,
      account_items: await Promise.all(
        data.account_items.map(async (item: any) => {
          const { data: itemParticipants } = await supabase
            .from('item_participants')
            .select('participant_id')
            .eq('item_id', item.id);

          const participantsDetails = (itemParticipants || [])
            .map((ip: any) => data.account_participants.find((ap: any) => ap.id === ip.participant_id))
            .filter(Boolean);

          return {
            ...item,
            participants: participantsDetails
          };
        })
      )
    };

    return accountWithItemParticipants;
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

    // Fetch accounts where the user is a participant 
    const { data: participantRows, error: participantError } = await supabase
      .from('account_participants')
      .select('account_id')
      .eq('participant_id', user.id);

    if (ownedError && participantError) {
      throw ownedError;
    }

    // Get full account details for participating accounts with owner profiles
    let participating = [];
    if (participantRows && participantRows.length > 0) {
      const accountIds = participantRows.map(r => r.account_id);
      
      // Get all accounts with owner profiles
      const { data: allParticipatingAccounts, error: participatingError } = await supabase
        .from('accounts')
        .select(`
          *,
          profiles!accounts_owner_id_fkey(name, email)
        `)
        .in('id', accountIds);
      
      // Then filter out accounts I own in JavaScript
      participating = (allParticipatingAccounts || []).filter(account => account.owner_id !== user.id);
    }

    const all = [...(owned || []), ...participating];
    // De-duplicate by account id
    const unique = Array.from(new Map(all.map((a: any) => [a.id, a])).values());

    // Calculate status, participant count, and user's amount for each account
    const accountsWithStatus = await Promise.all(
      unique.map(async (account: any) => {
        const { data: participants } = await supabase
          .from('account_participants')
          .select('paid, participant_id, total_amount')
          .eq('account_id', account.id);

        const totalParticipants = participants?.length || 0;
        const paidParticipants = participants?.filter(p => p.paid).length || 0;

        // Get current user's amount for this account
        const userParticipant = participants?.find(p => p.participant_id === user.id);
        const userAmount = userParticipant?.total_amount || 0;

        let status = 'pending';
        if (paidParticipants === totalParticipants && totalParticipants > 0) {
          status = 'paid';
        } else if (paidParticipants > 0) {
          status = 'partial';
        }

        return {
          ...account,
          participant_count: totalParticipants,
          paid_count: paidParticipants,
          user_amount: userAmount,
          status
        };
      })
    );

    // Sort by created_at desc
    accountsWithStatus.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    return accountsWithStatus;
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
  },

  async deleteAccount(id: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Usuario no autenticado');

    // Verify user is the owner
    const { data: account } = await supabase
      .from('accounts')
      .select('owner_id')
      .eq('id', id)
      .single();

    if (!account || account.owner_id !== user.id) {
      throw new Error('No tienes permisos para eliminar esta cuenta');
    }

    // Delete account (cascading will handle related tables)
    const { error } = await supabase
      .from('accounts')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
};