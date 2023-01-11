import { investors } from '$lib/db/investors'
import { ObjectId } from 'mongodb'

export async function load({ params }) {
	const res = await investors
		.findOne({
			_id: new ObjectId(params.slug)
		})

	return {
		investor: JSON.parse(JSON.stringify(res))
	}
}