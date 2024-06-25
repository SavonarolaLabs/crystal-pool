<script lang="ts">
    import { onMount, createEventDispatcher } from 'svelte';
    import { ergoTokens } from '$lib/constants/ergoTokens';
    const dispatch = createEventDispatcher();

    export let showDialog = true;
    const closeDialog = () => (showDialog = false);

    function handleKeydown(event: KeyboardEvent) {
        if (event.key === 'Enter' || event.key === 'Escape') {
            closeDialog();
        }
    }

    function selectCrypto(coin: string) {
        dispatch('message', { coin });
        closeDialog();
    }

    onMount(() => {
        document.addEventListener('keydown', handleKeydown);
        return () => {
            document.removeEventListener('keydown', handleKeydown);
        };
    });

    let search = '';
    function fuzzySearch(tokens: Record<string, any>, query: string): Record<string, any> {
        if (query === "") {
            return tokens;
        }
        const lowerQuery = query.toLowerCase();
        return Object.entries(tokens).reduce((result, [key, value]) => {
            // Only check attributes that exist and are strings
            if ((value.name && value.name.toLowerCase().includes(lowerQuery)) ||
                (value.ticker && value.ticker.toLowerCase().includes(lowerQuery)) ||
                (value.description && value.description.toLowerCase().includes(lowerQuery)) ||
                (value.project && value.project.toLowerCase().includes(lowerQuery))) {
                result[key] = value;
            }
            return result;
        }, {} as Record<string, any>);
    }

    function scoreMatch(text: string, query: string): number {
        const maxLen = Math.max(text.length, query.length);
        let score = 0;
        let textIndex = 0;
        let queryIndex = 0;

        text = text.toLowerCase();

        while (queryIndex < query.length && textIndex < text.length) {
            if (text[textIndex] === query[queryIndex]) {
                score++;
                queryIndex++;
            }
            textIndex++;
        }

        return score / maxLen; // Normalizing the score
    }

    $: filteredTokens = fuzzySearch(ergoTokens, search);
</script>

