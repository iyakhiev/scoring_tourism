import { investors } from '$lib/db/investors'

export async function load () {
	const res = await investors
		.find()
		.toArray()

	return {
		investors: JSON.parse(JSON.stringify(res)),
	}
}