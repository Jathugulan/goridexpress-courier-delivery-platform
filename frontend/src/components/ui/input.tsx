import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { AlertCircle, Check, Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";

/* -------------------------------------------------------------------------- */
/*                                  Field shell                               */
/* -------------------------------------------------------------------------- */

export function Field({
  className,
  required,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { required?: boolean }) {
  return (
    <div
      className={cn("flex w-full flex-col gap-1.5", className)}
      data-required={required ? "true" : undefined}
      {...props}
    />
  );
}

export function FieldLabel({
  className,
  required,
  children,
  ...props
}: React.LabelHTMLAttributes<HTMLLabelElement> & { required?: boolean }) {
  return (
    <label
      className={cn(
        "flex items-center gap-1 text-sm font-medium text-ink peer-disabled:opacity-60",
        className,
      )}
      {...props}
    >
      {children}
      {required ? (
        <>
          <span className="text-error" aria-hidden="true">
            *
          </span>
          <span className="sr-only">(required)</span>
        </>
      ) : null}
    </label>
  );
}

export function FieldDescription({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn("text-xs leading-relaxed text-ink-muted", className)} {...props} />;
}

export function FieldError({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  if (!children) return null;
  return (
    <p
      role="alert"
      aria-live="polite"
      className={cn("flex items-start gap-1.5 text-xs font-medium text-error", className)}
      {...props}
    >
      <AlertCircle className="mt-px size-3.5 shrink-0" aria-hidden="true" />
      <span>{children}</span>
    </p>
  );
}

/* -------------------------------------------------------------------------- */
/*                                  Input                                     */
/* -------------------------------------------------------------------------- */

export const inputVariants = cva(
  [
    "w-full rounded-[10px] border border-line-strong bg-input text-sm text-ink transition-[border-color,box-shadow,background-color]",
    "placeholder:text-ink-disabled",
    "focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/25 focus-visible:outline-none",
    "focus-visible:ring-offset-0",
    "disabled:cursor-not-allowed disabled:bg-muted disabled:text-ink-disabled",
    "readonly:bg-muted",
    "aria-[invalid=true]:border-error aria-[invalid=true]:ring-error/25",
    "file:mr-3 file:rounded-md file:border-0 file:bg-primary-light file:px-2.5 file:py-1 file:text-xs file:font-semibold file:text-primary-dark",
  ],
  {
    variants: {
      size: {
        sm: "h-9 px-3 text-[13px]",
        md: "h-11 px-3.5",
        lg: "h-12 px-4 text-[15px]",
      },
      variant: {
        default: "",
        filled: "border-transparent bg-muted focus-visible:border-primary",
        underline: "rounded-none border-x-0 border-b-0 border-t-0 bg-transparent px-0 focus-visible:ring-0",
      },
    },
    defaultVariants: { size: "md", variant: "default" },
  },
);

export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size">,
    VariantProps<typeof inputVariants> {
  invalid?: boolean;
  icon?: React.ReactNode;
  iconPosition?: "start" | "end";
  suffix?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, size, variant, invalid, icon, iconPosition = "start", suffix, type, ...props },
  ref,
) {
  const [revealed, setRevealed] = React.useState(false);
  const isPassword = type === "password";
  const resolvedType = isPassword && revealed ? "text" : type;

  const control = (
    <input
      ref={ref}
      type={resolvedType}
      aria-invalid={invalid || undefined}
      className={cn(
        inputVariants({ size, variant }),
        icon && iconPosition === "start" && "pl-10",
        (icon || suffix) && iconPosition === "end" && "pr-10",
        isPassword && "pr-11",
        className,
      )}
      {...props}
    />
  );

  if (!icon && !suffix && !isPassword) return control;

  return (
    <div className="relative w-full">
      {icon && iconPosition === "start" ? (
        <span
          className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-muted [&_svg]:size-4"
          aria-hidden="true"
        >
          {icon}
        </span>
      ) : null}

      {control}

      {isPassword ? (
        <button
          type="button"
          onClick={() => setRevealed((v) => !v)}
          className="absolute right-1.5 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-lg text-ink-muted transition-colors hover:bg-muted hover:text-ink focus-visible:ring-2 focus-visible:ring-primary"
          aria-label={revealed ? "Hide password" : "Show password"}
          tabIndex={0}
        >
          {revealed ? <EyeOff className="size-4" aria-hidden="true" /> : <Eye className="size-4" aria-hidden="true" />}
        </button>
      ) : suffix && iconPosition === "end" ? (
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted">{suffix}</span>
      ) : null}
    </div>
  );
});

/* -------------------------------------------------------------------------- */
/*                                 Textarea                                   */
/* -------------------------------------------------------------------------- */

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  invalid?: boolean;
  autoGrow?: boolean;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { className, invalid, autoGrow, onChange, rows = 4, ...props },
  ref,
) {
  const innerRef = React.useRef<HTMLTextAreaElement | null>(null);

  const setRefs = React.useCallback(
    (node: HTMLTextAreaElement | null) => {
      innerRef.current = node;
      if (typeof ref === "function") ref(node);
      else if (ref) (ref as React.RefObject<HTMLTextAreaElement | null>).current = node;
    },
    [ref],
  );

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (autoGrow && innerRef.current) {
      innerRef.current.style.height = "auto";
      innerRef.current.style.height = `${Math.min(innerRef.current.scrollHeight, 220)}px`;
    }
    onChange?.(e);
  };

  return (
    <textarea
      ref={setRefs}
      rows={rows}
      aria-invalid={invalid || undefined}
      onChange={handleChange}
      className={cn(
        inputVariants({ size: "md" }),
        "min-h-[96px] resize-y py-2.5 leading-relaxed",
        autoGrow && "resize-none overflow-hidden",
        className,
      )}
      {...props}
    />
  );
});

