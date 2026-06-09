"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import dynamic from "next/dynamic";
import { Heart, MapPin, Bed, Sofa, ArrowLeft, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { runApi } from "@/lib/api/runtime";
import type { ListingWithMedia } from "@/lib/types";
import { formatPrice } from "@/lib/utils";
import Navbar from "@/components/navbar";

const MapView = dynamic(() => import("@/components/MapView"), { ssr: false });

export default function ListingDetailPage() {
	const { id } = useParams<{ id: string }>();
	const router = useRouter();
	const [listing, setListing] = useState<ListingWithMedia | null>(null);
	const [loading, setLoading] = useState(true);
	const [favorited, setFavorited] = useState(false);
	const [activeImage, setActiveImage] = useState(0);
	const [checkingFavorite, setCheckingFavorite] = useState(false);

	useEffect(() => {
		const fetchListing = async () => {
			try {
				const result = await runApi((api) => api.getListingById(id));
				setListing(result as unknown as ListingWithMedia);
			} catch (e) {
				console.error(e);
			} finally {
				setLoading(false);
			}
		};

		fetchListing();
	}, [id]);

	useEffect(() => {
		const checkFavorite = async () => {
			if (!localStorage.getItem("accessToken")) return;
			try {
				const result = await runApi((api) => api.checkFavorite(id));
				setFavorited(result as unknown as boolean);
			} catch (e) {
				console.error(e);
			}
		};
		checkFavorite();
	}, [id]);

	const handleFavorite = async () => {
		if (!localStorage.getItem("accessToken")) {
			router.push("/sign-in");
			return;
		}
		setCheckingFavorite(true);
		try {
			if (favorited) {
				await runApi((api) => api.removeFavorite(id));
			} else {
				await runApi((api) => api.addFavorite(id));
			}
			setFavorited(!favorited);
		} catch (e) {
			console.error(e);
		} finally {
			setCheckingFavorite(false);
		}
	};

	if (loading) {
		return (
			<div className="min-h-screen bg-white">
				<Navbar />
				<div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
					<Skeleton className="w-full aspect-video rounded-2xl" />
					<Skeleton className="h-8 w-2/3" />
					<Skeleton className="h-4 w-1/3" />
					<Skeleton className="h-6 w-1/4" />
				</div>
			</div>
		);
	}

	if (!listing) {
		return (
			<div className="min-h-screen bg-white">
				<Navbar />
				<div className="max-w-5xl mx-auto px-4 py-20 text-center text-gray-400">
					<p>Listing not found</p>
					<Button
						variant="outline"
						className="mt-4"
						onClick={() => router.push("/")}
					>
						Back to listings
					</Button>
				</div>
			</div>
		);
	}

	const images = listing.media.filter((m) => m.type === "image");

	return (
		<div className="min-h-screen bg-white">
			<Navbar />

			<div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
				<button
					onClick={() => router.back()}
					className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 mb-6 transition-colors"
				>
					<ArrowLeft className="w-4 h-4" />
					Back
				</button>

				{images.length > 0 ? (
					<div className="grid grid-cols-4 grid-rows-2 gap-2 rounded-2xl overflow-hidden h-100 mb-8">
						{/* Main image */}
						<div className="col-span-2 row-span-2 relative">
							<Image
								src={images[activeImage]?.url ?? images[0].url}
								alt={listing.title}
								fill
								priority
								sizes="(max-width: 768px) 100vw, 50vw"
								className="object-cover"
							/>
						</div>
						{images.slice(1, 5).map((img, i) => (
							<div
								key={img.id}
								className="relative cursor-pointer hover:opacity-90 transition-opacity"
								onClick={() => setActiveImage(i + 1)}
							>
								<Image
									src={img.url}
									alt={`Photo ${i + 2}`}
									fill
									sizes="(max-width: 768px) 25vw, 12vw"
									className="object-cover"
								/>
							</div>
						))}
						{Array.from({
							length: Math.max(0, 4 - images.slice(1, 5).length),
						}).map((_, i) => (
							<div key={`empty-${i}`} className="bg-gray-100" />
						))}
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
								<h1 className="text-2xl font-semibold text-gray-900">
									{listing.title}
								</h1>
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

						<div className="flex flex-wrap gap-3">
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
									className={
										listing.status === "avaiable"
											? "bg-green-50 text-green-700 border-green-200"
											: "bg-gray-50 text-gray-600"
									}
								>
									{listing.status === "avaiable" ? "Available" : listing.status}
								</Badge>
							)}
						</div>

						<div>
							<h2 className="text-lg font-medium text-gray-900 mb-2">
								About this property
							</h2>
							<p className="text-gray-600 text-sm leading-relaxed">
								{listing.description}
							</p>
						</div>

						<div>
							<h2 className="text-lg font-medium text-gray-900 mb-3">
								Location
							</h2>
							<div className="rounded-xl overflow-hidden border border-gray-200 h-70">
								<MapView
									latitude={6.5244}
									longitude={3.3792}
									address={listing.address}
								/>
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
								<p className="text-2xl font-semibold text-gray-900">
									₦{formatPrice(listing.price)}
								</p>
								<p className="text-sm text-gray-500">per year</p>
							</div>

							<div className="flex items-center gap-1 text-sm text-gray-500">
								<Heart className="w-4 h-4 text-[#E8442A]" />
								{listing.favoriteCount} people saved this
							</div>

							<div className="space-y-3 pt-2">
								<Button
									onClick={handleFavorite}
									disabled={checkingFavorite}
									variant="outline"
									className={`w-full flex items-center gap-2 ${
										favorited ? "border-[#E8442A] text-[#E8442A]" : ""
									}`}
								>
									<Heart
										className={`w-4 h-4 ${favorited ? "fill-[#E8442A] text-[#E8442A]" : ""}`}
									/>
									{favorited ? "Saved" : "Save listing"}
								</Button>

								<Button className="w-full bg-[#E8442A] hover:bg-[#d03d25] text-white">
									Contact landlord
								</Button>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
