<script context="module">
	import { writable } from 'svelte/store'

	const modals = writable([])

	export function openModal(title, buttons) {
		modals.update(arr => [...arr, { title, buttons }])
	}

	function closeModal(modal) {
		modals.update(arr => arr.splice(arr.indexOf(modal), 1) && arr)
	}
</script>

<script>
</script>

{#each $modals as modal}
	<div class="absolute inset-0 z-50 bg-black/25">
		<div class="w-full h-full flex items-center justify-center p-10">
			<div class="bg-white w-96 max-w-full max-h-full overflow-auto p-5 rounded shadow-2xl">
				<h1 class="text-2xl font-light">{modal.title}</h1>
				<div class="flex gap-5 justify-end mt-10">
					{#each modal.buttons as button}
						<button class="btn btn-sm {button.class}"
						        on:click={() => button.cb && button.cb() || closeModal(modal)}>{button.title}</button>
					{/each}
				</div>
			</div>
		</div>
	</div>
{/each}