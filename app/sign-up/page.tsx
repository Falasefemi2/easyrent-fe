"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { runApi } from "@/lib/api/runtime";

export default function SignUpPage() {
	const router = useRouter();
	const [form, setForm] = useState({
		fullname: "",
		email: "",
		phone: "",
		password: "",
		confirmPassword: "",
	});
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError("");

		if (form.password !== form.confirmPassword) {
			setError("Passwords do not match");
			return;
		}

		if (form.password.length < 8) {
			setError("Password must be at least 8 characters");
			return;
		}

		setLoading(true);

		try {
			await runApi((api) =>
				api.signUp({
					fullname: form.fullname,
					email: form.email,
					phone: form.phone,
					password: form.password,
				}),
			);
			router.push("/");
			router.refresh();
		} catch (e) {
			setError("Something went wrong. Email may already be registered.");
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
			<div className="flex-1 flex items-center justify-center px-4 py-8">
				<div className="w-full max-w-sm">
					<div className="mb-8">
						<h1 className="text-2xl font-semibold text-gray-900">
							Create account
						</h1>
						<p className="text-sm text-gray-500 mt-1">
							Join EasyRent and find your next home
						</p>
					</div>

					<form onSubmit={handleSubmit} className="space-y-4">
						<div className="space-y-2">
							<Label>Full name</Label>
							<Input
								placeholder="Femi Falase"
								value={form.fullname}
								onChange={(e) =>
									setForm({
										...form,
										fullname: e.target.value,
									})
								}
								required
							/>
						</div>

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
							<Label>Phone number</Label>
							<Input
								type="tel"
								placeholder="+2347013329953"
								value={form.phone}
								onChange={(e) =>
									setForm({
										...form,
										phone: e.target.value,
									})
								}
								required
							/>
						</div>

						<div className="space-y-2">
							<Label>Password</Label>
							<Input
								type="password"
								placeholder="Min. 8 characters"
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

						<div className="space-y-2">
							<Label>Confirm password</Label>
							<Input
								type="password"
								placeholder="••••••••"
								value={form.confirmPassword}
								onChange={(e) =>
									setForm({
										...form,
										confirmPassword: e.target.value,
									})
								}
								required
							/>
						</div>

						{error && (
							<p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-lg">
								{error}
							</p>
						)}

						<Button
							type="submit"
							disabled={loading}
							className="w-full bg-[#E8442A] hover:bg-[#d03d25] text-white h-11"
						>
							{loading ? "Creating account..." : "Create account"}
						</Button>
					</form>

					<p className="text-center text-sm text-gray-500 mt-6">
						Already have an account?{" "}
						<Link
							href="/sign-in"
							className="text-[#E8442A] font-medium hover:underline"
						>
							Sign in
						</Link>
					</p>
				</div>
			</div>
		</div>
	);
}
