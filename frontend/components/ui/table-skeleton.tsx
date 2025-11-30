import { Skeleton } from "@/components/ui/skeleton"

export function TableSkeleton() {
    return (
        <div className="w-full">
            <div className="flex items-center py-4">
                <Skeleton className="h-8 w-[250px]" />
                <Skeleton className="ml-auto h-8 w-[100px]" />
            </div>
            <div className="rounded-md border border-gray-200 bg-white">
                <div className="h-12 border-b border-gray-200 px-4 flex items-center gap-4">
                    <Skeleton className="h-4 w-4" />
                    <Skeleton className="h-4 w-[150px]" />
                    <Skeleton className="h-4 w-[100px]" />
                    <Skeleton className="h-4 w-[100px]" />
                    <Skeleton className="h-4 w-[200px]" />
                    <Skeleton className="ml-auto h-4 w-[100px]" />
                </div>
                {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="h-16 border-b border-gray-200 px-4 flex items-center gap-4">
                        <Skeleton className="h-4 w-4" />
                        <Skeleton className="h-4 w-[150px]" />
                        <Skeleton className="h-4 w-[100px]" />
                        <Skeleton className="h-4 w-[100px]" />
                        <div className="flex flex-col gap-2">
                            <Skeleton className="h-4 w-[250px]" />
                            <Skeleton className="h-3 w-[200px]" />
                        </div>
                        <Skeleton className="ml-auto h-6 w-[80px]" />
                    </div>
                ))}
            </div>
        </div>
    )
}
