<script lang="ts">
	import io from 'socket.io-client';
  
	const socket = io('http://127.0.0.1:3000');
  
	socket.on('connect', () => {
	  console.log('Connected to the server:', socket.id);
	});
  
	// Example: Listen for updates
	socket.on('update', (data) => {
	  console.log('Received update:', data);
	});
  
	// Example: Join a room
	function joinRoom(room: string) {
	  socket.emit('join', room);
	}
  </script>
  
  <button on:click={() => joinRoom('room1')}>Join Room 1</button>

<style lang="postcss">
	:root{
        background-color: var(--bg-level-primary);
	}
</style>