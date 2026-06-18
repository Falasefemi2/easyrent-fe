export interface ListingMedia {
	id: string;
	listingId: string;
	url: string;
	type: "image" | "video";
	order: number;
	createdAt: string;
}

export interface Listing {
	id: string;
	landlordId: string;
	title: string;
	description: string;
	price: string;
	rooms: number | null;
	furnished: boolean;
	status: "avaiable" | "rented" | "inative" | null;
	address: string;
	createdAt: string;
	updatedAt: string;
	favoriteCount: number;
	latitude?: number | null;
	longitude?: number | null;
	coverImage: string | null;
}

export interface ListingWithMedia extends Listing {
	media: readonly ListingMedia[];
	landlordPhone?: string | null;
	landlordName?: string | null;
}

export interface PaginatedResponse<T> {
	data: T[];
	total: number;
	page: number;
	limit: number;
	totalPages: number;
}

export interface AuthTokens {
	accessToken: string;
	refreshToken: string;
}

export interface FavoriteListing extends Listing {
	media: readonly ListingMedia[];
	favoritedAt: string;
}

