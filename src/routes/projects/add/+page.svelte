<script>
	import { DIRs } from '$lib/stores'
	import { investors } from '$lib/stores'
	import { goto } from '$app/navigation'
	import Select from '$lib/components/select.svelte'
	import Input from '$lib/components/input.svelte'

	let investor = {
		name: '',
		region: '',
		buildingType: ''
	}

	function addInvestor() {
		if (!investor.name || !investor.name.trim())
			return

		investor.name = investor.name.trim()

		fetch('/api/add_investor', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ investor })
		})
			.then(res => res.json())
			.then(res => {
				console.log('add_investor(), res', res)

				if (res?.res?.insertedId) {
					investor._id = res?.res?.insertedId
					investors.update(arr => {
						arr.push(investor)
						return arr
					})

					goto(`/projects/${investor._id}`)
				}
			})
	}
</script>

<div class="flex justify-between">
	<div class="text-2xl font-light">Новый проект</div>
	<a href="/projects" class="btn btn-outline">Закрыть</a>
</div>
<div class="flex flex-col gap-2">
	<Input name="theInvestorName"
	       label="Название"
	       placeholder="Название проекта"
	       bind:value={investor.name}/>
	<Select name="theInvestorRegion"
	        label="Регион"
	        title="Выберите регион"
	        options={$DIRs['regions']?.values}
	        bind:value={investor.region}
	/>
	<Select name="theInvestorBuildingType"
	        label="Тип объекта"
	        title="Выберите тип объекта"
	        options={$DIRs['buildingTypes']?.values}
	        bind:value={investor.buildingType}
	/>
	<Select name="theInvestorBuildingCategory"
	        label="Категория объекта"
	        title="Выберите категорию объекта"
	        options={$DIRs['buildingCategory']?.values}
	        defaultDisabled={false}
	        bind:value={investor.buildingCategory}
	/>
</div>
<div class="flex justify-between mt-10">
	<button class="btn btn-outline btn-primary"
	        on:click={addInvestor}
	        class:btn-disabled={!investor?.name.trim()}>
		Добавить
	</button>
</div>