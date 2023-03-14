<script>
	import Dir from '$lib/components/dir.svelte'

	const name = 'smrDates'
	const structure = [
		{
			type: 'dir',
			dirName: 'buildingType',
			name: 'buildingType',
			title: 'Тип объекта',
			default: 'Выберите тип объекта'
		},
		{
			type: 'value',
			name: 'objectCategory',
			title: 'Категория объекта, м²',
			fields: [
				{
					title: 'от',
					name: 'from',
					placeholder: 'м²',
				},
				{
					title: 'до',
					name: 'to',
					placeholder: 'м²',
				},
			]
		},
		{
			type: 'value',
			name: 'value',
			title: 'Предельный срок выполнения СМР, мес.',
			fields: [
				{
					name: 'value',
					placeholder: 'Кол-во месяцев',
				}
			]
		}
	]
</script>

<Dir {name} {structure}/>