"use client";

import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/cn";

const buttonVariants = cva(
  "inline-flex select-none items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-[transform,background-color,border-color,color,box-shadow] duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2 focus-visible:ring-offset-paper active:translate-y-px disabled:pointer-events-none disabled:opacity-40",
  {
    variants: {
      variant: {
        primary:
          "bg-ink text-paper-high shadow-soft hover:bg-ink-soft hover:-translate-y-0.5 active:translate-y-0 active:shadow-none",
        secondary:
          "border border-line bg-paper-high text-ink hover:border-ink-soft hover:-translate-y-0.5 active:translate-y-0",
        green:
          "bg-green-600 text-paper-high shadow-soft hover:bg-green-700 hover:-translate-y-0.5 active:translate-y-0 active:shadow-none",
        gold:
          "bg-gold-500 text-ink shadow-soft hover:bg-gold-600 hover:-translate-y-0.5 active:translate-y-0 active:shadow-none",
        ghost: "text-ink-mute hover:bg-paper-low hover:text-ink",
        link: "h-auto p-0 text-green-600 underline-offset-4 hover:underline",
        danger: "bg-red-600 text-paper-high hover:bg-red-700",
      },
      size: {
        sm: "h-8 px-3.5 text-xs",
        md: "h-10 px-5 text-sm",
        lg: "h-12 px-7 text-sm",
        xl: "h-14 px-9 text-base",
        icon: "h-10 w-10 rounded-md",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
