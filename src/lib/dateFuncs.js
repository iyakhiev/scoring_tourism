export function getMonthDiff(date1, date2) {
	let months = (date2.getFullYear()
		- date1.getFullYear()) * 12
	months -= date1.getMonth()
	months += date2.getMonth()
	months += date2.getDate() > date1.getDate() ? 1 : 0

	return months
}