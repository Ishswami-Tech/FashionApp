import { cn } from "@/lib/utils"

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-muted", className)}
      {...props}
    />
  )
}

// Form field skeleton
function FormFieldSkeleton() {
  return (
    <div className="space-y-2">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-10 w-full" />
    </div>
  )
}

// Card skeleton
function CardSkeleton() {
  return (
    <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
      <div className="flex flex-col space-y-1.5 p-6">
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </div>
      <div className="p-6 pt-0 space-y-4">
        <FormFieldSkeleton />
        <FormFieldSkeleton />
        <FormFieldSkeleton />
      </div>
    </div>
  )
}

// Stepper skeleton
function StepperSkeleton() {
  return (
    <div className="w-full max-w-4xl mx-auto mb-6">
      <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-6 w-16" />
          </div>
          <Skeleton className="h-2 w-full" />
        </div>
        
        <div className="flex items-center justify-between">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex flex-col items-center">
              <Skeleton className="h-12 w-12 rounded-full" />
              <Skeleton className="h-3 w-16 mt-2" />
              <Skeleton className="h-2 w-12 mt-1" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// Table skeleton
function TableSkeleton() {
  return (
    <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
      <div className="p-6">
        <Skeleton className="h-6 w-32 mb-4" />
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex justify-between items-center">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-16" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// Button skeleton
function ButtonSkeleton() {
  return <Skeleton className="h-10 w-24" />
}

// Order form skeleton
function OrderFormSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 py-8 px-4">
      <StepperSkeleton />
      <div className="w-full max-w-2xl mx-auto">
        <CardSkeleton />
      </div>
    </div>
  )
}

export {
  Skeleton,
  FormFieldSkeleton,
  CardSkeleton,
  StepperSkeleton,
  TableSkeleton,
  ButtonSkeleton,
  OrderFormSkeleton,
} 