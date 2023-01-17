<script>
	import { page } from '$app/stores'

	const dirs = [
		{
			name: 'costPerSqMeter',
			title: 'Стоимость 1 м² объекта',
		},
		{
			name: 'adr',
			title: 'ADR - Отпускной тариф'
		},
		{
			name: 'marginEBITDA',
			title: 'Рентабельность по EBITDA'
		},
		{
			name: 'occ',
			title: 'Occupancy - Реальная заполняемость'
		},
		{
			name: 'doubleOcc',
			title: 'Double Occupancy — среднее кол-во гостей в номере'
		},
		{
			name: 'staffPerRoom',
			title: 'Количество сотрудников на 1 номер'
		},
		{
			name: 'averageLengthOfStay',
			title: 'Средняя продолжительность пребывания'
		}
	]
</script>

<div class="flex divide-x min-h-screen">
	<div class="w-3/12 flex flex-col items-center p-10">
		<div class="text-center text-2xl font-light mb-5">Справочники:</div>
		<div class="flex flex-col items-center w-full divide-y">
			{#each dirs as dir}
				<a href="/dirs/{dir.name}" class="p-5 w-full text-center hover:bg-blue-50 cursor-pointer"
				    class:bg-blue-100={$page.url.pathname.includes(dir.name)}>
					{dir.title}
				</a>
			{/each}
		</div>
	</div>
	<div class="w-9/12 p-10">
		<slot/>
	</div>
</div>