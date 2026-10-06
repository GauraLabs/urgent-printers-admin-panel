import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { FeedUrlCard, FEED_URL } from './FeedUrlCard';

describe('FeedUrlCard', () => {
  it('shows the feed URL derived from the API base URL', () => {
    render(<FeedUrlCard />);
    expect(FEED_URL.endsWith('/feeds/products.xml')).toBe(true);
    expect(FEED_URL).not.toContain('//feeds');
    expect(screen.getByLabelText('Shopping feed URL')).toHaveValue(FEED_URL);
    expect(screen.getByRole('button', { name: /copy/i })).toBeInTheDocument();
    expect(screen.getByText(/Google Merchant Center/)).toBeInTheDocument();
  });
});
