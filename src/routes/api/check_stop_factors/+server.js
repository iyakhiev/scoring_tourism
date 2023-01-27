import { dirs } from '$lib/db/dirs'

export const POST = async function ({ request }) {
	const { project } = await request.json()

	const dirsArray = await dirs
		.find()
		.toArray()

	const dirsMap = dirsArray.reduce((acc, dir) => {
		acc[dir.type] = dir
		return acc
	}, {})

	const scoring = checkStopFactors(project, dirsMap)

	return new Response(JSON.stringify({ dirs: dirsMap, project, scoring }))
}

const noValueMsg = 'Нет данных для оценки.'
const noRegionMsg = 'Не указан регион.'
const noBuildingTypeMsg = 'Не указан тип объекта.'

function checkFields(project, estimatingFields, checkRegion = false, checkBuildingType = false) {
	const errors = []

	for (const field of estimatingFields)
		if (!project[field]) {
			errors.push(noValueMsg)
			break
		}

	if (checkRegion && !project.region)
		errors.push(noRegionMsg)
	if (checkBuildingType && !project.buildingType)
		errors.push(noBuildingTypeMsg)
	return errors
}

function getDirValue(dirs, dirName, fields) {
	const res = {
		error: null,
		dirValue: null
	}

	const dir = dirs[dirName]
	if (!dir) {
		res.error = `Справочник "${dirName}" не найден.`
		return res
	}

	for (const dirValue of dir.values) {
		let dirFound = true

		for (const field of fields)
			if (dirValue[field.name] !== field.value) {
				dirFound = false
				break
			}

		if (dirFound && dirValue.value) {
			res.dirValue = dirValue.value
			return res
		}
	}

	const fieldsStr = fields
		.map(row => row.title || row.value)
		.join(', ')
	res.error = `В справочнике "${dir.title}" не указано значение по параметрам: ${fieldsStr}.`
	return res
}

