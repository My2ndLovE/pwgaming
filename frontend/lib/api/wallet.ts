const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4110';

export interface Transaction {
  id: string;
  type: 'deposit' | 'withdrawal' | 'game_win' | 'game_loss';
  amount: number;
  status: 'pending' | 'completed' | 'rejected';
  balanceBefore?: number;
  balanceAfter?: number;
  createdAt: string;
  notes?: string;
}

export interface TransactionResponse {
  transactions: Transaction[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface BalanceResponse {
  balance: number;
}

export interface DepositResponse {
  message: string;
  transaction: {
    id: string;
    amount: number;
    status: string;
    createdAt?: string;
  };
}

export interface WithdrawalResponse {
  message: string;
  transaction: {
    id: string;
    amount: number;
    status: string;
    createdAt?: string;
  };
}

class WalletApiService {
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

  async getBalance(token: string): Promise<BalanceResponse> {
    return this.request<BalanceResponse>('/wallet/balance', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  async getTransactions(
    token: string,
    page = 1,
    limit = 20
  ): Promise<TransactionResponse> {
    return this.request<TransactionResponse>(
      `/wallet/transactions?page=${page}&limit=${limit}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
  }

  async submitDeposit(
    token: string,
    amount: number,
    notes?: string
  ): Promise<DepositResponse> {
    const body: { amount: number; notes?: string } = { amount };
    if (notes) {
      body.notes = notes;
    }

    return this.request<DepositResponse>('/wallet/deposit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });
  }

  async submitWithdrawal(
    token: string,
    amount: number,
    notes?: string
  ): Promise<WithdrawalResponse> {
    const body: { amount: number; notes?: string } = { amount };
    if (notes) {
      body.notes = notes;
    }

    return this.request<WithdrawalResponse>('/wallet/withdraw', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });
  }
}

export const walletApi = new WalletApiService();
