<script lang="ts">
	import { onMount } from 'svelte';
	import { writable } from 'svelte/store';
  
	let socket;
	const receivedDataList = writable([]);
  
	onMount(() => {
	  socket = new WebSocket('ws://127.0.0.1:3000/ws');
  
	  socket.onopen = () => {
		console.log('Connected to the WebSocket server');
	  };
  
	  socket.onmessage = (event) => {
		console.log('Received WebSocket message:', event.data);
		receivedDataList.update(list => [...list, event.data]);
	  };
  
	  socket.onclose = () => {
		console.log('WebSocket connection closed');
	  };
  
	  socket.onerror = (error) => {
		console.error('WebSocket error:', error);
	  };
	});
  
	// Example: Send a message to the WebSocket server
	function sendMessage() {
	  socket.send('Hello from client');
	}
  </script>
  
  <button on:click={sendMessage}>Send Message</button>
  
  <h2>Received Data</h2>
  <ul>
	{#each $receivedDataList as data, index}
	  <li>
		<pre>{data}</pre>
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
  