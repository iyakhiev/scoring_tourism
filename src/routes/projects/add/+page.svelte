<script>
	import { DIRs } from '$lib/stores'
	import { investors } from '$lib/stores'
	import { goto } from '$app/navigation'

	let newInvestor = {
		name: '',
		region: '',
		buildingType: ''
	}

	function addInvestor() {
		if (!newInvestor.name || !newInvestor.name.trim())
			return

		newInvestor.name = newInvestor.name.trim()

		fetch('/api/add_investor', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				investor: newInvestor
			})
		})
			.then(res => res.json())
			.then(res => {
				console.log('add_investor(), res', res)

				if (res?.res?.insertedId) {
					newInvestor._id = res?.res?.insertedId
					investors.update(arr => {
						arr.push(newInvestor)
						return arr
					})

					goto(`/projects/${newInvestor._id}`)
				}
			})
	}
</script>

<div class="flex justify-between">
	<div class="text-2xl font-light">Новый проект</div>
	<a href="/projects" class="btn btn-outline">Закрыть</a>
</div>
<div class="flex flex-col gap-2">
	<div class="form-control w-full">
		<label class="label" for="investorName">
			<span class="label-text">Название</span>
		</label>
		<input id="investorName" type="text" placeholder="Новый проект"
		       bind:value={newInvestor.name}
		       class="input input-bordered w-full"/>
	</div>
	<div class="form-control">
		<label class="label" for="investorRegion">
			<span class="label-text">Регион</span>
		</label>
		<select class="select select-bordered" id="investorRegion"
		        bind:value={newInvestor.region}>
			<option disabled selected value="">Выберите регион</option>
			{#each $DIRs['regions']?.values || [] as region}
				<option value="{region.iso_code}">{region.title}</option>
			{/each}
		</select>
	</div>
	<div class="form-control">
		<label class="label" for="investorBuildingType">
			<span class="label-text">Тип объекта</span>
		</label>
		<select class="select select-bordered" id="investorBuildingType"
		        bind:value={newInvestor.buildingType}>
			<option disabled selected value="">Выберите тип объекта</option>
			{#each $DIRs['buildingTypes']?.values || [] as bType}
				<option value="{bType.name}">{bType.title}</option>
			{/each}
		</select>
	</div>
	<div class="form-control">
		<label class="label" for="investorBuildingCategory">
			<span class="label-text">Категория объекта</span>
		</label>
		<select class="select select-bordered" id="investorBuildingCategory"
		        bind:value={newInvestor.buildingCategory}>
			<option selected value="">Выберите категорию объекта</option>
			{#each $DIRs['buildingCategory']?.values || [] as bType}
				<option value="{bType.name}">{bType.title}</option>
			{/each}
		</select>
	</div>
</div>
<div class="flex justify-between mt-10">
	<button class="btn btn-outline btn-primary"
	        on:click={addInvestor}
	        class:btn-disabled={!newInvestor?.name.trim()}>
		Добавить
	</button>
</div>