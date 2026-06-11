"use client";

import { useEffect, useState, useCallback } from "react";
import { runApi } from "@/lib/api/runtime";
import { type Listing } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import ListingCard from "@/components/listingcard";
import { toast } from "sonner";
import EmptyState from "@/components/emptystate";

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
	const [favoritedIds, setFavoritedIds] = useState<Set<string>>(() => {
		if (typeof window === "undefined") return new Set();
		const saved = localStorage.getItem("favoritedIds");
		return saved ? new Set(JSON.parse(saved)) : new Set();
	});
	const [searchQuery, setSearchQuery] = useState("");
	const [debouncedSearch, setDebouncedSearch] = useState("");

	useEffect(() => {
		const handleListingCreated = () => {
			fetchListings(1);
		};
		window.addEventListener("listing-created", handleListingCreated);
		return () => {
			window.removeEventListener("listing-created", handleListingCreated);
		};
	}, []);

	const getFilterParams = (filter: string) => {
		switch (filter) {
			case "Furnished":
				return { furnished: true };
			case "1 bed":
				return { rooms: 1 };
			case "2 beds":
				return { rooms: 2 };
			case "3+ beds":
				return { minRooms: 3 };
			case "Self contain":
				return { rooms: 1, furnished: false };
			default:
				return {};
		}
	};

	useEffect(() => {
		const timer = setTimeout(() => {
			setDebouncedSearch(searchQuery);
		}, 500);
		return () => clearTimeout(timer);
	}, [searchQuery]);

	useEffect(() => {
		fetchListings(1, activeFilter, debouncedSearch);
	}, [debouncedSearch]);

	const fetchListings = useCallback(
		async (p = 1, filter = activeFilter, search = debouncedSearch) => {
			setLoading(true);
			try {
				const result = await runApi((api) =>
					api.getListings({
						page: p,
						limit: 12,
						...getFilterParams(filter),
						...(search ? { search } : {}),
					}),
				);
				setListings(result.data as Listing[]);
				setTotalPages(result.totalPages);
			} catch (e) {
				toast.error("Failed to load listings");
				console.error(e);
			} finally {
				setLoading(false);
			}
		},
		[activeFilter, debouncedSearch],
	);

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
			.catch(() => {
				toast.error("Failed to load favorites");
			});
	}, []);

	return (
		<div className="min-h-screen bg-white">
			{/* Search bar */}
			<div className="border-b border-gray-100 py-4">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					<div className="flex items-center gap-2 border border-gray-200 rounded-full px-4 py-2 max-w-2xl shadow-sm hover:shadow-md transition-shadow">
						<Input
							placeholder="Search by location..."
							value={searchQuery}
							onChange={(e) => {
								setSearchQuery(e.target.value);
								setPage(1);
							}}
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
								onClick={() => {
									setActiveFilter(filter);
									setPage(1);
									fetchListings(1, filter);
								}}
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
								<Skeleton className="aspect-4/3 rounded-xl" />
								<Skeleton className="h-4 w-3/4" />
								<Skeleton className="h-3 w-1/2" />
								<Skeleton className="h-4 w-1/3" />
							</div>
						))}
					</div>
				) : listings.length === 0 ? (
					<EmptyState type="search" />
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
		</div>
	);
}
