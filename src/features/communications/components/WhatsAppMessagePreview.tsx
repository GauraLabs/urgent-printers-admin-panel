'use client';

import { ExternalLink, FileText, Phone, Play, Reply } from 'lucide-react';
import type { WhatsAppTemplateComponent } from '@/types';

function highlightVariables(text: string): React.ReactNode[] {
  const parts = text.split(/({{[^}]+}})/g);
  return parts.map((part, i) =>
    /^{{[^}]+}}$/.test(part) ? (
      <span key={i} className="text-blue-600 font-medium">
        {part}
      </span>
    ) : (
      part
    ),
  );
}

interface Props {
  components: WhatsAppTemplateComponent[];
}

export function WhatsAppMessagePreview({ components }: Props) {
  if (components.length === 0) {
    return (
      <div className="max-w-xs mx-auto bg-zinc-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="bg-[#075E54] px-3 py-2 flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
            <span className="text-white text-[10px] font-bold">W</span>
          </div>
          <span className="text-white text-xs font-medium">WhatsApp Business</span>
        </div>
        <div className="p-4 flex items-center justify-center min-h-[80px]">
          <p className="text-zinc-400 text-xs text-center">No preview available</p>
        </div>
      </div>
    );
  }

  const header = components.find((c) => c.type === 'HEADER');
  const body = components.find((c) => c.type === 'BODY');
  const footer = components.find((c) => c.type === 'FOOTER');
  const buttonsComp = components.find((c) => c.type === 'BUTTONS');

  return (
    <div className="max-w-xs mx-auto bg-zinc-800 rounded-2xl overflow-hidden shadow-xl select-none">
      <div className="bg-[#075E54] px-3 py-2 flex items-center gap-2">
        <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
          <span className="text-white text-[10px] font-bold">W</span>
        </div>
        <span className="text-white text-xs font-medium">WhatsApp Business</span>
      </div>

      <div
        className="p-3 min-h-[100px]"
        style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.03'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")" }}
      >
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden max-w-[220px] ml-auto">
          {header && (
            <div className="px-3 pt-3">
              {header.format === 'TEXT' && header.text && (
                <p className="text-[13px] font-bold text-zinc-900 leading-snug">
                  {highlightVariables(header.text)}
                </p>
              )}
              {header.format === 'IMAGE' && (
                <div className="w-full h-28 bg-zinc-100 rounded-lg flex items-center justify-center mb-1">
                  <div className="text-zinc-400 flex flex-col items-center gap-1">
                    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3 3h18M3 21h18" />
                    </svg>
                    <span className="text-[10px]">Image</span>
                  </div>
                </div>
              )}
              {header.format === 'VIDEO' && (
                <div className="w-full h-28 bg-zinc-100 rounded-lg flex items-center justify-center mb-1">
                  <div className="text-zinc-400 flex flex-col items-center gap-1">
                    <Play className="w-8 h-8" />
                    <span className="text-[10px]">Video</span>
                  </div>
                </div>
              )}
              {header.format === 'DOCUMENT' && (
                <div className="w-full h-20 bg-zinc-100 rounded-lg flex items-center justify-center mb-1">
                  <div className="text-zinc-400 flex flex-col items-center gap-1">
                    <FileText className="w-8 h-8" />
                    <span className="text-[10px]">Document</span>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="px-3 pt-2 pb-1">
            {body?.text && (
              <p className="text-[12px] text-zinc-800 leading-relaxed whitespace-pre-wrap">
                {highlightVariables(body.text)}
              </p>
            )}

            {footer?.text && (
              <p className="text-[11px] text-zinc-400 mt-1.5">{footer.text}</p>
            )}

            <div className="flex items-center justify-end gap-1 mt-1.5 pb-0.5">
              <span className="text-[10px] text-zinc-400">10:30 AM</span>
              <svg className="w-3 h-3 text-zinc-400" viewBox="0 0 16 11" fill="currentColor">
                <path d="M11.071.653a.75.75 0 0 1 .025 1.06l-5.5 5.75a.75.75 0 0 1-1.085 0l-2-2.09a.75.75 0 0 1 1.085-1.038l1.457 1.524 4.957-5.181a.75.75 0 0 1 1.061-.025z" />
                <path d="M14.071.653a.75.75 0 0 1 .025 1.06l-5.5 5.75a.75.75 0 0 1-1.06 0 .75.75 0 0 1 0-1.06l5.474-5.724a.75.75 0 0 1 1.061-.026z" />
              </svg>
            </div>
          </div>

          {buttonsComp?.buttons && buttonsComp.buttons.length > 0 && (
            <div className="border-t border-zinc-100">
              {buttonsComp.buttons.map((btn, i) => (
                <div
                  key={i}
                  className="flex items-center justify-center gap-1.5 px-3 py-2 border-t border-zinc-100 first:border-t-0"
                >
                  {btn.type === 'QUICK_REPLY' && <Reply className="h-3.5 w-3.5 text-emerald-500 flex-shrink-0" />}
                  {btn.type === 'URL' && <ExternalLink className="h-3.5 w-3.5 text-emerald-500 flex-shrink-0" />}
                  {btn.type === 'PHONE_NUMBER' && <Phone className="h-3.5 w-3.5 text-emerald-500 flex-shrink-0" />}
                  <span className="text-[12px] font-medium text-emerald-500">{btn.text || 'Button'}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
