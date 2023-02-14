<script>
	import { DIRs } from '$lib/stores'
	import Select from '$lib/components/select.svelte'
	import { browser } from '$app/environment'
	import { goto } from '$app/navigation'

	export let name
	export let structure

	let currentDir
	let filteredValues
	let pageValues
	let searchQuery
	let searchTimeout
	let highlightSave = false

	const maxValuesPerPage = 50
	let maxPages = 0
	let currentPage = 0

	$: name && load()

	function load() {
		if (!name || !browser)
			return

		fetch('/api/load_dir', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ name })
		})
			.then(res => res.json())
			.then(res => {
				console.log('load_dir', res, new Date())

				if (res.redirect)
					goto('/')
				if (!res?.dir?._id)
					return

				currentDir = parseDir(res.dir)

				filteredValues = currentDir.values
				pageValues = filteredValues.slice(0, maxValuesPerPage)
				currentPage = 0
				maxPages = Math.floor(filteredValues.length / maxValuesPerPage)
			})
	}

	function getTitleFromDir(dirName, value) {
		if (!$DIRs[dirName]) {
			console.error(`Справочник ${dirName} не найден`)
			return ''
		}

		for (const row of $DIRs[dirName].values)
			if (row.name === value)
				return row.title

		return ''
	}

	function parseDir(dir) {
		const dirsMap = {}

		for (const value of dir.values)
			for (const field of structure)
				if (field.type === 'dir') {
					let title = dirsMap[field.dirName] && dirsMap[field.dirName][value[field.name]] || ''

					if (!title) {
						title = getTitleFromDir(field.dirName, value[field.name])
						if (!dirsMap[field.dirName])
							dirsMap[field.dirName] = {}
						dirsMap[field.dirName][value[field.name]] = title
					}

					value[field.name + 'Title'] = title
				}

		dir.values.sort((a, b) => {
			const region = 'regionTitle' in a ? a['regionTitle'].localeCompare(b['regionTitle']) : 0
			const buildingType = 'buildingTypeTitle' in a ? a['buildingTypeTitle'].localeCompare(b['buildingTypeTitle']) : 0
			const buildingCategory = 'buildingCategoryTitle' in a ? a['buildingCategoryTitle'].localeCompare(b['buildingCategoryTitle']) : 0
			const hotelRating = 'hotelRatingTitle' in a ? a['hotelRatingTitle'].localeCompare(b['hotelRatingTitle']) : 0
			return region || buildingType || buildingCategory || hotelRating
		})

		return dir
	}

	function save() {
		const values = currentDir.values.reduce((acc, row) => {
			const value = {}
			for (const field of structure)
				value[field.name] = row[field.name]
			acc.push(value)
			return acc
		}, [])

		fetch('/api/update_dir', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				values,
				id: currentDir._id
			})
		})
			.then(res => res.json())
			.then(res => {
				console.log('update_dir', res)

				if (res.redirect)
					goto('/')
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
		currentDir.values = [newValue, ...currentDir.values]
		filteredValues = [newValue, ...filteredValues]
		pageValues = filteredValues.slice(currentPage * maxValuesPerPage, (currentPage + 1) * maxValuesPerPage)
		highlightSave = true
	}

	function remove(value) {
		currentDir.values = currentDir.values.filter(row => row !== value)
		filteredValues = filteredValues.filter(row => row !== value)
		pageValues = filteredValues.slice(currentPage * maxValuesPerPage, (currentPage + 1) * maxValuesPerPage)
		highlightSave = true
	}

	function filter() {
		if (searchQuery && searchQuery.length) {
			const values = []
			for (const value of currentDir.values)
				for (const field of structure)
					if (field.type === 'dir')
						if (value[field.name + 'Title'] && value[field.name + 'Title'].includes(searchQuery)) {
							values.push(value)
							break
						}

			filteredValues = values
		} else
			filteredValues = currentDir.values

		pageValues = filteredValues.slice(0, maxValuesPerPage)
		currentPage = 0
		maxPages = Math.floor(filteredValues.length / maxValuesPerPage)
	}

	function onSearchQuery(withTimer = true) {
		if (searchTimeout) {
			clearTimeout(searchTimeout)
			searchTimeout = null
		}

		if (withTimer)
			searchTimeout = setTimeout(() => filter(), 500)
		else
			filter()
	}

	function clearSearchQuery() {
		searchQuery = ''
		onSearchQuery(false)
	}

	function nextPage() {
		if (currentPage + 1 > maxPages)
			return

		currentPage++
		pageValues = filteredValues.slice(currentPage * maxValuesPerPage, (currentPage + 1) * maxValuesPerPage)
	}

	function prevPage() {
		if (currentPage === 0)
			return

		currentPage--
		pageValues = filteredValues.slice(currentPage * maxValuesPerPage, (currentPage + 1) * maxValuesPerPage)
	}
</script>

{#if pageValues}
	<div class="flex flex-col md:flex-row items-end md:items-center gap-5">
		<div class="text-2xl mr-auto">{currentDir.title}</div>
		<button class="btn btn-outline btn-secondary"
		        class:opacity-50={!highlightSave}
		        on:click={save}>
			Сохранить
		</button>
		<button class="btn btn-outline btn-secondary"
		        on:click={add}>
			Добавить значение
		</button>
	</div>
	<div class="flex justify-between gap-5 my-10">
		<div class="form-control w-full max-w-md relative">
			<input type="text" placeholder="Поиск..." class="input input-bordered w-full"
			       bind:value={searchQuery}
			       on:keyup={onSearchQuery}/>
			<div class="p-2 cursor-pointer absolute right-2 top-2 opacity-50 rounded hover:bg-base-200"
			     on:click={clearSearchQuery}>
				<img class="w-4" src="/x.svg" alt="Очистить">
			</div>
		</div>
		<div class="btn-group shrink-0">
			<button class="btn btn-secondary btn-outline"
			        on:click={prevPage}>«
			</button>
			<div class="flex items-center px-3 border-t border-b border-secondary cursor-default">{currentPage + 1}
				/ {maxPages + 1}</div>
			<button class="btn btn-secondary btn-outline"
			        on:click={nextPage}>»
			</button>
		</div>
	</div>
	<div class="overflow-x-auto my-10">
		<table class="table w-full">
			<thead>
			<tr>
				<th class="!relative"></th>
				{#each structure as row}
					<th>{@html row.title}</th>
				{/each}
			</tr>
			</thead>
			<tbody>
			{#each pageValues as value}
				<tr>
					<td class="p-0">
						<img class="w-4 mx-auto opacity-20 hover:opacity-60 cursor-pointer" src="/trash.svg"
						     alt="Remove"
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
										<div class="form-control w-full" style="min-width: 100px">
											<input type="number" placeholder="{field.placeholder}"
											       on:change={() => highlightSave = true}
											       bind:value={value.value[field.name]}
											       class="input input-bordered"/>
										</div>
									</td>
								{/each}
							{:else}
								<td>
									<div class="flex items-center justify-evenly gap-1" style="min-width: 200px">
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
	<div class="flex justify-between gap-5 my-10">
		<div class="form-control w-full max-w-md relative">
			<input type="text" placeholder="Поиск..." class="input input-bordered w-full"
			       bind:value={searchQuery}
			       on:keyup={onSearchQuery}/>
			<div class="p-2 cursor-pointer absolute right-2 top-2 opacity-50 rounded hover:bg-base-200"
			     on:click={clearSearchQuery}>
				<img class="w-4" src="/x.svg" alt="Очистить">
			</div>
		</div>
		<div class="btn-group shrink-0">
			<button class="btn btn-secondary btn-outline"
			        on:click={prevPage}>«
			</button>
			<div class="flex items-center px-3 border-t border-b border-secondary cursor-default">{currentPage + 1}
				/ {maxPages + 1}</div>
			<button class="btn btn-secondary btn-outline"
			        on:click={nextPage}>»
			</button>
		</div>
	</div>
{:else}
	<div class="p-10">
		<div class="alert shadow-lg">
			<div>
				<img src="/pulse.svg" alt="Анимация загрузки" width="30">
				<span>Загрузка справочника...</span>
			</div>
		</div>
	</div>
{/if}