import React from 'react';
import { render, screen } from '@testing-library/react';
import { PlayingCard } from '../../../components/game/playing-card';

describe('PlayingCard', () => {
  it('should render face down card', () => {
    const { container } = render(<PlayingCard card="" faceUp={false} />);
    expect(container.querySelector('.from-blue-700')).toBeInTheDocument();
  });

  it('should render face up card with correct rank and suit', () => {
    const { container } = render(<PlayingCard card="Ah" faceUp={true} />);
    expect(container.textContent).toContain('A');
    expect(container.textContent).toContain('♥');
  });

  it('should render red suits correctly', () => {
    const { container: heartsContainer } = render(<PlayingCard card="Kh" faceUp={true} />);
    expect(heartsContainer.querySelector('.text-red-600')).toBeInTheDocument();

    const { container: diamondsContainer } = render(<PlayingCard card="Qd" faceUp={true} />);
    expect(diamondsContainer.querySelector('.text-red-600')).toBeInTheDocument();
  });

  it('should render black suits correctly', () => {
    const { container: clubsContainer } = render(<PlayingCard card="Jc" faceUp={true} />);
    expect(clubsContainer.querySelector('.text-black')).toBeInTheDocument();

    const { container: spadesContainer } = render(<PlayingCard card="Ts" faceUp={true} />);
    expect(spadesContainer.querySelector('.text-black')).toBeInTheDocument();
  });

  it('should render different sizes', () => {
    const { container: smContainer } = render(<PlayingCard card="Ah" faceUp={true} size="sm" />);
    expect(smContainer.querySelector('.w-12')).toBeInTheDocument();

    const { container: mdContainer } = render(<PlayingCard card="Ah" faceUp={true} size="md" />);
    expect(mdContainer.querySelector('.w-16')).toBeInTheDocument();

    const { container: lgContainer } = render(<PlayingCard card="Ah" faceUp={true} size="lg" />);
    expect(lgContainer.querySelector('.w-20')).toBeInTheDocument();
  });

  it('should render placeholder for empty face up card', () => {
    const { container } = render(<PlayingCard card="" faceUp={true} />);
    expect(container.querySelector('.border-dashed')).toBeInTheDocument();
  });
});
