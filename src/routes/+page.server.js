import { investors } from '$lib/db/investors'

export const load = async function () {
	const res = await investors
		.find()
		.toArray()

	return {
		investors: JSON.parse(JSON.stringify(res)),
	}
}