import { type ChangeEventHandler, useEffect, useRef } from 'react';

export function Checkbox(props: {
  checked: boolean;
  disabled?: boolean;
  indeterminate?: boolean;
  label: string;
  onChange: ChangeEventHandler<HTMLInputElement>;
}) {
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (ref.current) ref.current.indeterminate = !props.checked && !!props.indeterminate;
  }, [props.checked, props.indeterminate]);

  return (
    <label className="relative inline-flex size-4 cursor-pointer">
      <input
        aria-label={props.label}
        checked={props.checked}
        className="peer size-4 cursor-pointer appearance-none rounded-sm border border-(--border-action-high-blue-france) bg-(--background-default-grey) checked:bg-(--background-action-high-blue-france) indeterminate:bg-(--background-action-high-blue-france) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--border-action-high-blue-france) disabled:cursor-not-allowed disabled:opacity-50"
        disabled={props.disabled}
        onChange={props.onChange}
        ref={ref}
        type="checkbox"
      />
      <svg
        aria-hidden
        className="pointer-events-none absolute inset-0 hidden size-4 text-(--text-inverted-blue-france) peer-checked:block peer-indeterminate:hidden"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        viewBox="0 0 16 16"
      >
        <path d="M3.5 8.5l3 3 6-7" />
      </svg>
      <svg
        aria-hidden
        className="pointer-events-none absolute inset-0 hidden size-4 text-(--text-inverted-blue-france) peer-indeterminate:block"
        viewBox="0 0 16 16"
      >
        <rect fill="currentColor" height="2" rx="1" width="9" x="3.5" y="7" />
      </svg>
    </label>
  );
}
