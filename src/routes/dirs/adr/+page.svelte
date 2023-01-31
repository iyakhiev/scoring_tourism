<script>
	import Dir from '$lib/components/dir.svelte'

	const type = 'adr'
	const structure = [
		{
			type: 'dir',
			dirName: 'regions',
			name: 'region',
			title: 'Регион',
			default: 'Выберите регион',
		},
		{
			type: 'dir',
			dirName: 'hotelRating',
			name: 'hotelRating',
			title: 'Звездность гостиницы',
			default: 'Выберите тип',
		},
		{
			type: 'dir',
			dirName: 'buildingCategory',
			name: 'buildingCategory',
			title: 'Категория объекта',
			default: 'Выберите категорию объекта',
			defaultEnabled: true
		},
		{
			type: 'value',
			name: 'value',
			title: 'Стоимость, руб./сутки',
			fields: [
				{
					name: 'value',
					placeholder: 'руб./сутки',
				}
			]
		}
	]
</script>

<Dir {type} {structure}/>