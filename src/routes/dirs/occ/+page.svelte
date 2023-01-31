<script>
	import Dir from '$lib/components/dir.svelte'

	const type = 'occ'
	const structure = [
		{
			type: 'dir',
			dirName: 'regions',
			name: 'region',
			title: 'Регион',
			default: 'Выберите регион'
		},
		{
			type: 'dir',
			dirName: 'hotelRating',
			name: 'hotelRating',
			title: 'Звездность гостиницы',
			default: 'Выберите тип',
		},
		{
			type: 'value',
			name: 'value',
			title: 'Заполняемость, %',
			fields: [
				{
					name: 'value',
					placeholder: '%',
				}
			]
		}
	]
</script>

<Dir {type} {structure}/>