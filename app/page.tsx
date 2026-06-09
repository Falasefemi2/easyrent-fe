"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { runApi } from "@/lib/api/runtime";
import { type Listing } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import Navbar from "@/components/navbar";
import ListingCard from "@/components/listingcard";
import CreateListingModal from "@/components/createlistingmodal";

const FILTERS = [
	"All",
	"Furnished",
	"1 bed",
	"2 beds",
	"3+ beds",
	"Self contain",
];

export default function HomePage() {
	const [listings, setListings] = useState<Listing[]>([]);
	const [loading, setLoading] = useState(true);
	const [page, setPage] = useState(1);
	const [totalPages, setTotalPages] = useState(1);
	const [activeFilter, setActiveFilter] = useState("All");
	const [showCreateModal, setShowCreateModal] = useState(false);
	const [isLoggedIn, setIsLoggedIn] = useState(false);
	const [favoritedIds, setFavoritedIds] = useState<Set<string>>(() => {
		if (typeof window === "undefined") return new Set();
		const saved = localStorage.getItem("favoritedIds");
		return saved ? new Set(JSON.parse(saved)) : new Set();
	});

	useEffect(() => {
		const checkAuth = () => {
			setIsLoggedIn(!!localStorage.getItem("accessToken"));
		};
		checkAuth();
		window.addEventListener("auth-change", checkAuth);
		window.addEventListener("storage", checkAuth);
		return () => {
			window.removeEventListener("auth-change", checkAuth);
			window.removeEventListener("storage", checkAuth);
		};
	}, []);

	const fetchListings = useCallback(async (p = 1) => {
		setLoading(true);
		try {
			const result = await runApi((api) =>
				api.getListings({ page: p, limit: 12 }),
			);
			setListings(result.data as Listing[]);
			setTotalPages(result.totalPages);
		} catch (e) {
			console.error(e);
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		fetchListings(page);
	}, [page, fetchListings]);

	useEffect(() => {
		if (!localStorage.getItem("accessToken")) return;
		runApi((api) => api.getMyFavorites({ page: 1, limit: 100 }))
			.then((result) => {
				const ids = (result.data as any[]).map((f: any) => f.id);
				setFavoritedIds(new Set(ids));
				localStorage.setItem("favoritedIds", JSON.stringify(ids));
			})
			.catch(() => {});
	}, []);

	return (
		<div className="min-h-screen bg-white">
			<Navbar onCreateListing={() => setShowCreateModal(true)} />

			<CreateListingModal
				open={showCreateModal}
				onClose={() => setShowCreateModal(false)}
				onSuccess={() => fetchListings(1)}
			/>

			{/* Search bar */}
			<div className="border-b border-gray-100 py-4">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					<div className="flex items-center gap-2 border border-gray-200 rounded-full px-4 py-2 max-w-2xl shadow-sm hover:shadow-md transition-shadow">
						<Input
							placeholder="Search by location..."
							className="border-none shadow-none focus-visible:ring-0 text-sm flex-1 p-0"
						/>
						<button className="bg-[#E8442A] text-white rounded-full p-2 hover:bg-[#d03d25] transition-colors">
							<svg
								className="w-4 h-4"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
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

			{/* Filter chips */}
			<div className="border-b border-gray-100">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					<div className="flex gap-2 py-3 overflow-x-auto scrollbar-hide">
						{FILTERS.map((filter) => (
							<button
								key={filter}
								onClick={() => setActiveFilter(filter)}
								className={`px-4 py-1.5 rounded-full text-sm whitespace-nowrap border transition-colors ${
									activeFilter === filter
										? "bg-[#E8442A] text-white border-[#E8442A]"
										: "border-gray-200 text-gray-600 hover:border-gray-400"
								}`}
							>
								{filter}
							</button>
						))}
					</div>
				</div>
			</div>

			{/* Listings grid */}
			<main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24 sm:pb-8">
				{loading ? (
					<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
						{Array.from({ length: 8 }).map((_, i) => (
							<div key={i} className="space-y-3">
								<Skeleton className="aspect-[4/3] rounded-xl" />
								<Skeleton className="h-4 w-3/4" />
								<Skeleton className="h-3 w-1/2" />
								<Skeleton className="h-4 w-1/3" />
							</div>
						))}
					</div>
				) : listings.length === 0 ? (
					<div className="text-center py-20 text-gray-400">
						<p className="text-lg">No listings found</p>
					</div>
				) : (
					<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
						{listings.map((listing) => (
							<ListingCard
								key={listing.id}
								listing={listing}
								initialFavorited={favoritedIds.has(listing.id)}
							/>
						))}
					</div>
				)}

				{/* Pagination */}
				{totalPages > 1 && (
					<div className="flex items-center justify-center gap-2 mt-10">
						<Button
							variant="outline"
							size="sm"
							onClick={() => setPage((p) => Math.max(1, p - 1))}
							disabled={page === 1}
						>
							Previous
						</Button>
						<span className="text-sm text-gray-500">
							Page {page} of {totalPages}
						</span>
						<Button
							variant="outline"
							size="sm"
							onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
							disabled={page === totalPages}
						>
							Next
						</Button>
					</div>
				)}
			</main>

			{/* Floating action button — mobile only, logged in only */}
			{isLoggedIn && (
				<button
					onClick={() => setShowCreateModal(true)}
					className="fixed bottom-20 right-4 z-40 w-14 h-14 bg-[#E8442A] rounded-full flex items-center justify-center shadow-lg hover:bg-[#d03d25] transition-colors sm:hidden"
				>
					<svg
						className="w-6 h-6 text-white"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth={2}
							d="M12 4v16m8-8H4"
						/>
					</svg>
				</button>
			)}

			{/* Mobile bottom tab bar */}
			<div className="fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-gray-100 flex sm:hidden">
				<Link href="/" className="flex-1 flex flex-col items-center py-2 gap-1">
					<svg
						className="w-5 h-5 text-[#E8442A]"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth={2}
							d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
						/>
					</svg>
					<span className="text-xs text-[#E8442A]">Explore</span>
				</Link>
				<Link
					href="/profile"
					className="flex-1 flex flex-col items-center py-2 gap-1"
				>
					<svg
						className="w-5 h-5 text-gray-400"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth={2}
							d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
						/>
					</svg>
					<span className="text-xs text-gray-400">Saved</span>
				</Link>
				<Link
					href="/profile"
					className="flex-1 flex flex-col items-center py-2 gap-1"
				>
					<svg
						className="w-5 h-5 text-gray-400"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth={2}
							d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
						/>
					</svg>
					<span className="text-xs text-gray-400">Profile</span>
				</Link>
			</div>
		</div>
	);
}
