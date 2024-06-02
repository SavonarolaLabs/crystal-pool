# Project Goals

For ErgohackVII , we aim to develop:

1. **Web UI with integrated wallet**: For trading and signing transactions in the background on user Actions.
2. **Pool Service**: Builds and strores a transaction tree in realtime, submits it to the mempool asynchrnously. Notifies connected clients about orderbook updates and recent trades via a socket. Service also provides a public api for the latest utxo set.