import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { WithdrawalForm } from '@/components/wallet/withdrawal-form';

describe('WithdrawalForm Component', () => {
  const mockOnSubmit = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render withdrawal form with amount input', () => {
    render(<WithdrawalForm onSubmit={mockOnSubmit} isLoading={false} maxAmount={1000} />);

    expect(screen.getByLabelText(/amount/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /submit withdrawal/i })).toBeInTheDocument();
  });

  it('should validate insufficient balance', async () => {
    render(<WithdrawalForm onSubmit={mockOnSubmit} isLoading={false} maxAmount={500} />);

    const amountInput = screen.getByLabelText(/amount/i) as HTMLInputElement;
    const submitButton = screen.getByRole('button', { name: /submit withdrawal/i });

    fireEvent.change(amountInput, { target: { value: '600' } });
    fireEvent.submit(submitButton.closest('form')!);

    // Wait for error message to appear
    const errorMessage = await screen.findByText(/amount exceeds available balance/i);
    expect(errorMessage).toBeInTheDocument();

    // Check that submit was not called
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('should submit valid withdrawal', async () => {
    render(<WithdrawalForm onSubmit={mockOnSubmit} isLoading={false} maxAmount={1000} />);

    const amountInput = screen.getByLabelText(/amount/i);
    const submitButton = screen.getByRole('button', { name: /submit withdrawal/i });

    fireEvent.change(amountInput, { target: { value: '100' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith(100, undefined);
    });
  });

  it('should display available balance', () => {
    render(<WithdrawalForm onSubmit={mockOnSubmit} isLoading={false} maxAmount={1000} />);

    expect(screen.getByText(/available: 1,000/i)).toBeInTheDocument();
  });

  it('should disable submit button when loading', () => {
    render(<WithdrawalForm onSubmit={mockOnSubmit} isLoading={true} maxAmount={1000} />);

    const submitButton = screen.getByRole('button', { name: /submitting/i });
    expect(submitButton).toBeDisabled();
  });
});
