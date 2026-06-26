"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, MapPin, Upload, X } from "lucide-react";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { runApi } from "@/lib/api/runtime";
import { queryKeys } from "@/lib/queryKeys";
import type { ListingWithMedia } from "@/lib/types";

const MapView = dynamic(() => import("./MapView"), { ssr: false });

interface EditListingModalProps {
	open: boolean;
	onClose: () => void;
	listing: ListingWithMedia;
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
	newFiles: File[];
}

const DEFAULT_LAGOS = { latitude: 6.5244, longitude: 3.3792 };

export default function EditListingModal({
	open,
	onClose,
	listing,
	onSuccess,
}: EditListingModalProps) {
	const queryClient = useQueryClient();
	const [step, setStep] = useState(1);

	const [step1, setStep1] = useState<Step1Data>({
		title: listing.title,
		description: listing.description,
		price: listing.price,
		rooms: listing.rooms ?? 1,
		furnished: listing.furnished,
	});

	const [step2, setStep2] = useState<Step2Data>({
		address: listing.address,
		latitude: listing.latitude ?? null,
		longitude: listing.longitude ?? null,
	});

	const [step3, setStep3] = useState<Step3Data>({ newFiles: [] });
	const [previews, setPreviews] = useState<
		{ url: string; type: "image" | "video" }[]
	>([]);

	// Reset form when listing changes
	useEffect(() => {
		if (open) {
			setStep(1);
			setStep1({
				title: listing.title,
				description: listing.description,
				price: listing.price,
				rooms: listing.rooms ?? 1,
				furnished: listing.furnished,
			});
			setStep2({
				address: listing.address,
				latitude: listing.latitude ?? null,
				longitude: listing.longitude ?? null,
			});
			setStep3({ newFiles: [] });
			previews.forEach((p) => URL.revokeObjectURL(p.url));
			setPreviews([]);
		}
	}, [listing, open]);

	const handleClose = () => {
		previews.forEach((p) => URL.revokeObjectURL(p.url));
		setPreviews([]);
		setStep3({ newFiles: [] });
		setStep(1);
		onClose();
	};

	const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const newFiles = Array.from(e.target.files ?? []);
		setStep3((prev) => ({ newFiles: [...prev.newFiles, ...newFiles] }));

		const newPreviews: { url: string; type: "image" | "video" }[] =
			newFiles.map((f) => ({
				url: URL.createObjectURL(f),
				type: f.type.startsWith("video/") ? "video" : ("image" as const),
			}));

		setPreviews((prev) => [...prev, ...newPreviews]);
	};

	const moveFile = (index: number, direction: "up" | "down") => {
		const newIndex = direction === "up" ? index - 1 : index + 1;
		if (newIndex < 0 || newIndex >= step3.newFiles.length) return;

		const files = [...step3.newFiles];
		const previewsCopy = [...previews];

		[files[index], files[newIndex]] = [files[newIndex], files[index]];
		[previewsCopy[index], previewsCopy[newIndex]] = [
			previewsCopy[newIndex],
			previewsCopy[index],
		];

		setStep3({ newFiles: files });
		setPreviews(previewsCopy);
	};

	const handleRemoveFile = (index: number) => {
		URL.revokeObjectURL(previews[index].url);
		const newFiles = step3.newFiles.filter((_, i) => i !== index);
		const newPreviews = previews.filter((_, i) => i !== index);
		setStep3({ newFiles });
		setPreviews(newPreviews);
	};

	const editListingMutation = useMutation({
		mutationFn: async () => {
			// 1. Update listing details
			await runApi((api) =>
				api.updateListing(listing.id, {
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

			// 2. Upload any new images
			if (step3.newFiles.length > 0) {
				// Start order after existing media
				const startOrder = listing.media.length;
				await Promise.all(
					step3.newFiles.map((file, index) =>
						runApi((api) =>
							api.uploadListingMedia(listing.id, file, startOrder + index),
						),
					),
				);
			}
		},
		onSuccess: () => {
			toast.success("Listing updated successfully!");
			queryClient.invalidateQueries({ queryKey: queryKeys.listings.all });
			queryClient.invalidateQueries({
				queryKey: queryKeys.listings.detail(listing.id),
			});
			handleClose();
			onSuccess();
		},
		onError: (e) => {
			toast.error("Something went wrong while updating. Please try again.");
			console.error(e);
		},
	});

	const handleSubmit = () => {
		editListingMutation.mutate();
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
							{step === 1 && "Edit basic information"}
							{step === 2 && "Edit location"}
							{step === 3 && "Add photos"}
						</DialogTitle>
					</div>
					<p className="text-sm text-gray-500">
						{step === 1 && "Update the details about your property"}
						{step === 2 && "Update the location of your property"}
						{step === 3 && "Add new photos to your listing"}
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

				{/* Existing images preview */}
				{step === 3 && listing.media.length > 0 && (
					<div className="mb-4">
						<p className="text-xs font-medium text-gray-500 mb-2 uppercase tracking-wider">
							Existing photos ({listing.media.length})
						</p>
						<div className="grid grid-cols-4 gap-2">
							{listing.media
								.filter((m) => m.type === "image")
								.map((media) => (
									<div
										key={media.id}
										className="relative aspect-square rounded-lg overflow-hidden bg-gray-100"
									>
										<img
											src={media.url}
											alt="Existing"
											className="w-full h-full object-cover"
										/>
									</div>
								))}
						</div>
					</div>
				)}

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
									Click to add photos
								</p>
								<p className="text-xs text-gray-400 mt-1">
									PNG, JPG up to 10MB each. Select multiple photos to upload.
								</p>
								<input
									type="file"
									multiple
									accept="image/*,video/*"
									className="hidden"
									onChange={handleFileChange}
								/>
							</div>
						</label>

						{previews.length > 0 && (
							<>
								<p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
									New photos ({previews.length})
								</p>
								<div className="grid grid-cols-2 gap-3">
									{previews.map((preview, index) => (
										<div
											key={index}
											className="group relative aspect-video rounded-xl overflow-hidden border border-gray-100 bg-gray-50"
										>
											{preview.type === "video" ? (
												<video
													src={preview.url}
													className="w-full h-full object-cover"
													controls
													preload="metadata"
												/>
											) : (
												<img
													src={preview.url}
													alt={`Preview ${index + 1}`}
													className="w-full h-full object-cover"
												/>
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

											<div className="absolute bottom-2 right-2 bg-black/60 text-white text-[10px] px-2 py-0.5 rounded-full">
												{index + 1}
											</div>
										</div>
									))}
								</div>
							</>
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
							disabled={editListingMutation.isPending}
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
							disabled={editListingMutation.isPending}
							className="flex-1 bg-[#E8442A] hover:bg-[#d03d25] text-white"
						>
							{editListingMutation.isPending ? "Saving..." : "Save changes"}
						</Button>
					)}
				</div>
			</DialogContent>
		</Dialog>
	);
}
