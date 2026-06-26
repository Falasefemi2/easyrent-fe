"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import CreateListingModal from "./createlistingmodal";
import Navbar from "./navbar";

export default function GlobalNav() {
	const pathname = usePathname();
	const [showCreateModal, setShowCreateModal] = useState(false);
	const [isLoggedIn, setIsLoggedIn] = useState(false);

	useEffect(() => {
		const handleOpenModal = () => setShowCreateModal(true);
		window.addEventListener("open-create-listing-modal", handleOpenModal);
		return () => {
			window.removeEventListener("open-create-listing-modal", handleOpenModal);
		};
	}, []);

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

	// Hide bottom bar on auth pages
	const isAuthPage = pathname === "/sign-in" || pathname === "/sign-up";

	return (
		<>
			{!isAuthPage && (
				<Navbar onCreateListing={() => setShowCreateModal(true)} />
			)}

			<CreateListingModal
				open={showCreateModal}
				onClose={() => setShowCreateModal(false)}
				onSuccess={() => {
					// Refresh the current page to show new listing if on home/profile
					window.dispatchEvent(new CustomEvent("listing-created"));
				}}
			/>

			{!isAuthPage && (
				<>
					{/* Floating action button — mobile only, logged in only */}
					{isLoggedIn && (
						<button
							onClick={() => setShowCreateModal(true)}
							className="fixed bottom-20 right-4 z-50 w-14 h-14 bg-[#E8442A] rounded-full flex items-center justify-center shadow-lg hover:bg-[#d03d25] transition-colors sm:hidden"
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
					<div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-100 flex sm:hidden">
						<Link
							href="/"
							className="flex-1 flex flex-col items-center py-2 gap-1"
						>
							<svg
								className={`w-5 h-5 ${pathname === "/" ? "text-[#E8442A]" : "text-gray-400"}`}
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
							<span
								className={`text-xs ${pathname === "/" ? "text-[#E8442A]" : "text-gray-400"}`}
							>
								Explore
							</span>
						</Link>
						<Link
							href="/profile"
							className="flex-1 flex flex-col items-center py-2 gap-1"
						>
							<svg
								className={`w-5 h-5 ${pathname === "/saved" ? "text-[#E8442A]" : "text-gray-400"}`}
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
							<span
								className={`text-xs ${pathname === "/saved" ? "text-[#E8442A]" : "text-gray-400"}`}
							>
								Saved
							</span>
						</Link>
						<Link
							href="/profile"
							className="flex-1 flex flex-col items-center py-2 gap-1"
						>
							<svg
								className={`w-5 h-5 ${pathname === "/profile" ? "text-[#E8442A]" : "text-gray-400"}`}
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
							<span
								className={`text-xs ${pathname === "/profile" ? "text-[#E8442A]" : "text-gray-400"}`}
							>
								Profile
							</span>
						</Link>
					</div>
				</>
			)}
		</>
	);
}
