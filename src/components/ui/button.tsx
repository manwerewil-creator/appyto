import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 active:scale-[.97] active:translate-y-0",
  {
    variants: {
      variant: {
        default: "bg-gradient-to-b from-primary to-primary/88 text-primary-foreground shadow-sm shadow-primary/25 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/30 hover:brightness-[1.05]",
        destructive: "bg-gradient-to-b from-destructive to-destructive/90 text-destructive-foreground shadow-sm shadow-destructive/25 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-destructive/30 hover:brightness-[1.05]",
        outline: "border border-input bg-background shadow-sm hover:-translate-y-0.5 hover:border-primary/40 hover:bg-accent hover:text-accent-foreground hover:shadow-md",
        secondary: "bg-secondary text-secondary-foreground shadow-sm hover:-translate-y-0.5 hover:bg-secondary/70 hover:shadow-md",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        success: "bg-gradient-to-b from-success to-success/88 text-success-foreground shadow-sm shadow-success/25 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-success/30 hover:brightness-[1.05]",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-5 py-2",
        sm: "h-8 rounded-lg px-3 text-xs",
        lg: "h-12 px-7 text-[15px]",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
