"use client"

import * as React from "react"
import * as Root from "@radix-ui/react-label"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const labelVariants = cva(
    "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
)

const Label = React.forwardRef<
    React.ElementRef<typeof Root.Root>,
    React.ComponentPropsWithoutRef<typeof Root.Root> &
    VariantProps<typeof labelVariants>
>(({ className, ...props }, ref) => (
    <Root.Root
        ref={ref}
        className={cn(labelVariants(), className)}
        {...props}
    />
))
Label.displayName = Root.Root.displayName

export { Label }