const indicators = [
	{
		label: 'Платежеспособность Инвестора',
		name: '',
		stopFactor: {
			type: 'common',
			title: 'Выявлены признак неплатежеспособности Инвестора'
		},
		indicators: [
			{
				label: 'Коэффициент абсолютной ликвидности',
				name: 'absLiqRatio',
				stopFactor: {
					type: 'additional',
					title: 'Низкий показатель абсолютной ликвидности'
				},
				calc: function (project, dirs, scoring) {
					const res = { value: project[this.name] }

					const errors = checkFields(project, [this.name])
					if (errors.length)
						res.errors = errors
					else {
						const condition = res.value < 0.5
						if (condition)
							res.stopFactor = this.stopFactor
					}

					return res
				}
			},
			{
				label: 'Коэффициент быстрой ликвидности',
				name: 'fastLiqRatio',
				stopFactor: {
					type: 'additional',
					title: 'Низкий показатель быстрой ликвидности'
				},
				calc: function (project, dirs, scoring) {
					const res = { value: project[this.name] }

					const errors = checkFields(project, [this.name])
					if (errors.length)
						res.errors = errors
					else {
						const condition = res.value < 0.8
						if (condition)
							res.stopFactor = this.stopFactor
					}

					return res
				}
			},
			{
				label: 'Коэффициент текущей ликвидности',
				name: 'currentLiqRatio',
				stopFactor: {
					type: 'additional',
					title: 'Низкий показатель текущей ликвидности'
				},
				calc: function (project, dirs, scoring) {
					const res = { value: project[this.name] }

					const errors = checkFields(project, [this.name])
					if (errors.length)
						res.errors = errors
					else {
						const condition = res.value < 1.5
						if (condition)
							res.stopFactor = this.stopFactor
					}

					return res
				}
			},
			{
				label: 'Коэфициент соотношения заемных и собственных средств',
				name: 'debtToEquityRatio',
				stopFactor: {
					type: 'additional',
					title: 'Высокая доля заемных средств'
				},
				calc: function (project, dirs, scoring) {
					const res = { value: project[this.name] }

					const errors = checkFields(project, [this.name])
					if (errors.length)
						res.errors = errors
					else {
						const condition = res.value > 0.8
						if (condition)
							res.stopFactor = this.stopFactor
					}

					return res
				}
			},
			{
				label: 'Коэффициент общей платежеспособности',
				name: 'solvencyRatio',
				stopFactor: {
					type: 'additional',
					title: 'Низкий коэффициент платежеспособности'
				},
				calc: function (project, dirs, scoring) {
					const res = { value: project[this.name] }

					const errors = checkFields(project, [this.name])
					if (errors.length)
						res.errors = errors
					else {
						const condition = res.value < 0.5
						if (condition)
							res.stopFactor = this.stopFactor
					}

					return res
				}
			},
			{
				label: 'Наличие права пользования/владения на имущество (объекты, земельные участки), вносимым в виде имущественного взноса',
				name: 'hasOwnershipRight',
				stopFactor: {
					type: 'common',
					title: 'Не представлены правоустанавливающие документы'
				},
				calc: function (project, dirs, scoring) {
					const res = { value: project[this.name] }

					if (!res.value)
						res.stopFactor = this.stopFactor

					return res
				}
			},
			{
				label: 'Наличие обременения на имущество (объекты, земельные участки) вносимое в виде имущественного взноса',
				name: 'hasPropertyEncumbrance',
				stopFactor: {
					type: 'additional',
					title: 'Имущество находится под обременением'
				},
				calc: function (project, dirs, scoring) {
					const res = { value: project[this.name] }

					if (res.value)
						res.stopFactor = this.stopFactor

					return res
				}
			},
			{
				label: 'Для физических лиц - наличие документов, подтверждающих источники происхождения собственных средств (доходов, имущества)',
				name: 'hasSourceOfFundsDocs',
				stopFactor: {
					type: 'common',
					title: 'Отсутствует подтверждение происхождения доходов (имущества)'
				},
				calc: function (project, dirs, scoring) {
					const res = { value: project[this.name] }

					if (!res.value)
						res.stopFactor = this.stopFactor

					return res
				}
			},
		],
		calc: function (project, dirs, scoring) {
			for (const row of scoring)
				if (row.stopFactor?.type === 'common')
					return { stopFactor: this.stopFactor }
		}
	},
	{
		label: 'Благонадежность (инвестора, бенефециара(ов), связанных с бенефециаром(ами) юр.лиц, в зависимости от фазы)',
		name: '',
		stopFactor: {
			type: 'common',
			title: 'Выявлены признак неблагонадежности Инвестора'
		},
		indicators: [
			{
				label: 'Участие в уставном капитале инвестора резидента недружественной страны',
				name: 'hasUnfriendlyCountryCapital',
				stopFactor: {
					type: 'common',
					title: 'Выявлен факт участия в уставном капитале инвестора резидента недружественной страны'
				},
				calc: function (project, dirs, scoring) {
					const res = { value: project[this.name] }

					if (res.value)
						res.stopFactor = this.stopFactor

					return res
				}
			},
			{
				label: 'За последний отчетный год бухгалтерская отчетность не сдавалась или сдавалась с нулевым показателем',
				name: 'noFinancialReportsForLastYear',
				stopFactor: {
					type: 'additional',
					title: 'За последний отчетный год бухгалтерская отчетность не сдавалась или сдавалась с нулевым показателем'
				},
				calc: function (project, dirs, scoring) {
					const res = { value: project[this.name] }

					if (res.value)
						res.stopFactor = this.stopFactor

					return res
				}
			},
			{
				label: 'Среднесписочная численность сотрудников за последний отчетный год была как у компаний без сотрудников: ни одного или один сотрудник, являющийся руководителем',
				name: 'reportWithNoEmployeesForLastYear',
				stopFactor: {
					type: 'additional',
					title: 'Среднесписочная численность сотрудников за последний отчетный год была как у компаний без сотрудников'
				},
				calc: function (project, dirs, scoring) {
					const res = { value: project[this.name] }

					if (res.value)
						res.stopFactor = this.stopFactor

					return res
				}
			},
			{
				label: 'Отсутствие штата персонала',
				name: 'hasLackOfStaff',
				stopFactor: {
					type: 'additional',
					title: 'Отсутствие штата персонала'
				},
				calc: function (project, dirs, scoring) {
					const res = { value: project[this.name] }

					if (res.value)
						res.stopFactor = this.stopFactor

					return res
				}
			},
			{
				label: 'Отсутствие материальных и финансовых ресурсов',
				name: 'noFunds',
				stopFactor: {
					type: 'additional',
					title: 'Отсутствие материальных и финансовых ресурсов'
				},
				calc: function (project, dirs, scoring) {
					const res = { value: project[this.name] }

					if (res.value)
						res.stopFactor = this.stopFactor

					return res
				}
			},
			{
				label: 'Наличие информации, свидетельствующей об отсутствии ведения реальной экономической деятельности, в т.ч. способе получения сведений об инвесторе (сайте, реклама в СМИ, отзывы в Интернете, рекомендации)',
				name: 'noEconomicActivity',
				stopFactor: {
					type: 'additional',
					title: 'Наличие информации, свидетельствующей об отсутствии ведения реальной экономической деятельности'
				},
				calc: function (project, dirs, scoring) {
					const res = { value: project[this.name] }

					if (res.value)
						res.stopFactor = this.stopFactor

					return res
				}
			},
			{
				label: 'В бухгалтерской отчетности отражены убытки на протяжении последних двух лет',
				name: 'hasLossesForLast2Years',
				stopFactor: {
					type: 'additional',
					title: 'В бухгалтерской отчетности отражены убытки на протяжении последних двух лет'
				},
				calc: function (project, dirs, scoring) {
					const res = { value: project[this.name] }

					if (res.value)
						res.stopFactor = this.stopFactor

					return res
				}
			},
			{
				label: 'Ответчик в судах на сумму свыше 300 тыс. руб.',
				name: 'isDefendantInCourts',
				stopFactor: {
					type: 'additional',
					title: 'Ответчик в судах на сумму свыше 300 тыс. руб.'
				},
				calc: function (project, dirs, scoring) {
					const res = { value: project[this.name] }

					if (res.value)
						res.stopFactor = this.stopFactor

					return res
				}
			},
			{
				label: 'Предстоящее исключение из ЕГРЮЛ',
				name: 'upcomingExclusionFromEGRUL',
				stopFactor: {
					type: 'common',
					title: 'Предстоящее исключение из ЕГРЮЛ'
				},
				calc: function (project, dirs, scoring) {
					const res = { value: project[this.name] }

					if (res.value)
						res.stopFactor = this.stopFactor

					return res
				}
			},
			{
				label: 'Признание сведений в ЕГРЮЛ недостоверными',
				name: 'hasUnreliableInfoInEGRUL',
				stopFactor: {
					type: 'common',
					title: 'Признание сведений в ЕГРЮЛ недостоверными'
				},
				calc: function (project, dirs, scoring) {
					const res = { value: project[this.name] }

					if (res.value)
						res.stopFactor = this.stopFactor

					return res
				}
			},
			{
				label: 'Исполнительные производства (на сумму свыше 300 тыс. руб.)',
				name: 'hasEnforcementProceedings',
				stopFactor: {
					type: 'additional',
					title: 'Исполнительные производства (на сумму свыше 300 тыс. руб.)'
				},
				calc: function (project, dirs, scoring) {
					const res = { value: project[this.name] }

					if (res.value)
						res.stopFactor = this.stopFactor

					return res
				}
			},
			{
				label: 'Сведения об имеющейся задолженности по уплате налогов и/или не предоставлении налоговой отчетности более года',
				name: 'hasTaxDebts',
				stopFactor: {
					type: 'common',
					title: 'Сведения об имеющейся задолженности по уплате налогов и/или не предоставлении налоговой отчетности более года'
				},
				calc: function (project, dirs, scoring) {
					const res = { value: project[this.name] }

					if (res.value)
						res.stopFactor = this.stopFactor

					return res
				}
			},
			{
				label: 'Нахождение в реестре сведений о банкротстве',
				name: 'hasRegisteredBankruptcy',
				stopFactor: {
					type: 'common',
					title: 'Нахождение в реестре сведений о банкротстве'
				},
				calc: function (project, dirs, scoring) {
					const res = { value: project[this.name] }

					if (res.value)
						res.stopFactor = this.stopFactor

					return res
				}
			},
			{
				label: 'Нахождение в реестре недобросовестных поставщиков',
				name: 'registeredAsUnscrupulousSupplier',
				stopFactor: {
					type: 'common',
					title: 'Нахождение в реестре недобросовестных поставщиков'
				},
				calc: function (project, dirs, scoring) {
					const res = { value: project[this.name] }

					if (res.value)
						res.stopFactor = this.stopFactor

					return res
				}
			},
			{
				label: 'Нахождение в реестре обеспечительных мер',
				name: 'inRegisterOfInterimMeasures',
				stopFactor: {
					type: 'common',
					title: 'Нахождение в реестре обеспечительных мер'
				},
				calc: function (project, dirs, scoring) {
					const res = { value: project[this.name] }

					if (res.value)
						res.stopFactor = this.stopFactor

					return res
				}
			},
			{
				label: 'Сведения о лицах, в отношении которых факт невозможности участия (осуществления руководства) в организации установлен (подтвержден) в судебном порядке',
				name: 'notAbleToParticipateInOrgByJudicialProceeding',
				stopFactor: {
					type: 'common',
					title: 'Сведения о лицах, в отношении которых факт невозможности участия (осуществления руководства) в организации установлен (подтвержден) в судебном порядке'
				},
				calc: function (project, dirs, scoring) {
					const res = { value: project[this.name] }

					if (res.value)
						res.stopFactor = this.stopFactor

					return res
				}
			},
			{
				label: 'Нахождение в реестре дисквалифицированных лиц',
				name: 'inRegisterOfDisqualifiedPersons',
				stopFactor: {
					type: 'common',
					title: 'Нахождение в реестре дисквалифицированных лиц'
				},
				calc: function (project, dirs, scoring) {
					const res = { value: project[this.name] }

					if (res.value)
						res.stopFactor = this.stopFactor

					return res
				}
			},
			{
				label: 'Наличие информации о судимости',
				name: 'hasCriminalRecords',
				stopFactor: {
					type: 'additional',
					title: 'Наличие информации о судимости'
				},
				calc: function (project, dirs, scoring) {
					const res = { value: project[this.name] }

					if (res.value)
						res.stopFactor = this.stopFactor

					return res
				}
			},
			{
				label: 'Наличие информации об актуальных возбужднных уголовных делах',
				name: 'hasInitiatedCriminalCases',
				stopFactor: {
					type: 'additional',
					title: 'Наличие информации об актуальных возбужднных уголовных делах'
				},
				calc: function (project, dirs, scoring) {
					const res = { value: project[this.name] }

					if (res.value)
						res.stopFactor = this.stopFactor

					return res
				}
			},
			{
				label: 'Наличие конфликта интересов, аффилированности с работником Корпорации',
				name: 'hasConflictOfInterest',
				stopFactor: {
					type: 'common',
					title: 'Наличие конфликта интересов, аффилированности с работником Корпорации'
				},
				calc: function (project, dirs, scoring) {
					const res = { value: project[this.name] }

					if (res.value)
						res.stopFactor = this.stopFactor

					return res
				}
			},
			{
				label: 'Нахождение в списке лиц, попадающих под условия, предусмотренные подпунктом "ф" пункта 1 статьи 23 Закона о регистрации (Федеральный закон от 08.08.2001 № 129-ФЗ)',
				name: 'fallingUnderArticle231f',
				stopFactor: {
					type: 'common',
					title: 'Отказ в государственной регистрации'
				},
				calc: function (project, dirs, scoring) {
					const res = { value: project[this.name] }

					if (res.value)
						res.stopFactor = this.stopFactor

					return res
				}
			},
		],
		calc: function (project, dirs, scoring) {
			for (const row of scoring)
				if (row.stopFactor?.type === 'common')
					return { stopFactor: this.stopFactor }
		}
	},
	{
		label: 'Дата начала подготовки ПСД',
		name: 'startDateOfPSDPreparation',
		stopFactor: {
			type: 'additional',
			title: 'Начало проектно-изыскательских работ более 12 месяцев с даты поступления анкеты'
		},
		calc: function (project, dirs, scoring) {
			const res = { value: project[this.name] }

			const errors = checkFields(project, [this.name, 'applicationSubmissionDate'])
			if (errors.length)
				res.errors = errors
			else {
				try {
					const startDateOfPSDPreparation = new Date(project[this.name])
					const applicationSubmissionDate = new Date(project.applicationSubmissionDate)

					let months = (startDateOfPSDPreparation.getFullYear()
						- applicationSubmissionDate.getFullYear()) * 12
					months -= applicationSubmissionDate.getMonth()
					months += startDateOfPSDPreparation.getMonth()
					months += startDateOfPSDPreparation.getDate() > applicationSubmissionDate.getDate() ? 1 : 0

					const condition = months > 12
					if (condition)
						res.stopFactor = this.stopFactor
				} catch (e) {
					res.errors = ['Неверный формат даты']
				}
			}

			return res
		}
	},
	{
		label: 'Дата окончания подготовки ПСД',
		name: 'endDateOfPSDPreparation',
		stopFactor: {
			type: 'additional',
			title: 'Завершение проектно-изыскательских работ  после начала СМР'
		},
		calc: function (project, dirs, scoring) {
			const res = { value: project[this.name] }

			const errors = checkFields(project, [this.name, 'startDateOfSMR'])
			if (errors.length)
				res.errors = errors
			else {
				try {
					const endDateOfPSDPreparation = new Date(project[this.name])
					const startDateOfSMR = new Date(project.startDateOfSMR)

					const condition = endDateOfPSDPreparation > startDateOfSMR
					if (condition)
						res.stopFactor = this.stopFactor
				} catch (e) {
					res.errors = ['Неверный формат даты']
				}
			}

			return res
		}
	},
	{
		label: 'Дата начала СМР',
		name: 'startDateOfSMR',
		stopFactor: {
			type: 'additional',
			title: 'Начало СМР до завершения проектно-изыскательских работ'
		},
		calc: function (project, dirs, scoring) {
			const res = { value: project[this.name] }

			const errors = checkFields(project, [this.name, 'endDateOfPSDPreparation'])
			if (errors.length)
				res.errors = errors
			else {
				try {
					const startDateOfSMR = new Date(project[this.name])
					const endDateOfPSDPreparation = new Date(project.startDateOfSMR)

					const condition = endDateOfPSDPreparation > startDateOfSMR
					if (condition)
						res.stopFactor = this.stopFactor
				} catch (e) {
					res.errors = ['Неверный формат даты']
				}
			}

			return res
		}
	},
	{
		label: 'Дата окончания СМР',
		name: 'endDateOfSMR',
		stopFactor: {
			type: 'additional',
			title: 'Дата окончания СМР после 2030 года'
		},
		calc: function (project, dirs, scoring) {
			const res = { value: project[this.name] }

			const errors = checkFields(project, [this.name])
			if (errors.length)
				res.errors = errors
			else {
				try {
					const endDateOfSMR = new Date(project[this.name])

					const condition = endDateOfSMR > new Date('2030-01-01')
					if (condition)
						res.stopFactor = this.stopFactor
				} catch (e) {
					res.errors = ['Неверный формат даты']
				}
			}

			return res
		}
	},
	{
		label: 'Дата ввода в эксплуатацию',
		name: 'commissioningDate',
		stopFactor: {
			type: 'additional',
			title: 'Дата ввода в эксплуатацию после 2030 года'
		},
		calc: function (project, dirs, scoring) {
			const res = { value: project[this.name] }

			const errors = checkFields(project, [this.name])
			if (errors.length)
				res.errors = errors
			else {
				try {
					const commissioningDate = new Date(project[this.name])

					const condition = commissioningDate > new Date('2030-01-01')
					if (condition)
						res.stopFactor = this.stopFactor
				} catch (e) {
					res.errors = ['Неверный формат даты']
				}
			}

			return res
		}
	},
	{
		label: 'Соответствие категории и вида разрешенного использования земельного участка целям проекта',
		name: 'complianceOfLandTypeWithProject',
		stopFactor: {
			type: 'additional',
			title: 'Выявлено несоответствие  категории и вида разрешенного использования земельного участка целям проекта'
		},
		calc: function (project, dirs, scoring) {
			const res = { value: project[this.name] }

			if (!res.value)
				res.stopFactor = this.stopFactor

			return res
		}
	},
	{
		label: 'Стоимость 1 м² объекта, тыс. руб.',
		name: 'costPerSqMeter',
		stopFactor: {
			type: 'common',
			title: 'Отклонение значения стоимости 1 кв.м. объекта от среднего значения по региону'
		},
		calc: function (project, dirs, scoring) {
			const res = { value: project[this.name] }

			const errors = checkFields(project, [this.name], true)
			if (errors.length)
				res.errors = errors
			else {
				const fields = [
					{
						name: 'region',
						value: project.region,
						title: project.regionTitle,
					},
				]
				const { error, dirValue } = getDirValue(dirs, 'costPerSqMeter', fields)
				if (error)
					res.errors = [error]
				else {
					const condition = Math.abs(res.value / dirValue.value - 1) * 100 > 15
					if (condition)
						res.stopFactor = this.stopFactor
				}
			}

			return res
		}
	},
	{
		label: 'Количество месяцев функционирования в году',
		name: 'numberOfOperationMonths',
		stopFactor: {
			type: 'common',
			title: 'Проект не соответствует критериям всесезонности'
		},
		calc: function (project, dirs, scoring) {
			const res = { value: project[this.name] }

			const errors = checkFields(project, [this.name])
			if (errors.length)
				res.errors = errors
			else {
				const condition = res.value < 12
				if (condition)
					res.stopFactor = this.stopFactor
			}

			return res
		}
	},
]

function checkStopFactors(project, dirs) {
	const scoring = []

	for (const indicator of indicators) {
		const nestedScoring = []

		if (indicator.indicators)
			for (const nestedIndicator of indicator.indicators)
				nestedScoring.push(checkStopFactor(nestedIndicator, project, dirs))

		if (indicator.calc)
			scoring.push(checkStopFactor(indicator, project, dirs, nestedScoring))
		if (nestedScoring.length)
			scoring.push(...nestedScoring)
	}

	return scoring
}

function checkStopFactor(indicator, project, dirs, scoring) {
	const scoringResult = {
		name: indicator.name,
		label: indicator.label,
	}

	const res = indicator.calc(project, dirs, scoring)
	if (res) {
		const { value, errors, stopFactor } = res

		scoringResult.value = value

		if (errors)
			scoringResult.errors = errors
		if (stopFactor)
			scoringResult.stopFactor = stopFactor
	}

	return scoringResult
}