import { investors } from '$lib/db/investors'

export const POST = async function ({ request }) {
	const { investor } = await request.json()

	const res = await investors.insertOne(investor)

	return new Response(JSON.stringify({ res }))
}