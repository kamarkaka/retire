import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import { useI18n } from '../i18n/context';

interface Props {
  path: string;
  label: string;
  description: string;
  unit?: string;
  className?: string;
  footnote?: ReactNode;
  children: (attributes: {
    id: string;
    'aria-describedby': string;
  }) => ReactNode;
}

// Keep a single explanation visible, including when hovering another field while one is focused.
let activeHelp: { id: string; dismiss: () => void } | undefined;

/** Plain-English field help on hover, keyboard focus, or an explicit info-button tap. */
export default function ConfigField({
  path,
  label,
  description,
  unit,
  className = '',
  footnote,
  children,
}: Props) {
  const { t } = useI18n();
  const id = useId(),
    controlId = `${id}-input`,
    helpId = `${id}-help`;
  const field = useRef<HTMLDivElement>(null),
    popup = useRef<HTMLDivElement>(null);
  const hovered = useRef(false),
    popupHovered = useRef(false),
    focused = useRef(false),
    pinned = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const [open, setOpen] = useState(false),
    [position, setPosition] = useState<{ left: number; top: number }>();
  const cancelClose = useCallback(() => {
    clearTimeout(timer.current);
    timer.current = undefined;
  }, []);
  const dismiss = useCallback(() => {
    cancelClose();
    pinned.current = false;
    popupHovered.current = false;
    setOpen(false);
    if (activeHelp?.id === helpId) activeHelp = undefined;
  }, [cancelClose, helpId]);
  const show = () => {
    cancelClose();
    if (activeHelp?.id !== helpId) activeHelp?.dismiss();
    activeHelp = { id: helpId, dismiss };
    setOpen(true);
  };
  const scheduleClose = () => {
    cancelClose();
    if (
      !hovered.current &&
      !popupHovered.current &&
      !focused.current &&
      !pinned.current
    )
      timer.current = setTimeout(dismiss, 120);
  };
  useEffect(
    () => () => {
      cancelClose();
      if (activeHelp?.id === helpId) activeHelp = undefined;
    },
    [cancelClose, helpId],
  );
  useLayoutEffect(() => {
    if (!open) return;
    const place = () => {
      const anchor = field.current?.getBoundingClientRect(),
        box = popup.current?.getBoundingClientRect();
      if (!anchor || !box) return;
      const margin = 12,
        gap = 8;
      const left = Math.max(
        margin,
        Math.min(anchor.left, window.innerWidth - box.width - margin),
      );
      const preferred =
        anchor.top - box.height - gap >= margin
          ? anchor.top - box.height - gap
          : anchor.bottom + gap;
      const top = Math.max(
        margin,
        Math.min(preferred, window.innerHeight - box.height - margin),
      );
      setPosition({ left, top });
    };
    place();
    window.addEventListener('resize', place);
    window.addEventListener('scroll', place, true);
    return () => {
      window.removeEventListener('resize', place);
      window.removeEventListener('scroll', place, true);
    };
  }, [open, description]);
  useEffect(() => {
    if (!open) return;
    const escape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') dismiss();
    };
    const outside = (event: PointerEvent) => {
      const target = event.target as Node;
      if (!field.current?.contains(target) && !popup.current?.contains(target))
        dismiss();
    };
    document.addEventListener('keydown', escape);
    document.addEventListener('pointerdown', outside);
    return () => {
      document.removeEventListener('keydown', escape);
      document.removeEventListener('pointerdown', outside);
    };
  }, [open, dismiss]);
  return (
    <div
      className={`field ${className}`}
      ref={field}
      data-config-field={path}
      // Bubble after the control's edit handler; capture-phase updates can reset controlled text.
      onChange={dismiss}
      onMouseEnter={() => {
        hovered.current = true;
        show();
      }}
      onMouseLeave={() => {
        hovered.current = false;
        scheduleClose();
      }}
      onFocusCapture={() => {
        focused.current = true;
        show();
      }}
      onBlurCapture={(event) => {
        if (field.current?.contains(event.relatedTarget as Node)) return;
        focused.current = false;
        scheduleClose();
      }}
    >
      <div className="field-heading">
        <label className="field-label" htmlFor={controlId}>
          <span>{label}</span>
          {unit && <small>{unit}</small>}
        </label>
        <button
          className="field-info"
          type="button"
          aria-label={t('configField.about', { path })}
          aria-describedby={helpId}
          onClick={() => {
            if (pinned.current) dismiss();
            else {
              pinned.current = true;
              show();
            }
          }}
        >
          i
        </button>
      </div>
      {children({ id: controlId, 'aria-describedby': helpId })}
      {footnote && <small className="field-help">{footnote}</small>}
      {!open && (
        <span id={helpId} className="sr-only">
          {description}
        </span>
      )}
      {open &&
        createPortal(
          <div
            className="field-tooltip"
            role="tooltip"
            id={helpId}
            ref={popup}
            style={{
              left: position?.left ?? 12,
              top: position?.top ?? 12,
              visibility: position ? 'visible' : 'hidden',
            }}
            onMouseEnter={() => {
              popupHovered.current = true;
              cancelClose();
            }}
            onMouseLeave={() => {
              popupHovered.current = false;
              scheduleClose();
            }}
          >
            <strong>{label}</strong>
            <p>{description}</p>
          </div>,
          document.body,
        )}
    </div>
  );
}
