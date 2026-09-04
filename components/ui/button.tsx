import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"
import { motion } from "framer-motion"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-full text-sm font-medium transition-colors focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-[#0A0A0A] text-white hover:bg-[#1A1A1A] ",
        outline: "border border-[#E7E5E4] bg-white hover:bg-[#F5F5F3] text-[#0A0A0A]",
        ghost: "hover:bg-[#F5F5F3] text-[#0A0A0A]",
        secondary: "bg-[#F5F5F3] text-[#0A0A0A] hover:bg-[#E7E5E4]",
      },
      size: {
        default: "h-10 px-6 py-2",
        sm: "h-8 rounded-full px-4 text-xs",
        lg: "h-12 rounded-full px-8 text-base",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    const MButton = motion.button as unknown as React.ForwardRefExoticComponent<ButtonProps & React.RefAttributes<HTMLButtonElement>>
    return (
      <MButton
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.97 }}
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        transition={{ type: "spring", stiffness: 400, damping: 18 } as any}
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        {...(props as any)}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
