"use client";

import { useState } from "react";
import { runApi } from "@/lib/api/runtime";
import { toast } from "sonner";

type Status = "avaiable" | "rented" | "inative";

const STATUS_CONFIG: Record<
	Status,
	{ label: string; color: string; next: Status; nextLabel: string }
> = {
	avaiable: {
		label: "Available",
		color: "bg-green-50 text-green-700 border-green-200",
		next: "rented",
		nextLabel: "Mark as rented",
	},
	rented: {
		label: "Rented",
		color: "bg-blue-50 text-blue-700 border-blue-200",
		next: "avaiable",
		nextLabel: "Mark as available",
	},
	inative: {
		label: "Inactive",
		color: "bg-gray-50 text-gray-500 border-gray-200",
		next: "avaiable",
		nextLabel: "Reactivate",
	},
};

export default function ListingStatusBadge({
	listingId,
	initialStatus,
	onStatusChange,
}: {
	listingId: string;
	initialStatus: Status;
	onStatusChange?: (status: Status) => void;
}) {
	const [status, setStatus] = useState<Status>(initialStatus);
	const [loading, setLoading] = useState(false);
	const config = STATUS_CONFIG[status];

	const handleToggle = async (e: React.MouseEvent) => {
		e.preventDefault();
		e.stopPropagation();
		setLoading(true);
		try {
			const successMessages: Record<Status, string> = {
				avaiable: "Listing is now available",
				rented: "Listing has been marked as rented",
				inative: "Listing has been deactivated",
			};
			await runApi((api) =>
				(api as any).updateListingStatus(listingId, config.next),
			);
			setStatus(config.next);
			onStatusChange?.(config.next);
			toast.success(successMessages[config.next]);
		} catch (err) {
			console.error(err);
			toast.error("Failed to update listing status");
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="flex items-center gap-2 mt-2">
			<span
				className={`text-xs px-2 py-0.5 rounded-full border ${config.color}`}
			>
				{config.label}
			</span>
			<button
				onClick={handleToggle}
				disabled={loading}
				className="text-xs text-gray-400 hover:text-gray-600 underline transition-colors"
			>
				{loading ? "Updating..." : config.nextLabel}
			</button>
		</div>
	);
}
