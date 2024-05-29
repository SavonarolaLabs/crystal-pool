// First, ensure the script is treated as a module by adding an export statement.
export {};

// Extend the Window interface
import type { Socket } from 'socket.io-client';
import type { DefaultEventsMap } from '@socket.io/component-emitter';

declare global {
  interface Window {
    ergoConnector: any;  // Replace 'any' with the appropriate type if available
    ergo: any;
    __socket: Socket<DefaultEventsMap, DefaultEventsMap>; // Add this for the socket
  }
  var ergo: any;
}