/* -------------------------------------------------------------------------- */
/*                                  Checkbox                                  */
/* -------------------------------------------------------------------------- */

export interface CheckboxProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type" | "size"> {
  label?: React.ReactNode;
  description?: React.ReactNode;
  invalid?: boolean;
}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(function Checkbox(
  { className, label, description, invalid, id, checked, ...props },
  ref,
) {
  const generatedId = React.useId();
  const inputId = id ?? generatedId;

  return (
    <div className="flex items-start gap-2.5">
      <span className="relative flex size-5 shrink-0 items-center justify-center pt-px">
        <input
          ref={ref}
          id={inputId}
          type="checkbox"
          checked={checked}
          aria-invalid={invalid || undefined}
          aria-describedby={description ? `${inputId}-description` : undefined}
          className={cn(
            "peer size-[18px] shrink-0 cursor-pointer appearance-none rounded-[5px] border border-line-strong bg-input transition-all",
            "checked:border-primary checked:bg-primary",
            "hover:border-primary/60",
            "focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-none",
            "disabled:cursor-not-allowed disabled:opacity-50",
            "aria-[invalid=true]:border-error",
            "[&::after]:absolute [&::after]:left-[5px] [&::after]:top-[1px] [&::after]:size-2.5 [&::after]:border-2 [&::after]:border-white [&::after]:border-l-0 [&::after]:border-t-0 [&::after]:rotate-45 [&::after]:content-[''] [&::after]:opacity-0",
            "peer-checked::after:opacity-100",
            className,
          )}
          {...props}
        />
      </span>
      {(label || description) && (
        <div className="min-w-0 flex-1">
          {label ? (
            <label
              htmlFor={inputId}
              className="cursor-pointer select-none text-sm font-medium leading-5 text-ink"
            >
              {label}
            </label>
          ) : null}
          {description ? (
            <p id={`${inputId}-description`} className="text-xs leading-relaxed text-ink-muted">
              {description}
            </p>
          ) : null}
        </div>
      )}
    </div>
  );
});

/* -------------------------------------------------------------------------- */
/*                                  Radio                                     */
/* -------------------------------------------------------------------------- */

export interface RadioCardProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  label: React.ReactNode;
  description?: React.ReactNode;
  icon?: React.ReactNode;
  meta?: React.ReactNode;
  selected?: boolean;
}

