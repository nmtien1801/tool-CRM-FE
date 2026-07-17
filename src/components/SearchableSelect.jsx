import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';

export default function SearchableSelect({
    options = [],
    value,
    onChange,
    placeholder = 'Chọn...',
    className = '',
    disabled = false,
    emptyText = 'Không có dữ liệu',
    optionLabel = (option) => option?.label ?? option?.value ?? '',
    optionValue = (option) => option?.value ?? option?.label ?? '',
    formatOptionLabel,
}) {
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState('');
    const wrapperRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                setIsOpen(false);
                setQuery('');
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const filteredOptions = useMemo(() => {
        const normalizedQuery = query.trim().toLowerCase();
        if (!normalizedQuery) return options;

        return options.filter((option) => {
            const label = String(optionLabel(option) || '').toLowerCase();
            const val = String(optionValue(option) || '').toLowerCase();
            return label.includes(normalizedQuery) || val.includes(normalizedQuery);
        });
    }, [options, query, optionLabel, optionValue]);

    const selectedLabel = useMemo(() => {
        const matchedOption = options.find((option) => String(optionValue(option)) === String(value));
        if (!matchedOption) return '';
        return formatOptionLabel ? formatOptionLabel(matchedOption) : optionLabel(matchedOption);
    }, [options, value, optionLabel, optionValue, formatOptionLabel]);

    const handleSelect = (nextValue) => {
        onChange?.(nextValue);
        setIsOpen(false);
        setQuery('');
    };

    return (
        <div ref={wrapperRef} className={`relative ${className}`.trim()}>
            <div className="relative">
                <input
                    type="text"
                    disabled={disabled}
                    value={isOpen ? query : (selectedLabel || '')}
                    placeholder={placeholder}
                    onFocus={() => setIsOpen(true)}
                    onClick={() => setIsOpen(true)}
                    onChange={(event) => {
                        setQuery(event.target.value);
                        setIsOpen(true);
                    }}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-slate-100 disabled:text-slate-500"
                />
                <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-2.5 pointer-events-none" />
            </div>

            {isOpen && !disabled && (
                <div className="absolute z-20 mt-1 w-full rounded-xl border border-slate-200 bg-white shadow-lg max-h-56 overflow-auto">
                    {filteredOptions.length > 0 ? (
                        filteredOptions.map((option, index) => {
                            const nextValue = optionValue(option);
                            const label = formatOptionLabel ? formatOptionLabel(option) : optionLabel(option);
                            const isSelected = String(nextValue) === String(value);

                            return (
                                <button
                                    key={`${nextValue}-${index}`}
                                    type="button"
                                    onClick={() => handleSelect(nextValue)}
                                    className={`flex w-full items-center justify-between px-3 py-2 text-left text-xs transition ${isSelected ? 'bg-indigo-50 text-indigo-700' : 'text-slate-700 hover:bg-slate-50'}`}
                                >
                                    <span>{label}</span>
                                    {isSelected && <span className="text-[10px] font-semibold">✓</span>}
                                </button>
                            );
                        })
                    ) : (
                        <div className="px-3 py-2 text-xs text-slate-400">{emptyText}</div>
                    )}
                </div>
            )}
        </div>
    );
}
