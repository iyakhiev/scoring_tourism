import { DIRs } from './stores.js'
import { get } from 'svelte/store'

const noValueMsg = 'Нет данных для оценки.'
const noRegionMsg = 'Не указан регион.'
const noBuildingTypeMsg = 'Не указан тип объекта.'

function parseFloatWithComma(value) {
	return parseFloat((value + '').replace(',', '.'))
}

function roundFloatTo2Digits(value) {
	return Math.round(value * 100) / 100
}

function checkRegion(data) {
	if (data.region)
		return false
	return noRegionMsg
}

function checkBuildingType(data) {
	if (data.buildingType)
		return false
	return noBuildingTypeMsg
}

function checkEstimatingField(data, field) {
	if (data[field])
		return false
	return noValueMsg
}

function checkDirValue(dir, fields, doNotCheckValue = false) {
	if (!dir)
		return [true, `В справочнике не найден.`]

	for (const dirValue of dir.values) {
		let dirFound = true
		for (const field of fields)
			if (dirValue[field.name] !== field.value) {
				dirFound = false
				break
			}
		if (dirFound && (dirValue.value || doNotCheckValue))
			return [false, dirValue]
	}

	const fieldsStr = fields
		.filter(row => row.title)
		.map(row => row.title)
		.join(', ')
	return [true, null, `В справочнике "${dir.title}" не указано значение по параметрам: ${fieldsStr}.`]
}

function collectDirValues(dirs, fields) {
	const errors = []

	for (const field of fields)
		if (field.value) {
			const matched = dirs[field.dirName].values.filter(row => row[field.dirValueField] === field.value)
			if (!matched.length)
				errors.push(`Значение ${field.value} не найдено в справочнике ${field.dirName}.`)
			else
				field.title = matched[0].title
		}

	if (errors.length)
		return [false, errors]
	else
		return [true, fields]
}