{#if showDialog}
	<div class="dialog-overlay">
		<!-- svelte-ignore a11y-click-events-have-key-events -->
		<!-- svelte-ignore a11y-no-static-element-interactions -->
		<div class="dialog-content shadow-s2-down" on:click|stopPropagation>
			<div class="w-full flex justify-between items-center" style="height:60px;">
				<h2>Select Crypto to Deposit</h2>
				<button
					type="button"
					on:click={closeDialog}
					aria-label="Close"
					class="ant-modal-close"
					><span class="ant-modal-close-x"
						><svg
							focusable="false"
							width="1em"
							height="1em"
							fill="currentColor"
							aria-hidden="true"
							viewBox="0 0 1024 1024"
							data-icon="CloseOutlined"
							><path
								d="M512 592.440889l414.890667 414.890667 80.440889-80.440889L592.440889 512l414.890667-414.890667L926.890667 16.668444 512 431.559111 97.109333 16.668444 16.668444 97.109333 431.559111 512 16.668444 926.890667l80.440889 80.440889L512 592.440889z"
							></path></svg
						></span
					></button
				>
			</div>

			<div class="markets_searchBar mx-5 mb-2">
				<div class="ant-input-affix-wrapper ant-input-affix-wrapper-lg">
					<span class="ant-input-prefix"
						><svg
							class="svg-icon iconfont"
							focusable="false"
							width="1em"
							height="1em"
							fill="currentColor"
							aria-hidden="true"
							viewBox="0 0 16 16"
							data-icon="SearchOutlined"
							><path
								fill-rule="evenodd"
								clip-rule="evenodd"
								d="M9.93186 10.8786C9.02879 11.5806 7.89393 11.9987 6.66146 11.9987C3.71594 11.9987 1.32812 9.6109 1.32812 6.66536C1.32812 3.71984 3.71594 1.33203 6.66146 1.33203C9.60699 1.33203 11.9948 3.71984 11.9948 6.66536C11.9948 7.89783 11.5767 9.0327 10.8747 9.93576L14.4662 13.5273C14.7265 13.7876 14.7265 14.2098 14.4662 14.4701C14.2059 14.7304 13.7837 14.7304 13.5234 14.4701L9.93186 10.8786ZM10.6615 6.66536C10.6615 8.8745 8.87059 10.6654 6.66146 10.6654C4.45232 10.6654 2.66146 8.8745 2.66146 6.66536C2.66146 4.45622 4.45232 2.66536 6.66146 2.66536C8.87059 2.66536 10.6615 4.45622 10.6615 6.66536Z"
							></path></svg
						></span
					>
		
					<input placeholder="Search" class="ant-input" type="text" bind:value={search} />
				</div>
			</div>

			<div class="scroll-container">
				<div style="position:relative">
					{#each  Object.keys(filteredTokens) as k}
						<div class="select-token" on:click={() => selectCrypto(k)}>
							<div class="flex items-center gap-3">
								<div>
									<img
										style="width:32px;"
										alt=""
										src="/token/{k}.svg"
									/>
								</div>
								<div>
									<div class="select-token_currency">{ergoTokens[k].ticker}</div>
									<div class="label">{ergoTokens[k].name}</div>
								</div>
							</div>
							<div class="amount pr-2">
								<div>0</div>
								<div class="label">≈ 0.00 USD</div>
							</div>
						</div>
					{/each}
				</div>
			</div>
		</div>
	</div>
{/if}

<style>
	.coin {
		display: flex;
		align-items: center;
		width: calc(50% - 12px);
		-webkit-margin-end: 24px;
		margin-inline-end: 24px;
	}
	.amount {
		display: flex;
		flex-direction: column;
		align-items: end;
	}
	.select-token {
		height: 72px;
		margin-top: -2px;
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0 16px 0 24px;
		cursor: pointer;
		width: 100%;
		overflow: hidden;
	}
	.select-token:hover {
		background-color: var(--fill-opacity-container);
	}

	.label {
		font-size: 14px;
		color: var(--text-secondary);
		opacity: 0.6;
	}

	.scroll-container {
		display: grid;
		overflow: auto;
		height: 350px;
	}

	.ant-modal-close {
		width: 60px;
		height: 60px;
		display: flex;
		align-items: center;
		justify-content: center;
	}
	.ant-modal-close-x {
		display: block;
		width: var(--modal-header-close-size);
		height: var(--modal-header-close-size);
		font-size: var(--font-size-lg);
		font-style: normal;
		line-height: var(--modal-header-close-size);
		text-align: center;
		text-transform: none;
		text-rendering: auto;
	}

	.dialog-overlay {
		position: fixed;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background-color: rgba(0, 0, 0, 0.25);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1000;
		animation: fadeIn 0.3s ease-out;
	}

	.dialog-content {
		background-color: var(--bg-level-primary);
		padding-top: 0rem;
		border-radius: 8px;
		width: 90%;
		max-width: 400px;
		box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
		position: relative;
		animation: slideUp 0.3s ease-out;
	}

	.close-btn {
		top: 0.5rem;
		right: 1rem;
		font-size: 1.5rem;
		background: none;
		border: none;
		color: var(--text-color);
		cursor: pointer;
	}

	h2 {
		font-size: 1.5rem;
		color: var(--text-color);
		margin-bottom: 0;
		padding-left: 2rem;
	}

	.icon-container {
		display: flex;
		justify-content: center;
		align-items: center;
		margin-bottom: 1.5rem;
	}

	.wallet-icon {
		width: 60px;
		height: 60px;
		color: #3b82f6;
	}

	label {
		display: block;
		margin-bottom: 0.5rem;
		color: #bbb;
	}

	.unlock-btn {
		width: 100%;
		padding: 0.75rem;
		background-color: #3b82f6;
		color: #fff;
		border: none;
		border-radius: 4px;
		font-size: 1rem;
		cursor: pointer;
		transition: background-color 0.2s ease;
	}

	.unlock-btn:hover {
		background-color: #2563eb;
	}

	@keyframes fadeIn {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}

	@keyframes slideUp {
		from {
			transform: translateY(20px);
			opacity: 0;
		}
		to {
			transform: translateY(0);
			opacity: 1;
		}
	}
</style>
