import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { DepositForm } from '@/components/wallet/deposit-form';

describe('DepositForm Component', () => {
  const mockOnSubmit = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render deposit form with amount input', () => {
    render(<DepositForm onSubmit={mockOnSubmit} isLoading={false} />);

    expect(screen.getByLabelText(/amount/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /submit deposit/i })).toBeInTheDocument();
  });

  it('should validate minimum amount', async () => {
    render(<DepositForm onSubmit={mockOnSubmit} isLoading={false} />);

    const amountInput = screen.getByLabelText(/amount/i);
    const submitButton = screen.getByRole('button', { name: /submit deposit/i });

    fireEvent.change(amountInput, { target: { value: '0' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/amount must be greater than 0/i)).toBeInTheDocument();
    });

    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('should submit valid deposit', async () => {
    render(<DepositForm onSubmit={mockOnSubmit} isLoading={false} />);

    const amountInput = screen.getByLabelText(/amount/i);
    const submitButton = screen.getByRole('button', { name: /submit deposit/i });

    fireEvent.change(amountInput, { target: { value: '100' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith(100, undefined);
    });
  });

  it('should disable submit button when loading', () => {
    render(<DepositForm onSubmit={mockOnSubmit} isLoading={true} />);

    const submitButton = screen.getByRole('button', { name: /submitting/i });
    expect(submitButton).toBeDisabled();
  });

  it('should include notes if provided', async () => {
    render(<DepositForm onSubmit={mockOnSubmit} isLoading={false} />);

    const amountInput = screen.getByLabelText(/amount/i);
    const notesInput = screen.getByLabelText(/notes/i);
    const submitButton = screen.getByRole('button', { name: /submit deposit/i });

    fireEvent.change(amountInput, { target: { value: '200' } });
    fireEvent.change(notesInput, { target: { value: 'Test note' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith(200, 'Test note');
    });
  });
});
