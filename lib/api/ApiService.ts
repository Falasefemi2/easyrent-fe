import { Context, Effect, Layer, Ref, flow, Schedule, Schema } from "effect";
import {
	HttpClient,
	HttpClientRequest,
	HttpClientResponse,
} from "effect/unstable/http";
import {
	Listing,
	type ListingWithMedia,
	type PaginatedListings,
	AuthTokens,
	type PaginatedFavorites,
	ApiError,
} from "./client";

export class TokenStore extends Context.Service<
	TokenStore,
	{
		readonly getAccessToken: Effect.Effect<string | null>;
		readonly getRefreshToken: Effect.Effect<string | null>;
		readonly setTokens: (tokens: {
			accessToken: string;
			refreshToken: string;
		}) => Effect.Effect<void>;
		readonly clearTokens: Effect.Effect<void>;
	}
>()("easyrent/TokenStore") {
	static readonly layer = Layer.effect(
		TokenStore,
		Effect.gen(function* () {
			const accessRef = yield* Ref.make<string | null>(
				typeof window !== "undefined"
					? localStorage.getItem("accessToken")
					: null,
			);
			const refreshRef = yield* Ref.make<string | null>(
				typeof window !== "undefined"
					? localStorage.getItem("refreshToken")
					: null,
			);

			return {
				getAccessToken: Ref.get(accessRef),
				getRefreshToken: Ref.get(refreshRef),

				setTokens: ({
					accessToken,
					refreshToken,
				}: {
					accessToken: string;
					refreshToken: string;
				}) =>
					Effect.gen(function* () {
						yield* Ref.set(accessRef, accessToken);
						yield* Ref.set(refreshRef, refreshToken);
						if (typeof window !== "undefined") {
							localStorage.setItem("accessToken", accessToken);
							localStorage.setItem("refreshToken", refreshToken);
							window.dispatchEvent(new Event("auth-change"));
						}
					}),

				clearTokens: Effect.gen(function* () {
					yield* Ref.set(accessRef, null);
					yield* Ref.set(refreshRef, null);
					if (typeof window !== "undefined") {
						localStorage.removeItem("accessToken");
						localStorage.removeItem("refreshToken");
						window.dispatchEvent(new Event("auth-change"));
					}
				}),
			};
		}),
	);
}

export class ApiService extends Context.Service<
	ApiService,
	{
		readonly signUp: (params: {
			email: string;
			password: string;
			fullname: string;
			phone: string;
		}) => Effect.Effect<AuthTokens, ApiError>;

		readonly signIn: (params: {
			email: string;
			password: string;
		}) => Effect.Effect<AuthTokens, ApiError>;

		readonly signOut: () => Effect.Effect<void, ApiError>;

		readonly getListings: (params?: {
			page?: number;
			limit?: number;
			status?: string;
			furnished?: boolean;
			minRooms?: number;
			rooms?: number;
			search?: string;
		}) => Effect.Effect<PaginatedListings, ApiError>;

		readonly getListingById: (
			id: string,
		) => Effect.Effect<ListingWithMedia, ApiError>;

		readonly createListing: (params: {
			title: string;
			description: string;
			price: string;
			rooms: number;
			furnished: boolean;
			latitude: number;
			longitude: number;
			address: string;
		}) => Effect.Effect<Listing, ApiError>;

		readonly updateListing: (
			id: string,
			params: Partial<{
				title: string;
				description: string;
				price: string;
				rooms: number;
				furnished: boolean;
				latitude: number;
				longitude: number;
				address: string;
			}>,
		) => Effect.Effect<Listing, ApiError>;

		readonly deleteListing: (id: string) => Effect.Effect<void, ApiError>;

		readonly getMyListings: (params?: {
			page?: number;
			limit?: number;
		}) => Effect.Effect<PaginatedListings, ApiError>;

		readonly uploadListingMedia: (
			listingId: string,
			file: File,
			order?: number,
		) => Effect.Effect<
			{
				id: string;
				url: string;
				type: string;
				order: number;
			},
			ApiError
		>;

		readonly addFavorite: (listingId: string) => Effect.Effect<void, ApiError>;

		readonly removeFavorite: (
			listingId: string,
		) => Effect.Effect<void, ApiError>;

		readonly getMyFavorites: (params?: {
			page?: number;
			limit?: number;
		}) => Effect.Effect<PaginatedFavorites, ApiError>;

		readonly checkFavorite: (
			listingId: string,
		) => Effect.Effect<boolean, ApiError>;

		readonly uploadAvatar: (
			file: File,
		) => Effect.Effect<{ avatarUrl: string }, ApiError>;
		readonly getMe: () => Effect.Effect<
			{
				id: string;
				email: string;
				fullname: string;
				phone: string;
				avatarUrl: string | null;
				createdAt: string;
			},
			ApiError
		>;
	}
