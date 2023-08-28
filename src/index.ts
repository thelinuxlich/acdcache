import { createCache as cc, type Cache } from "async-cache-dedupe";
import { assert } from "vitest";
type References = string | string[];

type Definition = [
	string,
	{
		references: (
			// rome-ignore lint/suspicious/noExplicitAny: needs any in this case
			args: any,
			key: string,
			// rome-ignore lint/suspicious/noExplicitAny: needs any in this case
			result: any,
		) => References | Promise<References>;
	},
	// rome-ignore lint/suspicious/noExplicitAny: needs any in this case
	(...args: any) => any,
];

type cacheOptions = Parameters<typeof cc>[0];
// rome-ignore lint/suspicious/noExplicitAny: needs any in this case
export const def = <N extends string, T extends (...args: any[]) => any>(
	name: N,
	fn: T,
	references: (
		args: Parameters<T>,
		key: string,
		result: Awaited<ReturnType<T>>,
	) => References | Promise<References>,
) => {
	return [name, { references }, fn] as [
		N,
		{ references: typeof references },
		T,
	];
};
export const createCache = <T extends Definition[]>(
	options: cacheOptions,
	definitions: T,
) => {
	const cache = cc(options);
	for (const [name, { references }, fn] of definitions) {
		cache.define(name, { references }, fn);
	}
	return cache as Cache & {
		[K in T[number] as K[0]]: (...args: Parameters<K[2]>) => ReturnType<K[2]>;
	};
};

if (import.meta.vitest) {
	const { it, expectTypeOf, expect, assertType } = import.meta.vitest;
	it("Should have the dynamic cache methods and only one cache miss", async () => {
		let missedCache = 0;
		const getBankAccount = async (bank_account_id: string) => {
			const result = await bank_account_id; // this would be some call to the DB by ID
			missedCache++;
			return result;
		};
		const definitions = [
			def("getBankAccount", getBankAccount, (_args, _key, result) => [result]), // will save as the ID in cache reference
		];
		const cache = createCache(
			{
				ttl: 60 * 60 * 24,
			},
			definitions,
		);
		expectTypeOf(cache.getBankAccount).toBeFunction();
		assertType<(bank_account_id: string) => Promise<string>>(
			cache.getBankAccount,
		);
		expect(await cache.getBankAccount("123")).toBe("123");
		expect(await cache.getBankAccount("123")).toBe("123");
		expect(missedCache).toBe(1);
	});
}
