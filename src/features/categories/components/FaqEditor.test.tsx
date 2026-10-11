import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { FaqEditor } from './FaqEditor';

const faqs = [{ question: 'A?', answer: 'a' }, { question: 'B?', answer: 'b' }];

describe('FaqEditor', () => {
  it('adds a blank row', () => {
    const onChange = vi.fn();
    render(<FaqEditor value={faqs} onChange={onChange} />);
    fireEvent.click(screen.getByRole('button', { name: /Add FAQ/ }));
    expect(onChange).toHaveBeenCalledWith([...faqs, { question: '', answer: '' }]);
  });

  it('removes and reorders rows', () => {
    const onChange = vi.fn();
    render(<FaqEditor value={faqs} onChange={onChange} />);
    fireEvent.click(screen.getByLabelText('Remove FAQ 1'));
    expect(onChange).toHaveBeenLastCalledWith([faqs[1]]);
    fireEvent.click(screen.getByLabelText('Move FAQ 1 down'));
    expect(onChange).toHaveBeenLastCalledWith([faqs[1], faqs[0]]);
    expect(screen.getByLabelText('Move FAQ 1 up')).toBeDisabled();
    expect(screen.getByLabelText('Move FAQ 2 down')).toBeDisabled();
  });

  it('shows validation errors only when asked', () => {
    const bad = [{ question: '', answer: '' }];
    const { rerender } = render(<FaqEditor value={bad} onChange={vi.fn()} />);
    expect(screen.queryByText('Question is required')).toBeNull();
    rerender(<FaqEditor value={bad} onChange={vi.fn()} showErrors />);
    expect(screen.getByText('Question is required')).toBeInTheDocument();
    expect(screen.getByText('Answer is required')).toBeInTheDocument();
  });

  it('disables Add at 20 rows', () => {
    const twenty = Array.from({ length: 20 }, () => ({ question: 'q', answer: 'a' }));
    render(<FaqEditor value={twenty} onChange={vi.fn()} />);
    expect(screen.getByRole('button', { name: /Add FAQ/ })).toBeDisabled();
  });
});