>()("easyrent/ApiService") {
	static readonly layer = Layer.effect(
		ApiService,
		Effect.gen(function* () {
			const tokenStore = yield* TokenStore;

			const BASE_URL =
				process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";

			const baseClient = (yield* HttpClient.HttpClient).pipe(
				HttpClient.mapRequest(
					flow(
						HttpClientRequest.prependUrl(BASE_URL),
						HttpClientRequest.acceptJson,
					),
				),
				HttpClient.retryTransient({
					schedule: Schedule.exponential(100),
					times: 3,
				}),
			);

			const mapError = (cause: unknown): ApiError =>
				new ApiError({
					message: String(cause),
					status: 500,
				});

			const isUnauthorized = (e: unknown): boolean => {
				const msg = String(e);
				return msg.includes("401") || msg.includes("Unauthorized");
			};

			// Refresh token and return new access token
			const doRefresh = (): Effect.Effect<string, ApiError> =>
				Effect.gen(function* () {
					const refreshToken = yield* tokenStore.getRefreshToken;
					if (!refreshToken) {
						return yield* Effect.fail(
							new ApiError({
								message: "No refresh token",
								status: 401,
							}),
						);
					}

					const tokens = yield* HttpClientRequest.post("/auth/refresh").pipe(
						HttpClientRequest.bodyJsonUnsafe({
							refreshToken,
						}),
						baseClient.execute,
						Effect.flatMap(HttpClientResponse.schemaBodyJson(AuthTokens)),
						Effect.mapError(mapError),
					);

					yield* tokenStore.setTokens(tokens);
					return tokens.accessToken;
				});

			// Attach token to client and retry once on 401
			const makeAuthRequest = <A, E>(
				buildRequest: (client: typeof baseClient) => Effect.Effect<A, E>,
			): Effect.Effect<A, E | ApiError> =>
				Effect.gen(function* () {
					const token = yield* tokenStore.getAccessToken;

					const withToken = (t: string | null) =>
						baseClient.pipe(
							HttpClient.mapRequest(
								t
									? HttpClientRequest.setHeader("Authorization", `Bearer ${t}`)
									: (req) => req,
							),
						);

					return yield* buildRequest(withToken(token)).pipe(
						Effect.catchIf(isUnauthorized, () =>
							Effect.gen(function* () {
								const newToken = yield* doRefresh();
								return yield* buildRequest(withToken(newToken));
							}),
						),
					);
				});

			const signIn = Effect.fn("ApiService.signIn")(
				(params: {
					email: string;
					password: string;
				}): Effect.Effect<AuthTokens, ApiError> =>
					Effect.gen(function* () {
						const response = yield* HttpClientRequest.post(
							"/auth/sign-in",
						).pipe(
							HttpClientRequest.bodyJsonUnsafe(params),
							baseClient.execute,
							Effect.flatMap(HttpClientResponse.schemaBodyJson(AuthTokens)),
							Effect.mapError(mapError),
						);
						yield* tokenStore.setTokens(response);
						return response;
					}),
			);

			const signUp = Effect.fn("ApiService.signUp")(
				(params: {
					email: string;
					password: string;
					fullname: string;
					phone: string;
				}): Effect.Effect<AuthTokens, ApiError> =>
					Effect.gen(function* () {
						const response = yield* HttpClientRequest.post(
							"/auth/sign-up",
						).pipe(
							HttpClientRequest.bodyJsonUnsafe(params),
							baseClient.execute,
							Effect.flatMap(HttpClientResponse.schemaBodyJson(AuthTokens)),
							Effect.mapError(mapError),
						);
						yield* tokenStore.setTokens(response);
						return response;
					}),
			);

			const signOut = Effect.fn("ApiService.signOut")(
				(): Effect.Effect<void, ApiError> =>
					Effect.gen(function* () {
						const token = yield* tokenStore.getRefreshToken;
						if (token) {
							yield* HttpClientRequest.post("/auth/sign-out").pipe(
								HttpClientRequest.bodyJsonUnsafe({
									refreshToken: token,
								}),
								baseClient.execute,
								Effect.mapError(mapError),
							);
						}
						yield* tokenStore.clearTokens;
					}),
			);

			const getListings = Effect.fn("ApiService.getListings")(
				(params?: {
					page?: number;
					limit?: number;
					status?: string;
					furnished?: boolean;
					rooms?: number;
					minRooms?: number;
					search?: string;
				}): Effect.Effect<PaginatedListings, ApiError> => {
					const urlParams: Record<string, string> = {
						page: String(params?.page ?? 1),
						limit: String(params?.limit ?? 10),
					};

					if (params?.status) urlParams.status = params.status;
					if (params?.furnished !== undefined)
						urlParams.furnished = String(params.furnished);
					if (params?.rooms !== undefined)
						urlParams.rooms = String(params.rooms);
					if (params?.minRooms !== undefined)
						urlParams.minRooms = String(params.minRooms);
					if (params?.search) urlParams.search = params.search;

					return baseClient.get("/listings", { urlParams }).pipe(
						Effect.flatMap((response) => response.json),
						Effect.map((json) => json as unknown as PaginatedListings),
						Effect.mapError(mapError),
					);
				},
			);

			const getListingById = Effect.fn("ApiService.getListingById")(
				(id: string): Effect.Effect<ListingWithMedia, ApiError> =>
					baseClient.get(`/listings/${id}`).pipe(
						Effect.flatMap((response) => response.json),
						Effect.map((json) => json as unknown as ListingWithMedia),
						Effect.mapError(mapError),
					),
			);

			const createListing = Effect.fn("ApiService.createListing")(
				(params: {
					title: string;
					description: string;
					price: string;
					rooms: number;
					furnished: boolean;
					latitude: number;
					longitude: number;
					address: string;
				}): Effect.Effect<Listing, ApiError> =>
					makeAuthRequest((client) =>
						HttpClientRequest.post("/listings").pipe(
							HttpClientRequest.bodyJsonUnsafe(params),
							client.execute,
							Effect.flatMap(HttpClientResponse.schemaBodyJson(Listing)),
							Effect.mapError(mapError),
						),
					),
			);

			const updateListing = Effect.fn("ApiService.updateListing")(
				(
					id: string,
					params: Partial<{
						title: string;
						description: string;
						price: string;
						rooms: number;
						furnished: boolean;
						latitude: number;
						longitude: number;
						address: string;
					}>,
				): Effect.Effect<Listing, ApiError> =>
					makeAuthRequest((client) =>
						HttpClientRequest.patch(`/listings/${id}`).pipe(
							HttpClientRequest.bodyJsonUnsafe(params),
							client.execute,
							Effect.flatMap(HttpClientResponse.schemaBodyJson(Listing)),
							Effect.mapError(mapError),
						),
					),
			);

			const deleteListing = Effect.fn("ApiService.deleteListing")(
				(id: string): Effect.Effect<void, ApiError> =>
					makeAuthRequest((client) =>
						HttpClientRequest.delete(`/listings/${id}`).pipe(
							client.execute,
							Effect.asVoid,
							Effect.mapError(mapError),
						),
					),
			);

			const getMyListings = Effect.fn("ApiService.getMyListings")(
				(params?: {
					page?: number;
					limit?: number;
				}): Effect.Effect<PaginatedListings, ApiError> =>
					makeAuthRequest((client) =>
						client
							.get("/listings/my", {
								urlParams: {
									page: String(params?.page ?? 1),
									limit: String(params?.limit ?? 10),
								},
							})
							.pipe(
								Effect.flatMap((response) => response.json),
								Effect.map((json) => json as unknown as PaginatedFavorites),
								Effect.mapError(mapError),
							),
					),
			);

			const uploadListingMedia = Effect.fn("ApiService.uploadListingMedia")(
				(
					listingId: string,
					file: File,
					order = 0,
				): Effect.Effect<
					{
						id: string;
						url: string;
						type: string;
						order: number;
					},
					ApiError
				> =>
					makeAuthRequest((client) =>
						Effect.gen(function* () {
							const formData = new FormData();
							formData.append("file", file);
							formData.append("type", "image");
							formData.append("order", String(order));

							return yield* HttpClientRequest.post(
								`/listings/${listingId}/media`,
							).pipe(
								HttpClientRequest.bodyFormData(formData),
								client.execute,
								Effect.flatMap(
									HttpClientResponse.schemaBodyJson(
										Schema.Struct({
											id: Schema.String,
											url: Schema.String,
											type: Schema.String,
											order: Schema.Number,
										}),
									),
								),
								Effect.mapError(mapError),
							);
						}),
					),
			);

			const addFavorite = Effect.fn("ApiService.addFavorite")(
				(listingId: string): Effect.Effect<void, ApiError> =>
					makeAuthRequest((client) =>
						HttpClientRequest.post(`/favorites/${listingId}`).pipe(
							client.execute,
							Effect.asVoid,
							Effect.mapError(mapError),
						),
					),
			);

			const removeFavorite = Effect.fn("ApiService.removeFavorite")(
				(listingId: string): Effect.Effect<void, ApiError> =>
					makeAuthRequest((client) =>
						HttpClientRequest.delete(`/favorites/${listingId}`).pipe(
							client.execute,
							Effect.asVoid,
							Effect.mapError(mapError),
						),
					),
			);

			const getMyFavorites = Effect.fn("ApiService.getMyFavorites")(
				(params?: {
					page?: number;
					limit?: number;
				}): Effect.Effect<PaginatedFavorites, ApiError> =>
					makeAuthRequest((client) =>
						client
							.get("/favorites", {
								urlParams: {
									page: String(params?.page ?? 1),
									limit: String(params?.limit ?? 10),
								},
							})
							.pipe(
								Effect.flatMap((response) => response.json),
								Effect.map((json) => json as unknown as PaginatedFavorites),
								Effect.mapError(mapError),
							),
					),
			);

			const checkFavorite = Effect.fn("ApiService.checkFavorite")(
				(listingId: string): Effect.Effect<boolean, ApiError> =>
					makeAuthRequest((client) =>
						client.get(`/favorites/${listingId}/check`).pipe(
							Effect.flatMap(
								HttpClientResponse.schemaBodyJson(
									Schema.Struct({
										favorited: Schema.Boolean,
									}),
								),
							),
							Effect.map((r) => r.favorited),
							Effect.mapError(mapError),
						),
					),
			);

			const uploadAvatar = Effect.fn("ApiService.uploadAvatar")(
				(file: File): Effect.Effect<{ avatarUrl: string }, ApiError> =>
					makeAuthRequest((client) =>
						Effect.gen(function* () {
							const formData = new FormData();
							formData.append("file", file);

							const response = yield* HttpClientRequest.post(
								"/users/avatar",
							).pipe(HttpClientRequest.bodyFormData(formData), client.execute);

							// Parse manually to avoid schema issues
							const json = yield* response.json;
							return json as {
								avatarUrl: string;
							};
						}).pipe(Effect.mapError(mapError)),
					),
			);
			const getMe = Effect.fn("ApiService.getMe")(
				(): Effect.Effect<
					{
						id: string;
						email: string;
						fullname: string;
						phone: string;
						avatarUrl: string | null;
						createdAt: string;
					},
					ApiError
				> =>
					makeAuthRequest((client) =>
						client.get("/users/me").pipe(
							Effect.flatMap((response) => response.json),
							Effect.map((json) => json as any),
							Effect.mapError(mapError),
						),
					),
			);

			return ApiService.of({
				signUp,
				signIn,
				signOut,
				getListings,
				getListingById,
				createListing,
				updateListing,
				deleteListing,
				getMyListings,
				uploadListingMedia,
				addFavorite,
				removeFavorite,
				getMyFavorites,
				checkFavorite,
				uploadAvatar,
				getMe,
			});
		}),
	).pipe(Layer.provide(TokenStore.layer));
}
