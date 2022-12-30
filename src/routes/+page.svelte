<script>
	import { estimate } from '$lib/stopFactors'
	import { onMount } from 'svelte'
	import { DIRs } from '$lib/dirs'

	export let data

	let investors = []
	let selectedInvestor

	let newInvestor = {
		name: '',
		region: '',
		buildingType: ''
	}
	let showNewInvestorForm = false
	let highlightSave = false
	let activeInvestorTab = 1

	function selectInvestor(investor) {
		console.log('selectInvestor', investor)
		showNewInvestorForm = false
		selectedInvestor = investor
		activeInvestorTab = selectedInvestor.scoring ? 0 : 1
	}

	function toggleNewInvestorForm(value) {
		showNewInvestorForm = value
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
				console.log('add_investor', res)

				if (res?.res?.insertedId) {
					newInvestor._id = res?.res?.insertedId
					investors = [...investors, newInvestor]

					newInvestor = {
						name: ''
					}
					showNewInvestorForm = false
					selectInvestor(investors[investors.length - 1])
				}
			})
	}

	function saveInvestor() {
		if (!selectedInvestor._id)
			return

		const id = selectedInvestor._id
		const investor = {}

		Object.keys(selectedInvestor)
			.forEach(key => {
				if (!['_id', 'scoring'].includes(key))
					investor[key] = selectedInvestor[key]
			})

		fetch('/api/update_investor', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				id,
				investor
			})
		})
			.then(res => res.json())
			.then(res => {
				console.log('update_investor', res)

				if (res?.res?.modifiedCount || res?.res?.matchedCount) {
					highlightSave = false
				}
			})
	}

	function estimateStopFactors() {
		console.log('estimateStopFactors', selectedInvestor)
		selectedInvestor.scoring = estimate(selectedInvestor)
		activeInvestorTab = 0
		console.log('indicators', selectedInvestor.scoring)
	}

	onMount(() => {
		console.log('data', data)
		investors = data.investors

		// if (investors.length)
		// 	selectInvestor(investors[0])
	})
</script>

