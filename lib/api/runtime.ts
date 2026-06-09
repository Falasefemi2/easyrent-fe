import { ManagedRuntime, Layer, Effect } from "effect";
import { ApiService, TokenStore } from "./ApiService";
import { FetchHttpClient } from "effect/unstable/http";

const AppLayer = ApiService.layer.pipe(
	Layer.provide(TokenStore.layer),
	Layer.provide(FetchHttpClient.layer),
);

export const runtime = ManagedRuntime.make(AppLayer);

export const runApi = <A>(
	effect: (api: typeof ApiService.Service) => Effect.Effect<A, unknown>,
) =>
	runtime
		.runPromise(
			Effect.gen(function* () {
				const api = yield* ApiService;
				return yield* effect(api);
			}),
		)
		.catch((e) => {
			console.error("runApi raw error:", e);
			console.error("runApi error string:", String(e));
			throw e;
		});
