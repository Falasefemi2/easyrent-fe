"use client";

import { MessageCircle, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";

interface ContactLandlordModalProps {
	open: boolean;
	onClose: () => void;
	phone: string | null | undefined;
	name: string | null | undefined;
	listingTitle: string;
}

export default function ContactLandlordModal({
	open,
	onClose,
	phone,
	name,
	listingTitle,
}: ContactLandlordModalProps) {
	const whatsappUrl = phone
		? `https://wa.me/${phone.replace(/\D/g, "")}?text=${encodeURIComponent(
				`Hi, I'm interested in your property: ${listingTitle}`,
			)}`
		: null;

	const smsUrl = phone
		? `sms:${phone}?body=${encodeURIComponent(
				`Hi, I'm interested in your property: ${listingTitle}`,
			)}`
		: null;

	return (
		<Dialog open={open} onOpenChange={onClose}>
			<DialogContent className="max-w-sm">
				<DialogHeader>
					<DialogTitle>Contact landlord</DialogTitle>
				</DialogHeader>

				<div className="space-y-4 pt-2">
					{/* Landlord info */}
					<div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
						<div className="w-12 h-12 rounded-full bg-[#E8442A]/10 flex items-center justify-center">
							<span className="text-[#E8442A] font-semibold text-lg">
								{name?.charAt(0).toUpperCase() ?? "L"}
							</span>
						</div>
						<div>
							<p className="font-medium text-gray-900">{name ?? "Landlord"}</p>
							<p className="text-sm text-gray-500">
								{phone ?? "No phone available"}
							</p>
						</div>
					</div>

					{/* Actions */}
					{phone ? (
						<div className="space-y-3">
							<Button
								asChild
								className="w-full bg-[#25D366] hover:bg-[#1da851] text-white flex items-center gap-2"
							>
								<a
									href={whatsappUrl!}
									target="_blank"
									rel="noopener noreferrer"
								>
									<MessageCircle className="w-4 h-4" />
									Message on WhatsApp
								</a>
							</Button>

							<Button
								asChild
								variant="outline"
								className="w-full flex items-center gap-2"
							>
								<a href={`tel:${phone}`}>
									<Phone className="w-4 h-4" />
									Call landlord
								</a>
							</Button>
						</div>
					) : (
						<p className="text-sm text-gray-400 text-center py-4">
							No contact information available
						</p>
					)}

					<p className="text-xs text-gray-400 text-center">
						Always meet in a public place for viewings
					</p>
				</div>
			</DialogContent>
		</Dialog>
	);
}
