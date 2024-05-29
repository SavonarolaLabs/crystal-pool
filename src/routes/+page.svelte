<script lang="ts">
	import io from 'socket.io-client';
	import { writable } from 'svelte/store';

	const socket = io('http://127.0.0.1:3000'); // Ensure this URL matches your server

	// Define a reactive store for the list of received data
	const receivedDataList = writable([]);

	socket.on('connect', () => {
		console.log('Connected to the server:', socket.id);
	});

	// Listen for updates and add the new data to the list
	socket.on('update', (data) => {
		console.log('Received update:', data);
		receivedDataList.update((list) => [...list, data]);
	});

	// Example: Join a room
	function joinRoom(room: string) {
		socket.emit('join', room);
	}

	// Example: Emit an event
	function emitExampleEvent() {
		socket.emit('exampleEvent', { message: 'Hello from the client!' });
	}
</script>

<button on:click={() => joinRoom('room1')}>Join Room 1</button>
<button on:click={emitExampleEvent}>Emit Example Event</button>

<h2>Received Data</h2>
<ul>
	{#each $receivedDataList as data, index}
		<li>
			<pre>{JSON.stringify(data, null, 2)}</pre>
		</li>
	{/each}
</ul>

<style lang="postcss">
	:root {
		background-color: var(--bg-level-primary);
	}
	pre {
		background: #f0f0f0;
		padding: 10px;
		border: 1px solid #ccc;
		border-radius: 4px;
	}
	ul {
		list-style-type: none;
		padding: 0;
	}
	li {
		margin-bottom: 10px;
	}
</style>
