export function splitRateStringToNumDenom(sellRate: string): [bigint, bigint] {
	const [integerPart, decimalPart = ''] = sellRate.split('.');
	const trimmedDecimal = decimalPart.replace(/0+$/, '');
	const exponent = trimmedDecimal.length;
	return [BigInt(integerPart + trimmedDecimal), 10n ** BigInt(exponent)];
}
