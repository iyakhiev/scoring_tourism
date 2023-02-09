<script>
	import { DIRs } from '$lib/stores'
	import Select from '$lib/components/select.svelte'

	export let name
	export let structure

	let currentDir
	let highlightSave = false

	$: currentDir = $DIRs[name]

	function save() {
		fetch('/api/update_dir', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				id: currentDir._id,
				values: currentDir.values
			})
		})
			.then(res => res.json())
			.then(res => {
				console.log('update_dir', res)

				if (res?.res?.modifiedCount || res?.res?.matchedCount) {
					DIRs.update(dirs => {
						dirs[name] = {
							...dirs[name],
							values: currentDir.values
						}
						return dirs
					})
					highlightSave = false
				}
			})
	}

	function add() {
		const newValue = structure.reduce((acc, row) => {
			acc[row.name] = row.type === 'dir' ? '' : {}
			return acc
		}, {})
		currentDir.values = [...currentDir.values, newValue]
		highlightSave = true
	}

	function remove(value) {
		currentDir.values = currentDir.values.filter(row => row !== value)
		highlightSave = true
	}
</script>

{#if currentDir}
	<div class="flex flex-col md:flex-row items-end md:items-center gap-5">
		<div class="text-2xl mr-auto">{currentDir.title}</div>
		<button class="btn btn-primary"
		        class:btn-outline={!highlightSave}
		        on:click={save}>
			Сохранить
		</button>
		<button class="btn btn-outline"
		        on:click={add}>
			Добавить значение
		</button>
	</div>
	<div>
		<div class="overflow-x-auto my-10">
			<table class="table w-full">
				<thead>
				<tr>
					<th class="!relative"></th>
					{#each structure as row}
						<th>{row.title}</th>
					{/each}
				</tr>
				</thead>
				<tbody>
				{#each currentDir.values as value}
					<tr>
						<td class="p-0">
							<img class="w-4 mx-auto opacity-20 hover:opacity-60 cursor-pointer" src="/trash.svg" alt="Remove"
							     on:click={() => remove(value)}>
						</td>
						{#each structure as row}
							{#if row.type === 'dir'}
								<td>
									<Select name={row.name}
									        title={row.default}
									        options={row.options || $DIRs[row.dirName]?.values || []}
									        on:change={() => highlightSave = true}
									        bind:value={value[row.name]}
									/>
								</td>
							{:else}
								{#if row.fields.length === 1}
									{#each row.fields as field}
										<td>
											<div class="form-control w-full">
												<input type="number" placeholder="{field.placeholder}"
												       on:change={() => highlightSave = true}
												       bind:value={value.value[field.name]}
												       class="input input-bordered"/>
											</div>
										</td>
									{/each}
								{:else}
									<td>
										<div class="flex items-center justify-evenly">
											{#each row.fields as field}
												<span>{field.title}</span>
												<input type="number" placeholder="{field.placeholder}"
												       on:change={() => highlightSave = true}
												       bind:value={value.value[field.name]}
												       class="input input-bordered w-1/3"/>
											{/each}
										</div>
									</td>
								{/if}
							{/if}
						{/each}
					</tr>
				{/each}
				</tbody>
			</table>
		</div>
	</div>
{:else}
	<div class="p-10">
		<div class="alert shadow-lg">
			<div>
				<img src="/pulse.svg" alt="Анимация загрузки" width="30">
				<span>Загрузка справочников...</span>
			</div>
		</div>
	</div>
{/if}