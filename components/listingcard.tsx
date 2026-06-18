"use client";
import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Heart } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { Listing } from "@/lib/types";
import { runApi } from "@/lib/api/runtime";
import { formatPrice } from "@/lib/utils";
import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";

export default function ListingCard({
	listing,
	initialFavorited = false,
}: {
	listing: Listing;
	initialFavorited?: boolean;
}) {
	const queryClient = useQueryClient();
	const [favorited, setFavorited] = useState(initialFavorited);

	useEffect(() => {
		setFavorited(initialFavorited);
	}, [initialFavorited]);

	const toggleFavoriteMutation = useMutation({
		mutationFn: async () => {
			if (favorited) {
				await runApi((api) => api.removeFavorite(listing.id));
			} else {
				await runApi((api) => api.addFavorite(listing.id));
			}
		},
		onSuccess: () => {
			const saved = localStorage.getItem("favoritedIds");
			let ids: string[] = saved ? JSON.parse(saved) : [];
			if (favorited) {
				ids = ids.filter((id) => id !== listing.id);
			} else {
				ids = [...ids, listing.id];
			}
			localStorage.setItem("favoritedIds", JSON.stringify(ids));

			toast.success(favorited ? "Removed from favorites" : "Added to favorites!");
			setFavorited(!favorited);

			queryClient.invalidateQueries({ queryKey: queryKeys.listings.all });
			queryClient.invalidateQueries({ queryKey: queryKeys.favorites.all });
			queryClient.invalidateQueries({ queryKey: queryKeys.favorites.check(listing.id) });
		},
		onError: (e) => {
			toast.error("Failed to update favorites. Please try again.");
			console.error(e);
		},
	});

	const handleFavorite = (e: React.MouseEvent) => {
		e.preventDefault();
		e.stopPropagation();
		if (!localStorage.getItem("accessToken")) {
			toast.error("Please sign in to favorite properties");
			return;
		}
		toggleFavoriteMutation.mutate();
	};

	const coverImage = listing.coverImage || "";
	const priceFormatted = formatPrice(listing.price); // Safe call

	return (
		<Link href={`/listings/${listing.id}`}>
			<div className="group cursor-pointer">
				<div className="relative aspect-4/3 rounded-xl overflow-hidden bg-gray-100 mb-3">
					{coverImage ? (
						<Image
							src={coverImage}
							alt={listing.title}
							fill
							loading="lazy"
							quality={90}
							unoptimized
							sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
							className="object-cover group-hover:scale-105 transition-transform duration-300"
						/>
					) : (
						<div className="w-full h-full flex items-center justify-center text-gray-400">
							<svg
								className="w-12 h-12"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={1}
									d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"
								/>
							</svg>
						</div>
					)}

					<button
						onClick={handleFavorite}
						disabled={toggleFavoriteMutation.isPending}
						className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 flex items-center justify-center shadow-sm hover:scale-110 transition-transform"
					>
						<Heart
							className={`w-4 h-4 transition-colors ${
								favorited ? "fill-[#E8442A] text-[#E8442A]" : "text-gray-600"
							}`}
						/>
					</button>

					{listing.furnished && (
						<div className="absolute top-3 left-3">
							<Badge className="bg-white text-gray-700 text-xs font-normal shadow-sm">
								Furnished
							</Badge>
						</div>
					)}
				</div>

				<div className="space-y-1">
					<div className="flex items-start justify-between">
						<h3 className="font-medium text-sm text-gray-900 line-clamp-1">
							{listing.title}
						</h3>
						<div className="flex items-center gap-1 text-xs text-gray-500 ml-2 shrink-0">
							<Heart className="w-3 h-3" />
							{listing.favoriteCount ?? 0}
						</div>
					</div>

					<p className="text-xs text-gray-500 line-clamp-1">
						{listing.address}
					</p>

					<div className="flex items-center gap-2">
						<p className="text-sm font-semibold text-gray-900">
							₦{priceFormatted}
						</p>
						<span className="text-xs text-gray-400">/year</span>
					</div>

					<div className="flex gap-2">
						{listing.rooms && (
							<span className="text-xs text-gray-500 bg-gray-50 px-2 py-0.5 rounded-full">
								{listing.rooms} {listing.rooms === 1 ? "bed" : "beds"}
							</span>
						)}

						{listing.status === "avaiable" && (
							<span className="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
								Available
							</span>
						)}
						{listing.status === "rented" && (
							<span className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
								Rented
							</span>
						)}
						{listing.status === "inative" && (
							<span className="text-xs text-gray-500 bg-gray-50 px-2 py-0.5 rounded-full">
								Inactive
							</span>
						)}
					</div>
				</div>
			</div>
		</Link>
	);
}
