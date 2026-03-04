import { apiClient } from '@/integrations/api/client';
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
    return apiClient.post<Account>('/api/accounts', data);
  },


  async getAccount(id: string) {
    return apiClient.get<Account & {
      account_items: Array<AccountItem & { participants: AccountParticipant[] }>;
      account_participants: AccountParticipant[];
    }>(`/api/accounts/${id}`);
  },


  async getUserAccounts() {
    return apiClient.get<Account[]>('/api/accounts');
  },


  async updateAccount(id: string, data: {
    name: string;
    description?: string;
    items: Array<{ id?: string; name: string; amount: number; participants?: string[] }>;
    participants: Array<{ id?: string; email: string; name?: string }>;
    tipIncluded: boolean;
    tipAmount?: number;
  }) {
    return apiClient.put<{ id: string }>(`/api/accounts/${id}`, data);
  },


  async sendReminder(accountId: string) {
    return apiClient.post('/api/reminders/send', { accountId });
  },


  async markAsPaid(accountId: string, participantId: string) {
    return apiClient.put(`/api/accounts/${accountId}/participants/${participantId}/paid`);
  },


  async acceptInvitation(token: string) {
    return apiClient.post<{ success: boolean; account_id: string }>(
      `/api/invitations/accept/${token}`
    );
  },


  async deleteAccount(id: string) {
    return apiClient.delete(`/api/accounts/${id}`);
  },
};
