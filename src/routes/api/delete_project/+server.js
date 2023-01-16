import { investors } from '$lib/db/investors'
import { ObjectId } from 'mongodb'

export const POST = async function ({ request }) {
	const { _id } = await request.json()

	const res = await investors.deleteOne({ _id: new ObjectId(_id) })

	return new Response(JSON.stringify({ res }))
}