import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { ArrowLeft, Bed, Heart, MapPin, Pencil, Share2, Sofa } from "lucide-react"
import { lazy, Suspense, useState } from "react"
import { toast } from "sonner"
import ContactLandlordModal from "@/components/contactlandlordmodal"
import EditListingModal from "@/components/editlistingmodal"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { runApi } from "@/lib/api/runtime"
import { queryKeys } from "@/lib/queryKeys"
import type { ListingWithMedia } from "@/lib/types"
import { formatPrice } from "@/lib/utils"

const MapView = lazy(() => import("@/components/MapView"))

export const Route = createFileRoute("/listings/$id")({
  component: ListingDetailPage,
})

function ListingDetailPage() {
  const { id } = Route.useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [activeImage, setActiveImage] = useState(0)
  const [showContact, setShowContact] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [imagesLoaded, setImagesLoaded] = useState<Record<number, boolean>>({})

  // Fetch listing detail
  const { data: listing, isLoading: loadingListing } = useQuery({
    queryKey: queryKeys.listings.detail(id),
    queryFn: async () => {
      const res = await runApi((api) => api.getListingById(id))
      return res as unknown as ListingWithMedia
    },
    enabled: !!id,
  })

  // Fetch current user
  const { data: user } = useQuery({
    queryKey: queryKeys.user.me,
    queryFn: () => runApi((api) => api.getMe()),
    enabled: typeof window !== "undefined" && !!localStorage.getItem("accessToken"),
  })

  const currentUserId = (user as unknown as { id: string })?.id ?? null
  const isLandlord = currentUserId && listing ? currentUserId === listing.landlordId : false

  // Check favorite status
  const { data: initialFavoritedData } = useQuery({
    queryKey: queryKeys.favorites.check(id),
    queryFn: () => runApi((api) => api.checkFavorite(id)),
    enabled: typeof window !== "undefined" && !!localStorage.getItem("accessToken") && !!id,
  })

  const favorited = !!initialFavoritedData

  // Favorite toggling mutation
  const toggleFavoriteMutation = useMutation({
    mutationFn: async () => {
      if (favorited) {
        await runApi((api) => api.removeFavorite(id))
      } else {
        await runApi((api) => api.addFavorite(id))
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.favorites.check(id),
      })
      queryClient.invalidateQueries({ queryKey: queryKeys.favorites.all })
      queryClient.invalidateQueries({ queryKey: queryKeys.listings.all })
      toast.success(favorited ? "Removed from favorites" : "Added to favorites!")
    },
    onError: (e) => {
      toast.error("Failed to update favorites. Please try again.")
      console.error(e)
    },
  })

  if (loadingListing) {
    return (
      <div className="min-h-screen bg-white">
        <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
          <Skeleton className="w-full aspect-video rounded-2xl" />
          <Skeleton className="h-8 w-2/3" />
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-6 w-1/4" />
        </div>
      </div>
    )
  }

  if (!listing) {
    return (
      <div className="min-h-screen bg-white">
        <div className="max-w-5xl mx-auto px-4 py-20 text-center text-gray-400">
          <p>Listing not found</p>
          <Button variant="outline" className="mt-4" onClick={() => navigate({ to: "/" })}>
            Back to listings
          </Button>
        </div>
      </div>
    )
  }

  const images = listing.media.filter((m) => m.type === "image")

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <button
          onClick={() => window.history.back()}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        {images.length > 0 ? (
          <div className="relative mb-8">
            {/* Mobile: Horizontal Scroll Gallery */}
            <div className="flex sm:hidden overflow-x-auto snap-x snap-mandatory scrollbar-hide -mx-4 px-4 gap-2">
              {images.map((img, i) => (
                <div
                  key={img.id}
                  className="relative flex-none w-[85vw] aspect-square rounded-2xl overflow-hidden snap-center bg-gray-100"
                >
                  <img
                    src={img.url}
                    alt={`${listing.title} - Photo ${i + 1}`}
                    loading={i === 0 ? "eager" : "lazy"}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-3 right-3 bg-black/60 text-white text-[10px] px-2 py-1 rounded-full backdrop-blur-sm">
                    {i + 1} / {images.length}
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop: Gallery Layout */}
            <div
              className={`hidden sm:grid gap-2 rounded-2xl overflow-hidden ${
                images.length === 1 ? "grid-cols-1" : "grid-cols-4 grid-rows-2"
              }`}
              style={{ height: "500px" }}
            >
              <div
                className={`relative bg-gray-100 ${
                  images.length === 1 ? "col-span-4 row-span-2" : "col-span-2 row-span-2"
                }`}
              >
                {!imagesLoaded[activeImage] && <div className="absolute inset-0 bg-gray-100 animate-pulse" />}
                <img
                  src={images[activeImage]?.url ?? images[0].url}
                  alt={listing.title}
                  className={`w-full h-full object-cover transition-opacity duration-300 ${
                    imagesLoaded[activeImage] ? "opacity-100" : "opacity-0"
                  }`}
                  onLoad={() =>
                    setImagesLoaded((prev) => ({
                      ...prev,
                      [activeImage]: true,
                    }))
                  }
                />
              </div>

              {images.length > 1 && (
                <>
                  {images.slice(1, 5).map((img, i) => (
                    <div
                      key={img.id}
                      className="relative cursor-pointer hover:opacity-90 transition-opacity bg-gray-100"
                      onClick={() => setActiveImage(i + 1)}
                    >
                      {!imagesLoaded[i + 1] && <div className="absolute inset-0 bg-gray-100 animate-pulse" />}
                      <img
                        src={img.url}
                        alt={`Photo ${i + 2}`}
                        loading="lazy"
                        className={`w-full h-full object-cover transition-opacity duration-300 ${
                          imagesLoaded[i + 1] ? "opacity-100" : "opacity-0"
                        }`}
                        onLoad={() =>
                          setImagesLoaded((prev) => ({
                            ...prev,
                            [i + 1]: true,
                          }))
                        }
                      />
                    </div>
                  ))}
                  {/* Fill remaining slots only if there are at least 2 images but less than 5 total */}
                  {Array.from({
                    length: Math.max(0, 4 - images.slice(1, 5).length),
                  }).map((_, i) => (
                    <div key={`empty-${i}`} className="bg-gray-100" />
                  ))}
                </>
              )}
            </div>
          </div>
        ) : (
          <div className="w-full h-75 rounded-2xl bg-gray-100 flex items-center justify-center mb-8">
            <p className="text-gray-400">No photos available</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div>
              <div className="flex items-start justify-between">
                <h1 className="text-2xl font-semibold text-gray-900">{listing.title}</h1>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() =>
                      navigator.share?.({
                        title: listing.title,
                        url: window.location.href,
                      })
                    }
                    className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                  >
                    <Share2 className="w-4 h-4 text-gray-500" />
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-1 text-sm text-gray-500 mt-1">
                <MapPin className="w-4 h-4" />
                {listing.address}
              </div>
            </div>

            <div className="flex flex-wrap gap-3 items-center">
              {listing.rooms && (
                <div className="flex items-center gap-2 bg-gray-50 px-4 py-2 rounded-full text-sm text-gray-600">
                  <Bed className="w-4 h-4" />
                  {listing.rooms} {listing.rooms === 1 ? "bedroom" : "bedrooms"}
                </div>
              )}
              {listing.furnished && (
                <div className="flex items-center gap-2 bg-gray-50 px-4 py-2 rounded-full text-sm text-gray-600">
                  <Sofa className="w-4 h-4" />
                  Furnished
                </div>
              )}
              {listing.status && (
                <Badge
                  className={`self-center ${
                    listing.status === "avaiable"
                      ? "bg-green-50 text-green-700 border-green-200"
                      : "bg-gray-50 text-gray-600"
                  }`}
                >
                  {listing.status === "avaiable" ? "Available" : listing.status}
                </Badge>
              )}
            </div>

            <div>
              <h2 className="text-lg font-medium text-gray-900 mb-2">About this property</h2>
              <p className="text-gray-600 text-sm leading-relaxed">{listing.description}</p>
            </div>

            <div>
              <h2 className="text-lg font-medium text-gray-900 mb-3">Location</h2>
              <div className="relative z-0 rounded-xl overflow-hidden border border-gray-200 h-70">
                <Suspense fallback={<div className="w-full h-full bg-gray-100 animate-pulse" />}>
                  <MapView
                    latitude={listing.latitude ?? 6.5244}
                    longitude={listing.longitude ?? 3.3792}
                    address={listing.address}
                  />
                </Suspense>
              </div>
              <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {listing.address}
              </p>
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="sticky top-24 border border-gray-200 rounded-2xl p-6 shadow-sm space-y-4">
              <div>
                <p className="text-2xl font-semibold text-gray-900">₦{formatPrice(listing.price)}</p>
                <p className="text-sm text-gray-500">per year</p>
              </div>

              <div className="flex items-center gap-1 text-sm text-gray-500">
                <Heart className="w-4 h-4 text-[#E8442A]" />
                {listing.favoriteCount} people saved this
              </div>

              <div className="space-y-3 pt-2">
                {isLandlord ? (
                  <Button
                    onClick={() => setShowEditModal(true)}
                    variant="outline"
                    className="w-full flex items-center gap-2 border-[#E8442A] text-[#E8442A] hover:bg-[#E8442A] hover:text-white"
                  >
                    <Pencil className="w-4 h-4" />
                    Edit listing
                  </Button>
                ) : (
                  <>
                    <Button
                      onClick={() => {
                        if (!localStorage.getItem("accessToken")) {
                          toast.error("Please sign in to favorite properties")
                          navigate({ to: "/sign-in" })
                          return
                        }
                        toggleFavoriteMutation.mutate()
                      }}
                      disabled={toggleFavoriteMutation.isPending}
                      variant="outline"
                      className={`w-full flex items-center gap-2 ${favorited ? "border-[#E8442A] text-[#E8442A]" : ""}`}
                    >
                      <Heart className={`w-4 h-4 ${favorited ? "fill-[#E8442A] text-[#E8442A]" : ""}`} />
                      {favorited ? "Saved" : "Save listing"}
                    </Button>

                    <ContactLandlordModal
                      open={showContact}
                      onClose={() => setShowContact(false)}
                      phone={listing.landlordPhone}
                      name={listing.landlordName}
                      listingTitle={listing.title}
                    />

                    <Button
                      className="w-full bg-[#E8442A] hover:bg-[#d03d25] text-white"
                      onClick={() => setShowContact(true)}
                    >
                      Contact landlord
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {listing && (
          <EditListingModal
            open={showEditModal}
            onClose={() => setShowEditModal(false)}
            listing={listing}
            onSuccess={() => {
              queryClient.invalidateQueries({
                queryKey: queryKeys.listings.detail(id),
              })
            }}
          />
        )}
      </div>
    </div>
  )
}
