/**
 * @jest-environment jsdom
 */
import { render, screen } from '@testing-library/react';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

describe('LoadingSpinner', () => {
  it('should render a loading spinner', () => {
    render(<LoadingSpinner />);

    const spinner = screen.getByRole('status');
    expect(spinner).toBeInTheDocument();
  });

  it('should have accessible aria-label', () => {
    render(<LoadingSpinner />);

    const spinner = screen.getByLabelText(/loading/i);
    expect(spinner).toBeInTheDocument();
  });

  it('should accept custom size prop', () => {
    const { container } = render(<LoadingSpinner size="lg" />);

    const spinner = container.querySelector('svg');
    expect(spinner).toHaveClass('w-12', 'h-12');
  });

  it('should accept small size prop', () => {
    const { container } = render(<LoadingSpinner size="sm" />);

    const spinner = container.querySelector('svg');
    expect(spinner).toHaveClass('w-4', 'h-4');
  });

  it('should use default medium size when no size specified', () => {
    const { container } = render(<LoadingSpinner />);

    const spinner = container.querySelector('svg');
    expect(spinner).toHaveClass('w-8', 'h-8');
  });

  it('should display optional text', () => {
    render(<LoadingSpinner text="Loading data..." />);

    expect(screen.getByText('Loading data...')).toBeInTheDocument();
  });

  it('should not display text when not provided', () => {
    const { container } = render(<LoadingSpinner />);

    const text = container.querySelector('p');
    expect(text).not.toBeInTheDocument();
  });
});
