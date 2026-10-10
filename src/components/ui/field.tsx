import * as React from "react";
import { cn } from "@/lib/utils";

export function Label({
  className,
  required,
  ...props
}: React.LabelHTMLAttributes<HTMLLabelElement> & { required?: boolean }) {
  return (
    <label
      className={cn(
        "mb-1.5 block text-sm font-semibold text-foreground",
        className,
      )}
      {...props}
    >
      {props.children}
      {required ? (
        <span className="ml-1 text-primary" aria-hidden>
          *
        </span>
      ) : null}
    </label>
  );
}

const baseField =
  "w-full rounded-md border border-border bg-surface px-3.5 text-sm text-foreground placeholder:text-muted-foreground/70 transition-colors focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-ring disabled:cursor-not-allowed disabled:bg-surface-muted disabled:opacity-70";

const invalidRing = "border-destructive focus-visible:outline-destructive";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  invalid?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, invalid, ...props }, ref) => (
    <input
      ref={ref}
      aria-invalid={invalid || undefined}
      className={cn(baseField, "h-11", invalid && invalidRing, className)}
      {...props}
    />
  ),
);
Input.displayName = "Input";

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  invalid?: boolean;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, invalid, ...props }, ref) => (
    <textarea
      ref={ref}
      aria-invalid={invalid || undefined}
      className={cn(baseField, "min-h-28 resize-y py-3 leading-relaxed", invalid && invalidRing, className)}
      {...props}
    />
  ),
);
Textarea.displayName = "Textarea";

export interface SelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {
  invalid?: boolean;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, invalid, children, ...props }, ref) => (
    <select
      ref={ref}
      aria-invalid={invalid || undefined}
      className={cn(
        baseField,
        "h-11 appearance-none bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22%23786c69%22 stroke-width=%222%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22><path d=%22m6 9 6 6 6-6%22/></svg>')] bg-[length:18px] bg-[right_0.85rem_center] bg-no-repeat pr-10",
        invalid && invalidRing,
        className,
      )}
      {...props}
    >
      {children}
    </select>
  ),
);
Select.displayName = "Select";

export function FieldError({
  id,
  children,
}: {
  id?: string;
  children: React.ReactNode;
}) {
  if (!children) return null;
  return (
    <p id={id} role="alert" className="mt-1.5 text-xs font-medium text-destructive">
      {children}
    </p>
  );
}

/** Label + control + hint/error, wired together with ids. */
export function Field({
  label,
  htmlFor,
  error,
  hint,
  required,
  className,
  children,
}: {
  label: React.ReactNode;
  htmlFor: string;
  error?: string | null;
  hint?: React.ReactNode;
  required?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  const descriptionId = `${htmlFor}-description`;
  return (
    <div className={className}>
      <Label htmlFor={htmlFor} required={required}>
        {label}
      </Label>
      {children}
      {error ? (
        <FieldError id={descriptionId}>{error}</FieldError>
      ) : hint ? (
        <p id={descriptionId} className="mt-1.5 text-xs text-muted-foreground">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
