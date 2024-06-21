export function generateRandomData(numPoints) {
	const data = [];
	let baseTime = new Date('2018-12-22').getTime() / 1000;
	let baseValue = 50;
	for (let i = 0; i < numPoints; i++) {
		const open = Math.abs(baseValue + Math.random() * 10 - 5);
		const close = Math.abs(open + Math.random() * 10 - 5);
		const high = Math.max(open, close) + Math.random() * 5;
		const low = Math.max(0, Math.min(open, close) - Math.random() * 5); // Ensure low is not negative
		// @ts-ignore
		data.push({
			time: baseTime + i * 86400, // increment by one day
			open,
			high,
			low,
			close
		});
		baseValue = close;
	}
	return data;
}
