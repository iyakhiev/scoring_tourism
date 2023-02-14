<script>
	import Dir from '$lib/components/dir.svelte'

	const name = 'occ'
	const structure = [
		{
			type: 'dir',
			dirName: 'region',
			name: 'region',
			title: 'Регион&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;',
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

<Dir {name} {structure}/>