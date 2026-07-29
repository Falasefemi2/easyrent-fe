import { createFileRoute } from "@tanstack/react-router"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useEffect, useState } from "react"

import EmptyState from "@/components/emptystate"
import ListingCard from "@/components/listingcard"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { runApi } from "@/lib/api/runtime"
import { queryKeys } from "@/lib/queryKeys"

export const Route = createFileRoute("/")({
  component: HomePage,
})

const FILTERS = ["All", "Furnished", "1 bed", "2 beds", "3+ beds", "Self contain"]

function HomePage() {
  const queryClient = useQueryClient()

  const [page, setPage] = useState(1)
  const [activeFilter, setActiveFilter] = useState("All")
  const [searchQuery, setSearchQuery] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [hasToken, setHasToken] = useState(false)

  useEffect(() => {
    setHasToken(!!localStorage.getItem("accessToken"))
  }, [])

  useEffect(() => {
    const handleListingCreated = () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.listings.all,
      })
      setPage(1)
    }

    window.addEventListener("listing-created", handleListingCreated)

    return () => {
      window.removeEventListener("listing-created", handleListingCreated)
    }
  }, [queryClient])

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery)
    }, 500)

    return () => clearTimeout(timer)
  }, [searchQuery])

  const getFilterParams = (filter: string) => {
    switch (filter) {
      case "Furnished":
        return { furnished: true }

      case "1 bed":
        return { rooms: 1 }

      case "2 beds":
        return { rooms: 2 }

      case "3+ beds":
        return { minRooms: 3 }

      case "Self contain":
        return {
          rooms: 1,
          furnished: false,
        }

      default:
        return {}
    }
  }

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: queryKeys.listings.list({
      page,
      limit: 12,
      ...getFilterParams(activeFilter),
      ...(debouncedSearch
        ? {
            search: debouncedSearch,
          }
        : {}),
    }),
    queryFn: () =>
      runApi((api) =>
        api.getListings({
          page,
          limit: 12,
          ...getFilterParams(activeFilter),
          ...(debouncedSearch
            ? {
                search: debouncedSearch,
              }
            : {}),
        }),
      ),
  })

  const listings = data?.data ?? []
  const totalPages = data?.totalPages ?? 1

  const { data: favoritesData } = useQuery({
    queryKey: queryKeys.favorites.list({
      page: 1,
      limit: 100,
    }),
    queryFn: () =>
      runApi((api) =>
        api.getMyFavorites({
          page: 1,
          limit: 100,
        }),
      ),
    enabled: hasToken,
  })

  const favoritedIds = new Set((favoritesData?.data as any[] | undefined)?.map((favorite: any) => favorite.id) ?? [])

  return (
    <div className="min-h-screen bg-white">
      {/* Search */}
      <div className="border-b border-gray-100 py-4">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex max-w-2xl items-center gap-2 rounded-full border border-gray-200 px-4 py-2 shadow-sm transition-shadow hover:shadow-md">
            <Input
              placeholder="Search by location..."
              value={searchQuery}
              onChange={(event) => {
                setSearchQuery(event.target.value)
                setPage(1)
              }}
              className="flex-1 border-none p-0 text-sm shadow-none focus-visible:ring-0"
            />

            <button className="rounded-full bg-[#E8442A] p-2 text-white transition-colors hover:bg-[#d03d25]">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="border-b border-gray-100">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="scrollbar-hide flex gap-2 overflow-x-auto py-3">
            {FILTERS.map((filter) => (
              <button
                key={filter}
                onClick={() => {
                  setActiveFilter(filter)
                  setPage(1)
                }}
                className={`whitespace-nowrap rounded-full border px-4 py-1.5 text-sm transition-colors ${
                  activeFilter === filter
                    ? "border-[#E8442A] bg-[#E8442A] text-white"
                    : "border-gray-200 text-gray-600 hover:border-gray-400"
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Listings */}
      <main className="mx-auto max-w-7xl px-4 py-8 pb-24 sm:px-6 sm:pb-8 lg:px-8">
        {isLoading ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, index) => (
              <div key={index} className="space-y-3">
                <Skeleton className="aspect-4/3 rounded-xl" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
                <Skeleton className="h-4 w-1/3" />
              </div>
            ))}
          </div>
        ) : isError ? (
          <div className="py-16 text-center">
            <p className="text-gray-600 mb-4">Failed to load listings. Please try again.</p>
            <Button onClick={() => refetch()} variant="outline" size="sm">
              Retry
            </Button>
          </div>
        ) : listings.length === 0 ? (
          <EmptyState type="search" />
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {listings.map((listing) => (
              <ListingCard key={listing.id} listing={listing} initialFavorited={favoritedIds.has(listing.id)} />
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <div className="mt-10 flex items-center justify-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 1}
              onClick={() => {
                setPage((previous) => Math.max(1, previous - 1))
              }}
            >
              Previous
            </Button>

            <span className="text-sm text-gray-500">
              Page {page} of {totalPages}
            </span>

            <Button
              variant="outline"
              size="sm"
              disabled={page === totalPages}
              onClick={() => {
                setPage((previous) => Math.min(totalPages, previous + 1))
              }}
            >
              Next
            </Button>
          </div>
        )}
      </main>
    </div>
  )
}
