'use client';

import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { CategoryFaq } from '@/lib/api/categories';
import {
  FAQ_ANSWER_MAX, FAQ_QUESTION_MAX, MAX_FAQS, moveItem, validateFaqs,
} from '../utils/categoryTree';

interface Props {
  value: CategoryFaq[];
  onChange: (next: CategoryFaq[]) => void;
  showErrors?: boolean;
}

const inputCls = 'w-full px-3 py-2 text-sm bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/40';
const errorCls = 'mt-1 text-xs text-destructive';
const iconBtn = 'p-1 rounded hover:bg-muted text-muted-foreground disabled:opacity-30 disabled:hover:bg-transparent';

export function FaqEditor({ value, onChange, showErrors = false }: Props) {
  const { rows, form } = validateFaqs(value);

  function update(i: number, patch: Partial<CategoryFaq>) {
    onChange(value.map((f, idx) => (idx === i ? { ...f, ...patch } : f)));
  }

  return (
    <div className="space-y-3" data-testid="faq-editor">
      {value.length === 0 && <p className="text-xs text-muted-foreground">No FAQs yet.</p>}
      {value.map((f, i) => (
        <div key={i} className="rounded-lg border border-border p-3 space-y-2" data-testid="faq-row">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-muted-foreground">FAQ {i + 1}</span>
            <div className="flex items-center gap-0.5">
              <button type="button" className={iconBtn} aria-label={`Move FAQ ${i + 1} up`} disabled={i === 0} onClick={() => onChange(moveItem(value, i, i - 1))}>
                <ArrowUp className="h-3.5 w-3.5" />
              </button>
              <button type="button" className={iconBtn} aria-label={`Move FAQ ${i + 1} down`} disabled={i === value.length - 1} onClick={() => onChange(moveItem(value, i, i + 1))}>
                <ArrowDown className="h-3.5 w-3.5" />
              </button>
              <button type="button" className={iconBtn} aria-label={`Remove FAQ ${i + 1}`} onClick={() => onChange(value.filter((_, idx) => idx !== i))}>
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
          <div>
            <input
              value={f.question}
              onChange={(e) => update(i, { question: e.target.value })}
              placeholder="Question"
              aria-label={`FAQ ${i + 1} question`}
              className={inputCls}
            />
            <div className="flex justify-between">
              <span>{showErrors && rows[i].question && <span className={errorCls}>{rows[i].question}</span>}</span>
              <span className={`text-[11px] ${f.question.length > FAQ_QUESTION_MAX ? 'text-destructive' : 'text-muted-foreground'}`}>{f.question.length}/{FAQ_QUESTION_MAX}</span>
            </div>
          </div>
          <div>
            <textarea
              value={f.answer}
              onChange={(e) => update(i, { answer: e.target.value })}
              rows={3}
              placeholder="Answer"
              aria-label={`FAQ ${i + 1} answer`}
              className={inputCls}
            />
            <div className="flex justify-between">
              <span>{showErrors && rows[i].answer && <span className={errorCls}>{rows[i].answer}</span>}</span>
              <span className={`text-[11px] ${f.answer.length > FAQ_ANSWER_MAX ? 'text-destructive' : 'text-muted-foreground'}`}>{f.answer.length}/{FAQ_ANSWER_MAX}</span>
            </div>
          </div>
        </div>
      ))}
      {form && <p className={errorCls}>{form}</p>}
      <Button
        type="button"
        size="sm"
        variant="outline"
        disabled={value.length >= MAX_FAQS}
        onClick={() => onChange([...value, { question: '', answer: '' }])}
      >
        <Plus className="h-3.5 w-3.5" /> Add FAQ ({value.length}/{MAX_FAQS})
      </Button>
    </div>
  );
}
