import { render, screen } from '@testing-library/react';
import { BalanceCard } from '@/components/wallet/balance-card';

describe('BalanceCard Component', () => {
  it('should display current balance', () => {
    render(<BalanceCard balance={1000} pendingDeposits={0} pendingWithdrawals={0} />);

    expect(screen.getByText(/current balance/i)).toBeInTheDocument();
    expect(screen.getByText('1,000')).toBeInTheDocument();
  });

  it('should display pending deposits when present', () => {
    render(<BalanceCard balance={500} pendingDeposits={200} pendingWithdrawals={0} />);

    expect(screen.getByText(/pending deposits/i)).toBeInTheDocument();
    expect(screen.getByText('200')).toBeInTheDocument();
  });

  it('should display pending withdrawals when present', () => {
    render(<BalanceCard balance={1000} pendingDeposits={0} pendingWithdrawals={300} />);

    expect(screen.getByText(/pending withdrawals/i)).toBeInTheDocument();
    expect(screen.getByText('300')).toBeInTheDocument();
  });

  it('should not display pending sections when amounts are zero', () => {
    render(<BalanceCard balance={500} pendingDeposits={0} pendingWithdrawals={0} />);

    expect(screen.queryByText(/pending deposits/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/pending withdrawals/i)).not.toBeInTheDocument();
  });

  it('should display all amounts correctly', () => {
    render(<BalanceCard balance={1500} pendingDeposits={250} pendingWithdrawals={100} />);

    expect(screen.getByText('1,500')).toBeInTheDocument();
    expect(screen.getByText('250')).toBeInTheDocument();
    expect(screen.getByText('100')).toBeInTheDocument();
  });

  it('should be accessible with proper ARIA labels', () => {
    render(<BalanceCard balance={1000} pendingDeposits={0} pendingWithdrawals={0} />);

    const balanceCard = screen.getByRole('region');
    expect(balanceCard).toHaveAttribute('aria-label', 'Wallet balance information');
  });
});
