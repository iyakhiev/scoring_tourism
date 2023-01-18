import { dirs } from '$lib/db/dirs'

export const POST = async function ({ request }) {
	const { project } = await request.json()

	const dirs = await dirs
		.find()
		.toArray()

	const scoring = {

	}
	const errors = []

	return new Response(JSON.stringify({ dirs, project }))
}

const indicators = [
	{
		name: 'name',
		stopFactor: {
			type: 'common',
			title: 'title'
		},
	},
	{
		name: 'name',
		stopFactor: {
			type: 'additional',
			title: 'title'
		},
	},
	{
		name: 'Платежеспособность Инвестора',
		stopFactor: {
			type: 'common',
			title: 'Отклонение значения стоимости 1 кв.м. объекта от среднего значения по региону'
		},
		indicators: [
			{
				name: 'name',
				stopFactor: {
					type: 'additional',
					title: 'Низкий показатель абсолютной ликвидности'
				},
				calc: function () {

				}
			},
		]
	},
]