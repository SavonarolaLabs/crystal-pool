<script lang="ts">
  import { goto } from '$app/navigation';
    let menuOpen = false;
  
    function toggleMenu() {
      menuOpen = !menuOpen;
    }
  
    function closeMenu() {
      menuOpen = false;
    }
    function deposit() {
      menuOpen = false;
      goto('/assets/deposit')
    }
  </script>
  
  <style>
    .menu-enter {
      transform: scale(0.95);
      opacity: 0;
    }
    .menu-enter-active {
      transform: scale(1);
      opacity: 1;
      transition: transform 100ms ease-out, opacity 100ms ease-out;
    }
    .menu-leave {
      transform: scale(1);
      opacity: 1;
    }
    .menu-leave-active {
      transform: scale(0.95);
      opacity: 0;
      transition: transform 75ms ease-in, opacity 75ms ease-in;
    }
    .dropdown {
      background-color: var(--bg-level-secondary);
      color: var(--text-color);
      border-radius: 0.5rem;
      padding: 1rem;
      width: 250px;
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
    .balance-total{
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
      background-color: #1f2937; /* Darker color */
      color: white;
    }
    .actions button.deposit:hover {
      background-color: #2563eb; /* Darker blue on hover */
    }
    .actions button.withdraw:hover {
      background-color: #374151; /* Darker color on hover */
    }
  </style>
  
  <div class="relative inline-block text-left">
    <div>
      <button 
        type="button"
        class="inline-flex w-full justify-center gap-x-1.5 rounded-md px-3 py-2 text-sm font-semibold" 
        id="menu-button" 
        aria-expanded={menuOpen} 
        aria-haspopup="true" 
        on:click={toggleMenu}>
        Wallet
        <svg class="-mr-1 h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <path fill-rule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clip-rule="evenodd" />
        </svg>
      </button>
    </div>
  
    {#if !menuOpen}
      <div class="shadow-s1-down absolute right-0 z-10 mt-2 origin-top-right dropdown" role="menu" aria-orientation="vertical" aria-labelledby="menu-button" tabindex="-1">
        <div class="balance text-xs">
          Estimated Balance: 
          <div class="balance-total text-xl py-2">0 ERG</div>
          ≈ 0.00 USD
        </div>
        <div class="actions">
          <button class="deposit" on:click={deposit}>Deposit</button>
          <button class="withdraw" on:click={closeMenu}>Withdraw</button>
        </div>
        <a href="/assets" role="menuitem" tabindex="-1" on:click={closeMenu}>Spot</a>
        <a href="#" role="menuitem" tabindex="-1" on:click={closeMenu}>Disconnect</a>
      </div>
    {/if}
  </div>
  