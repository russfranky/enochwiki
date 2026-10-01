"use client"

import * as React from "react"
import * as ScrollAreaPrimitive from "@radix-ui/react-scroll-area"

import { cn } from "@/lib/utils"

function ScrollArea({
  className,
  children,
  viewportLabel,
  ...props
}: React.ComponentProps<typeof ScrollAreaPrimitive.Root> & {
  // When the scrollable region has no focusable content of its own (e.g. a
  // canvas visualization), pass a label: the viewport becomes a focusable,
  // named region so keyboard and screen-reader users can reach and scroll it.
  viewportLabel?: string
}) {
  return (
    <ScrollAreaPrimitive.Root
      data-slot="scroll-area"
      // min-h-0: the root is not a scroll container itself, so without this
      // its automatic minimum size is content-based and flex-1 cannot shrink
      // it inside a constrained column (verses became unreachable).
      className={cn("relative min-h-0", className)}
      {...props}
    >
      <ScrollAreaPrimitive.Viewport
        data-slot="scroll-area-viewport"
        className="focus-visible:ring-ring/50 size-full rounded-[inherit] transition-[color,box-shadow] outline-none focus-visible:ring-[3px] focus-visible:outline-1"
        tabIndex={viewportLabel ? 0 : undefined}
        role={viewportLabel ? "region" : undefined}
        aria-label={viewportLabel}
      >
        {children}
      </ScrollAreaPrimitive.Viewport>
      <ScrollBar />
      <ScrollAreaPrimitive.Corner />
    </ScrollAreaPrimitive.Root>
  )
}

function ScrollBar({
  className,
  orientation = "vertical",
  ...props
}: React.ComponentProps<typeof ScrollAreaPrimitive.ScrollAreaScrollbar>) {
  return (
    <ScrollAreaPrimitive.ScrollAreaScrollbar
      data-slot="scroll-area-scrollbar"
      orientation={orientation}
      className={cn(
        "flex touch-none p-px transition-colors select-none",
        orientation === "vertical" &&
          "h-full w-2.5 border-l border-l-transparent",
        orientation === "horizontal" &&
          "h-2.5 flex-col border-t border-t-transparent",
        className
      )}
      {...props}
    >
      <ScrollAreaPrimitive.ScrollAreaThumb
        data-slot="scroll-area-thumb"
        className="bg-border relative flex-1 rounded-full"
      />
    </ScrollAreaPrimitive.ScrollAreaScrollbar>
  )
}

export { ScrollArea, ScrollBar }
