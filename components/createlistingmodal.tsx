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
import { X, Upload, MapPin, ChevronLeft, ChevronRight } from "lucide-react";
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
		previews.forEach((url) => URL.revokeObjectURL(url));
		setPreviews([]);
	};

	const handleClose = () => {
		reset();
		onClose();
	};

	const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const newFiles = Array.from(e.target.files ?? []);
		setStep3((prev) => ({ files: [...prev.files, ...newFiles] }));
		setPreviews((prev) => [
			...prev,
			...newFiles.map((f) => URL.createObjectURL(f)),
		]);
	};

	const moveFile = (index: number, direction: "up" | "down") => {
		const newIndex = direction === "up" ? index - 1 : index + 1;
		if (newIndex < 0 || newIndex >= step3.files.length) return;

		const files = [...step3.files];
		const previewsCopy = [...previews];

		[files[index], files[newIndex]] = [files[newIndex], files[index]];
		[previewsCopy[index], previewsCopy[newIndex]] = [
			previewsCopy[newIndex],
			previewsCopy[index],
		];

		setStep3({ files });
		setPreviews(previewsCopy);
	};

	const handleRemoveFile = (index: number) => {
		URL.revokeObjectURL(previews[index]);
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

						<div
							className={`flex items-center justify-between p-4 rounded-xl border transition-all duration-300 ${
								step1.furnished
									? "bg-[#E8442A] border-[#E8442A] shadow-md shadow-[#E8442A]/20"
									: "bg-gray-50 border-gray-100"
							}`}
						>
							<div>
								<p
									className={`text-sm font-bold transition-colors ${
										step1.furnished ? "text-white" : "text-gray-900"
									}`}
								>
									Furnished
								</p>
								<p
									className={`text-xs transition-colors ${
										step1.furnished ? "text-white/80" : "text-gray-500"
									}`}
								>
									Is the property furnished?
								</p>
							</div>
							<button
								type="button"
								onClick={() =>
									setStep1({
										...step1,
										furnished: !step1.furnished,
									})
								}
								className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 transition-colors duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
									step1.furnished
										? "bg-white border-white focus-visible:ring-white"
										: "bg-gray-200 border-transparent focus-visible:ring-[#E8442A]"
								}`}
							>
								<span
									className={`pointer-events-none block h-5 w-5 rounded-full shadow-md transition-transform duration-300 ${
										step1.furnished
											? "translate-x-5 bg-[#E8442A]"
											: "translate-x-0 bg-white"
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
									PNG, JPG up to 10MB each. Select multiple photos to upload.
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
							<div className="grid grid-cols-2 gap-3">
								{previews.map((preview, index) => (
									<div
										key={index}
										className="group relative aspect-video rounded-xl overflow-hidden border border-gray-100 bg-gray-50"
									>
										<img
											src={preview}
											alt={`Preview ${index + 1}`}
											className="w-full h-full object-cover"
										/>
										
										{/* Badge for cover photo */}
										{index === 0 && (
											<div className="absolute top-2 left-2 bg-[#E8442A] text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm uppercase tracking-wider">
												Cover
											</div>
										)}

										{/* Controls overlay */}
										<div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
											{index > 0 && (
												<button
													onClick={() => moveFile(index, "up")}
													className="p-1.5 bg-white rounded-full hover:bg-gray-100 transition-colors"
													title="Move earlier"
												>
													<ChevronLeft className="w-4 h-4 text-gray-900" />
												</button>
											)}
											{index < previews.length - 1 && (
												<button
													onClick={() => moveFile(index, "down")}
													className="p-1.5 bg-white rounded-full hover:bg-gray-100 transition-colors"
													title="Move later"
												>
													<ChevronRight className="w-4 h-4 text-gray-900" />
												</button>
											)}
											<button
												onClick={() => handleRemoveFile(index)}
												className="p-1.5 bg-white rounded-full hover:bg-red-50 transition-colors group/delete"
												title="Remove photo"
											>
												<X className="w-4 h-4 text-gray-900 group-hover/delete:text-red-500" />
											</button>
										</div>

										{/* Order badge */}
										<div className="absolute bottom-2 right-2 bg-black/60 text-white text-[10px] px-2 py-0.5 rounded-full">
											{index + 1}
										</div>
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
