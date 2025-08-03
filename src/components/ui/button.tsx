import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import * as React from "react"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-base text-sm font-base ring-offset-white transition-all duration-300 gap-2 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "text-main-foreground bg-main border border-border shadow-shadow hover:shadow-lg hover:scale-[1.02] hover:brightness-110 active:scale-[0.98] transition-all duration-300",
        noShadow: "text-main-foreground bg-main border border-border hover:bg-main/90 hover:brightness-110 transition-all duration-300",
        neutral:
          "bg-secondary-background text-foreground border border-border shadow-shadow hover:shadow-md hover:bg-secondary-background/80 hover:scale-[1.01] transition-all duration-300",
        reverse:
          "text-main-foreground bg-main border border-border shadow-shadow hover:shadow-inner hover:brightness-90 transition-all duration-300",
        outline:
          "border border-border bg-transparent text-foreground hover:bg-secondary-background hover:text-foreground transition-all duration-300",
        ghost:
          "bg-transparent text-foreground hover:bg-secondary-background hover:text-foreground transition-all duration-300",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90 border border-destructive transition-all duration-300",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80 border border-border transition-all duration-300",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 px-3",
        lg: "h-11 px-8",
        icon: "size-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
)

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
