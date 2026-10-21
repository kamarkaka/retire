import { useEffect, useRef, type InputHTMLAttributes } from 'react';

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
export default function NumberInput({ value, onChange, ...props }: Props) {
  const input = useRef<HTMLInputElement>(null);
  const text =
    value === undefined || !Number.isFinite(value) ? '' : String(value);
  useEffect(() => {
    const element = input.current;
    // Replacing 0.00 with String(0) on each keystroke removes the decimal point.
    if (element && !Object.is(enteredNumber(element), value))
      element.value = text;
  }, [value, text]);
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
      onInput={(event) => onChange(enteredNumber(event.currentTarget))}
    />
  );
}
