import * as React from "react"
import { cn } from "@/lib/utils"

export function Badge({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border border-[#E7E5E4] bg-[#F5F5F3] px-2.5 py-0.5 text-xs font-medium text-[#44403C] transition-colors",
        className
      )}
      {...props}
    />
  )
}