export function RadioCard({
  className,
  label,
  description,
  icon,
  meta,
  selected,
  id,
  disabled,
  ...props
}: RadioCardProps) {
  const generatedId = React.useId();
  const inputId = id ?? generatedId;

  return (
    <label
      htmlFor={inputId}
      className={cn(
        "group relative flex cursor-pointer items-start gap-3 rounded-xl border-2 bg-card p-3.5 transition-all sm:p-4",
        "hover:border-primary/40 hover:shadow-sm",
        "focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2 focus-within:ring-offset-app-bg",
        selected ? "border-primary bg-primary-light/40 shadow-sm" : "border-line",
        disabled && "cursor-not-allowed opacity-55 hover:border-line hover:shadow-none",
        className,
      )}
    >
      <input
        id={inputId}
        type="radio"
        disabled={disabled}
        className="sr-only"
        checked={selected}
        {...props}
      />
      {icon ? (
        <span
          className={cn(
            "flex size-9 shrink-0 items-center justify-center rounded-lg transition-colors [&_svg]:size-[18px]",
            selected ? "bg-primary text-white" : "bg-muted text-ink-secondary group-hover:bg-primary-light group-hover:text-primary",
          )}
          aria-hidden="true"
        >
          {icon}
        </span>
      ) : null}
      <span className="min-w-0 flex-1">
        <span className="flex items-center justify-between gap-2">
          <span className="text-sm font-semibold text-ink">{label}</span>
          {meta ? <span className="shrink-0 text-sm font-semibold text-primary">{meta}</span> : null}
        </span>
        {description ? (
          <span className="mt-0.5 block text-xs leading-relaxed text-ink-muted">{description}</span>
        ) : null}
      </span>
      <span
        className={cn(
          "flex size-[18px] shrink-0 items-center justify-center rounded-full border-2 transition-colors",
          selected ? "border-primary bg-primary" : "border-line-strong bg-card",
        )}
        aria-hidden="true"
      >
        {selected ? <Check className="size-2.5 stroke-[3] text-white" /> : null}
      </span>
    </label>
  );
}

/* -------------------------------------------------------------------------- */
/*                                   Switch                                   */
/* -------------------------------------------------------------------------- */

export interface SwitchProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "onChange"> {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  label?: React.ReactNode;
  description?: React.ReactNode;
  name?: string;
}

export function Switch({
  checked = false,
  onCheckedChange,
  label,
  description,
  className,
  disabled,
  id,
  name,
  ...props
}: SwitchProps) {
  const generatedId = React.useId();
  const switchId = id ?? generatedId;
  return (
    <div className="flex items-center justify-between gap-4">
      {(label || description) && (
        <div className="min-w-0">
          {label ? (
            <label htmlFor={switchId} className="cursor-pointer text-sm font-medium text-ink">
              {label}
            </label>
          ) : null}
          {description ? <p className="mt-0.5 text-xs text-ink-muted">{description}</p> : null}
        </div>
      )}
      <button
        id={switchId}
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={typeof label === "string" ? label : undefined}
        disabled={disabled}
        onClick={() => onCheckedChange?.(!checked)}
        className={cn(
          "relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200",
          "focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-app-bg focus-visible:outline-none",
          "disabled:cursor-not-allowed disabled:opacity-50",
          checked ? "bg-primary" : "bg-line-strong",
          className,
        )}
        {...props}
      >
        {name ? <input type="hidden" name={name} value={checked ? "on" : "off"} /> : null}
        <span
          className={cn(
            "pointer-events-none block size-5 rounded-full bg-white shadow-sm transition-transform duration-200",
            checked ? "translate-x-5" : "translate-x-0",
          )}
        />
      </button>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                                InputGroup                                  */
/* -------------------------------------------------------------------------- */

export function InputGroup({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "flex w-full items-stretch overflow-hidden rounded-[10px] border border-line-strong bg-input transition-colors focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/25",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function InputGroupAddon({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "flex shrink-0 items-center gap-1.5 border-r border-line bg-muted px-3 text-sm font-medium text-ink-secondary [&_svg]:size-4",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function InputGroupTextarea({
  className,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        "min-w-0 flex-1 resize-none bg-transparent px-3 py-2.5 text-sm text-ink outline-none placeholder:text-ink-disabled",
        className,
      )}
      {...props}
    />
  );
}
