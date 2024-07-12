import WebSocket from 'ws';

interface Transaction {
  id: string;
  // Add other properties as needed
}

const transactionSet: Set<string> = new Set();

async function fetchMempoolTransactions(offset: number = 0): Promise<Transaction[]> {
  try {
    const response = await fetch(`http://213.239.193.208:9053/transactions/unconfirmed?limit=100&offset=${offset}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json() as Transaction[];
  } catch (error) {
    console.error('Error fetching mempool transactions:', error);
    return [];
  }
}

async function populateInitialSet(): Promise<void> {
  let offset = 0;
  let transactions: Transaction[];
  do {
    transactions = await fetchMempoolTransactions(offset);
    transactions.forEach(tx => transactionSet.add(tx.id));
    offset += 100;
  } while (transactions.length === 100);

  console.log(`Initial mempool size: ${transactionSet.size}`);
}

async function handleNewBlock(): Promise<void>  {
  transactionSet.clear();
  console.log('New block');
  await populateInitialSet();
  console.log(`Mempool size changed: ${transactionSet.size}`);
}

function handleNewTransaction(txId: string): void {
  transactionSet.add(txId);
  console.log(`Mempool size changed: ${transactionSet.size}`);
}

function getMempoolSize(): number {
  return transactionSet.size;
}

export async function run(io): Promise<void> {
  await populateInitialSet();

  const ws = new WebSocket('ws://localhost:9060');
  ws.on('open', () => {
    console.log("WebSocket client connected to port 9060");
  });

  ws.on('message', (message) => {
    const [topic, msgStr] = message.toString().split(' ');

    if (topic === 'newBlock') {
      handleNewBlock();
    } else if (topic === 'mempool') {
      handleNewTransaction(msgStr);
    }

    // Emit the current mempool size
    io.emit('mempoolSize', getMempoolSize());

    // Also emit the original WebSocket message
    // io.emit('websocket', { topic, message: msgStr });
  });
}
