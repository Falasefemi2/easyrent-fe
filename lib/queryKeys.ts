export const queryKeys = {
	listings: {
		all: ["listings"] as const,
		list: (params?: object) => ["listings", "list", params] as const,
		detail: (id: string) => ["listings", "detail", id] as const,
		mine: (params?: object) => ["listings", "mine", params] as const,
	},
	favorites: {
		all: ["favorites"] as const,
		list: (params?: object) => ["favorites", "list", params] as const,
		check: (listingId: string) => ["favorites", "check", listingId] as const,
	},
	user: {
		me: ["user", "me"] as const,
	},
};
