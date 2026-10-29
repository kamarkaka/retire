import { useEffect, useRef, useState, type InputHTMLAttributes } from 'react';

type Props = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'type' | 'value' | 'defaultValue' | 'onChange' | 'onInput'
> & {
  value: number | undefined;
  onChange: (value: number | undefined) => void;
};

function enteredNumber(input: HTMLInputElement): number | undefined {
  if (input.validity.badInput) return NaN;
  return input.value === '' ? undefined : Number(input.value);
}

/** Keep the user's numeric text while typing; synchronize external config edits. */
export default function NumberInput({
  value,
  onChange,
  onFocus,
  onBlur,
  ...props
}: Props) {
  const input = useRef<HTMLInputElement>(null);
  const [focused, setFocused] = useState(false);
  const text =
    value === undefined || !Number.isFinite(value) ? '' : String(value);
  useEffect(() => {
    const element = input.current;
    if (!element) return;
    // A focused field the user just cleared stays blank while they retype;
    // never overwrite it with the effective value mid-edit. The sync runs
    // again on blur, restoring a cleared field to its effective value.
    if (focused && element.value === '') return;
    // Replacing 0.00 with String(0) on each keystroke removes the decimal point.
    if (!Object.is(enteredNumber(element), value)) element.value = text;
  }, [value, text, focused]);
  useEffect(() => {
    const element = input.current;
    // A non-passive native listener also covers browsers that step focused numeric fields on wheel.
    // Keep focus and keyboard editing intact while preventing accidental changes.
    const preventWheelChange = (event: WheelEvent) => {
      if (document.activeElement === element) event.preventDefault();
    };
    element?.addEventListener('wheel', preventWheelChange, { passive: false });
    return () => element?.removeEventListener('wheel', preventWheelChange);
  }, []);
  return (
    <input
      {...props}
      ref={input}
      type="number"
      defaultValue={text}
      onFocus={(event) => {
        setFocused(true);
        onFocus?.(event);
      }}
      onBlur={(event) => {
        setFocused(false);
        onBlur?.(event);
      }}
      onInput={(event) => onChange(enteredNumber(event.currentTarget))}
    />
  );
}