const indicators = {
	numberOfRooms: {
		section: 'ТЭП, CAPEX',
		fieldName: 'Количество номеров в КСР, шт.',
		stopFactorType: 'common',
		stopFactor: 'Недостаточное количество номеров в КСР',
		calc: function (data, dirs) {
			let stopFactor = null
			let value = null
			let errors = []

			let error = checkEstimatingField(data, 'numberOfRooms')
			if (error)
				errors.push(error)
			else
				value = parseInt(data.numberOfRooms)

			if (!errors.length) {
				const condition = value < 120
				if (condition)
					stopFactor = {
						type: this.stopFactorType,
						text: this.stopFactor
					}
				else
					stopFactor = false
			}

			return [value, stopFactor, errors]
		}
	},
	costPerSqMeter: {
		section: 'ТЭП, CAPEX',
		fieldName: 'Стоимость 1 м² объекта, руб.',
		stopFactorType: 'common',
		stopFactor: 'Отклонение значения стоимости 1 кв.м. объекта от среднего значения по региону',
		calc: function (data, dirs) {
			let stopFactor = null
			let value = null
			let errors = []

			let error = checkEstimatingField(data, 'costPerSqMeter')
			if (error)
				errors.push(error)
			else
				value = parseFloatWithComma(data.costPerSqMeter)

			error = checkRegion(data)
			if (error)
				errors.push(error)

			error = checkBuildingType(data)
			if (error)
				errors.push(error)

			if (!errors.length) {
				let fields = [
					{
						name: 'region',
						value: data.region,
						dirName: 'regions',
						dirValueField: 'name'
					},
					{
						name: 'type',
						value: data.buildingType,
						dirName: 'buildingTypes',
						dirValueField: 'name'
					},
					{
						name: 'category',
						value: data.buildingCategory || '',
						dirName: 'buildingCategory',
						dirValueField: 'name'
					}
				]
				let [noErrors, res] = collectDirValues(dirs, fields)

				if (noErrors) {
					const [dirError, dir, error] = checkDirValue(dirs['costPerSqMeter'], res)
					if (dirError)
						errors.push(error)
					else {
						const condition = Math.abs(value / dir.value - 1) * 100 > 15
						if (condition)
							stopFactor = {
								type: this.stopFactorType,
								text: this.stopFactor
							}
						else
							stopFactor = false
					}
				} else
					errors = res
			}

			return [value, stopFactor, errors]
		}
	},
	creditFundsShare: {
		section: 'Финансирование',
		fieldName: 'Доля кредитных средств в объеме финансирования, %',
		stopFactorType: 'additional',
		stopFactor: 'Высокий уровень закредитованности проекта',
		calc: function (data, dirs) {
			let stopFactor = null
			let value = null
			let errors = []

			let error = checkEstimatingField(data, 'bankLoanAmount')
			if (error)
				errors.push(error)

			if (!errors.length) {
				error = checkEstimatingField(data, 'totalFunds')
				if (error)
					errors.push(error)
			}

			if (!errors.length) {
				value = parseFloatWithComma(data.bankLoanAmount) / parseFloatWithComma(data.totalFunds)
				value = roundFloatTo2Digits(value * 100)
				const condition = value > 90

				if (condition)
					stopFactor = {
						type: this.stopFactorType,
						text: this.stopFactor
					}
				else
					stopFactor = false
			}

			return [value, stopFactor, errors]
		}
	},
	corporationFundsShare: {
		section: 'Финансирование',
		fieldName: 'Доля средств Корпорации Туризм.РФ в уставном капитале, %',
		stopFactorType: 'additional',
		stopFactor: 'Завышен риск миноритарного участника',
		calc: function (data, dirs) {
			let stopFactor = null
			let value = null
			let errors = []

			let error = checkEstimatingField(data, 'corporationContribution')
			if (error)
				errors.push(error)

			if (!errors.length) {
				error = checkEstimatingField(data, 'investorContributionCash')
				if (error)
					errors.push(error)
			}

			if (!errors.length) {
				const corporationContribution = parseFloatWithComma(data.corporationContribution)
				const investorContributionCash = parseFloatWithComma(data.investorContributionCash)
				value = corporationContribution / (investorContributionCash + corporationContribution)
				value = roundFloatTo2Digits(value * 100)
				const condition = value < 25
				if (condition)
					stopFactor = {
						type: this.stopFactorType,
						text: this.stopFactor
					}
				else
					stopFactor = false
			}

			return [value, stopFactor, errors]
		}
	},
	staffPerRoom: {
		section: 'Экономические показатели',
		fieldName: 'Количество сотрудников на 1 номер',
		stopFactorType: 'additional',
		stopFactor: 'Отклонение показателя от среднего рыночного значения',
		calc: function (data, dirs) {
			let stopFactor = null
			let value = null
			let errors = []

			let error = checkEstimatingField(data, 'numberOfRooms')
			if (error)
				errors.push(error)

			if (!errors.length) {
				error = checkEstimatingField(data, 'numberOfStaff')
				if (error)
					errors.push(error)
			}
			error = checkRegion(data)
			if (error)
				errors.push(error)

			error = checkBuildingType(data)
			if (error)
				errors.push(error)

			if (!errors.length) {
				let fields = [
					{
						name: 'region',
						value: data.region,
						dirName: 'regions',
						dirValueField: 'name'
					},
					{
						name: 'type',
						value: data.buildingType,
						dirName: 'buildingTypes',
						dirValueField: 'name'
					},
					{
						name: 'category',
						value: data.buildingCategory || '',
						dirName: 'buildingCategory',
						dirValueField: 'name'
					}
				]
				let [noErrors, res] = collectDirValues(dirs, fields)

				if (noErrors) {
					const [dirError, dir, error] = checkDirValue(dirs['staffPerRoom'], res, true)
					if (dirError)
						errors.push(error)
					else {
						value = data.numberOfStaff / data.numberOfRooms
						value = roundFloatTo2Digits(value)
						const condition = value > dir.to || value < dir.from
						if (condition)
							stopFactor = {
								type: this.stopFactorType,
								text: this.stopFactor
							}
						else
							stopFactor = false
					}
				} else
					errors = res
			}

			return [value, stopFactor, errors]
		}
	},
	debtCoverageRatio: {
		section: 'Финансирование',
		fieldName: 'EBITDA / (I + D)',
		stopFactorType: 'common',
		stopFactor: 'Высокий уровень долговой нагрузки',
		calc: function (data, dirs) {
			let stopFactor = null
			let value = null
			let errors = []

			let error = checkEstimatingField(data, 'debtCoverageRatio')
			if (error)
				errors.push(error)
			else
				value = parseFloatWithComma(data.debtCoverageRatio)

			if (!errors.length) {
				const condition = value < 1.3
				if (condition)
					stopFactor = {
						type: this.stopFactorType,
						text: this.stopFactor
					}
				else
					stopFactor = false
			}

			return [value, stopFactor, errors]
		}
	},
	numberOfOperationMonths: {
		section: 'Экономические показатели',
		fieldName: 'Количество месяцев функционирования в году',
		stopFactorType: 'common',
		stopFactor: 'Проект не соответствует критериям всесезонности',
		calc: function (data, dirs) {
			let stopFactor = null
			let value = null
			let errors = []

			let error = checkEstimatingField(data, 'numberOfOperationMonths')
			if (error)
				errors.push(error)
			else
				value = parseInt(data.numberOfOperationMonths)

			if (!errors.length) {
				const condition = value < 12
				if (condition)
					stopFactor = {
						type: this.stopFactorType,
						text: this.stopFactor
					}
				else
					stopFactor = false
			}

			return [value, stopFactor, errors]
		}
	},
	adr: {
		section: 'Экономические показатели',
		fieldName: 'ADR — отпускной тариф, руб./сутки',
		stopFactorType: 'additional',
		stopFactor: 'Отклонение показателя ADR от среднего рыночного значения',
		calc: function (data, dirs) {
			let stopFactor = null
			let value = null
			let errors = []

			let error = checkEstimatingField(data, 'adr')
			if (error)
				errors.push(error)
			else
				value = parseFloatWithComma(data.adr)

			error = checkRegion(data)
			if (error)
				errors.push(error)

			error = checkBuildingType(data)
			if (error)
				errors.push(error)

			if (!errors.length) {
				let fields = [
					{
						name: 'region',
						value: data.region,
						dirName: 'regions',
						dirValueField: 'name'
					},
					{
						name: 'type',
						value: data.buildingType,
						dirName: 'buildingTypes',
						dirValueField: 'name'
					},
					{
						name: 'category',
						value: data.buildingCategory || '',
						dirName: 'buildingCategory',
						dirValueField: 'name'
					}
				]
				let [noErrors, res] = collectDirValues(dirs, fields)

				if (noErrors) {
					const [dirError, dir, error] = checkDirValue(dirs['adr'], res)
					if (dirError)
						errors.push(error)
					else {
						const condition = Math.abs(value / dir.value - 1) * 100 > 10
						if (condition)
							stopFactor = {
								type: this.stopFactorType,
								text: this.stopFactor
							}
						else
							stopFactor = false
					}
				} else
					errors = res
			}

			return [value, stopFactor, errors]
		}
	},
	marginEBITDA: {
		section: 'Экономические показатели',
		fieldName: 'Рентабельность по EBITDA (прогноз Инвестора), %',
		stopFactorType: 'common',
		stopFactor: 'Отклонение показателя EBITDA от среднего рыночного значения',
		calc: function (data, dirs) {
			let stopFactor = null
			let value = null
			let errors = []

			let error = checkEstimatingField(data, 'marginEBITDA')
			if (error)
				errors.push(error)
			else
				value = parseFloatWithComma(data.marginEBITDA)

			error = checkRegion(data)
			if (error)
				errors.push(error)

			error = checkBuildingType(data)
			if (error)
				errors.push(error)

			if (!errors.length) {
				let fields = [
					{
						name: 'region',
						value: data.region,
						dirName: 'regions',
						dirValueField: 'name'
					},
					{
						name: 'type',
						value: data.buildingType,
						dirName: 'buildingTypes',
						dirValueField: 'name'
					},
					{
						name: 'category',
						value: data.buildingCategory || '',
						dirName: 'buildingCategory',
						dirValueField: 'name'
					}
				]
				let [noErrors, res] = collectDirValues(dirs, fields)

				if (noErrors) {
					const [dirError, dir, error] = checkDirValue(dirs['marginEBITDA'], res)
					if (dirError)
						errors.push(error)
					else {
						const condition = Math.abs(value / dir.value - 1) * 100 > 20
						if (condition)
							stopFactor = {
								type: this.stopFactorType,
								text: this.stopFactor
							}
						else
							stopFactor = false
					}
				} else
					errors = res
			}

			return [value, stopFactor, errors]
		}
	},
	occ: {
		section: 'Экономические показатели',
		fieldName: 'Occupancy (OCC) — реальная заполняемость, %',
		stopFactorType: 'common',
		stopFactor: 'Завышена ожидаемость по загрузке',
		calc: function (data, dirs) {
			let stopFactor = null
			let value = null
			let errors = []

			let error = checkEstimatingField(data, 'occ')
			if (error)
				errors.push(error)
			else
				value = parseFloatWithComma(data.occ)

			error = checkRegion(data)
			if (error)
				errors.push(error)

			error = checkBuildingType(data)
			if (error)
				errors.push(error)

			if (!errors.length) {
				let fields = [
					{
						name: 'region',
						value: data.region,
						dirName: 'regions',
						dirValueField: 'name'
					},
					{
						name: 'type',
						value: data.buildingType,
						dirName: 'buildingTypes',
						dirValueField: 'name'
					},
					{
						name: 'category',
						value: data.buildingCategory || '',
						dirName: 'buildingCategory',
						dirValueField: 'name'
					}
				]
				let [noErrors, res] = collectDirValues(dirs, fields)

				if (noErrors) {
					const [dirError, dir, error] = checkDirValue(dirs['occ'], res)
					if (dirError)
						errors.push(error)
					else {
						const condition = Math.abs(value / dir.value - 1) * 100 > 10
						if (condition)
							stopFactor = {
								type: this.stopFactorType,
								text: this.stopFactor
							}
						else
							stopFactor = false
					}
				} else
					errors = res
			}

			return [value, stopFactor, errors]
		}
	},
	doubleOcc: {
		section: 'Экономические показатели',
		fieldName: 'Double Occupancy — сколько гостей в среднем проживает в одном номере, чел./номер',
		stopFactorType: 'additional',
		stopFactor: 'Отклонение показателя Double Occupancy от установленного значения',
		calc: function (data, dirs) {
			let stopFactor = null
			let value = null
			let errors = []

			let error = checkEstimatingField(data, 'doubleOcc')
			if (error)
				errors.push(error)
			else
				value = parseFloatWithComma(data.doubleOcc)

			error = checkRegion(data)
			if (error)
				errors.push(error)

			error = checkBuildingType(data)
			if (error)
				errors.push(error)

			if (!errors.length) {
				let fields = [
					{
						name: 'region',
						value: data.region,
						dirName: 'regions',
						dirValueField: 'name'
					},
					{
						name: 'type',
						value: data.buildingType,
						dirName: 'buildingTypes',
						dirValueField: 'name'
					},
					{
						name: 'category',
						value: data.buildingCategory || '',
						dirName: 'buildingCategory',
						dirValueField: 'name'
					}
				]
				let [noErrors, res] = collectDirValues(dirs, fields)

				if (noErrors) {
					const [dirError, dir, error] = checkDirValue(dirs['doubleOcc'], res, true)
					if (dirError)
						errors.push(error)
					else {
						const condition = value > dir.to || value < dir.from
						if (condition)
							stopFactor = {
								type: this.stopFactorType,
								text: this.stopFactor
							}
						else
							stopFactor = false
					}
				} else
					errors = res
			}

			return [value, stopFactor, errors]
		}
	},
}


export function estimate(investorData) {
	const dirs = get(DIRs)
	const factors = []

	for (const indicator of Object.values(indicators)) {
		if (!indicator || !indicator.calc)
			continue

		const res = {
			section: indicator.section,
			fieldName: indicator.fieldName,
		}

		const [value, stopFactor, errors] = indicator.calc(investorData, dirs)
		res.value = value
		if (errors.length)
			res.error = errors.join('\n')
		else
			res.stopFactor = stopFactor

		factors.push(res)
	}

	return factors
}