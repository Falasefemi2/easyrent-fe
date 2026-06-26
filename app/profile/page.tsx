"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Camera, Heart, Home } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import EmptyState from "@/components/emptystate";
import ListingCard from "@/components/listingcard";
import ListingStatusBadge from "@/components/listingstatusbadge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { runApi } from "@/lib/api/runtime";
import { queryKeys } from "@/lib/queryKeys";
import type { FavoriteListing, Listing } from "@/lib/types";

type Tab = "listings" | "favorites";

export default function ProfilePage() {
	const router = useRouter();
	const queryClient = useQueryClient();
	const fileInputRef = useRef<HTMLInputElement>(null);
	const [activeTab, setActiveTab] = useState<Tab>("listings");
	const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
	const [listingsPage, setListingsPage] = useState(1);
	const [favoritesPage, setFavoritesPage] = useState(1);

	useEffect(() => {
		if (typeof window !== "undefined" && !localStorage.getItem("accessToken")) {
			router.push("/sign-in");
		}
	}, [router]);

	useEffect(() => {
		if (typeof window !== "undefined") {
			const saved = localStorage.getItem("avatarUrl");
			if (saved) setAvatarUrl(saved);
		}
	}, []);

	// Fetch user profile
	const { data: user } = useQuery({
		queryKey: queryKeys.user.me,
		queryFn: () => runApi((api) => api.getMe()),
		enabled:
			typeof window !== "undefined" && !!localStorage.getItem("accessToken"),
	});

	useEffect(() => {
		if (user) {
			localStorage.setItem("userFullname", (user as any).fullname);
			localStorage.setItem("userEmail", (user as any).email);
			if ((user as any).avatarUrl) {
				setAvatarUrl((user as any).avatarUrl);
				localStorage.setItem("avatarUrl", (user as any).avatarUrl);
			}
		}
	}, [user]);

	// Fetch user's listings
	const { data: listingsData, isLoading: loadingListings } = useQuery({
		queryKey: queryKeys.listings.mine({ page: listingsPage, limit: 8 }),
		queryFn: () =>
			runApi((api) =>
				api.getMyListings({
					page: listingsPage,
					limit: 8,
				}),
			),
		enabled:
			typeof window !== "undefined" && !!localStorage.getItem("accessToken"),
	});

	const listings = listingsData?.data ?? [];
	const listingsTotalPages = listingsData?.totalPages ?? 1;

	useEffect(() => {
		const handleListingCreated = () => {
			queryClient.invalidateQueries({ queryKey: ["listings", "mine"] });
			setListingsPage(1);
		};
		window.addEventListener("listing-created", handleListingCreated);
		return () => {
			window.removeEventListener("listing-created", handleListingCreated);
		};
	}, [queryClient]);

	// Fetch user's favorites
	const { data: favoritesData, isLoading: loadingFavorites } = useQuery({
		queryKey: queryKeys.favorites.list({ page: favoritesPage, limit: 8 }),
		queryFn: () =>
			runApi((api) =>
				api.getMyFavorites({
					page: favoritesPage,
					limit: 8,
				}),
			),
		enabled:
			typeof window !== "undefined" && !!localStorage.getItem("accessToken"),
	});

	const favorites = favoritesData?.data ?? [];
	const favoritesTotalPages = favoritesData?.totalPages ?? 1;

	// Avatar upload mutation
	const uploadAvatarMutation = useMutation({
		mutationFn: (file: File) => runApi((api) => api.uploadAvatar(file)),
		onSuccess: (result) => {
			const url = (result as any).avatarUrl;
			setAvatarUrl(url);
			localStorage.setItem("avatarUrl", url);
			queryClient.invalidateQueries({ queryKey: queryKeys.user.me });
			toast.success("Profile picture updated successfully!");
		},
		onError: (e) => {
			toast.error("Failed to upload profile picture");
			console.error(e);
		},
	});

	const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;
		uploadAvatarMutation.mutate(file);
	};

	return (
		<div className="min-h-screen bg-white">
			<div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
				{/* Profile header */}
				<div className="flex items-start justify-between mb-8">
					<div className="flex items-center gap-5">
						{/* Avatar */}
						<div className="relative">
							<div className="w-20 h-20 rounded-full overflow-hidden bg-gray-100 border-2 border-white shadow-md">
								{avatarUrl ? (
									<Image
										src={avatarUrl}
										alt="Avatar"
										fill
										sizes="80px"
										quality={100}
										unoptimized
										className="object-cover"
									/>
								) : (
									<div className="w-full h-full flex items-center justify-center text-gray-400">
										<svg
											className="w-8 h-8"
											fill="none"
											stroke="currentColor"
											viewBox="0 0 24 24"
										>
											<path
												strokeLinecap="round"
												strokeLinejoin="round"
												strokeWidth={1.5}
												d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
											/>
										</svg>
									</div>
								)}
							</div>
							{/* Upload button */}
							<button
								onClick={() => fileInputRef.current?.click()}
								disabled={uploadAvatarMutation.isPending}
								className="absolute -bottom-1 -right-1 w-7 h-7 bg-[#E8442A] rounded-full flex items-center justify-center shadow-md hover:bg-[#d03d25] transition-colors"
							>
								{uploadAvatarMutation.isPending ? (
									<div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" />
								) : (
									<Camera className="w-3.5 h-3.5 text-white" />
								)}
							</button>
							<input
								ref={fileInputRef}
								type="file"
								accept="image/*"
								className="hidden"
								onChange={handleAvatarUpload}
							/>
						</div>

						<div>
							<div>
								<h1 className="text-xl font-semibold text-gray-900">
									{user?.fullname ?? "My profile"}
								</h1>
								<p className="text-sm text-gray-500 mt-0.5">
									{user?.email ?? "Manage your listings and saved properties"}
								</p>
							</div>
							<p className="text-sm text-gray-500 mt-0.5">
								Manage your listings and saved properties
							</p>
						</div>
					</div>
				</div>

				{/* Stats */}
				<div className="grid grid-cols-2 gap-4 mb-8">
					<div className="bg-gray-50 rounded-xl p-4">
						<div className="flex items-center gap-2 text-gray-500 mb-1">
							<Home className="w-4 h-4" />
							<span className="text-xs">My listings</span>
						</div>
						<p className="text-2xl font-semibold text-gray-900">
							{loadingListings ? "—" : (listings?.length ?? 0)}
						</p>
					</div>
					<div className="bg-gray-50 rounded-xl p-4">
						<div className="flex items-center gap-2 text-gray-500 mb-1">
							<Heart className="w-4 h-4" />
							<span className="text-xs">Saved</span>
						</div>
						<p className="text-2xl font-semibold text-gray-900">
							{loadingFavorites ? "—" : favorites?.length}
						</p>
					</div>
				</div>

				{/* Tabs */}
				<div className="flex gap-1 border-b border-gray-200 mb-6">
					<button
						onClick={() => setActiveTab("listings")}
						className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
							activeTab === "listings"
								? "border-[#E8442A] text-[#E8442A]"
								: "border-transparent text-gray-500 hover:text-gray-700"
						}`}
					>
						My listings
					</button>
					<button
						onClick={() => setActiveTab("favorites")}
						className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
							activeTab === "favorites"
								? "border-[#E8442A] text-[#E8442A]"
								: "border-transparent text-gray-500 hover:text-gray-700"
						}`}
					>
						Saved
					</button>
				</div>

				{/* My listings tab */}
				{activeTab === "listings" && (
					<>
						{loadingListings ? (
							<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
								{Array.from({
									length: 4,
								}).map((_, i) => (
									<div key={i} className="space-y-3">
										<Skeleton className="aspect-4/3 rounded-xl" />
										<Skeleton className="h-4 w-3/4" />
										<Skeleton className="h-3 w-1/2" />
									</div>
								))}
							</div>
						) : listings?.length === 0 ? (
							<EmptyState
								type="listings"
								onAction={() =>
									window.dispatchEvent(
										new CustomEvent("open-create-listing-modal"),
									)
								}
								actionLabel="List a property"
							/>
						) : (
							<>
								<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
									{listings?.map((listing) => (
										<div key={listing.id} className="space-y-1">
											<ListingCard listing={listing} />
											<ListingStatusBadge
												listingId={listing.id}
												initialStatus={listing.status as any}
												onStatusChange={(newStatus) => {
													queryClient.invalidateQueries({
														queryKey: ["listings", "mine"],
													});
												}}
											/>
										</div>
									))}
								</div>
								{listingsTotalPages > 1 && (
									<div className="flex items-center justify-center gap-2 mt-8">
										<Button
											variant="outline"
											size="sm"
											onClick={() => setListingsPage((p) => Math.max(1, p - 1))}
											disabled={listingsPage === 1}
										>
											Previous
										</Button>
										<span className="text-sm text-gray-500">
											{listingsPage} of {listingsTotalPages}
										</span>
										<Button
											variant="outline"
											size="sm"
											onClick={() =>
												setListingsPage((p) =>
													Math.min(listingsTotalPages, p + 1),
												)
											}
											disabled={listingsPage === listingsTotalPages}
										>
											Next
										</Button>
									</div>
								)}
							</>
						)}
					</>
				)}

				{/* Favorites tab */}
				{activeTab === "favorites" && (
					<>
						{loadingFavorites ? (
							<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
								{Array.from({
									length: 4,
								}).map((_, i) => (
									<div key={i} className="space-y-3">
										<Skeleton className="aspect-4/3 rounded-xl" />
										<Skeleton className="h-4 w-3/4" />
										<Skeleton className="h-3 w-1/2" />
									</div>
								))}
							</div>
						) : favorites?.length === 0 ? (
							<EmptyState
								type="favorites"
								onAction={() => router.push("/")}
								actionLabel="Browse listings"
							/>
						) : (
							<>
								<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
									{favorites?.map((listing) => (
										<ListingCard
											key={listing.id}
											listing={listing}
											initialFavorited={true}
										/>
									))}
								</div>
								{favoritesTotalPages > 1 && (
									<div className="flex items-center justify-center gap-2 mt-8">
										<Button
											variant="outline"
											size="sm"
											onClick={() =>
												setFavoritesPage((p) => Math.max(1, p - 1))
											}
											disabled={favoritesPage === 1}
										>
											Previous
										</Button>
										<span className="text-sm text-gray-500">
											{favoritesPage} of {favoritesTotalPages}
										</span>
										<Button
											variant="outline"
											size="sm"
											onClick={() =>
												setFavoritesPage((p) =>
													Math.min(favoritesTotalPages, p + 1),
												)
											}
											disabled={favoritesPage === favoritesTotalPages}
										>
											Next
										</Button>
									</div>
								)}
							</>
						)}
					</>
				)}
			</div>
		</div>
	);
}
