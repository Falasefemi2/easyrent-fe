"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { runApi } from "@/lib/api/runtime";
import { X, Upload, MapPin } from "lucide-react";
import { toast } from "sonner";

const MapView = dynamic(() => import("./MapView"), { ssr: false });

interface CreateListingModalProps {
	open: boolean;
	onClose: () => void;
	onSuccess: () => void;
}

interface Step1Data {
	title: string;
	description: string;
	price: string;
	rooms: number;
	furnished: boolean;
}

interface Step2Data {
	address: string;
	latitude: number | null;
	longitude: number | null;
}

interface Step3Data {
	files: File[];
}

const DEFAULT_LAGOS = { latitude: 6.5244, longitude: 3.3792 };

export default function CreateListingModal({
	open,
	onClose,
	onSuccess,
}: CreateListingModalProps) {
	const [step, setStep] = useState(1);
	const [loading, setLoading] = useState(false);

	const [step1, setStep1] = useState<Step1Data>({
		title: "",
		description: "",
		price: "",
		rooms: 1,
		furnished: false,
	});

	const [step2, setStep2] = useState<Step2Data>({
		address: "",
		latitude: null,
		longitude: null,
	});

	const [step3, setStep3] = useState<Step3Data>({ files: [] });
	const [previews, setPreviews] = useState<string[]>([]);

	const reset = () => {
		setStep(1);
		setStep1({
			title: "",
			description: "",
			price: "",
			rooms: 1,
			furnished: false,
		});
		setStep2({
			address: "",
			latitude: null,
			longitude: null,
		});
		setStep3({ files: [] });
		setPreviews([]);
	};

	const handleClose = () => {
		reset();
		onClose();
	};

	const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const files = Array.from(e.target.files ?? []);
		setStep3({ files });
		setPreviews(files.map((f) => URL.createObjectURL(f)));
	};

	const handleRemoveFile = (index: number) => {
		const newFiles = step3.files.filter((_, i) => i !== index);
		const newPreviews = previews.filter((_, i) => i !== index);
		setStep3({ files: newFiles });
		setPreviews(newPreviews);
	};

	const handleSubmit = async () => {
		setLoading(true);

		try {
			// 1. Create listing
			const listing = await runApi((api) =>
				api.createListing({
					title: step1.title,
					description: step1.description,
					price: step1.price,
					rooms: step1.rooms,
					furnished: step1.furnished,
					latitude: step2?.latitude ?? 0,
					longitude: step2?.longitude ?? 0,
					address: step2.address,
				}),
			);

			// 2. Upload images
			if (step3.files.length > 0) {
				await Promise.all(
					step3.files.map((file, index) =>
						runApi((api) =>
							api.uploadListingMedia((listing as any).id, file, index),
						),
					),
				);
			}

			toast.success("Listing published successfully!");
			reset();
			onSuccess();
			onClose();
		} catch (e) {
			toast.error("Something went wrong while publishing. Please try again.");
			console.error(e);
		} finally {
			setLoading(false);
		}
	};

	const validateStep1 = () => {
		return (
			step1.title.length >= 3 &&
			step1.description.length >= 10 &&
			step1.price.length > 0 &&
			step1.rooms > 0
		);
	};

	const validateStep2 = () => {
		return step2.address.length > 0;
	};

	const geocodeAddress = async (address: string) => {
		if (!address.trim()) return;

		try {
			const res = await fetch(
				`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1`,
			);
			const data = await res.json();
			if (data.length > 0) {
				const { lat, lon } = data[0];
				setStep2((prev) => ({
					...prev,
					latitude: parseFloat(lat),
					longitude: parseFloat(lon),
				}));
			}
		} catch (e) {
			console.error("Geocoding failed:", e);
		}
	};

	return (
		<Dialog open={open} onOpenChange={handleClose}>
			<DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
				<DialogHeader>
					<div className="flex items-center justify-between">
						<DialogTitle className="text-lg font-semibold">
							{step === 1 && "Basic information"}
							{step === 2 && "Where is the property?"}
							{step === 3 && "Add photos"}
						</DialogTitle>
					</div>
					<p className="text-sm text-gray-500">
						{step === 1 && "Tell us about your property"}
						{step === 2 && "Drop a pin on the exact location"}
						{step === 3 && "Photos help tenants visualize the space"}
					</p>
				</DialogHeader>

				{/* Progress steps */}
				<div className="flex gap-2 mb-6">
					{[1, 2, 3].map((s) => (
						<div
							key={s}
							className={`flex-1 h-1 rounded-full transition-colors ${
								s <= step ? "bg-[#E8442A]" : "bg-gray-200"
							}`}
						/>
					))}
				</div>

				{/* Step 1 — Basic info */}
				{step === 1 && (
					<div className="space-y-4">
						<div className="space-y-2">
							<Label>Title</Label>
							<Input
								placeholder="e.g. 3 Bedroom Flat in Lekki Phase 1"
								value={step1.title}
								onChange={(e) =>
									setStep1({
										...step1,
										title: e.target.value,
									})
								}
							/>
						</div>

						<div className="space-y-2">
							<Label>Description</Label>
							<Textarea
								placeholder="Describe the property — features, nearby landmarks, etc."
								rows={4}
								value={step1.description}
								onChange={(e) =>
									setStep1({
										...step1,
										description: e.target.value,
									})
								}
							/>
						</div>

						<div className="grid grid-cols-2 gap-4">
							<div className="space-y-2">
								<Label>Price (₦/year)</Label>
								<Input
									type="number"
									placeholder="e.g. 1500000"
									value={step1.price}
									onChange={(e) =>
										setStep1({
											...step1,
											price: e.target.value,
										})
									}
								/>
							</div>
							<div className="space-y-2">
								<Label>Bedrooms</Label>
								<Input
									type="number"
									min={0}
									max={20}
									value={step1.rooms}
									onChange={(e) =>
										setStep1({
											...step1,
											rooms: Number(e.target.value),
										})
									}
								/>
							</div>
						</div>

						<div className="flex items-center justify-between py-3 border-t border-gray-100">
							<div>
								<p className="text-sm font-medium text-gray-900">Furnished</p>
								<p className="text-xs text-gray-500">
									Is the property furnished?
								</p>
							</div>
							<button
								onClick={() =>
									setStep1({
										...step1,
										furnished: !step1.furnished,
									})
								}
								className={`relative w-11 h-6 rounded-full transition-colors ${
									step1.furnished ? "bg-[#E8442A]" : "bg-gray-200"
								}`}
							>
								<span
									className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
										step1.furnished ? "translate-x-5" : "translate-x-0.5"
									}`}
								/>
							</button>
						</div>
					</div>
				)}

				{/* Step 2 — Location */}
				{step === 2 && (
					<div className="space-y-4">
						<div className="space-y-2">
							<Label>Address</Label>
							<div className="flex gap-2">
								<Input
									placeholder="e.g. Chevron Drive, Lekki, Lagos"
									value={step2.address}
									onChange={(e) =>
										setStep2({ ...step2, address: e.target.value })
									}
									onKeyDown={(e) => {
										if (e.key === "Enter") {
											e.preventDefault();
											geocodeAddress(step2.address);
										}
									}}
								/>
								<Button
									type="button"
									variant="outline"
									size="sm"
									onClick={() => geocodeAddress(step2.address)}
									className="shrink-0"
								>
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
								</Button>
							</div>
							<p className="text-xs text-gray-400">
								Type address then press Enter or click search to pin location
							</p>
						</div>
						<div className="rounded-xl overflow-hidden border border-gray-200 h-60">
							<MapView
								latitude={step2.latitude ?? DEFAULT_LAGOS.latitude}
								longitude={step2.longitude ?? DEFAULT_LAGOS.longitude}
								address={step2.address}
								draggable
								onPositionChange={(lat, lng) => {
									setStep2((prev) => ({
										...prev,
										latitude: lat,
										longitude: lng,
									}));
								}}
							/>
						</div>

						<div className="grid grid-cols-2 gap-4">
							<div className="space-y-1">
								<Label className="text-xs text-gray-500">Latitude (auto)</Label>
								<Input
									value={(step2.latitude ?? DEFAULT_LAGOS.latitude).toFixed(6)}
									readOnly
									className="text-sm text-gray-500 bg-gray-50"
								/>
							</div>
							<div className="space-y-1">
								<Label className="text-xs text-gray-500">
									Longitude (auto)
								</Label>
								<Input
									value={(step2.longitude ?? DEFAULT_LAGOS.longitude).toFixed(
										6,
									)}
									readOnly
									className="text-sm text-gray-500 bg-gray-50"
								/>
							</div>
						</div>

						<p className="text-xs text-gray-400 flex items-center gap-1">
							<MapPin className="w-3 h-3" />
							Drag the pin to set the exact location
						</p>
					</div>
				)}

				{/* Step 3 — Photos */}
				{step === 3 && (
					<div className="space-y-4">
						<label className="block">
							<div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center cursor-pointer hover:border-gray-300 transition-colors">
								<Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
								<p className="text-sm font-medium text-gray-600">
									Click to upload photos
								</p>
								<p className="text-xs text-gray-400 mt-1">
									PNG, JPG up to 10MB each
								</p>
								<input
									type="file"
									multiple
									accept="image/*"
									className="hidden"
									onChange={handleFileChange}
								/>
							</div>
						</label>

						{previews.length > 0 && (
							<div className="grid grid-cols-3 gap-2">
								{previews.map((preview, index) => (
									<div
										key={index}
										className="relative aspect-square rounded-lg overflow-hidden"
									>
										<img
											src={preview}
											alt={`Preview ${index + 1}`}
											className="w-full h-full object-cover"
										/>
										{index === 0 && (
											<div className="absolute bottom-1 left-1 bg-black/60 text-white text-xs px-1.5 py-0.5 rounded">
												Cover
											</div>
										)}
										<button
											onClick={() => handleRemoveFile(index)}
											className="absolute top-1 right-1 w-5 h-5 bg-black/60 rounded-full flex items-center justify-center"
										>
											<X className="w-3 h-3 text-white" />
										</button>
									</div>
								))}
							</div>
						)}
					</div>
				)}

				{/* Footer actions */}
				<div className="flex gap-3 mt-6 pt-4 border-t border-gray-100">
					{step > 1 && (
						<Button
							variant="outline"
							onClick={() => setStep(step - 1)}
							className="flex-1"
							disabled={loading}
						>
							Back
						</Button>
					)}

					{step < 3 ? (
						<Button
							onClick={() => setStep(step + 1)}
							disabled={
								(step === 1 && !validateStep1()) ||
								(step === 2 && !validateStep2())
							}
							className="flex-1 bg-[#E8442A] hover:bg-[#d03d25] text-white"
						>
							Next
						</Button>
					) : (
						<Button
							onClick={handleSubmit}
							disabled={loading}
							className="flex-1 bg-[#E8442A] hover:bg-[#d03d25] text-white"
						>
							{loading ? "Publishing..." : "Publish listing"}
						</Button>
					)}
				</div>
			</DialogContent>
		</Dialog>
	);
}