<div class="flex divide-x min-h-screen">
	<div class="w-3/12 flex flex-col items-center p-10">
		<div class="flex flex-wrap justify-center gap-5">
			<a href="/dirs" class="btn btn-outline">
				Справочники
			</a>
			<button class="btn btn-outline btn-primary" on:click={() => toggleNewInvestorForm(true)}>
				Добавить проект
			</button>
		</div>
		<div class="text-center text-2xl font-light mt-10 mb-5">Проекты:</div>
		<ul class="flex flex-col items-center w-full divide-y">
			{#each investors as investor}
				<li class="p-5 w-full text-center hover:bg-blue-50 cursor-pointer"
				    on:click={() => selectInvestor(investor)}
				    class:bg-blue-100={investor === selectedInvestor}>
					{investor.name}
				</li>
			{/each}
		</ul>
	</div>
	<div class="w-9/12 p-10">
		{#if showNewInvestorForm}
			<div class="flex justify-between">
				<div class="text-2xl font-light">Новый проект</div>
				<button class="btn btn-outline" on:click={() => toggleNewInvestorForm(false)}>Закрыть</button>
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
							<option value="{region.iso_code}">{region.name}</option>
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
			</div>
			<div class="flex justify-between mt-10">
				<button class="btn btn-outline btn-primary"
				        on:click={addInvestor}
				        class:btn-disabled={!newInvestor?.name.trim()}>
					Добавить
				</button>
			</div>
		{:else}
			{#if selectedInvestor}
				<div class="flex items-center gap-5">
					<div class="text-2xl">{selectedInvestor.name}</div>
					<button class="btn btn-primary ml-auto"
					        class:btn-outline={!highlightSave}
					        on:click={saveInvestor}>Сохранить
					</button>
					<button class="btn btn-outline"
					        on:click={estimateStopFactors}>
						Провести оценку
					</button>
				</div>
				<div class="my-10 flex flex-col gap-2">
					<div class="form-control w-full">
						<label class="label" for="theInvestorName">
							<span class="label-text">Название</span>
						</label>
						<input id="theInvestorName" type="text" placeholder="Название проекта"
						       on:change={() => highlightSave = true}
						       bind:value={selectedInvestor.name}
						       class="input input-bordered w-full"/>
					</div>
					<div class="form-control">
						<label class="label" for="theInvestorRegion">
							<span class="label-text">Регион</span>
						</label>
						<select class="select select-bordered" id="theInvestorRegion"
						        bind:value={selectedInvestor.region}>
							<option disabled selected value="">Выберите регион</option>
							{#each $DIRs['regions']?.values || [] as region}
								<option value="{region.iso_code}">{region.name}</option>
							{/each}
						</select>
					</div>
					<div class="form-control">
						<label class="label" for="theInvestorBuildingType">
							<span class="label-text">Тип объекта</span>
						</label>
						<select class="select select-bordered" id="theInvestorBuildingType"
						        bind:value={selectedInvestor.buildingType}>
							<option disabled selected value="">Выберите тип объекта</option>
							{#each $DIRs['buildingTypes']?.values || [] as bType}
								<option value="{bType.name}">{bType.title}</option>
							{/each}
						</select>
					</div>
				</div>
				<div class="tabs mt-10">
					{#if selectedInvestor.scoring}
						<a class="tab tab-lifted"
						   class:tab-active={activeInvestorTab === 0}
						   on:click={() => activeInvestorTab = 0}
						>Стоп-факторы</a>
					{/if}
					<a class="tab tab-lifted"
					   class:tab-active={activeInvestorTab === 1}
					   on:click={() => activeInvestorTab = 1}
					>ТЭП, CAPEX</a>
					<a class="tab tab-lifted"
					   class:tab-active={activeInvestorTab === 2}
					   on:click={() => activeInvestorTab = 2}
					>Финансирование</a>
					<a class="tab tab-lifted"
					   class:tab-active={activeInvestorTab === 3}
					   on:click={() => activeInvestorTab = 3}
					>Экономические показатели</a>
				</div>
				<div class="flex overflow-hidden">
					<div class="shrink-0 w-full overflow-hidden transition-all"
					     class:h-0={activeInvestorTab !== 0}
					     style="margin-left: {-activeInvestorTab * 100}%">
						{#if selectedInvestor.scoring}
							<div class="overflow-x-auto mt-10">
								<table class="table w-full">
									<!-- head -->
									<thead>
									<tr>
										<th>Раздел</th>
										<th>Наименование показателя</th>
										<th>Значение</th>
										<th colspan="2" class="text-center">Стоп-фактор (Предварительная оценка)</th>
									</tr>
									<tr>
										<th class="w-2/12"></th>
										<th class="w-3/12"></th>
										<th class="w-1/12"></th>
										<th class="w-3/12 text-center">Общий</th>
										<th class="w-3/12 text-center">Дополнительный</th>
									</tr>
									</thead>
									<tbody>
									{#each selectedInvestor.scoring as scoringRow}
										<tr>
											<td class="whitespace-pre-wrap">{scoringRow.section}</td>
											<td class="whitespace-pre-wrap">{scoringRow.fieldName}</td>
											<td class="whitespace-pre-wrap">{scoringRow.value || 0}</td>
											{#if scoringRow.error}
												<td colspan="2" class="whitespace-pre-wrap text-center text-accent">
													{scoringRow.error}
												</td>
											{:else if scoringRow.stopFactor?.type === 'common'}
												<td class="whitespace-pre-wrap bg-red-300">
													{scoringRow.stopFactor.text}
												</td>
												<td></td>
											{:else if scoringRow.stopFactor?.type === 'additional'}
												<td></td>
												<td class="whitespace-pre-wrap bg-yellow-300">
													{scoringRow.stopFactor.text}
												</td>
											{:else}
												<td colspan="2" class="text-center">Соответствует критериям</td>
											{/if}
										</tr>
									{/each}
									</tbody>
								</table>
							</div>
						{/if}
					</div>
					<div class="shrink-0 w-full overflow-hidden transition-all"
					     class:h-0={activeInvestorTab !== 1}>
						<div class="form-control w-full p-5">
							<label class="label" for="numberOfRooms">
								<span class="label-text">Количество номеров в КСР, шт.</span>
							</label>
							<input id="numberOfRooms" type="number" placeholder=""
							       bind:value={selectedInvestor.numberOfRooms}
							       on:change={() => highlightSave = true}
							       class="input input-bordered w-full max-w-lg"/>
						</div>
						<div class="form-control w-full p-5">
							<label class="label" for="costPerSqMeter">
								<span class="label-text">Стоимость 1 м² объекта, руб.</span>
							</label>
							<input id="costPerSqMeter" type="number" placeholder=""
							       bind:value={selectedInvestor.costPerSqMeter}
							       on:change={() => highlightSave = true}
							       class="input input-bordered w-full max-w-lg"/>
						</div>
					</div>
					<div class="shrink-0 w-full overflow-hidden transition-all"
					     class:h-0={activeInvestorTab !== 2}>
						<div class="form-control w-full p-5">
							<label class="label" for="totalFunds">
								<span class="label-text">Общий объем финансирования, тыс. руб.</span>
							</label>
							<input id="totalFunds" type="number" placeholder=""
							       bind:value={selectedInvestor.totalFunds}
							       on:change={() => highlightSave = true}
							       class="input input-bordered w-full max-w-lg"/>
						</div>
						<div class="form-control w-full p-5">
							<label class="label" for="bankLoanAmount">
								<span class="label-text">Кредит банка, тыс. руб.</span>
							</label>
							<input id="bankLoanAmount" type="number" placeholder=""
							       bind:value={selectedInvestor.bankLoanAmount}
							       on:change={() => highlightSave = true}
							       class="input input-bordered w-full max-w-lg"/>
						</div>
						<div class="form-control w-full p-5">
							<label class="label" for="investorContributionCash">
								<span class="label-text">Взнос Инвестора в уставный капитал СПК в денежной форме, тыс. руб.</span>
							</label>
							<input id="investorContributionCash" type="number" placeholder=""
							       bind:value={selectedInvestor.investorContributionCash}
							       on:change={() => highlightSave = true}
							       class="input input-bordered w-full max-w-lg"/>
						</div>
						<div class="form-control w-full p-5">
							<label class="label" for="investorContributionNotCash">
								<span class="label-text">Имущественный взнос Инвестора в уставный капитал СПК (не в денежной форме), тыс. руб.</span>
							</label>
							<input id="investorContributionNotCash" type="number" placeholder=""
							       bind:value={selectedInvestor.investorContributionNotCash}
							       on:change={() => highlightSave = true}
							       class="input input-bordered w-full max-w-lg"/>
						</div>
						<div class="form-control w-full p-5">
							<label class="label" for="corporationContribution">
								<span class="label-text">Корпорация Туризм.РФ (взнос в уставный капитал СПК), тыс. руб.</span>
							</label>
							<input id="corporationContribution" type="number" placeholder=""
							       bind:value={selectedInvestor.corporationContribution}
							       on:change={() => highlightSave = true}
							       class="input input-bordered w-full max-w-lg"/>
						</div>
						<div class="form-control w-full p-5">
							<label class="label" for="debtCoverageRatio">
								<span class="label-text">Уровень долговой нагрузки</span>
							</label>
							<input id="debtCoverageRatio" type="number" placeholder=""
							       bind:value={selectedInvestor.debtCoverageRatio}
							       on:change={() => highlightSave = true}
							       class="input input-bordered w-full max-w-lg"/>
						</div>
					</div>
					<div class="shrink-0 w-full overflow-hidden transition-all"
					     class:h-0={activeInvestorTab !== 3}>
						<div class="form-control w-full p-5">
							<label class="label" for="numberOfOperationMonths">
								<span class="label-text">Количество месяцев функционирования в году</span>
							</label>
							<input id="numberOfOperationMonths" type="number" placeholder=""
							       bind:value={selectedInvestor.numberOfOperationMonths}
							       on:change={() => highlightSave = true}
							       class="input input-bordered w-full max-w-lg"/>
						</div>
						<div class="form-control w-full p-5">
							<label class="label" for="adr">
								<span class="label-text">ADR — отпускной тариф, руб./сутки</span>
							</label>
							<input id="adr" type="number" placeholder=""
							       bind:value={selectedInvestor.adr}
							       on:change={() => highlightSave = true}
							       class="input input-bordered w-full max-w-lg"/>
						</div>
						<div class="form-control w-full p-5">
							<label class="label" for="marginEBITDA">
								<span class="label-text">Рентабельность по EBITDA (прогноз Инвестора), %</span>
							</label>
							<input id="marginEBITDA" type="number" placeholder=""
							       bind:value={selectedInvestor.marginEBITDA}
							       on:change={() => highlightSave = true}
							       class="input input-bordered w-full max-w-lg"/>
						</div>
						<div class="form-control w-full p-5">
							<label class="label" for="occ">
								<span class="label-text">Occupancy (OCC) — реальная заполняемость, %</span>
							</label>
							<input id="occ" type="number" placeholder=""
							       bind:value={selectedInvestor.occ}
							       on:change={() => highlightSave = true}
							       class="input input-bordered w-full max-w-lg"/>
						</div>
						<div class="form-control w-full p-5">
							<label class="label" for="doubleOcc">
								<span class="label-text">Double Occupancy — сколько гостей в среднем проживает в одном номере, чел./номер</span>
							</label>
							<input id="doubleOcc" type="number" placeholder=""
							       bind:value={selectedInvestor.doubleOcc}
							       on:change={() => highlightSave = true}
							       class="input input-bordered w-full max-w-lg"/>
						</div>
						<div class="form-control w-full p-5">
							<label class="label" for="touristFlow">
								<span class="label-text">Турпоток, чел./год</span>
							</label>
							<input id="touristFlow" type="number" placeholder=""
							       bind:value={selectedInvestor.touristFlow}
							       on:change={() => highlightSave = true}
							       class="input input-bordered w-full max-w-lg"/>
						</div>
						<div class="form-control w-full p-5">
							<label class="label" for="numberOfNewJobs">
								<span class="label-text">Количество новых рабочих мест, чел.</span>
							</label>
							<input id="numberOfNewJobs" type="number" placeholder=""
							       bind:value={selectedInvestor.numberOfNewJobs}
							       on:change={() => highlightSave = true}
							       class="input input-bordered w-full max-w-lg"/>
						</div>
						<div class="form-control w-full p-5">
							<label class="label" for="numberOfStaff">
								<span class="label-text">Количество сотрудников, чел.</span>
							</label>
							<input id="numberOfStaff" type="number" placeholder=""
							       bind:value={selectedInvestor.numberOfStaff}
							       on:change={() => highlightSave = true}
							       class="input input-bordered w-full max-w-lg"/>
						</div>
					</div>
				</div>

				<div class="flex items-center gap-5 mt-10">
					<button class="btn btn-primary ml-auto"
					        class:btn-outline={!highlightSave}
					        on:click={saveInvestor}>Сохранить
					</button>
					<button class="btn btn-outline"
					        on:click={estimateStopFactors}>
						Провести оценку
					</button>
				</div>
			{:else}
				Выберите проект или
				<span class="link" on:click={() => toggleNewInvestorForm(true)}>добавьте новый</span>
			{/if}
		{/if}
	</div>
</div>