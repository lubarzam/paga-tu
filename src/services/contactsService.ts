import { apiClient } from '@/integrations/api/client';

export interface FrequentContact {
  id: string;
  name: string;
  email: string;
  usage_count: number;
  last_used_at: string;
}

export const contactsService = {

  async getFrequentContacts(): Promise<FrequentContact[]> {
    return apiClient.get<FrequentContact[]>('/api/contacts');
  },


  async addOrUpdateContact(name: string, email: string): Promise<void> {
    await apiClient.post('/api/contacts', { name, email });
  },


  async searchContacts(query: string): Promise<FrequentContact[]> {
    if (!query || query.trim().length < 2) return [];
    const q = encodeURIComponent(query.trim());
    return apiClient.get<FrequentContact[]>(`/api/contacts/search?q=${q}`);
  },
};
