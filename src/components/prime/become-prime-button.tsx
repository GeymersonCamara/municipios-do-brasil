"use client";

import Link from "next/link";
import { Crown } from "lucide-react";
import { Button, type ButtonProps } from "@/components/ui/button";
import { PRIME_PATH } from "@/lib/prime";
import { cn } from "@/lib/utils";

type BecomePrimeButtonProps = Omit<ButtonProps, "asChild" | "children"> & {
  label?: string;
};

export function BecomePrimeButton({
  label = "Tornar-se Prime",
  className,
  variant = "default",
  size = "default",
  ...props
}: BecomePrimeButtonProps) {
  return (
    <Button
      asChild
      variant={variant}
      size={size}
      className={cn(className)}
      {...props}
    >
      <Link href={PRIME_PATH}>
        <Crown className="h-4 w-4" aria-hidden />
        {label}
      </Link>
    </Button>
  );
}
