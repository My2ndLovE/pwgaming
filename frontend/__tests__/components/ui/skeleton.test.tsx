/**
 * @jest-environment jsdom
 */
import { render } from '@testing-library/react';
import { Skeleton } from '@/components/ui/skeleton';

describe('Skeleton', () => {
  it('should render a skeleton element', () => {
    const { container } = render(<Skeleton />);

    const skeleton = container.firstChild;
    expect(skeleton).toBeInTheDocument();
    expect(skeleton).toHaveClass('animate-pulse');
  });

  it('should accept custom className', () => {
    const { container } = render(<Skeleton className="custom-class" />);

    const skeleton = container.firstChild;
    expect(skeleton).toHaveClass('custom-class');
  });

  it('should render circle variant', () => {
    const { container } = render(<Skeleton variant="circle" />);

    const skeleton = container.firstChild;
    expect(skeleton).toHaveClass('rounded-full');
  });

  it('should render rectangular variant by default', () => {
    const { container } = render(<Skeleton />);

    const skeleton = container.firstChild;
    expect(skeleton).toHaveClass('rounded');
  });

  it('should accept custom width', () => {
    const { container } = render(<Skeleton width="200px" />);

    const skeleton = container.firstChild as HTMLElement;
    expect(skeleton.style.width).toBe('200px');
  });

  it('should accept custom height', () => {
    const { container } = render(<Skeleton height="100px" />);

    const skeleton = container.firstChild as HTMLElement;
    expect(skeleton.style.height).toBe('100px');
  });

  it('should combine multiple props', () => {
    const { container } = render(
      <Skeleton variant="circle" width="50px" height="50px" className="my-4" />
    );

    const skeleton = container.firstChild as HTMLElement;
    expect(skeleton).toHaveClass('rounded-full', 'my-4', 'animate-pulse');
    expect(skeleton.style.width).toBe('50px');
    expect(skeleton.style.height).toBe('50px');
  });
});
