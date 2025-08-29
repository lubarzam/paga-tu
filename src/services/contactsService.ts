import { supabase } from "@/integrations/supabase/client";

export interface FrequentContact {
  id: string;
  name: string;
  email: string;
  usage_count: number;
  last_used_at: string;
}

export const contactsService = {
  async getFrequentContacts(): Promise<FrequentContact[]> {
    const { data, error } = await supabase
      .from('frequent_contacts')
      .select('*')
      .order('usage_count', { ascending: false })
      .order('last_used_at', { ascending: false });

    if (error) {
      console.error('Error fetching frequent contacts:', error);
      throw error;
    }

    return data || [];
  },

  async addOrUpdateContact(name: string, email: string): Promise<void> {
    // Try to update existing contact
    const { data: existingContact } = await supabase
      .from('frequent_contacts')
      .select('*')
      .eq('email', email)
      .single();

    if (existingContact) {
      // Update existing contact
      const { error } = await supabase
        .from('frequent_contacts')
        .update({
          name,
          usage_count: existingContact.usage_count + 1,
          last_used_at: new Date().toISOString(),
        })
        .eq('id', existingContact.id);

      if (error) {
        console.error('Error updating frequent contact:', error);
        throw error;
      }
    } else {
      // Create new contact
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('frequent_contacts')
        .insert({
          user_id: user.id,
          name,
          email,
          usage_count: 1,
          last_used_at: new Date().toISOString(),
        });

      if (error) {
        console.error('Error creating frequent contact:', error);
        throw error;
      }
    }
  },

  async searchContacts(query: string): Promise<FrequentContact[]> {
    if (!query.trim()) return [];

    const { data, error } = await supabase
      .from('frequent_contacts')
      .select('*')
      .or(`name.ilike.%${query}%,email.ilike.%${query}%`)
      .order('usage_count', { ascending: false })
      .limit(5);

    if (error) {
      console.error('Error searching contacts:', error);
      throw error;
    }

    return data || [];
  }
};