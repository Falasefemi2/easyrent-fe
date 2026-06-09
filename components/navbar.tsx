"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { runApi } from "@/lib/api/runtime";
import { useState, useEffect } from "react";

export default function Navbar({
	onCreateListing,
}: {
	onCreateListing?: () => void;
}) {
	const router = useRouter();
	const [isLoggedIn, setIsLoggedIn] = useState(false);

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

	const handleSignOut = async () => {
		await runApi((api) => api.signOut());
		localStorage.removeItem("favoritedIds");
		localStorage.removeItem("avatarUrl");
		router.push("/");
		router.refresh();
	};

	return (
		<nav className="sticky top-0 z-50 bg-white border-b border-gray-100">
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
				<div className="flex items-center justify-between h-16">
					<Link href="/" className="text-xl font-semibold text-[#E8442A]">
						EasyRent
					</Link>

					<div className="flex items-center gap-3">
						{isLoggedIn ? (
							<>
								<Button
									variant="outline"
									size="sm"
									onClick={onCreateListing}
									className="hidden sm:flex items-center gap-2"
								>
									<span>+</span> List property
								</Button>
								<Link href="/profile" className="hidden sm:block">
									<div className="w-9 h-9 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center cursor-pointer hover:bg-gray-200 transition-colors">
										<svg
											className="w-4 h-4 text-gray-600"
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
									</div>
								</Link>
								<Button variant="ghost" size="sm" onClick={handleSignOut}>
									Sign out
								</Button>
							</>
						) : (
							<>
								<Link href="/sign-in">
									<Button variant="ghost" size="sm">
										Sign in
									</Button>
								</Link>
								<Link href="/sign-up">
									<Button
										size="sm"
										className="bg-[#E8442A] hover:bg-[#d03d25] text-white"
									>
										Sign up
									</Button>
								</Link>
							</>
						)}
					</div>
				</div>
			</div>
		</nav>
	);
}
