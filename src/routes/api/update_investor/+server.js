import { investors } from '$lib/db/investors'
import { ObjectId } from 'mongodb'

export const POST = async function ({ request }) {
	const { investor, id } = await request.json()

	const res = await investors.updateOne({ _id: new ObjectId(id) }, { $set: investor })

	return new Response(JSON.stringify({ res }))
}