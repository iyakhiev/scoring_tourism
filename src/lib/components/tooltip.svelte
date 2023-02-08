<script>
	import tippy from 'tippy.js'

	function tooltip(node, params) {
		let tip = tippy(node, params)
		return {
			update: (newParams) => {
				tip.setProps(newParams)
			},
			destroy: () => {
				tip.destroy()
			}
		}
	}

	export let content
</script>

{#if content}
	<span class="shrink-0 border border-secondary rounded-full p-1 ml-2 cursor-pointer opacity-50 hover:opacity-100"
	      use:tooltip={{content}}>
		<img class="w-3" src="/question.svg" alt="Вопрос">
	</span>
{/if}