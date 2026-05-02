"use client"

import { Tabs as TabsPrimitive } from "@base-ui/react/tabs"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

function Tabs({
  className,
  orientation = "horizontal",
  ...props
}: TabsPrimitive.Root.Props) {
  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      data-orientation={orientation}
      {...(orientation === "horizontal" ? { "data-horizontal": "" } : { "data-vertical": "" })}
      className={cn("group/tabs flex gap-3 data-horizontal:flex-col", className)}
      {...props}
    />
  )
}

function TabsList({
  className,
  ...props
}: TabsPrimitive.List.Props) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      className={cn(
        /* Segmented-control pill container */
        "inline-flex items-center gap-0.5 rounded-lg p-1",
        "bg-muted dark:bg-muted/60",
        className
      )}
      {...props}
    />
  )
}

function TabsTrigger({ className, ...props }: TabsPrimitive.Tab.Props) {
  return (
    <TabsPrimitive.Tab
      data-slot="tabs-trigger"
      className={cn(
        /* Base — inactive */
        "relative inline-flex items-center justify-center gap-1.5 rounded-md px-3 py-1.5",
        "text-[13px] font-medium whitespace-nowrap select-none",
        "text-muted-foreground transition-all duration-150",
        "hover:text-foreground",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
        "disabled:pointer-events-none disabled:opacity-40",
        /* Active — filled pill */
        "data-active:bg-background data-active:text-foreground data-active:shadow-sm",
        "dark:data-active:bg-card dark:data-active:text-foreground dark:data-active:shadow-md",
        className
      )}
      {...props}
    />
  )
}

function TabsContent({ className, ...props }: TabsPrimitive.Panel.Props) {
  return (
    <TabsPrimitive.Panel
      data-slot="tabs-content"
      className={cn("flex-1 outline-none", className)}
      {...props}
    />
  )
}

export { Tabs, TabsList, TabsTrigger, TabsContent }
