import { io, Socket } from 'socket.io-client';
import { writable } from 'svelte/store';
import type { DefaultEventsMap } from '@socket.io/component-emitter';
import { addRecentTrades, setOrderBook } from '$lib/ui/ui_state';

export const receivedDataList = writable<any[]>([]);

function createSocket(): Socket<DefaultEventsMap, DefaultEventsMap> {
  const socket = io('http://127.0.0.1:3000');

  socket.on('connect', () => {
    console.log('Connected to the server:', socket.id);
  });

  socket.on('orderbook', (data) => {
    try{
      const book = JSON.parse(data)
      setOrderBook(book);
    }catch(e){
      //Gotta catch 'em all!
    }
  });

  socket.on('trades', (data) => {
    try{
      const trades = JSON.parse(data)
      addRecentTrades(trades);
    }catch(e){
      //Gotta catch 'em all!
    }
  });

  return socket;
}

let socket: Socket<DefaultEventsMap, DefaultEventsMap> | undefined;

export function initSocket() {
  if (typeof window !== 'undefined') {
    if (!window.__socket) {
      window.__socket = createSocket();
    }
    socket = window.__socket;
  }
}

/*
export function joinRoom(room: string) {
  if (socket) {
    socket.emit('join', room);
  }
}

export function emitExampleEvent() {
  if (socket) {
    socket.emit('exampleEvent', { message: 'Hello from the client!' });
  }
}
*/