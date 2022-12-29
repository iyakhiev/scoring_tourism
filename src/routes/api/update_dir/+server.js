import { dirs } from '$lib/db/dirs'
import { ObjectId } from 'mongodb'

export const POST = async function ({ request }) {
	const { values, id } = await request.json()

	const res = await dirs.updateOne({ _id: new ObjectId(id) }, { $set: { values } })

	return new Response(JSON.stringify({ res }))
}