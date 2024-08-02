import { io, Socket } from 'socket.io-client';
import { get, writable } from 'svelte/store';
import type { DefaultEventsMap } from '@socket.io/component-emitter';
import { addRecentTrades, fetchBalance, mempool_size, setOrderBook, user_address } from '$lib/ui/ui_state';

export const receivedDataList = writable<any[]>([]);

function createSocket(): Socket<DefaultEventsMap, DefaultEventsMap> {
  const socket = io('http://127.0.0.1:3000');

  socket.on('connect', () => {
    console.log('Connected to the server:', socket.id);

    user_address.subscribe(pk=>{
      if(pk) socket.emit('pk', { pk });
    })
  });

  socket.on('orderbook', (data) => {
    try{
      const book = JSON.parse(data)
      setOrderBook(book);
      fetchBalance();
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

  socket.on('mempoolSize', (data) => {
    try{
      console.log("mempoolSize", data);
      mempool_size.set(data);
    }catch(e){
      //Gotta catch 'em all!
    }
  })

  socket.on('error_proxy_insufficient_erg', ({boxRows}) => {
    try{
      console.log("insufficinet funds proxy boxes", boxRows);
      //mempool_size.set(boxRows);
      
    }catch(e){
      //Gotta catch 'em all!
    }
  })

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