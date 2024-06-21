export function generateHighResolutionData(numPoints) {
	const data = [];
	let baseTime = new Date('2018-12-22').getTime() / 1000;
	let baseValue = 50;
	const intervalSeconds = 60; // 1 minute interval for highest resolution

	for (let i = 0; i < numPoints; i++) {
		const open = Math.abs(baseValue + Math.random() * 10 - 5);
		const close = Math.abs(open + Math.random() * 10 - 5);
		const high = Math.max(open, close) + Math.random() * 5;
		const low = Math.max(0, Math.min(open, close) - Math.random() * 5);
		//@ts-ignore
		data.push({
			time: baseTime + i * intervalSeconds,
			open,
			high,
			low,
			close
		});
		baseValue = close;
	}
	return data;
}

export function aggregateData(data, interval) {
	const intervals = {
		'1m': 60,
		'5m': 300,
		'15m': 900,
		'30m': 1800,
		'1H': 3600,
		'4H': 14400,
		'1D': 86400,
		'1W': 604800,
		'1M': 2592000
	};

	const intervalSeconds = intervals[interval];
	const aggregatedData = [];
	let currentChunk = [];
	let chunkStartTime = data[0].time;

	data.forEach(point => {
		if (point.time >= chunkStartTime + intervalSeconds) {
			const open = currentChunk[0].open;
			const close = currentChunk[currentChunk.length - 1].close;
			const high = Math.max(...currentChunk.map(p => p.high));
			const low = Math.min(...currentChunk.map(p => p.low));
			//@ts-ignore
			aggregatedData.push({
				time: chunkStartTime,
				open,
				high,
				low,
				close
			});
			chunkStartTime += intervalSeconds;
			currentChunk = [];
		}
		currentChunk.push(point);
	});

	// Add the last chunk
	if (currentChunk.length) {
		const open = currentChunk[0].open;
		const close = currentChunk[currentChunk.length - 1].close;
		const high = Math.max(...currentChunk.map(p => p.high));
		const low = Math.min(...currentChunk.map(p => p.low));
		//@ts-ignore
		aggregatedData.push({
			time: chunkStartTime,
			open,
			high,
			low,
			close
		});
	}

	return aggregatedData;
}
