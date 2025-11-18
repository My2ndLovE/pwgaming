import '@testing-library/jest-dom';

// Mock react-i18next
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => {
      const translations = {
        'login': 'Login with Telegram',
        'already_authenticated': 'Already Authenticated',
        'current_balance': 'Current Balance',
        'pending_deposits': 'Pending Deposits',
        'pending_withdrawals': 'Pending Withdrawals',
        'wallet_balance_info': 'Wallet balance information',
        'deposit_funds': 'Deposit Funds',
        'submit_deposit': 'Submit Deposit',
        'withdraw_funds': 'Withdraw Funds',
        'submit_withdrawal': 'Submit Withdrawal',
        'not_running_in_telegram': 'Not running in Telegram',
        'not_telegram_env': 'Not running in Telegram environment',
        'amount_exceeds_balance': 'Amount exceeds available balance',
        'amount_below_minimum': 'Amount is below minimum',
        'amount_greater_than_zero': 'Amount must be greater than 0',
      };
      return translations[key] || key;
    },
    i18n: {
      language: 'en',
      changeLanguage: jest.fn(),
    },
  }),
  Trans: ({ children }) => children,
  I18nextProvider: ({ children }) => children,
}));

// Mock next-i18next (for pages using it)
jest.mock('next-i18next', () => ({
  useTranslation: () => ({
    t: (key) => {
      const translations = {
        'login': 'Login with Telegram',
        'already_authenticated': 'Already Authenticated',
        'current_balance': 'Current Balance',
        'pending_deposits': 'Pending Deposits',
        'pending_withdrawals': 'Pending Withdrawals',
        'wallet_balance_info': 'Wallet balance information',
        'deposit_funds': 'Deposit Funds',
        'submit_deposit': 'Submit Deposit',
        'withdraw_funds': 'Withdraw Funds',
        'submit_withdrawal': 'Submit Withdrawal',
        'not_running_in_telegram': 'Not running in Telegram',
      };
      return translations[key] || key;
    },
    i18n: {
      language: 'en',
    },
  }),
}));

// Mock environment variables
process.env.NEXT_PUBLIC_API_URL = 'http://localhost:4110';
