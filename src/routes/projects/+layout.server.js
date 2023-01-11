import { investors } from '$lib/db/investors'

export async function load () {
	const res = await investors
		.find({}, {
			projection: {
				_id: 1,
				name: 1
			}
		})
		.toArray()

	return {
		investors: JSON.parse(JSON.stringify(res)),
	}
}