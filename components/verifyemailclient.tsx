"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { runApi } from "@/lib/api/runtime";
import { toast } from "sonner";

export default function VerifyEmailPage() {
	const searchParams = useSearchParams();
	const router = useRouter();
	const token = searchParams.get("token");
	const [status, setStatus] = useState<"loading" | "success" | "error">(
		"loading",
	);
	const [message, setMessage] = useState("");

	useEffect(() => {
		if (!token) {
			setStatus("error");
			setMessage("Invalid verification link");
			return;
		}

		runApi((api) => api.verifyEmail(token))
			.then(() => {
				toast.success("Email verified successfully");
				setStatus("success");
				setTimeout(() => router.push("/sign-in"), 3000);
			})
			.catch((e: any) => {
				toast.error("Verify error:", e);
				setStatus("error");
				setMessage(
					e?.message ?? "Verification failed. The link may have expired.",
				);
			});
	}, [token, router]);

	return (
		<div className="min-h-screen bg-white flex flex-col items-center justify-center px-4">
			<div className="w-full max-w-sm text-center space-y-4">
				{status === "loading" && (
					<>
						<div className="w-12 h-12 border-4 border-[#E8442A] border-t-transparent rounded-full animate-spin mx-auto" />
						<p className="text-gray-500 text-sm">Verifying your email...</p>
					</>
				)}

				{status === "success" && (
					<>
						<div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto">
							<span className="text-3xl">✓</span>
						</div>
						<h1 className="text-xl font-semibold text-gray-900">
							Email verified!
						</h1>
						<p className="text-sm text-gray-500">
							Redirecting you to sign in...
						</p>
					</>
				)}

				{status === "error" && (
					<>
						<div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto">
							<span className="text-3xl">✗</span>
						</div>
						<h1 className="text-xl font-semibold text-gray-900">
							Verification failed
						</h1>
						<p className="text-sm text-gray-500">{message}</p>
						<Link
							href="/sign-in"
							className="text-sm text-[#E8442A] hover:underline"
						>
							Back to sign in
						</Link>
					</>
				)}
			</div>
		</div>
	);
}
