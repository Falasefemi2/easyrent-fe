"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { runApi } from "@/lib/api/runtime";
import { toast } from "sonner";

export default function SignInPage() {
	const router = useRouter();
	const [form, setForm] = useState({ email: "", password: "" });
	const [loading, setLoading] = useState(false);

	const handleSubmit = async (e: React.SubmitEvent) => {
		e.preventDefault();
		setLoading(true);

		try {
			await runApi((api) => api.signIn(form));
			toast.success("Welcome back! You have successfully signed in.");
			router.push("/");
			router.refresh();
		} catch (_e) {
			toast.error("Invalid email or password. Please try again.");
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="min-h-screen bg-white flex flex-col">
			{/* Header */}
			<div className="border-b border-gray-100 px-6 py-4">
				<Link href="/" className="text-xl font-semibold text-[#E8442A]">
					EasyRent
				</Link>
			</div>

			{/* Form */}
			<div className="flex-1 flex items-center justify-center px-4">
				<div className="w-full max-w-sm">
					<div className="mb-8">
						<h1 className="text-2xl font-semibold text-gray-900">
							Welcome back
						</h1>
						<p className="text-sm text-gray-500 mt-1">
							Sign in to your EasyRent account
						</p>
					</div>

					<form onSubmit={handleSubmit} className="space-y-4">
						<div className="space-y-2">
							<Label>Email</Label>
							<Input
								type="email"
								placeholder="you@example.com"
								value={form.email}
								onChange={(e) =>
									setForm({
										...form,
										email: e.target.value,
									})
								}
								required
							/>
						</div>

						<div className="space-y-2">
							<Label>Password</Label>
							<PasswordInput
								placeholder="••••••••"
								value={form.password}
								onChange={(e) =>
									setForm({
										...form,
										password: e.target.value,
									})
								}
								required
							/>
						</div>

						<Button
							type="submit"
							disabled={loading}
							className="w-full bg-[#E8442A] hover:bg-[#d03d25] text-white h-11"
						>
							{loading ? "Signing in..." : "Sign in"}
						</Button>
					</form>

					<p className="text-center text-sm text-gray-500 mt-6">
						Don&apos;t have an account?{" "}
						<Link
							href="/sign-up"
							className="text-[#E8442A] font-medium hover:underline"
						>
							Sign up
						</Link>
					</p>
				</div>
			</div>
		</div>
	);
}
