<script>
	import { page } from '$app/stores'

	let drawer

	$: if ($page.route.id === '/dirs')
		drawer = true

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
		// {
		// 	name: 'averageLengthOfStay',
		// 	title: 'Средняя продолжительность пребывания'
		// }
	]
</script>

<div class="drawer drawer-mobile">
	<input id="my-drawer" type="checkbox" class="drawer-toggle" bind:checked={drawer}/>
	<div class="drawer-content">
		<div class="navbar bg-base-100 relative justify-center shrink-0 h-20 md:px-24">
			<div class="flex items-center justify-center h-full w-full max-w-7xl z-10">
				<ul class="menu menu-horizontal px-1 gap-5 lg:ml-auto">
					<li><a class="btn btn-ghost text-base font-medium" href="/projects">Проекты</a></li>
					<li><a class="btn btn-ghost text-secondary text-base font-medium" href="/dirs">Справочники</a></li>
				</ul>
			</div>
			<div class="absolute inset-0 items-end justify-end overflow-hidden">
				<img src="/hill-line-left.png" alt="" class="max-w-none -mr-14 md:mr-0">
			</div>
		</div>
		<div class="fixed bottom-5 md:bottom-10 right-5 md:right-10 opacity-75 z-10">
			<label for="my-drawer"
			       class="btn btn-ghost bg-base-200/75 lg:hidden">
				<img class="w-5 md:w-6" src="/menu.svg" alt="Меню">
			</label>
		</div>
		<div class="p-5 md:p-10">
			<slot/>
		</div>
	</div>
	<div class="drawer-side shadow-2xl">
		<label for="my-drawer" class="drawer-overlay"></label>
		<aside class="w-80 h-full bg-base-100 lg:!max-w-full" style="max-width: 90%;">
			<div class="flex items-center justify-center h-20 relative">
				<img class="h-8" src="/logo.png" alt="Логотип Туризм.РФ">
				<div class="absolute inset-0 flex items-end justify-start overflow-hidden">
					<img src="/hill-line-left.png" alt="" class="max-w-none">
				</div>
			</div>
			<ul class="menu p-5 gap-0.5">
				{#each dirs as dir}
					<li>
						<a href="/dirs/{dir.name}"
						   class="font-bold uppercase text-secondary"
						   on:click={() => drawer = false}
						   class:bg-base-200={$page.url.pathname.includes(dir.name)}>
							{dir.title}
						</a>
					</li>
				{/each}
			</ul>
		</aside>
	</div>
</div>