import { dirs } from '$lib/db/dirs'
import { ROLES_ENUM, PROJECT_STATUS_ENUM } from '$lib/enums'
import { getMonthDiff } from '$lib/dateFuncs'

export const POST = async function ({ request }) {
	const { project, role } = await request.json()

	const dirsArray = await dirs
		.find()
		.toArray()

	const dirsMap = dirsArray.reduce((acc, dir) => {
		acc[dir.name] = dir
		return acc
	}, {})

	const scoring = checkStopFactors(project, role, dirsMap)

	return new Response(JSON.stringify({ dirs: dirsMap, project, scoring }))
}

const noValueMsg = 'Нет данных для оценки.'
const noRegionMsg = 'Не указан регион.'
const noBuildingTypeMsg = 'Не указан тип объекта.'
const noBuildingCategoryMsg = 'Не указана категория объекта.'
const noHotelRatingMsg = 'Не указана звездность гостиницы.'

function checkFields(project, estimatingFields,
                     checkRegion = false,
                     checkBuildingType = false,
                     checkBuildingCategory = false) {
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
	if (checkBuildingCategory && !project.buildingCategory)
		errors.push(noBuildingCategoryMsg)
	return errors
}

function getDirValue(dirs, dirName, fields, multiple = false) {
	const res = {
		error: null,
		dirValue: null,
		dirValues: []
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
			if (multiple)
				res.dirValues.push(dirValue)
			else
				return res
		}
	}

	if (multiple && res.dirValues.length)
		return res

	const fieldsStr = fields
		.map(row => row.title || row.value)
		.join(', ')
	res.error = `В справочнике "${dir.title}" не указано значение по параметрам: ${fieldsStr}.`
	return res
}

function getDirTitle(dirs, dirName, value) {
	if (!dirs[dirName])
		return

	const values = dirs[dirName].values.filter(row => row.name === value)
	if (values.length)
		return values[0]
}

