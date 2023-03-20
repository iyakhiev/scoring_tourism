import { dirs } from '$lib/db/dirs'

export const POST = async function ({ request }) {
	const { name, conditions } = await request.json()

	let match = {}
	let cond = []
	let condAnd = null

	for (const condition of conditions) {
		match[`values.${condition.field}`] = condition.value
		cond.push({
			$eq: [`$$values.${condition.field}`, condition.value]
		})
	}

	if (cond.length > 1)
		condAnd = {
			$and: [...cond]
		}

	// console.log(match)
	// console.log(cond)
	// console.log('condAnd', condAnd)

	const res = await dirs.aggregate([
		{ $match: { name, ...match } },
		{
			$project: {
				values: {
					$filter: {
						cond: condAnd ? condAnd : cond[0],
						input: '$values',
						as: 'values'
					}
				}
			}
		}
	]).toArray()

	return new Response(JSON.stringify({ res }))
}