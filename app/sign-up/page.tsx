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
import { useMutation } from "@tanstack/react-query";

export default function SignUpPage() {
	const router = useRouter();
	const [form, setForm] = useState({
		fullname: "",
		email: "",
		phone: "",
		password: "",
		confirmPassword: "",
	});
	const [submitted, setSubmitted] = useState(false);

	const registerMutation = useMutation({
		mutationFn: () =>
			runApi((api) =>
				api.signUp({
					fullname: form.fullname,
					email: form.email,
					phone: form.phone,
					password: form.password,
				}),
			),
		onSuccess: () => {
			setSubmitted(true);
			toast.success("Account created successfully! Welcome to EasyRent.");
		},
		onError: () => {
			toast.error("Something went wrong. Email may already be registered.");
		},
	});

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();

		if (form.password !== form.confirmPassword) {
			toast.error("Passwords do not match");
			return;
		}

		if (form.password.length < 8) {
			toast.error("Password must be at least 8 characters");
			return;
		}

		registerMutation.mutate();
	};

	if (submitted) {
		return (
			<div className="min-h-screen bg-white flex flex-col">
				{/* Header */}
				<div className="border-b border-gray-100 px-6 py-4">
					<Link href="/" className="text-xl font-semibold text-[#E8442A]">
						EasyRent
					</Link>
				</div>
				<div className="flex-1 flex items-center justify-center px-4">
					<div className="w-full max-w-sm text-center space-y-4">
						<div className="w-16 h-16 bg-orange-50 rounded-full flex items-center justify-center mx-auto">
							<span className="text-3xl">📧</span>
						</div>
						<h1 className="text-2xl font-semibold text-gray-900">
							Check your email
						</h1>
						<p className="text-sm text-gray-500">
							We sent a verification link to your email. Click it to activate
							your account.
						</p>
						<Link
							href="/sign-in"
							className="text-sm text-[#E8442A] hover:underline block"
						>
							Already verified? Sign in
						</Link>
					</div>
				</div>
			</div>
		);
	}
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
							<PasswordInput
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
							<PasswordInput
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

						<Button
							type="submit"
							disabled={registerMutation.isPending}
							className="w-full bg-[#E8442A] hover:bg-[#d03d25] text-white h-11"
						>
							{registerMutation.isPending ? "Creating account..." : "Create account"}
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
