export function getNumber(str) {
	const n = str && str.toString
		&& parseFloat(str.toString()
			.replace(/[^0-9.,]/g, '')
			.replace(',', '.')
		)
	return n ? n : 0
}

export function getNumberStr(n) {
	// console.log('\ngetNumberStr', n)

	if (n === null || n === undefined)
		return ''

	const hasPoint = n && n.toString && n.length
		&& [',', '.'].includes(n.toString()[n.length - 1])

	if (typeof n !== 'number')
		n = getNumber(n)

	// console.log('getNumberStr', n)

	return n ? n.toLocaleString() + (hasPoint ? ',' : '') : ''
}