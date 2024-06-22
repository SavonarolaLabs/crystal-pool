<script lang="ts">
  import { goto } from '$app/navigation';
  let menuOpen = false;
  let hoverTimeout: NodeJS.Timeout;

  function handleMouseEnter() {
    clearTimeout(hoverTimeout);
    menuOpen = true;
  }

  function handleMouseLeave() {
    hoverTimeout = setTimeout(() => {
      menuOpen = false;
    }, 200); // Adjust the delay as needed
  }

  function deposit() {
    menuOpen = false;
    goto('/assets/deposit');
  }
</script>

<style>
  .dropdown {
    background-color: var(--bg-level-secondary);
    color: var(--text-color);
    border-radius: 0.5rem;
    padding: 1rem;
    width: 250px;
    opacity: 0;
    visibility: hidden;
    transform: translateY(-10px);
    transition: opacity 0.3s ease, transform 0.3s ease, visibility 0.3s ease;
    position: absolute;
    right: 0;
    z-index: 10;
    margin-top: 0.5rem;
    box-shadow: var(--shadow-level2);
  }

  .dropdown.show {
    opacity: 1;
    visibility: visible;
    transform: translateY(0);
  }

  .dropdown a, .dropdown button {
    display: block;
    padding: 0.5rem 1rem;
    color: var(--text-color);
    text-decoration: none;
    border-radius: 0.25rem;
    transition: background-color 0.2s;
  }

  .dropdown a:hover, .dropdown button:hover {
    background-color: var(--fill-container);
  }

  .balance {
    margin-bottom: 0.5rem;
    padding: 1em;
    background-color: var(--fill-container);
    color: var(--text-secondary);
  }

  .balance-total {
    color: var(--text-primary);
  }

  .actions {
    display: flex;
    gap: 0.5rem;
    margin-bottom: 1rem;
  }

  .actions button {
    flex: 1;
    padding: 0.5rem;
    border: none;
    border-radius: 0.25rem;
    transition: background-color 0.2s;
  }

  .actions button.deposit {
    background-color: #3b82f6; /* Blue color */
    color: white;
  }

  .actions button.withdraw {
    background-color: #1f2937;
    color: white;
  }

  .actions button.deposit:hover {
    background-color: #2563eb;
  }

  .actions button.withdraw:hover {
    background-color: #374151;
  }
</style>

<!-- svelte-ignore a11y-no-static-element-interactions -->
<div class="relative inline-block text-left" on:mouseenter={handleMouseEnter} on:mouseleave={handleMouseLeave}>
  <div>
    <button 
      type="button"
      class="inline-flex w-full justify-center gap-x-1.5 rounded-md px-3 py-2 text-sm font-semibold" 
      id="menu-button" 
      aria-haspopup="true">
      Wallet
      <svg class="-mr-1 h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
        <path fill-rule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clip-rule="evenodd" />
      </svg>
    </button>
  </div>

  <div class={`dropdown ${menuOpen ? 'show' : ''}`} role="menu" aria-orientation="vertical" aria-labelledby="menu-button" tabindex="-1">
    <div class="balance text-xs">
      Estimated Balance: 
      <div class="balance-total text-xl py-2">0 ERG</div>
      ≈ 0.00 USD
    </div>
    <div class="actions">
      <button class="deposit" on:click={deposit}>Deposit</button>
      <button class="withdraw" on:click={() => { menuOpen = false; }}>Withdraw</button>
    </div>
    <a href="/assets" role="menuitem" tabindex="-1" on:click={() => { menuOpen = false; }}>Spot</a>
    <!-- svelte-ignore a11y-invalid-attribute -->
    <a href="#" role="menuitem" tabindex="-1" on:click={() => { menuOpen = false; }}>Disconnect</a>
  </div>
</div>