const indicators = [
	{
		condition: function (project) {
			return project.status === PROJECT_STATUS_ENUM.APPLICANT_APPROVED.name
		},
		label: 'Платежеспособность Инвестора',
		name: '',
		sectionTitle: 'Оценка Инвестора',
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
		],
		calc: function (project, dirs, scoring) {
			for (const row of scoring)
				if (row.stopFactor?.type === 'common')
					return { stopFactor: this.stopFactor }
		}
	},

	{
		condition: function (project, role) {
			return project.status === PROJECT_STATUS_ENUM.WAITING_FOR_APPLICANT_APPROVAL.name
				|| role === ROLES_ENUM.MANAGER
		},
		sectionTitle: 'Оценка Инвестора',
		label: 'Наличие права пользования/владения на имущество (объекты, земельные участки), вносимым в виде имущественного взноса',
		name: 'hasOwnershipRight',
		stopFactor: {
			type: 'common',
			title: 'Не представлены правоустанавливающие документы'
		},
		calc: function (project, dirs, scoring) {
			const res = { value: !!project[this.name] }

			if (!res.value)
				res.stopFactor = this.stopFactor

			res.value = res.value ? 'Да' : 'Нет'

			return res
		}
	},
	{
		condition: function (project, role) {
			return project.status === PROJECT_STATUS_ENUM.WAITING_FOR_APPLICANT_APPROVAL.name
				|| role === ROLES_ENUM.MANAGER
		},
		sectionTitle: 'Оценка Инвестора',
		label: 'Наличие обременения на имущество (объекты, земельные участки) вносимое в виде имущественного взноса',
		name: 'hasPropertyEncumbrance',
		stopFactor: {
			type: 'additional',
			title: 'Имущество находится под обременением'
		},
		calc: function (project, dirs, scoring) {
			const res = { value: !!project[this.name] }

			if (res.value)
				res.stopFactor = this.stopFactor

			res.value = res.value ? 'Да' : 'Нет'

			return res
		}
	},
	{
		condition: function (project, role) {
			return (project.status === PROJECT_STATUS_ENUM.WAITING_FOR_APPLICANT_APPROVAL.name
				|| role === ROLES_ENUM.MANAGER) && project.applicantType === 'individual'
		},
		sectionTitle: 'Оценка Инвестора',
		label: 'Для физических лиц - наличие документов, подтверждающих источники происхождения собственных средств (доходов, имущества)',
		name: 'hasSourceOfFundsDocs',
		stopFactor: {
			type: 'common',
			title: 'Отсутствует подтверждение происхождения доходов (имущества)'
		},
		calc: function (project, dirs, scoring) {
			const res = { value: !!project[this.name] }

			if (!res.value)
				res.stopFactor = this.stopFactor

			res.value = res.value ? 'Да' : 'Нет'

			return res
		}
	},
	{
		condition: function (project, role) {
			return project.status === PROJECT_STATUS_ENUM.WAITING_FOR_APPLICANT_APPROVAL.name
				|| role === ROLES_ENUM.MANAGER
		},
		sectionTitle: 'Оценка Инвестора',
		label: 'Участие в уставном капитале инвестора резидента недружественной страны',
		name: 'hasUnfriendlyCountryCapital',
		stopFactor: {
			type: 'common',
			title: 'Выявлен факт участия в уставном капитале инвестора резидента недружественной страны'
		},
		calc: function (project, dirs, scoring) {
			const res = { value: !!project[this.name] }

			if (res.value)
				res.stopFactor = this.stopFactor

			res.value = res.value ? 'Да' : 'Нет'

			return res
		}
	},
	{
		condition: function (project, role) {
			return project.status === PROJECT_STATUS_ENUM.WAITING_FOR_APPLICANT_APPROVAL.name
				|| role === ROLES_ENUM.MANAGER
		},
		sectionTitle: 'Оценка Инвестора',
		label: 'За последний отчетный год бухгалтерская отчетность не сдавалась или сдавалась с нулевым показателем',
		name: 'noFinancialReportsForLastYear',
		stopFactor: {
			type: 'additional',
			title: 'За последний отчетный год бухгалтерская отчетность не сдавалась или сдавалась с нулевым показателем'
		},
		calc: function (project, dirs, scoring) {
			const res = { value: !!project[this.name] }

			if (res.value)
				res.stopFactor = this.stopFactor

			res.value = res.value ? 'Да' : 'Нет'

			return res
		}
	},
	{
		condition: function (project, role) {
			return project.status === PROJECT_STATUS_ENUM.WAITING_FOR_APPLICANT_APPROVAL.name
				|| role === ROLES_ENUM.MANAGER
		},
		sectionTitle: 'Оценка Инвестора',
		label: 'Среднесписочная численность сотрудников за последний отчетный год была как у компаний без сотрудников: ни одного или один сотрудник, являющийся руководителем',
		name: 'reportWithNoEmployeesForLastYear',
		stopFactor: {
			type: 'additional',
			title: 'Среднесписочная численность сотрудников за последний отчетный год была как у компаний без сотрудников'
		},
		calc: function (project, dirs, scoring) {
			const res = { value: !!project[this.name] }

			if (res.value)
				res.stopFactor = this.stopFactor

			res.value = res.value ? 'Да' : 'Нет'

			return res
		}
	},
	{
		condition: function (project, role) {
			return project.status === PROJECT_STATUS_ENUM.WAITING_FOR_APPLICANT_APPROVAL.name
				|| role === ROLES_ENUM.MANAGER
		},
		sectionTitle: 'Оценка Инвестора',
		label: 'Отсутствие работников в штате',
		name: 'hasLackOfStaff',
		stopFactor: {
			type: 'additional',
			title: 'Отсутствие работников в штате'
		},
		calc: function (project, dirs, scoring) {
			const res = { value: !!project[this.name] }

			if (res.value)
				res.stopFactor = this.stopFactor

			res.value = res.value ? 'Да' : 'Нет'

			return res
		}
	},
	{
		condition: function (project, role) {
			return project.status === PROJECT_STATUS_ENUM.WAITING_FOR_APPLICANT_APPROVAL.name
				|| role === ROLES_ENUM.MANAGER
		},
		sectionTitle: 'Оценка Инвестора',
		label: 'Отсутствие материальных и финансовых ресурсов',
		name: 'noFunds',
		stopFactor: {
			type: 'additional',
			title: 'Отсутствие материальных и финансовых ресурсов'
		},
		calc: function (project, dirs, scoring) {
			const res = { value: !!project[this.name] }

			if (res.value)
				res.stopFactor = this.stopFactor

			res.value = res.value ? 'Да' : 'Нет'

			return res
		}
	},
	{
		condition: function (project, role) {
			return project.status === PROJECT_STATUS_ENUM.WAITING_FOR_APPLICANT_APPROVAL.name
				|| role === ROLES_ENUM.MANAGER
		},
		sectionTitle: 'Оценка Инвестора',
		label: 'Наличие информации, свидетельствующей об отсутствии ведения реальной экономической деятельности, в т.ч. способе получения сведений об инвесторе (сайте, реклама в СМИ, отзывы в Интернете, рекомендации)',
		name: 'noEconomicActivity',
		stopFactor: {
			type: 'additional',
			title: 'Наличие информации, свидетельствующей об отсутствии ведения реальной экономической деятельности'
		},
		calc: function (project, dirs, scoring) {
			const res = { value: !!project[this.name] }

			if (res.value)
				res.stopFactor = this.stopFactor

			res.value = res.value ? 'Да' : 'Нет'

			return res
		}
	},
	{
		condition: function (project, role) {
			return project.status === PROJECT_STATUS_ENUM.WAITING_FOR_APPLICANT_APPROVAL.name
				|| role === ROLES_ENUM.MANAGER
		},
		sectionTitle: 'Оценка Инвестора',
		label: 'В бухгалтерской отчетности отражены убытки на протяжении последних двух лет',
		name: 'hasLossesForLast2Years',
		stopFactor: {
			type: 'additional',
			title: 'В бухгалтерской отчетности отражены убытки на протяжении последних двух лет'
		},
		calc: function (project, dirs, scoring) {
			const res = { value: !!project[this.name] }

			if (res.value)
				res.stopFactor = this.stopFactor

			res.value = res.value ? 'Да' : 'Нет'

			return res
		}
	},
	{
		condition: function (project, role) {
			return project.status === PROJECT_STATUS_ENUM.WAITING_FOR_APPLICANT_APPROVAL.name
				|| role === ROLES_ENUM.MANAGER
		},
		sectionTitle: 'Оценка Инвестора',
		label: 'Ответчик в судах на сумму свыше 300 тыс. руб.',
		name: 'isDefendantInCourts',
		stopFactor: {
			type: 'additional',
			title: 'Ответчик в судах на сумму свыше 300 тыс. руб.'
		},
		calc: function (project, dirs, scoring) {
			const res = { value: !!project[this.name] }

			if (res.value)
				res.stopFactor = this.stopFactor

			res.value = res.value ? 'Да' : 'Нет'

			return res
		}
	},
	{
		condition: function (project, role) {
			return project.status === PROJECT_STATUS_ENUM.WAITING_FOR_APPLICANT_APPROVAL.name
				|| role === ROLES_ENUM.MANAGER
		},
		sectionTitle: 'Оценка Инвестора',
		label: 'Предстоящее исключение из ЕГРЮЛ',
		name: 'upcomingExclusionFromEGRUL',
		stopFactor: {
			type: 'common',
			title: 'Предстоящее исключение из ЕГРЮЛ'
		},
		calc: function (project, dirs, scoring) {
			const res = { value: !!project[this.name] }

			if (res.value)
				res.stopFactor = this.stopFactor

			res.value = res.value ? 'Да' : 'Нет'

			return res
		}
	},
	{
		condition: function (project, role) {
			return project.status === PROJECT_STATUS_ENUM.WAITING_FOR_APPLICANT_APPROVAL.name
				|| role === ROLES_ENUM.MANAGER
		},
		sectionTitle: 'Оценка Инвестора',
		label: 'Признание сведений в ЕГРЮЛ недостоверными',
		name: 'hasUnreliableInfoInEGRUL',
		stopFactor: {
			type: 'common',
			title: 'Признание сведений в ЕГРЮЛ недостоверными'
		},
		calc: function (project, dirs, scoring) {
			const res = { value: !!project[this.name] }

			if (res.value)
				res.stopFactor = this.stopFactor

			res.value = res.value ? 'Да' : 'Нет'

			return res
		}
	},
	{
		condition: function (project, role) {
			return project.status === PROJECT_STATUS_ENUM.WAITING_FOR_APPLICANT_APPROVAL.name
				|| role === ROLES_ENUM.MANAGER
		},
		sectionTitle: 'Оценка Инвестора',
		label: 'Исполнительные производства (на сумму свыше 300 тыс. руб.)',
		name: 'hasEnforcementProceedings',
		stopFactor: {
			type: 'additional',
			title: 'Исполнительные производства (на сумму свыше 300 тыс. руб.)'
		},
		calc: function (project, dirs, scoring) {
			const res = { value: !!project[this.name] }

			if (res.value)
				res.stopFactor = this.stopFactor

			res.value = res.value ? 'Да' : 'Нет'

			return res
		}
	},
	{
		condition: function (project, role) {
			return project.status === PROJECT_STATUS_ENUM.WAITING_FOR_APPLICANT_APPROVAL.name
				|| role === ROLES_ENUM.MANAGER
		},
		sectionTitle: 'Оценка Инвестора',
		label: 'Сведения об имеющейся задолженности по уплате налогов и/или не предоставлении налоговой отчетности более года',
		name: 'hasTaxDebts',
		stopFactor: {
			type: 'common',
			title: 'Сведения об имеющейся задолженности по уплате налогов и/или не предоставлении налоговой отчетности более года'
		},
		calc: function (project, dirs, scoring) {
			const res = { value: !!project[this.name] }

			if (res.value)
				res.stopFactor = this.stopFactor

			res.value = res.value ? 'Да' : 'Нет'

			return res
		}
	},
	{
		condition: function (project, role) {
			return project.status === PROJECT_STATUS_ENUM.WAITING_FOR_APPLICANT_APPROVAL.name
				|| role === ROLES_ENUM.MANAGER
		},
		sectionTitle: 'Оценка Инвестора',
		label: 'Нахождение в реестре сведений о банкротстве',
		name: 'hasRegisteredBankruptcy',
		stopFactor: {
			type: 'common',
			title: 'Нахождение в реестре сведений о банкротстве'
		},
		calc: function (project, dirs, scoring) {
			const res = { value: !!project[this.name] }

			if (res.value)
				res.stopFactor = this.stopFactor

			res.value = res.value ? 'Да' : 'Нет'

			return res
		}
	},
	{
		condition: function (project, role) {
			return project.status === PROJECT_STATUS_ENUM.WAITING_FOR_APPLICANT_APPROVAL.name
				|| role === ROLES_ENUM.MANAGER
		},
		sectionTitle: 'Оценка Инвестора',
		label: 'Нахождение в реестре недобросовестных поставщиков',
		name: 'registeredAsUnscrupulousSupplier',
		stopFactor: {
			type: 'common',
			title: 'Нахождение в реестре недобросовестных поставщиков'
		},
		calc: function (project, dirs, scoring) {
			const res = { value: !!project[this.name] }

			if (res.value)
				res.stopFactor = this.stopFactor

			res.value = res.value ? 'Да' : 'Нет'

			return res
		}
	},
	{
		condition: function (project, role) {
			return project.status === PROJECT_STATUS_ENUM.WAITING_FOR_APPLICANT_APPROVAL.name
				|| role === ROLES_ENUM.MANAGER
		},
		sectionTitle: 'Оценка Инвестора',
		label: 'Нахождение в реестре обеспечительных мер',
		name: 'inRegisterOfInterimMeasures',
		stopFactor: {
			type: 'common',
			title: 'Нахождение в реестре обеспечительных мер'
		},
		calc: function (project, dirs, scoring) {
			const res = { value: !!project[this.name] }

			if (res.value)
				res.stopFactor = this.stopFactor

			res.value = res.value ? 'Да' : 'Нет'

			return res
		}
	},
	{
		condition: function (project, role) {
			return project.status === PROJECT_STATUS_ENUM.WAITING_FOR_APPLICANT_APPROVAL.name
				|| role === ROLES_ENUM.MANAGER
		},
		sectionTitle: 'Оценка Инвестора',
		label: 'Сведения о лицах, в отношении которых факт невозможности участия (осуществления руководства) в организации установлен (подтвержден) в судебном порядке',
		name: 'notAbleToParticipateInOrgByJudicialProceeding',
		stopFactor: {
			type: 'common',
			title: 'Сведения о лицах, в отношении которых факт невозможности участия (осуществления руководства) в организации установлен (подтвержден) в судебном порядке'
		},
		calc: function (project, dirs, scoring) {
			const res = { value: !!project[this.name] }

			if (res.value)
				res.stopFactor = this.stopFactor

			res.value = res.value ? 'Да' : 'Нет'

			return res
		}
	},
	{
		condition: function (project, role) {
			return project.status === PROJECT_STATUS_ENUM.WAITING_FOR_APPLICANT_APPROVAL.name
				|| role === ROLES_ENUM.MANAGER
		},
		sectionTitle: 'Оценка Инвестора',
		label: 'Нахождение в реестре дисквалифицированных лиц',
		name: 'inRegisterOfDisqualifiedPersons',
		stopFactor: {
			type: 'common',
			title: 'Нахождение в реестре дисквалифицированных лиц'
		},
		calc: function (project, dirs, scoring) {
			const res = { value: !!project[this.name] }

			if (res.value)
				res.stopFactor = this.stopFactor

			res.value = res.value ? 'Да' : 'Нет'

			return res
		}
	},
	{
		condition: function (project, role) {
			return project.status === PROJECT_STATUS_ENUM.WAITING_FOR_APPLICANT_APPROVAL.name
				|| role === ROLES_ENUM.MANAGER
		},
		sectionTitle: 'Оценка Инвестора',
		label: 'Наличие информации о судимости',
		name: 'hasCriminalRecords',
		stopFactor: {
			type: 'additional',
			title: 'Наличие информации о судимости'
		},
		calc: function (project, dirs, scoring) {
			const res = { value: !!project[this.name] }

			if (res.value)
				res.stopFactor = this.stopFactor

			res.value = res.value ? 'Да' : 'Нет'

			return res
		}
	},
	{
		condition: function (project, role) {
			return project.status === PROJECT_STATUS_ENUM.WAITING_FOR_APPLICANT_APPROVAL.name
				|| role === ROLES_ENUM.MANAGER
		},
		sectionTitle: 'Оценка Инвестора',
		label: 'Наличие информации об актуальных возбужднных уголовных делах',
		name: 'hasInitiatedCriminalCases',
		stopFactor: {
			type: 'additional',
			title: 'Наличие информации об актуальных возбужднных уголовных делах'
		},
		calc: function (project, dirs, scoring) {
			const res = { value: !!project[this.name] }

			if (res.value)
				res.stopFactor = this.stopFactor

			res.value = res.value ? 'Да' : 'Нет'

			return res
		}
	},
	{
		condition: function (project, role) {
			return project.status === PROJECT_STATUS_ENUM.WAITING_FOR_APPLICANT_APPROVAL.name
				|| role === ROLES_ENUM.MANAGER
		},
		sectionTitle: 'Оценка Инвестора',
		label: 'Наличие конфликта интересов, аффилированности с работником Корпорации',
		name: 'hasConflictOfInterest',
		stopFactor: {
			type: 'common',
			title: 'Наличие конфликта интересов, аффилированности с работником Корпорации'
		},
		calc: function (project, dirs, scoring) {
			const res = { value: !!project[this.name] }

			if (res.value)
				res.stopFactor = this.stopFactor

			res.value = res.value ? 'Да' : 'Нет'

			return res
		}
	},
	{
		condition: function (project, role) {
			return project.status === PROJECT_STATUS_ENUM.WAITING_FOR_APPLICANT_APPROVAL.name
				|| role === ROLES_ENUM.MANAGER
		},
		sectionTitle: 'Оценка Инвестора',
		label: 'Нахождение в списке лиц, попадающих под условия, предусмотренные подпунктом "ф" пункта 1 статьи 23 Закона о регистрации (Федеральный закон от 08.08.2001 № 129-ФЗ)',
		name: 'fallingUnderArticle231f',
		stopFactor: {
			type: 'common',
			title: 'Отказ в государственной регистрации'
		},
		calc: function (project, dirs, scoring) {
			const res = { value: !!project[this.name] }

			if (res.value)
				res.stopFactor = this.stopFactor

			res.value = res.value ? 'Да' : 'Нет'

			return res
		}
	},

	{
		condition: function (project, role) {
			return false
			return project.status === PROJECT_STATUS_ENUM.WAITING_FOR_APPLICANT_APPROVAL.name
				|| role === ROLES_ENUM.MANAGER
		},
		label: 'Благонадежность (инвестора, бенефециара(ов), связанных с бенефециаром(ами) юр.лиц, в зависимости от фазы)',
		name: '',
		sectionTitle: 'Оценка Инвестора',
		stopFactor: {
			type: 'common',
			title: 'Выявлены признак неблагонадежности Инвестора'
		},
		indicators: [
			{
				label: 'Наличие права пользования/владения на имущество (объекты, земельные участки), вносимым в виде имущественного взноса',
				name: 'hasOwnershipRight',
				stopFactor: {
					type: 'common',
					title: 'Не представлены правоустанавливающие документы'
				},
				calc: function (project, dirs, scoring) {
					const res = { value: !!project[this.name] }

					if (!res.value)
						res.stopFactor = this.stopFactor

					res.value = res.value ? 'Да' : 'Нет'

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
					const res = { value: !!project[this.name] }

					if (res.value)
						res.stopFactor = this.stopFactor

					res.value = res.value ? 'Да' : 'Нет'

					return res
				}
			},
			{
				condition: project => project.applicantType === 'individual',
				label: 'Для физических лиц - наличие документов, подтверждающих источники происхождения собственных средств (доходов, имущества)',
				name: 'hasSourceOfFundsDocs',
				stopFactor: {
					type: 'common',
					title: 'Отсутствует подтверждение происхождения доходов (имущества)'
				},
				calc: function (project, dirs, scoring) {
					const res = { value: !!project[this.name] }

					if (!res.value)
						res.stopFactor = this.stopFactor

					res.value = res.value ? 'Да' : 'Нет'

					return res
				}
			},
			{
				label: 'Участие в уставном капитале инвестора резидента недружественной страны',
				name: 'hasUnfriendlyCountryCapital',
				stopFactor: {
					type: 'common',
					title: 'Выявлен факт участия в уставном капитале инвестора резидента недружественной страны'
				},
				calc: function (project, dirs, scoring) {
					const res = { value: !!project[this.name] }

					if (res.value)
						res.stopFactor = this.stopFactor

					res.value = res.value ? 'Да' : 'Нет'

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
					const res = { value: !!project[this.name] }

					if (res.value)
						res.stopFactor = this.stopFactor

					res.value = res.value ? 'Да' : 'Нет'

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
					const res = { value: !!project[this.name] }

					if (res.value)
						res.stopFactor = this.stopFactor

					res.value = res.value ? 'Да' : 'Нет'

					return res
				}
			},
			{
				label: 'Отсутствие работников в штате',
				name: 'hasLackOfStaff',
				stopFactor: {
					type: 'additional',
					title: 'Отсутствие работников в штате'
				},
				calc: function (project, dirs, scoring) {
					const res = { value: !!project[this.name] }

					if (res.value)
						res.stopFactor = this.stopFactor

					res.value = res.value ? 'Да' : 'Нет'

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
					const res = { value: !!project[this.name] }

					if (res.value)
						res.stopFactor = this.stopFactor

					res.value = res.value ? 'Да' : 'Нет'

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
					const res = { value: !!project[this.name] }

					if (res.value)
						res.stopFactor = this.stopFactor

					res.value = res.value ? 'Да' : 'Нет'

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
					const res = { value: !!project[this.name] }

					if (res.value)
						res.stopFactor = this.stopFactor

					res.value = res.value ? 'Да' : 'Нет'

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
					const res = { value: !!project[this.name] }

					if (res.value)
						res.stopFactor = this.stopFactor

					res.value = res.value ? 'Да' : 'Нет'

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
					const res = { value: !!project[this.name] }

					if (res.value)
						res.stopFactor = this.stopFactor

					res.value = res.value ? 'Да' : 'Нет'

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
					const res = { value: !!project[this.name] }

					if (res.value)
						res.stopFactor = this.stopFactor

					res.value = res.value ? 'Да' : 'Нет'

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
					const res = { value: !!project[this.name] }

					if (res.value)
						res.stopFactor = this.stopFactor

					res.value = res.value ? 'Да' : 'Нет'

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
					const res = { value: !!project[this.name] }

					if (res.value)
						res.stopFactor = this.stopFactor

					res.value = res.value ? 'Да' : 'Нет'

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
					const res = { value: !!project[this.name] }

					if (res.value)
						res.stopFactor = this.stopFactor

					res.value = res.value ? 'Да' : 'Нет'

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
					const res = { value: !!project[this.name] }

					if (res.value)
						res.stopFactor = this.stopFactor

					res.value = res.value ? 'Да' : 'Нет'

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
					const res = { value: !!project[this.name] }

					if (res.value)
						res.stopFactor = this.stopFactor

					res.value = res.value ? 'Да' : 'Нет'

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
					const res = { value: !!project[this.name] }

					if (res.value)
						res.stopFactor = this.stopFactor

					res.value = res.value ? 'Да' : 'Нет'

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
					const res = { value: !!project[this.name] }

					if (res.value)
						res.stopFactor = this.stopFactor

					res.value = res.value ? 'Да' : 'Нет'

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
					const res = { value: !!project[this.name] }

					if (res.value)
						res.stopFactor = this.stopFactor

					res.value = res.value ? 'Да' : 'Нет'

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
					const res = { value: !!project[this.name] }

					if (res.value)
						res.stopFactor = this.stopFactor

					res.value = res.value ? 'Да' : 'Нет'

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
					const res = { value: !!project[this.name] }

					if (res.value)
						res.stopFactor = this.stopFactor

					res.value = res.value ? 'Да' : 'Нет'

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
					const res = { value: !!project[this.name] }

					if (res.value)
						res.stopFactor = this.stopFactor

					res.value = res.value ? 'Да' : 'Нет'

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
		condition: function (project) {
			return project.status === PROJECT_STATUS_ENUM.APPLICANT_APPROVED.name
		},
		label: 'Общее количество номеров в КСР, шт.',
		name: 'totalNumberOfRooms',
		sectionTitle: 'ТЭП, CAPEX',
		stopFactor: {
			type: 'common',
			title: 'Недостаточное количество номеров в КСР'
		},
		calc: function (project, dirs, scoring) {
			const res = { value: project[this.name] }

			const errors = checkFields(project, [this.name])
			if (errors.length)
				res.errors = errors
			else {
				const condition = res.value < 120
				if (condition)
					res.stopFactor = this.stopFactor
			}

			return res
		}
	},
	{
		condition: function (project) {
			return project.status === PROJECT_STATUS_ENUM.APPLICANT_APPROVED.name
		},
		label: 'Дата начала подготовки ПИР',
		name: 'startDateOfPSDPreparation',
		sectionTitle: 'ТЭП, CAPEX',
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

					let months = getMonthDiff(applicationSubmissionDate, startDateOfPSDPreparation)

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
		condition: function (project) {
			return project.status === PROJECT_STATUS_ENUM.APPLICANT_APPROVED.name
		},
		label: 'Дата окончания подготовки ПИР',
		name: 'endDateOfPSDPreparation',
		sectionTitle: 'ТЭП, CAPEX',
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
		condition: function (project) {
			return project.status === PROJECT_STATUS_ENUM.APPLICANT_APPROVED.name
		},
		label: 'Длительность выполнения ПИР',
		name: 'pirDuration',
		sectionTitle: 'ТЭП, CAPEX',
		stopFactor: {
			type: 'additional',
			title: 'Превышен предельный срок выполенния ПИР'
		},
		calc: function (project, dirs, scoring) {
			const res = { value: 0 }

			const errors = checkFields(project,
				['startDateOfPSDPreparation', 'endDateOfPSDPreparation', 'totalArea'])
			if (errors.length)
				res.errors = errors
			else {
				try {
					const startDateOfPSDPreparation = new Date(project.startDateOfPSDPreparation)
					const endDateOfPSDPreparation = new Date(project.endDateOfPSDPreparation)
					res.value = getMonthDiff(startDateOfPSDPreparation, endDateOfPSDPreparation)

					const fields = [
						{
							name: 'buildingType',
							value: project.buildingType,
							title: project.buildingTypeTitle,
						},
					]
					const { error, dirValues } = getDirValue(dirs, 'pirDates', fields, true)
					if (error)
						res.errors = [error]
					else {
						let dirValue = null
						for (const value of dirValues) {
							if (value.objectCategory.from && project.totalArea < value.objectCategory.from)
								continue
							if (value.objectCategory.to && project.totalArea > value.objectCategory.to)
								continue

							dirValue = value.value.value
						}

						if (dirValue) {
							const condition = res.value > dirValue
							if (condition)
								res.stopFactor = this.stopFactor
						} else
							res.errors = [`В справочнике "${dirs['pirDates'].title}" не указано значение по параметрам: ${project.buildingTypeTitle}, площадь ${project.totalArea} м²`]
					}
				} catch (e) {
					console.error(e)
					res.errors = ['Неверный формат даты']
				}
			}

			return res
		}
	},
	{
		condition: function (project) {
			return project.status === PROJECT_STATUS_ENUM.APPLICANT_APPROVED.name
		},
		label: 'Дата начала СМР',
		name: 'startDateOfSMR',
		sectionTitle: 'ТЭП, CAPEX',
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
		condition: function (project) {
			return project.status === PROJECT_STATUS_ENUM.APPLICANT_APPROVED.name
		},
		label: 'Дата окончания СМР',
		name: 'endDateOfSMR',
		sectionTitle: 'ТЭП, CAPEX',
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
		condition: function (project) {
			return project.status === PROJECT_STATUS_ENUM.APPLICANT_APPROVED.name
		},
		label: 'Длительность выполнения СМР',
		name: 'smrDuration',
		sectionTitle: 'ТЭП, CAPEX',
		stopFactor: {
			type: 'additional',
			title: 'Превышен предельный срок выполенния СМР'
		},
		calc: function (project, dirs, scoring) {
			const res = { value: 0 }

			const errors = checkFields(project,
				['startDateOfSMR', 'endDateOfPSDPreparation', 'totalArea'])
			if (errors.length)
				res.errors = errors
			else {
				try {
					const startDateOfSMR = new Date(project.startDateOfSMR)
					const endDateOfSMR = new Date(project.endDateOfSMR)
					res.value = getMonthDiff(startDateOfSMR, endDateOfSMR)

					const fields = [
						{
							name: 'buildingType',
							value: project.buildingType,
							title: project.buildingTypeTitle,
						},
					]
					const { error, dirValues } = getDirValue(dirs, 'smrDates', fields, true)
					if (error)
						res.errors = [error]
					else {
						let dirValue = null
						for (const value of dirValues) {
							if (value.objectCategory.from && project.totalArea < value.objectCategory.from)
								continue
							if (value.objectCategory.to && project.totalArea > value.objectCategory.to)
								continue

							dirValue = value.value.value
						}

						if (dirValue) {
							const condition = res.value > dirValue
							if (condition)
								res.stopFactor = this.stopFactor
						} else
							res.errors = [`В справочнике "${dirs['smrDates'].title}" не указано значение по параметрам: ${project.buildingTypeTitle}, площадь ${project.totalArea} м²`]
					}
				} catch (e) {
					console.error(e)
					res.errors = ['Неверный формат даты']
				}
			}

			return res
		}
	},
	{
		condition: function (project) {
			return project.status === PROJECT_STATUS_ENUM.APPLICANT_APPROVED.name
		},
		label: 'Дата ввода в эксплуатацию',
		name: 'commissioningDate',
		sectionTitle: 'ТЭП, CAPEX',
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
		condition: function (project) {
			return project.status === PROJECT_STATUS_ENUM.APPLICANT_APPROVED.name
		},
		label: 'Соответствие категории и вида разрешенного использования земельного участка целям проекта',
		name: 'complianceOfLandTypeWithProject',
		sectionTitle: 'ТЭП, CAPEX',
		stopFactor: {
			type: 'additional',
			title: 'Выявлено несоответствие  категории и вида разрешенного использования земельного участка целям проекта'
		},
		calc: function (project, dirs, scoring) {
			const res = { value: !!project[this.name] }

			if (!res.value)
				res.stopFactor = this.stopFactor

			res.value = res.value ? 'Да' : 'Нет'

			return res
		}
	},
	{
		condition: function (project) {
			return project.status === PROJECT_STATUS_ENUM.APPLICANT_APPROVED.name
		},
		label: 'Стоимость 1 м² объекта',
		name: 'costPerSqMeter',
		sectionTitle: 'ТЭП, CAPEX',
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
		condition: function (project) {
			return project.status === PROJECT_STATUS_ENUM.APPLICANT_APPROVED.name
		},
		label: 'Количество месяцев функционирования в году',
		name: 'numberOfOperationMonths',
		sectionTitle: 'Экономические показатели',
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
	{
		condition: function (project) {
			return project.status === PROJECT_STATUS_ENUM.APPLICANT_APPROVED.name
		},
		label: 'ADR — отпускной тариф, руб./сутки',
		name: 'adr',
		sectionTitle: 'Экономические показатели',
		stopFactor: {
			type: 'additional',
			title: 'Отклонение показателя ADR от среднего рыночного значения'
		},
		calc: function (project, dirs, scoring) {
			const res = { values: [] }

			const errors = checkFields(project, [], true, true)
			if (errors.length)
				res.errors = errors
			else if (project.objects) {
				for (const object of project.objects) {
					const objectRes = {
						value: object[this.name],
						hotelRating: object.hotelRating,
						objectName: object.objectName,
						errors: [],
					}

					if (!objectRes.value)
						objectRes.errors.push(noValueMsg)
					if (!objectRes.hotelRating)
						objectRes.errors.push(noHotelRatingMsg)

					if (!objectRes.errors.length) {
						const fields = [
							{
								name: 'region',
								value: project.region,
								title: project.regionTitle,
							},
							{
								name: 'buildingCategory',
								value: project.buildingCategory,
								title: project.buildingCategoryTitle,
							},
							{
								name: 'hotelRating',
								value: object.hotelRating,
								title: object.hotelRating + '*',
							},
						]
						const { error, dirValue } = getDirValue(dirs, 'adr', fields)
						if (error)
							objectRes.errors = [error]
						else {
							const condition = Math.abs(objectRes.value / dirValue.value - 1) * 100 > 10
							if (condition)
								objectRes.stopFactor = this.stopFactor
						}
					}

					res.values.push(objectRes)
				}
			}

			return res
		}
	},
	{
		buildingType: 'hotel',
		condition: function (project) {
			return project.buildingType === this.buildingType
				&& project.status === PROJECT_STATUS_ENUM.APPLICANT_APPROVED.name
		},
		label: 'Рентабельность по EBITDA (прогноз Инвестора), %',
		name: 'marginEBITDA',
		sectionTitle: 'Экономические показатели',
		stopFactor: {
			type: 'common',
			title: 'Отклонение показателя EBITDA от средего рыночного значения'
		},
		calc: function (project, dirs, scoring) {
			const res = { value: project[this.name] }

			const errors = checkFields(project, [this.name], true, true)
			if (errors.length)
				res.errors = errors
			else {
				if (!project.objects || !project.objects.length || !project.objects[0].hotelRating)
					res.errors = [noHotelRatingMsg]
				else {
					const fields = [
						{
							name: 'region',
							value: project.region,
							title: project.regionTitle,
						},
						{
							name: 'buildingType',
							value: project.buildingType,
							title: project.buildingTypeTitle,
						},
						{
							name: 'hotelRating',
							value: project.objects[0].hotelRating,
							title: project.objects[0].hotelRating + '*',
						},
					]
					const { error, dirValue } = getDirValue(dirs, 'marginEBITDA', fields)
					if (error)
						res.errors = [error]
					else {
						let condition = false
						if (res.value > dirValue.to)
							condition = Math.abs(res.value / dirValue.to - 1) * 100 > 20
						else if (res.value < dirValue.from)
							condition = Math.abs(res.value / dirValue.from - 1) * 100 > 20
						if (condition)
							res.stopFactor = this.stopFactor
					}
				}
			}

			return res
		}
	},
	{
		buildingType: 'complex',
		condition: function (project) {
			return project.buildingType === this.buildingType
				&& project.status === PROJECT_STATUS_ENUM.APPLICANT_APPROVED.name
		},
		label: 'Рентабельность по EBITDA (прогноз Инвестора), %',
		name: 'marginEBITDA',
		sectionTitle: 'Экономические показатели',
		stopFactor: {
			type: 'common',
			title: 'Отклонение показателя EBITDA от средего рыночного значения'
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
					{
						name: 'buildingType',
						value: project.buildingType,
						title: project.buildingTypeTitle,
					},
				]
				const { error, dirValue } = getDirValue(dirs, 'marginEBITDA', fields)
				if (error)
					res.errors = [error]
				else {
					let condition = false
					if (res.value > dirValue.to)
						condition = Math.abs(res.value / dirValue.to - 1) * 100 > 20
					else if (res.value < dirValue.from)
						condition = Math.abs(res.value / dirValue.from - 1) * 100 > 20
					if (condition)
						res.stopFactor = this.stopFactor
				}
			}

			return res
		}
	},
	{
		condition: function (project) {
			return project.status === PROJECT_STATUS_ENUM.APPLICANT_APPROVED.name
		},
		label: 'Occupancy (OCC) — реальная заполняемость, %',
		name: 'occ',
		sectionTitle: 'Экономические показатели',
		stopFactor: {
			type: 'common',
			title: 'Завышена ожидаемость по загрузке'
		},
		calc: function (project, dirs, scoring) {
			const res = { value: project[this.name] }

			const errors = checkFields(project, [this.name])
			if (errors.length)
				res.errors = errors
			else {
				const condition = Math.abs(res.value / 65 - 1) * 100 > 17
				if (condition)
					res.stopFactor = this.stopFactor
			}

			return res
		}
	},
	{
		condition: function (project) {
			return project.status === PROJECT_STATUS_ENUM.APPLICANT_APPROVED.name
		},
		label: 'Double Occupancy — сколько гостей в среднем проживает в одном номере, чел./номер',
		name: 'doubleOcc',
		sectionTitle: 'Экономические показатели',
		stopFactor: {
			type: 'additional',
			title: 'Отклонение показателя Double Occupancy от установленного значения'
		},
		calc: function (project, dirs, scoring) {
			const res = { value: project[this.name] }

			const errors = checkFields(project, [this.name],
				false, false, true)
			if (errors.length)
				res.errors = errors
			else {
				const fields = [
					{
						name: 'buildingCategory',
						value: project.buildingCategory,
						title: project.buildingCategoryTitle,
					},
				]
				const { error, dirValue } = getDirValue(dirs, 'doubleOcc', fields)
				if (error)
					res.errors = [error]
				else {
					const condition = res.value < dirValue.from || res.value > dirValue.to
					if (condition)
						res.stopFactor = this.stopFactor
				}
			}

			return res
		}
	},
	{
		// todo
		label: 'Участие в проекте гостиничного оператора (вознаграждение за управление проектируемым объектом)',
		name: 'remunerationForManagement',
		sectionTitle: 'Экономические показатели',
		stopFactor: {
			type: 'additional',
			title: 'Завышена стоимость услуг за управление объектом'
		},
	},
	{
		// todo
		label: 'Количество новых рабочих мест, чел.',
		name: 'totalNumberOfNewJobs',
		sectionTitle: 'Экономические показатели',
		stopFactor: {
			type: 'additional',
			title: 'Отклонение показателя кол-во новых рабочих мест от среднего значения'
		},
	},
	{
		buildingType: 'hotel',
		condition: function (project) {
			return project.buildingType === this.buildingType
				&& project.status === PROJECT_STATUS_ENUM.APPLICANT_APPROVED.name
		},
		label: 'Количество сотрудников на 1 номер, чел.',
		name: 'staffPerRoom',
		sectionTitle: 'Экономические показатели',
		stopFactor: {
			type: 'additional',
			title: 'Необходимо уточнить обеспеченность трудовыми ресурсами'
		},
		calc: function (project, dirs, scoring) {
			const res = { value: project[this.name] }

			const errors = checkFields(project, [this.name], true, true)
			if (errors.length)
				res.errors = errors
			else {
				if (!project.objects || !project.objects.length || !project.objects[0].hotelRating)
					res.errors = [noHotelRatingMsg]
				else {
					const fields = [
						{
							name: 'region',
							value: project.region,
							title: project.regionTitle,
						},
						{
							name: 'buildingType',
							value: project.buildingType,
							title: project.buildingTypeTitle,
						},
						{
							name: 'hotelRating',
							value: project.objects[0].hotelRating,
							title: project.objects[0].hotelRating + '*',
						},
					]
					const { error, dirValue } = getDirValue(dirs, 'staffPerRoom', fields)
					if (error)
						res.errors = [error]
					else {
						let condition = false
						if (res.value > dirValue.to)
							condition = Math.abs(res.value / dirValue.to - 1) * 100 > 20
						else if (res.value < dirValue.from)
							condition = Math.abs(res.value / dirValue.from - 1) * 100 > 20
						if (condition)
							res.stopFactor = this.stopFactor
					}
				}
			}

			return res
		}
	},
	{
		buildingType: 'complex',
		condition: function (project) {
			return project.buildingType === this.buildingType
				&& project.status === PROJECT_STATUS_ENUM.APPLICANT_APPROVED.name
		},
		label: 'Количество сотрудников на 1 номер, чел.',
		name: 'staffPerRoom',
		sectionTitle: 'Экономические показатели',
		stopFactor: {
			type: 'additional',
			title: 'Необходимо уточнить обеспеченность трудовыми ресурсами'
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
					{
						name: 'buildingType',
						value: project.buildingType,
						title: project.buildingTypeTitle,
					},
				]
				const { error, dirValue } = getDirValue(dirs, 'staffPerRoom', fields)
				if (error)
					res.errors = [error]
				else {
					let condition = false
					if (res.value > dirValue.to)
						condition = Math.abs(res.value / dirValue.to - 1) * 100 > 20
					else if (res.value < dirValue.from)
						condition = Math.abs(res.value / dirValue.from - 1) * 100 > 20
					if (condition)
						res.stopFactor = this.stopFactor
				}
			}

			return res
		}
	},
	{
		condition: function (project) {
			return project.status === PROJECT_STATUS_ENUM.APPLICANT_APPROVED.name
		},
		label: 'Доля средств Корпорации Туризм.РФ в уставном капитале, %',
		name: 'corporationFundsShare',
		sectionTitle: 'Финансирование',
		stopFactor: {
			type: 'additional',
			title: 'Завышен риск миноритарного участника'
		},
		calc: function (project, dirs, scoring) {
			const res = { value: project[this.name] }

			const errors = checkFields(project, [this.name])
			if (errors.length)
				res.errors = errors
			else {
				const condition = res.value < 25
				if (condition)
					res.stopFactor = this.stopFactor
			}

			return res
		}
	},
	{
		condition: function (project) {
			return project.status === PROJECT_STATUS_ENUM.APPLICANT_APPROVED.name
		},
		label: 'Доля кредитных средств в объеме финансирования, %',
		name: 'creditFundsShare',
		sectionTitle: 'Финансирование',
		stopFactor: {
			type: 'additional',
			title: 'Высокий уровень закредитованности проекта'
		},
		calc: function (project, dirs, scoring) {
			const res = { value: project[this.name] }

			const errors = checkFields(project, [this.name])
			if (errors.length)
				res.errors = errors
			else {
				const condition = res.value > 90
				if (condition)
					res.stopFactor = this.stopFactor
			}

			return res
		}
	},
	{
		condition: function (project) {
			return project.status === PROJECT_STATUS_ENUM.APPLICANT_APPROVED.name
		},
		label: 'Уровень долговой нагрузки, EBITDA / (I + D)',
		name: 'debtCoverageRatio',
		sectionTitle: 'Финансирование',
		stopFactor: {
			type: 'common',
			title: 'Высокий уровень закредитованности проекта'
		},
		calc: function (project, dirs, scoring) {
			const res = { value: project[this.name] }

			const errors = checkFields(project, [this.name])
			if (errors.length)
				res.errors = errors
			else {
				const condition = res.value < 1.3
				if (condition)
					res.stopFactor = this.stopFactor
			}

			return res
		}
	},
	{
		condition: function (project) {
			return project.needOfSoftLoan
				&& project.status === PROJECT_STATUS_ENUM.APPLICANT_APPROVED.name
		},
		label: 'Тип проекта',
		name: 'buildingType',
		sectionTitle: 'Льготное кредитование',
		stopFactor: {
			type: 'additional',
			title: 'Тип проекта не соответствует требованиям программы льготного кредитования'
		},
		calc: function (project, dirs, scoring) {
			const res = { value: project.buildingTypeTitle || project.buildingType }

			const condition = !res.value
			if (condition)
				res.stopFactor = this.stopFactor

			return res
		}
	},
	{
		buildingType: 'hotel',
		condition: function (project) {
			return project.needOfSoftLoan
				&& project.buildingType === this.buildingType
				&& project.status === PROJECT_STATUS_ENUM.APPLICANT_APPROVED.name
		},
		label: 'Размер номерного фонда',
		name: 'totalNumberOfRooms',
		sectionTitle: 'Льготное кредитование',
		stopFactor: {
			type: 'additional',
			title: 'Размер номерного фонда не соответствует требованиям программы льготного кредитования'
		},
		calc: function (project, dirs, scoring) {
			const res = { value: project[this.name] }

			const errors = checkFields(project, [this.name])
			if (errors.length)
				res.errors = errors
			else {
				const condition = res.value < 120
				if (condition)
					res.stopFactor = this.stopFactor
			}

			return res
		}
	},
	{
		buildingType: 'hotel',
		condition: function (project) {
			return project.needOfSoftLoan
				&& project.buildingType === this.buildingType
				&& project.status === PROJECT_STATUS_ENUM.APPLICANT_APPROVED.name
		},
		label: 'Площадь гостиницы',
		name: 'hotelArea',
		sectionTitle: 'Льготное кредитование',
		stopFactor: {
			type: 'additional',
			title: 'Площадь гостиницы не соответствует требованиям программы льготного кредитования'
		},
		calc: function (project, dirs, scoring) {
			const res = { value: project[this.name] }

			const errors = checkFields(project, [this.name])
			if (errors.length)
				res.errors = errors
			else {
				const condition = res.value < 5000
				if (condition)
					res.stopFactor = this.stopFactor
			}

			return res
		}
	},
	{
		condition: function (project) {
			return project.needOfSoftLoan
				&& project.status === PROJECT_STATUS_ENUM.APPLICANT_APPROVED.name
		},
		label: 'Соответствие установленному размеру льготного кредита',
		name: 'bankLoanAmount',
		sectionTitle: 'Льготное кредитование',
		stopFactor: {
			type: 'additional',
			title: 'Не выполнено требование по критерию размера льготного кредита'
		},
		calc: function (project, dirs, scoring) {
			const res = { value: project[this.name] }

			const errors = checkFields(project, [this.name])
			if (errors.length)
				res.errors = errors
			else {
				const condition = res.value < 100000 || res.value > 70000000
				if (condition)
					res.stopFactor = this.stopFactor
			}

			return res
		}
	},
	{
		condition: function (project) {
			return project.needOfSoftLoan
				&& project.status === PROJECT_STATUS_ENUM.APPLICANT_APPROVED.name
		},
		label: 'Всесезонность',
		name: 'numberOfOperationMonths',
		sectionTitle: 'Льготное кредитование',
		stopFactor: {
			type: 'common',
			title: 'Не выполнено требование программы льготного кредитования по круглогодичности функционирования'
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
	{
		condition: function (project) {
			return project.needOfSoftLoan
				&& project.status === PROJECT_STATUS_ENUM.APPLICANT_APPROVED.name
		},
		label: 'Наличие правоустанавливающих документов на земельные участки (объекты)',
		name: 'hasOwnershipRight',
		sectionTitle: 'Льготное кредитование',
		stopFactor: {
			type: 'additional',
			title: 'Отсутствуют правоустанавливающие документы на земельные участки (объекты)'
		},
		calc: function (project, dirs, scoring) {
			const res = { value: !!project[this.name] }

			const condition = !res.value
			if (condition)
				res.stopFactor = this.stopFactor

			res.value = res.value ? 'Да' : 'Нет'

			return res
		}
	},
	{
		condition: function (project) {
			return project.needOfSoftLoan
				&& project.status === PROJECT_STATUS_ENUM.APPLICANT_APPROVED.name
		},
		label: 'Вид работ по проекту (строительство или реконструкция)',
		name: 'typeOfWork',
		sectionTitle: 'Льготное кредитование',
		stopFactor: {
			type: 'additional',
			title: 'Вид работ по проекту не соответствует требованиям программы льготного кредитования'
		},
		calc: function (project, dirs, scoring) {
			const res = { value: project[this.name] }

			const condition = !res.value
			if (condition)
				res.stopFactor = this.stopFactor
			else {
				const dirValue = getDirTitle(dirs, 'typeOfWork', res.value)
				if (dirValue)
					res.value = dirValue.title
			}

			return res
		}
	},
	{
		buildingType: 'hotel',
		condition: function (project) {
			return project.needOfSoftLoan
				&& project.buildingType === this.buildingType
				&& project.status === PROJECT_STATUS_ENUM.APPLICANT_APPROVED.name
		},
		label: 'Размер льготного кредита на номер',
		name: 'bankLoanAmount',
		sectionTitle: 'Льготное кредитование',
		stopFactor: {
			type: 'additional',
			title: 'Превышен предельный размер льготного кредита на номер'
		},
		calc: function (project, dirs, scoring) {
			const res = { value: '' }

			const errors = checkFields(project, [this.name, 'totalNumberOfRooms'])
			if (errors.length)
				res.errors = errors
			else {
				res.value = project[this.name] / project.totalNumberOfRooms
				const condition = res.value > 20000
				if (condition)
					res.stopFactor = this.stopFactor
			}

			return res
		}
	},
	{
		buildingType: 'complex',
		condition: function (project) {
			return project.needOfSoftLoan
				&& project.buildingType === this.buildingType
				&& project.status === PROJECT_STATUS_ENUM.APPLICANT_APPROVED.name
		},
		label: 'Размер льготного кредита на номер',
		name: 'bankLoanAmount',
		sectionTitle: 'Льготное кредитование',
		stopFactor: {
			type: 'additional',
			title: 'Превышен предельный размер льготного кредита на номер'
		},
		calc: function (project, dirs, scoring) {
			const res = { value: '' }

			const errors = checkFields(project, [this.name, 'totalNumberOfRooms'])
			if (errors.length)
				res.errors = errors
			else {
				res.value = project[this.name] / project.totalNumberOfRooms

				const condition = res.value > 55000
				if (condition)
					res.stopFactor = this.stopFactor

				res.value = +res.value.toFixed(2)
			}

			return res
		}
	},
]

function checkStopFactors(project, role, dirs) {
	const scoring = {
		indicators: [],
		sections: []
	}

	for (const indicator of indicators) {
		if (indicator.condition && !indicator.condition(project, role))
			continue

		const nestedScoring = []

		if (indicator.indicators)
			for (const nestedIndicator of indicator.indicators) {
				if (nestedIndicator.condition && !nestedIndicator.condition(project))
					continue

				nestedScoring.push(...checkStopFactor({
					...nestedIndicator,
					sectionTitle: indicator.sectionTitle
				}, project, dirs))
			}

		if (indicator.calc)
			scoring.indicators.push(...checkStopFactor(indicator, project, dirs, nestedScoring))
		if (nestedScoring.length)
			scoring.indicators.push(...nestedScoring)
	}

	scoring.sections = scoring.indicators.reduce((acc, row) => {
		if (row.errors)
			row.error = row.errors.join('\n')

		let curSection

		for (const section of acc)
			if (section.title === row.section) {
				curSection = section
				break
			}

		if (!curSection) {
			curSection = {
				title: row.section,
				indicators: [],
				errorsCount: 0,
				passedCount: 0,
				hasCommonStops: false,
				hasAdditionalStops: false
			}
			acc.push(curSection)
		}

		curSection.indicators.push(row)

		if (row.errors && row.errors.includes(noValueMsg))
			curSection.errorsCount++
		if (row.stopFactor?.type === 'common')
			curSection.hasCommonStops = true
		if (row.stopFactor?.type === 'additional')
			curSection.hasAdditionalStops = true

		curSection.passedCount = curSection.indicators.length - curSection.errorsCount
		curSection.progress = curSection.passedCount / curSection.indicators.length

		return acc
	}, [])

	return scoring
}

function checkStopFactor(indicator, project, dirs, scoring) {
	const scoringResults = []
	const scoringResult = {
		name: indicator.name,
		label: indicator.label,
		section: indicator.sectionTitle,
	}

	const res = indicator.calc(project, dirs, scoring)
	if (res) {
		const { value, errors, stopFactor, values } = res

		if (!(errors && errors.length) && values)
			values.forEach(row => {
				const objectRes = {
					...scoringResult,
					value: row.value,
					errors: row.errors,
					stopFactor: row.stopFactor,
				}

				const objectName = row.objectName ? `, "${row.objectName}"` : ''
				const hotelRating = row.hotelRating ? `, Гостиница ${row.hotelRating}*` : ', Гостиница'

				objectRes.label = `${objectRes.label}${objectName}${hotelRating}`

				scoringResults.push(objectRes)
			})
		else {
			scoringResult.value = value

			if (errors)
				scoringResult.errors = errors
			if (stopFactor)
				scoringResult.stopFactor = stopFactor

			scoringResults.push(scoringResult)
		}
	}

	return scoringResults
}