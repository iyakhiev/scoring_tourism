<script>
	import { DIRs } from '$lib/dirs'

	const type = 'doubleOcc'
	let currentDir
	let highlightSave = false

	$: currentDir = $DIRs[type]

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
						dirs[type] = {
							...dirs[type],
							values: currentDir.values
						}
						return dirs
					})
					highlightSave = false
				}
			})
	}

	function add() {
		currentDir.values = [...currentDir.values, { region: '', type: '', from: '', to: '' }]
		highlightSave = true
	}

	function remove(value) {
		currentDir.values = currentDir.values.filter(row => row !== value)
		highlightSave = true
	}
</script>

{#if currentDir}
	<div class="flex items-center gap-5">
		<div class="text-2xl">{currentDir.title}</div>
		<button class="btn btn-primary ml-auto"
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
					<th></th>
					<th>Регион</th>
					<th>Тип объекта</th>
					<th>Кол-во гостей, чел./номер</th>
				</tr>
				</thead>
				<tbody>
				{#each currentDir.values as value}
					<tr>
						<td>
							<img class="h-10 opacity-20 hover:opacity-60 cursor-pointer p-3" src="/x.svg" alt="Remove"
							     on:click={() => remove(value)}>
						</td>
						<td>
							<select class="select select-bordered w-full"
							        bind:value={value.region}
							        on:change={() => highlightSave = true}>
								<option disabled selected value="">Выберите регион</option>
								{#each $DIRs['regions']?.values || [] as region}
									<option value="{region.iso_code}">{region.name}</option>
								{/each}
							</select>
						</td>
						<td>
							<select class="select select-bordered w-full"
							        bind:value={value.type}
							        on:change={() => highlightSave = true}>
								<option disabled selected value="">Выберите тип объекта</option>
								{#each $DIRs['buildingTypes']?.values || [] as bType}
									<option value="{bType.name}">{bType.title}</option>
								{/each}
							</select>
						</td>
						<td>
							<div class="form-control w-full">
								<div class="flex items-center justify-evenly">
									<input type="number" placeholder="От"
									       on:change={() => highlightSave = true}
									       bind:value={value.from}
									       class="input input-bordered w-1/3"/>
									<span>-</span>
									<input type="number" placeholder="До"
									       on:change={() => highlightSave = true}
									       bind:value={value.to}
									       class="input input-bordered w-1/3"/>
								</div>
							</div>
						</td>
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