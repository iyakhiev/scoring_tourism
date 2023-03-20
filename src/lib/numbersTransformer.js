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

	return (n ? n.toLocaleString('ru-RU') : '0') + (hasPoint ? ',' : '')
}

export function ogrnMask(str) {
	const maxLength = 13
	const n = str && str.toString && str.toString().replace(/[^0-9]/g, '') || ''
	const mask = maxLength - n.length > 0 ? 'x'.repeat(maxLength - n.length) : ''

	return mask + n.substring(0, maxLength)
}

export function innMask(str) {
	const maxLength = 10
	const n = str && str.toString && str.toString().replace(/[^0-9]/g, '') || ''
	const mask = maxLength - n.length > 0 ? 'x'.repeat(maxLength - n.length) : ''

	return mask + n.substring(0, maxLength)
}

export function phoneMask(str, lastStr) {
	const maxLength = 11 // 8 926 123 12 12
	let phone = str && str.toString
		&& str.toString()
			.replace(/[^0-9]/g, '')
		|| ''

	if (phone.length > maxLength)
		return lastStr

	// console.log('str', str)
	// console.log('phone', phone)

	let lastN = phone.slice(-1)
	phone = phone.slice(0, -1)
	let t2 = (lastN || 'x')

	lastN = phone.slice(-1)
	phone = phone.slice(0, -1)
	t2 = (lastN || 'x') + t2

	lastN = phone.slice(-1)
	phone = phone.slice(0, -1)
	let t1 = (lastN || 'x')

	lastN = phone.slice(-1)
	phone = phone.slice(0, -1)
	t1 = (lastN || 'x') + t1

	lastN = phone.slice(-1)
	phone = phone.slice(0, -1)
	let body = (lastN || 'x')

	lastN = phone.slice(-1)
	phone = phone.slice(0, -1)
	body = (lastN || 'x') + body

	lastN = phone.slice(-1)
	phone = phone.slice(0, -1)
	body = (lastN || 'x') + body

	lastN = phone.slice(-1)
	phone = phone.slice(0, -1)
	let code = (lastN || 'x')

	lastN = phone.slice(-1)
	phone = phone.slice(0, -1)
	code = (lastN || 'x') + code

	lastN = phone.slice(-1)
	phone = phone.slice(0, -1)
	code = (lastN || 'x') + code

	lastN = phone.slice(-1)
	phone = phone.slice(0, -1)
	let countryCode = (lastN || 'x')

	// const t2 = '' + (phone[9] || 'x') + (phone[10] || 'x')
	// const t1 = '' + (phone[7] || 'x') + (phone[8] || 'x')
	// const body = '' + (phone[4] || 'x') + (phone[5] || 'x') + (phone[6] || 'x')
	// const code = '' + (phone[1] || 'x') + (phone[2] || 'x') + (phone[3] || 'x')

	return countryCode + ` (${code}) ` + body + ` ${t1} ${t2}`
}