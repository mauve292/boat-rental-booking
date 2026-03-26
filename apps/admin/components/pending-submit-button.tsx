"use client";

import { useFormStatus } from "react-dom";

type PendingSubmitButtonProps = {
  idleLabel: string;
  pendingLabel: string;
  className: string;
  disabled?: boolean;
};

export function PendingSubmitButton({
  idleLabel,
  pendingLabel,
  className,
  disabled = false
}: PendingSubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <button className={className} disabled={disabled || pending} type="submit">
      {pending ? pendingLabel : idleLabel}
    </button>
  );
}
