const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4110';

export interface PendingWithdrawal {
  id: string;
  userId: string;
  username: string;
  amount: number;
  status: string;
  createdAt: string;
  notes?: string;
}

export interface WithdrawalsResponse {
  withdrawals: PendingWithdrawal[];
}

export interface ApprovalResponse {
  message: string;
  transaction: {
    id: string;
    status: string;
    processedAt: string;
  };
}

class AdminWithdrawalsApiService {
  private async request<T>(
    endpoint: string,
    options?: RequestInit
  ): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, options);

    if (!response.ok) {
      const error = await response.json().catch(() => ({
        message: 'Request failed',
      }));
      throw new Error(error.message || `HTTP ${response.status}`);
    }

    return response.json();
  }

  async getPendingWithdrawals(token: string): Promise<WithdrawalsResponse> {
    return this.request<WithdrawalsResponse>('/admin/withdrawals', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  async approveWithdrawal(
    token: string,
    withdrawalId: string
  ): Promise<ApprovalResponse> {
    return this.request<ApprovalResponse>(
      `/admin/withdrawals/${withdrawalId}/approve`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
  }

  async rejectWithdrawal(
    token: string,
    withdrawalId: string,
    reason: string
  ): Promise<ApprovalResponse> {
    return this.request<ApprovalResponse>(
      `/admin/withdrawals/${withdrawalId}/reject`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ reason }),
      }
    );
  }
}

export const adminWithdrawalsApi = new AdminWithdrawalsApiService();
