import { Effect } from "effect";
import { Schema } from "effect";
import { TokenStore } from "./ApiService";
import {
	HttpClientRequest,
	HttpClientResponse,
	type HttpClient,
} from "effect/unstable/http";

const TokensSchema = Schema.Struct({
	accessToken: Schema.String,
	refreshToken: Schema.String,
});

export const refreshAccessToken = (baseClient: HttpClient.HttpClient) =>
	Effect.gen(function* () {
		const tokenStore = yield* TokenStore;
		const refreshToken = yield* tokenStore.getRefreshToken;

		if (!refreshToken) {
			return yield* Effect.fail(new Error("No refresh token available"));
		}

		const tokens = yield* HttpClientRequest.post("/auth/refresh").pipe(
			HttpClientRequest.bodyJsonUnsafe({ refreshToken }),
			baseClient.execute,
			Effect.flatMap(HttpClientResponse.schemaBodyJson(TokensSchema)),
			Effect.mapError(() => new Error("Token refresh failed")),
		);

		yield* tokenStore.setTokens(tokens);
		return tokens.accessToken;
	});
