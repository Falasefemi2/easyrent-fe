import { Schema } from "effect";

export class ListingMedia extends Schema.Class<ListingMedia>("ListingMedia")({
	id: Schema.String,
	listingId: Schema.String,
	url: Schema.String,
	type: Schema.Literals(["image", "video"]),
	order: Schema.Number,
	createdAt: Schema.String,
}) {}

export class Listing extends Schema.Class<Listing>("Listing")({
	id: Schema.String,
	landlordId: Schema.String,
	title: Schema.String,
	description: Schema.String,
	price: Schema.String,
	rooms: Schema.NullOr(Schema.Number),
	furnished: Schema.Boolean,
	status: Schema.NullOr(Schema.Literals(["avaiable", "rented", "inative"])),
	address: Schema.String,
	createdAt: Schema.String,
	updatedAt: Schema.String,
	favoriteCount: Schema.Number,
	latitude: Schema.NullOr(Schema.Number).pipe(Schema.optional),
	longitude: Schema.NullOr(Schema.Number).pipe(Schema.optional),
	coverImage: Schema.NullOr(Schema.String),
}) {}

export class ListingWithMedia extends Schema.Class<ListingWithMedia>(
	"ListingWithMedia",
)({
	id: Schema.String,
	landlordId: Schema.String,
	title: Schema.String,
	description: Schema.String,
	price: Schema.String,
	rooms: Schema.NullOr(Schema.Number),
	furnished: Schema.Boolean,
	status: Schema.NullOr(Schema.Literals(["avaiable", "rented", "inative"])),
	address: Schema.String,
	createdAt: Schema.String,
	updatedAt: Schema.String,
	favoriteCount: Schema.Number,
	latitude: Schema.NullOr(Schema.Number),
	longitude: Schema.NullOr(Schema.Number),
	coverImage: Schema.NullOr(Schema.String),
	media: Schema.Array(ListingMedia),
}) {}

export class PaginatedListings extends Schema.Class<PaginatedListings>(
	"PaginatedListings",
)({
	data: Schema.Array(Listing),
	total: Schema.Number,
	page: Schema.Number,
	limit: Schema.Number,
	totalPages: Schema.Number,
}) {}

export class AuthTokens extends Schema.Class<AuthTokens>("AuthTokens")({
	accessToken: Schema.String,
	refreshToken: Schema.String,
}) {}

export class FavoriteListing extends Schema.Class<FavoriteListing>(
	"FavoriteListing",
)({
	id: Schema.String,
	landlordId: Schema.String,
	title: Schema.String,
	description: Schema.String,
	price: Schema.String,
	rooms: Schema.NullOr(Schema.Number),
	furnished: Schema.Boolean,
	status: Schema.NullOr(Schema.Literals(["avaiable", "rented", "inative"])),
	address: Schema.String,
	createdAt: Schema.String,
	updatedAt: Schema.String,
	favoriteCount: Schema.Number,
	latitude: Schema.NullOr(Schema.Number),
	longitude: Schema.NullOr(Schema.Number),
	coverImage: Schema.NullOr(Schema.String),
	media: Schema.Array(
		Schema.Struct({
			id: Schema.String,
			listingId: Schema.String,
			url: Schema.String,
			type: Schema.Literals(["image", "video"]),
			order: Schema.Number,
			createdAt: Schema.String,
		}),
	),
	favoritedAt: Schema.String,
}) {}

export class PaginatedFavorites extends Schema.Class<PaginatedFavorites>(
	"PaginatedFavorites",
)({
	data: Schema.Array(FavoriteListing),
	total: Schema.Number,
	page: Schema.Number,
	limit: Schema.Number,
	totalPages: Schema.Number,
}) {}

export class ApiError extends Schema.TaggedErrorClass<ApiError>()("ApiError", {
	message: Schema.String,
	status: Schema.Number,
}) {}

export class AuthError extends Schema.TaggedErrorClass<AuthError>()(
	"AuthError",
	{ message: Schema.String },
) {}
