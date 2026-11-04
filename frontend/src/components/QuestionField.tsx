import React from 'react';
import { QuestionItem } from '../api/types';

interface QuestionFieldProps {
  question: QuestionItem;
  value: any;
  onChange: (val: any) => void;
  error?: string;
}

export const QuestionField: React.FC<QuestionFieldProps> = ({
  question,
  value,
  onChange,
  error
}) => {
  const { id, header, short, type, required, scored, sensitive, note, options } = question;

  const handleSingleChange = (label: string) => {
    onChange(label);
  };

  const handleMultiChange = (label: string, checked: boolean) => {
    const currentList: string[] = Array.isArray(value) ? [...value] : [];
    if (checked) {
      if (!currentList.includes(label)) {
        currentList.push(label);
      }
    } else {
      const idx = currentList.indexOf(label);
      if (idx > -1) {
        currentList.splice(idx, 1);
      }
    }
    onChange(currentList);
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value.slice(0, 500);
    onChange(text);
  };

  return (
    <div className={`p-4 rounded-lg border transition-colors ${error ? 'border-red-400 bg-red-50/20' : 'border-slate-200 bg-white hover:border-slate-300'}`}>
      <fieldset className="w-full">
        <legend className="block text-sm font-semibold text-slate-800 mb-1 leading-snug">
          <span className="font-mono text-xs font-bold text-slate-500 mr-1.5">{id}</span>
          {header}
          {required && <span className="text-red-500 ml-1" title="Required">*</span>}
        </legend>

        {/* Subtitle / Context notes */}
        <div className="flex flex-wrap items-center gap-2 mb-3 text-xs">
          {!scored && (
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-600">
              Optional context question, not used for scoring
            </span>
          )}
          {sensitive && (
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800">
              Optional. You can skip this
            </span>
          )}
        </div>

        {/* Single choice: Radio group */}
        {type === 'single' && options && (
          <div className="space-y-2 mt-2" role="radiogroup" aria-required={required}>
            {options.map((opt, idx) => {
              const inputId = `${id}_opt_${idx}`;
              const isChecked = value === opt.label;

              return (
                <label
                  key={idx}
                  htmlFor={inputId}
                  className={`flex items-start gap-3 p-2.5 rounded-md border cursor-pointer transition-all text-sm ${
                    isChecked
                      ? 'border-indigo-600 bg-indigo-50/50 text-indigo-950 font-medium'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <input
                    type="radio"
                    id={inputId}
                    name={id}
                    value={opt.label}
                    checked={isChecked}
                    onChange={() => handleSingleChange(opt.label)}
                    className="mt-0.5 h-4 w-4 text-indigo-600 border-slate-300 focus:ring-indigo-500"
                  />
                  <span>{opt.label}</span>
                </label>
              );
            })}
          </div>
        )}

        {/* Multi choice: Checkbox group */}
        {type === 'multi' && options && (
          <div className="space-y-2 mt-2">
            {options.map((opt, idx) => {
              const inputId = `${id}_multi_${idx}`;
              const currentList: string[] = Array.isArray(value) ? value : [];
              const isChecked = currentList.includes(opt.label);

              return (
                <label
                  key={idx}
                  htmlFor={inputId}
                  className={`flex items-start gap-3 p-2.5 rounded-md border cursor-pointer transition-all text-sm ${
                    isChecked
                      ? 'border-indigo-600 bg-indigo-50/50 text-indigo-950 font-medium'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <input
                    type="checkbox"
                    id={inputId}
                    name={id}
                    value={opt.label}
                    checked={isChecked}
                    onChange={(e) => handleMultiChange(opt.label, e.target.checked)}
                    className="mt-0.5 h-4 w-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                  />
                  <span>{opt.label}</span>
                </label>
              );
            })}
          </div>
        )}

        {/* Text area (max 500 chars) */}
        {type === 'text' && (
          <div className="mt-2">
            <textarea
              id={id}
              rows={3}
              value={value || ''}
              onChange={handleTextChange}
              placeholder="Type your response here (optional)..."
              maxLength={500}
              className="w-full p-2.5 text-sm rounded-md border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-slate-800 placeholder-slate-400"
            />
            <div className="flex justify-between items-center text-xs text-slate-400 mt-1">
              <span>Not scored, not stored.</span>
              <span>{(value || '').length}/500</span>
            </div>
          </div>
        )}

        {error && (
          <p className="mt-2 text-xs font-medium text-red-600 flex items-center gap-1" role="alert">
            {error}
          </p>
        )}
      </fieldset>
    </div>
  );
};

