<script>
	import { DIRs, investors } from '$lib/stores'
	import { estimate } from '$lib/stopFactors'
	import Input from '$lib/components/input.svelte'
	import Check from '$lib/components/check.svelte'
	import Select from '$lib/components/select.svelte'
	import { openModal } from '$lib/components/modals.svelte'
	import { goto } from '$app/navigation'

	// todo check tab problem

	export let data

	let investor
	let highlightSave = false
	let activeInvestorTab = 1
	let errors = {}

	$: {
		console.log('projects/[slug], data', data)
		setInvestor(data)
	}

	function getDirValue(dirName) {
		const values = $DIRs[dirName]?.values || []
		for (const valueRow of values)
			if (valueRow.region === investor.region
				&& valueRow.buildingType === investor.buildingType
				&& (valueRow.buildingCategory || '') === (investor.buildingCategory || ''))
				return [true, valueRow.value]

		const dirTitle = $DIRs[dirName] ? $DIRs[dirName].title : dirName
		const searchFieldsStr = `${investor.regionsTitle}, ${investor.buildingTypeTitle}`
			+ (investor.buildingCategoryTitle ? `, ${investor.buildingCategoryTitle}` : '')
		return [false, `В справочнике "${dirTitle}" не указано значение по параметрам: ${searchFieldsStr}.`]
	}

	function getTitleFromDirByValue(dirName, dirValueField, dirTitleField, value) {
		const values = $DIRs[dirName].values.filter(row => row.name === value)
		if (values.length)
			return values[0][dirTitleField]
		return ''
	}

	const calcFields = {
		absLiqRatio: {
			label: 'Коэффициент абсолютной ликвидности',
			name: 'absLiqRatio',
			calc: function () {
				if (!investor.kfv || !investor.ds || !investor.ko)
					return investor[this.name] = ''
				const value = (investor.kfv + investor.ds) / investor.ko
				investor[this.name] = +value.toFixed(2)
			}
		},
		fastLiqRatio: {
			label: 'Коэффициент быстрой ликвидности',
			name: 'fastLiqRatio',
			calc: function () {
				if (!investor.kdz || !investor.kfv || !investor.ds || !investor.ko)
					return investor[this.name] = ''
				const value = (investor.kdz + investor.kfv + investor.ds) / investor.ko
				investor[this.name] = +value.toFixed(2)
			}
		},
		currentLiqRatio: {
			label: 'Коэффициент текущей ликвидности',
			name: 'currentLiqRatio',
			calc: function () {
				if (!investor.oa || !investor.ko)
					return investor[this.name] = ''
				const value = investor.oa / investor.ko
				investor[this.name] = +value.toFixed(2)
			}
		},
		debtToEquityRatio: {
			label: 'Коэфициент соотношения заемных и собственных средств',
			name: 'debtToEquityRatio',
			calc: function () {
				if (!investor.sk || !investor.ko || !investor.do)
					return investor[this.name] = ''
				const value = (investor.do + investor.ko) / investor.sk
				investor[this.name] = +value.toFixed(2)
			}
		},
		solvencyRatio: {
			label: 'Коэффициент общей платежеспособности',
			name: 'solvencyRatio',
			calc: function () {
				if (!investor.kr || !investor.ko || !investor.do)
					return investor[this.name] = ''
				const value = investor.kr / (investor.do + investor.ko)
				investor[this.name] = +value.toFixed(2)
			}
		},
		costPerSqMeter: {
			label: 'Стоимость 1 м² объекта, тыс. руб.',
			name: 'costPerSqMeter',
			calc: function () {
				if (!investor.totalCost || !investor.totalArea)
					return investor[this.name] = ''
				const value = investor.totalCost / investor.totalArea
				investor[this.name] = +value.toFixed(2)
			}
		},
		costPerRoom: {
			label: 'Стоимость 1 номера, тыс. руб.',
			name: 'costPerRoom',
			calc: function () {
				if (!investor.totalCost || !investor.numberOfRooms)
					return investor[this.name] = ''
				const value = investor.totalCost / investor.numberOfRooms
				investor[this.name] = +value.toFixed(2)
			}
		},
		shareOfRoomsArea: {
			label: 'Доля площадей КСР в составе объекта (для МФК), %',
			name: 'shareOfRoomsArea',
			calc: function () {
				if (!investor.totalArea || !investor.roomsArea)
					return investor[this.name] = ''
				const value = (investor.roomsArea / investor.totalArea) * 100
				investor[this.name] = +value.toFixed(2)
			}
		},
		totalArea: {
			label: 'Общая площадь объектов, м²',
			name: 'totalArea',
			calc: function () {
				const value = parseFloat(investor.hotelArea || 0)
					+ parseFloat(investor.infrastructureArea || 0)
				investor[this.name] = +value.toFixed(2)
				calcFields.costPerSqMeter.calc()
				calcFields.revenuePerSqMeter.calc()
			}
		},
		hotelArea: {
			label: 'Площадь гостиницы, м²',
			name: 'hotelArea',
			calc: function () {
				const value = parseFloat(investor.roomsArea || 0)
					+ parseFloat(investor.restaurantsArea || 0)
					+ parseFloat(investor.confRoomsArea || 0)
					+ parseFloat(investor.spaAndGymArea || 0)
					+ parseFloat(investor.poolsArea || 0)
					+ parseFloat(investor.hotelOthersArea || 0)
				investor[this.name] = +value.toFixed(2)
				calcFields.totalArea.calc()
			}
		},
		infrastructureArea: {
			label: 'Площадь дополнительной инфраструктуры (отдельные объекты), м²',
			name: 'infrastructureArea',
			calc: function () {
				const value = parseFloat(investor.aquaparkArea || 0)
					+ parseFloat(investor.sportComplexArea || 0)
					+ parseFloat(investor.amusementParkArea || 0)
					+ parseFloat(investor.thermalComplexArea || 0)
					+ parseFloat(investor.infrastructureOthersArea || 0)
				investor[this.name] = +value.toFixed(2)
				calcFields.totalArea.calc()
			}
		},
		totalCost: {
			label: 'Общая стоимость объектов и дополнительной инфраструктуры (с НДС, в ценах соответствующих лет), тыс. руб',
			name: 'totalCost',
			calc: function () {
				const value = parseFloat(investor.totalCostOfBuilding || 0)
					+ parseFloat(investor.totalCostOfBuildingInfrastructure || 0)
				investor[this.name] = +value.toFixed(2)
				calcFields.costPerRoom.calc()
				calcFields.costPerSqMeter.calc()
			}
		},
		totalCostOfBuilding: {
			label: 'Стоимость строительства объектов, тыс. руб.',
			name: 'totalCostOfBuilding',
			calc: function () {
				const value = parseFloat(investor.totalCostOfBuildingRooms || 0)
					+ parseFloat(investor.totalCostOfBuildingRestaurants || 0)
					+ parseFloat(investor.totalCostOfBuildingConfRooms || 0)
					+ parseFloat(investor.totalCostOfBuildingSpaAndGym || 0)
					+ parseFloat(investor.totalCostOfBuildingPools || 0)
					+ parseFloat(investor.totalCostOfBuildingHotelOthers || 0)
				investor[this.name] = +value.toFixed(2)
				calcFields.totalCost.calc()
			}
		},
		totalCostOfBuildingInfrastructure: {
			label: 'Стоимость строительства дополнительной инфраструктуры (отдельные объекты), тыс. руб.',
			name: 'totalCostOfBuildingInfrastructure',
			calc: function () {
				const value = parseFloat(investor.totalCostOfBuildingAquapark || 0)
					+ parseFloat(investor.totalCostOfBuildingSportComplex || 0)
					+ parseFloat(investor.totalCostOfBuildingAmusementPark || 0)
					+ parseFloat(investor.totalCostOfBuildingThermalComplex || 0)
					+ parseFloat(investor.totalCostOfBuildingInfrastructureOthers || 0)
				investor[this.name] = +value.toFixed(2)
				calcFields.totalCost.calc()
			}
		},
		occ: {
			label: 'Occupancy (OCC) — реальная заполняемость, %',
			name: 'occ',
			calc: function () {
				if (!investor.totalRoomsOccupied || !investor.numberOfRooms)
					return investor[this.name] = ''
				const value = (investor.totalRoomsOccupied / investor.numberOfRooms) * 100
				investor[this.name] = +value.toFixed(2)
			}
		},
		doubleOcc: {
			label: 'Double Occupancy — сколько гостей в среднем проживает в одном номере, чел./номер',
			name: 'doubleOcc',
			calc: function () {
				if (!investor.totalRoomsOccupied || !investor.totalGuestsInHouse) {
					investor[this.name] = ''
					calcFields.touristFlow.calc()
					calcFields.touristPerNightFlow.calc()
					return
				}
				const value = investor.totalGuestsInHouse / investor.totalRoomsOccupied
				investor[this.name] = +value.toFixed(2)
				calcFields.touristFlow.calc()
				calcFields.touristPerNightFlow.calc()
			}
		},
		touristPerNightFlow: {
			label: 'Турпоток, чел./ночей за год',
			name: 'touristPerNightFlow',
			calc: function () {
				if (!investor.totalRoomsOccupied || !investor.doubleOcc)
					return investor[this.name] = ''
				const value = investor.totalRoomsOccupied * investor.doubleOcc * 365
				investor[this.name] = +value.toFixed(2)
			}
		},
		touristFlow: {
			label: 'Турпоток, чел./год',
			name: 'touristFlow',
			calc: function () {
				if (!investor.totalRoomsOccupied || !investor.doubleOcc) {
					investor[this.name] = ''
					calcFields.revPAC.calc()
					return
				}

				const [status, dirValue] = getDirValue('averageLengthOfStay')
				if (!status) {
					errors[this.name] = dirValue
					investor[this.name] = ''
					calcFields.revPAC.calc()
					return
				}

				const value = (investor.totalRoomsOccupied * investor.doubleOcc * 365) / dirValue.value
					+ parseFloat(investor.totalExternalGuests || 0) * 365
				investor[this.name] = +value.toFixed(2)
				calcFields.revPAC.calc()
			}
		},
		totalRevenues: {
			label: 'Общая выручка, тыс. руб. в год после выхода на проектную нагрузку',
			name: 'totalRevenues',
			calc: function () {
				const value = parseFloat(investor.roomRevenue || 0)
					+ parseFloat(investor.restaurantsRevenue || 0)
					+ parseFloat(investor.spaAndGymRevenue || 0)
					+ parseFloat(investor.aquaparkRevenue || 0)
					+ parseFloat(investor.glkRevenue || 0)
					+ parseFloat(investor.amusementsRevenue || 0)
					+ parseFloat(investor.otherRevenue || 0)
				investor[this.name] = +value.toFixed(2)
				calcFields.revPAC.calc()
				calcFields.revenuePerSqMeter.calc()
			}
		},
		revPAR: {
			label: 'RevPAR — средняя выручка за номер в год, тыс. руб.',
			name: 'revPAR',
			calc: function () {
				if (!investor.roomRevenue || !investor.numberOfRooms)
					return investor[this.name] = ''

				const value = investor.roomRevenue / investor.numberOfRooms
				investor[this.name] = +value.toFixed(2)
			}
		},
		revPAC: {
			label: 'RevPAC — доход на гостя. Включает доход от продажи  номерного фонда и других услуг, тыс. руб.',
			name: 'revPAC',
			calc: function () {
				if (!investor.totalRevenues || !investor.touristFlow)
					return investor[this.name] = ''

				const value = investor.totalRevenues / investor.touristFlow
				investor[this.name] = +value.toFixed(2)
			}
		},
		staffPerRoom: {
			label: 'Количество сотрудников на 1 номер, чел.',
			name: 'staffPerRoom',
			calc: function () {
				if (!investor.numberOfNewJobs || !investor.numberOfRooms)
					return investor[this.name] = ''

				const value = investor.numberOfNewJobs / investor.numberOfRooms
				investor[this.name] = +value.toFixed(2)
			}
		},
		revenuePerSqMeter: {
			label: 'Выручка на 1 м² (с НДС , после выхода на плановую загрузку (ориентировочно 3 год экспуатационной фазы), тыс. руб.',
			name: 'revenuePerSqMeter',
			calc: function () {
				if (!investor.totalRevenues || !investor.totalArea)
					return investor[this.name] = ''

				const value = investor.totalRevenues / investor.totalArea
				investor[this.name] = +value.toFixed(2)
			}
		},
		roomRevenuePerSqMeter: {
			label: 'Выручка на 1 м² от реализации номеров (Room Revenue), тыс. руб. в год после выхода на проектную нагрузку',
			name: 'roomRevenuePerSqMeter',
			calc: function () {
				if (!investor.roomRevenue || !investor.roomsArea)
					return investor[this.name] = ''

				const value = investor.roomRevenue / investor.roomsArea
				investor[this.name] = +value.toFixed(2)
			}
		},
		restaurantsRevenuePerSqMeter: {
			label: 'Выручка на 1 м² ресторанов, тыс. руб. в год после выхода на проектную нагрузку',
			name: 'restaurantsRevenuePerSqMeter',
			calc: function () {
				if (!investor.restaurantsRevenue || !investor.restaurantsArea)
					return investor[this.name] = ''

				const value = investor.restaurantsRevenue / investor.restaurantsArea
				investor[this.name] = +value.toFixed(2)
			}
		},
		spaAndGymRevenuePerSqMeter: {
			label: 'Выручка на 1 м² СПА и фитнес-центров, тыс. руб. в год после выхода на проектную нагрузку',
			name: 'spaAndGymRevenuePerSqMeter',
			calc: function () {
				if (!investor.spaAndGymRevenue || !investor.spaAndGymArea)
					return investor[this.name] = ''

				const value = investor.spaAndGymRevenue / investor.spaAndGymArea
				investor[this.name] = +value.toFixed(2)
			}
		},
		aquaparkRevenuePerSqMeter: {
			label: 'Выручка на 1 м² аквапарка, тыс. руб. в год после выхода на проектную нагрузку',
			name: 'aquaparkRevenuePerSqMeter',
			calc: function () {
				if (!investor.aquaparkRevenue || !investor.aquaparkArea)
					return investor[this.name] = ''

				const value = investor.aquaparkRevenue / investor.aquaparkArea
				investor[this.name] = +value.toFixed(2)
			}
		},
		amusementsRevenuePerSqMeter: {
			label: 'Выручка на 1 м² парка развлечений, аттракционов, тыс. руб. в год после выхода на проектную нагрузку',
			name: 'amusementsRevenuePerSqMeter',
			calc: function () {
				if (!investor.amusementsRevenue || !investor.amusementParkArea)
					return investor[this.name] = ''

				const value = investor.amusementsRevenue / investor.amusementParkArea
				investor[this.name] = +value.toFixed(2)
			}
		},
		totalFunds: {
			label: 'Общий объем финансирования (Total Founds), тыс. руб.',
			name: 'totalFunds',
			calc: function () {
				const value = parseFloat(investor.ownFunds || 0)
					+ parseFloat(investor.bankLoanAmount || 0)
				investor[this.name] = +value.toFixed(2)
				calcFields.creditFundsShare.calc()
				calcFields.EBITDA.calc()
			}
		},
		ownFunds: {
			label: 'Собственные средства, тыс. руб.',
			name: 'ownFunds',
			calc: function () {
				const value = parseFloat(investor.investorContributionCash || 0)
					+ parseFloat(investor.investorContributionNotCash || 0)
					+ parseFloat(investor.investorContributionCashNotInCapital || 0)
					+ parseFloat(investor.investorLoan || 0)
					+ parseFloat(investor.corporationContributionCash || 0)
					+ parseFloat(investor.corporationLoan || 0)
					+ parseFloat(investor.landSaleRevenue || 0)
				investor[this.name] = +value.toFixed(2)
				calcFields.totalFunds.calc()
			}
		},
		corporationFundsShare: {
			label: 'Доля средств Корпорации Туризм.РФ в уставном капитале, %',
			name: 'corporationFundsShare',
			calc: function () {
				if (!(investor.corporationContributionCash || investor.corporationLoan)
					|| !(investor.investorContributionCash || investor.investorContributionNotCash))
					return investor[this.name] = ''

				const corporationContribution = parseFloat(investor.corporationContributionCash || 0)
					+ parseFloat(investor.corporationLoan || 0)
				const investorContribution = parseFloat(investor.investorContributionCash || 0)
					+ parseFloat(investor.investorContributionNotCash || 0)
				const value = corporationContribution / (corporationContribution + investorContribution) * 100
				investor[this.name] = +value.toFixed(2)
			}
		},
		creditFundsShare: {
			label: 'Доля кредитных средств в объеме финансирования, %',
			name: 'creditFundsShare',
			calc: function () {
				if (!investor.bankLoanAmount || !investor.totalFunds)
					return investor[this.name] = ''

				const value = (investor.bankLoanAmount / investor.totalFunds) * 100
				investor[this.name] = +value.toFixed(2)
			}
		},
		debtCoverageRatio: {
			label: 'Уровень долговой нагрузки, EBITDA / (I + D)',
			name: 'debtCoverageRatio',
			calc: function () {
				if (!investor.EBITDA || !investor.interestPayments || !investor.loanBodyPayments)
					return investor[this.name] = ''

				const value = investor.EBITDA / (investor.interestPayments + investor.loanBodyPayments)
				investor[this.name] = +value.toFixed(2)
			}
		},
		EBITDA: {
			label: 'EBITDA, руб. (за год после ввода в эксплуатацию)',
			name: 'EBITDA',
			calc: function () {
				if (!investor.totalFunds || !investor.marginEBITDA) {
					investor[this.name] = ''
					calcFields.debtCoverageRatio.calc()
					return
				}

				const value = investor.totalFunds * investor.marginEBITDA
				investor[this.name] = +value.toFixed(2)
				calcFields.debtCoverageRatio.calc()
			}
		},
		interestPayments: {
			label: 'Процентные платежи в год (I)',
			name: 'interestPayments',
			calc: function () {
				if (!investor.bankLoanAmount || !investor.plannedLoanRate || !investor.loanTerm) {
					investor[this.name] = ''
					calcFields.debtCoverageRatio.calc()
					return
				}

				const value = investor.bankLoanAmount / investor.loanTerm * (investor.plannedLoanRate / 100)
				investor[this.name] = +value.toFixed(2)
				calcFields.debtCoverageRatio.calc()
			}
		},
		loanBodyPayments: {
			label: 'Выплаты тела кредита, руб. в год (D)',
			name: 'loanBodyPayments',
			calc: function () {
				if (!investor.bankLoanAmount || !investor.loanTerm) {
					investor[this.name] = ''
					calcFields.debtCoverageRatio.calc()
					return
				}

				const value = investor.bankLoanAmount / investor.loanTerm
				investor[this.name] = +value.toFixed(2)
				calcFields.debtCoverageRatio.calc()
			}
		},
	}

	const tabs = [
		{
			ind: 1,
			title: 'Оценка Инвестора',
			fields: [
				{
					label: 'Коэффициент абсолютной ликвидности',
					name: 'absLiqRatio',
					type: 'number',
					disabled: true
				},
				{
					label: 'Краткосрочные финансовые вложения',
					name: 'kfv',
					type: 'number',
					min: 0,
					calc: () => {
						calcFields.absLiqRatio.calc()
						calcFields.fastLiqRatio.calc()
					}
				},
				{
					label: 'Денежные средства и их эквиваленты',
					name: 'ds',
					type: 'number',
					min: 0,
					calc: () => {
						calcFields.absLiqRatio.calc()
						calcFields.fastLiqRatio.calc()
					}
				},
				{
					label: 'Краткосрочные обязательства',
					name: 'ko',
					type: 'number',
					min: 0,
					calc: () => {
						calcFields.absLiqRatio.calc()
						calcFields.fastLiqRatio.calc()
						calcFields.currentLiqRatio.calc()
						calcFields.debtToEquityRatio.calc()
						calcFields.solvencyRatio.calc()
					}
				},
				{
					label: 'Коэффициент быстрой ликвидности',
					name: 'fastLiqRatio',
					type: 'number',
					disabled: true
				},
				{
					label: 'Краткосрочная дебиторская задолженность',
					name: 'kdz',
					type: 'number',
					min: 0,
					calc: () => calcFields.fastLiqRatio.calc()
				},
				{
					label: 'Коэффициент текущей ликвидности',
					name: 'currentLiqRatio',
					type: 'number',
					disabled: true
				},
				{
					label: 'Оборотные активы',
					name: 'oa',
					type: 'number',
					min: 0,
					calc: () => calcFields.currentLiqRatio.calc()
				},
				{
					label: 'Коэфициент соотношения заемных и собственных средств',
					name: 'debtToEquityRatio',
					type: 'number',
					disabled: true
				},
				{
					label: 'Долгосрочные обязательства',
					name: 'do',
					type: 'number',
					min: 0,
					calc: () => {
						calcFields.debtToEquityRatio.calc()
						calcFields.solvencyRatio.calc()
					}
				},
				{
					label: 'Собственный капитал',
					name: 'sk',
					type: 'number',
					min: 0,
					calc: () => calcFields.debtToEquityRatio.calc()
				},
				{
					label: 'Коэффициент общей платежеспособности',
					name: 'solvencyRatio',
					type: 'number',
					disabled: true
				},
				{
					label: 'Капитал и резервы',
					name: 'kr',
					type: 'number',
					min: 0,
					calc: () => calcFields.solvencyRatio.calc()
				},
				{
					label: 'Наличие права пользования/владения на имущество (объекты, земельные участки), вносимым в виде имущественного взноса',
					name: 'hasOwnershipRight',
					type: 'check',
				},
				{
					label: 'Наличие обременения на имущество (объекты, земельные участки) вносимое в виде имущественного взноса',
					name: 'hasPropertyEncumbrance',
					type: 'check',
				},
				{
					label: 'Для физических лиц - наличие документов, подтверждающих источники происхождения собственных средств (доходов, имущества)',
					name: 'hasSourceOfFundsDocs',
					type: 'check',
				},
				{
					label: 'Участие в уставном капитале инвестора резидента недружественной страны',
					name: 'hasUnfriendlyCountryCapital',
					type: 'check',
				},
				{
					label: 'За последний отчетный год бухгалтерская отчетность не сдавалась или сдавалась с нулевым показателем',
					name: 'noFinancialReportsForLastYear',
					type: 'check',
				},
				{
					label: 'Среднесписочная численность сотрудников за последний отчетный год была как у компаний без сотрудников: ни одного или один сотрудник, являющийся руководителем',
					name: 'reportWithNoEmployeesForLastYear',
					type: 'check',
				},
				{
					label: 'Отсутствие штата персонала',
					name: 'hasLackOfStaff',
					type: 'check',
				},
				{
					label: 'Отсутствие материальных и финансовых ресурсов',
					name: 'noFunds',
					type: 'check',
				},
				{
					label: 'Наличие информации, свидетельствующей об отсутствии ведения реальной экономической деятельности, в т.ч. способе получения сведений об инвесторе (сайте, реклама в СМИ, отзывы в Интернете, рекомендации)',
					name: 'noEconomicActivity',
					type: 'check',
				},
				{
					label: 'В бухгалтерской отчетности отражены убытки на протяжении последних двух лет',
					name: 'hasLossesForLast2Years',
					type: 'check',
				},
				{
					label: 'Ответчик в судах на сумму свыше 300 тыс. руб.',
					name: 'isDefendantInCourts',
					type: 'check',
				},
				{
					label: 'Предстоящее исключение из ЕГРЮЛ',
					name: 'upcomingExclusionFromEGRUL',
					type: 'check',
				},
				{
					label: 'Признание сведений в ЕГРЮЛ недостоверными',
					name: 'hasUnreliableInfoInEGRUL',
					type: 'check',
				},
				{
					label: 'Исполнительные производства (на сумму свыше 300 тыс. руб.)',
					name: 'hasEnforcementProceedings',
					type: 'check',
				},
				{
					label: 'Сведения об имеющейся задолженности по уплате налогов и/или не предоставлении налоговой отчетности более года',
					name: 'hasTaxDebts',
					type: 'check',
				},
				{
					label: 'Нахождение в реестре сведений о банкротстве',
					name: 'hasRegisteredBankruptcy',
					type: 'check',
				},
				{
					label: 'Нахождение в реестре недобросовестных поставщиков',
					name: 'registeredAsUnscrupulousSupplier',
					type: 'check',
				},
				{
					label: 'Нахождение в реестре обеспечительных мер',
					name: 'inRegisterOfInterimMeasures',
					type: 'check',
				},
				{
					label: 'Сведения о лицах, в отношении которых факт невозможности участия (осуществления руководства) в организации установлен (подтвержден) в судебном порядке',
					name: 'notAbleToParticipateInOrgByJudicialProceeding',
					type: 'check',
				},
				{
					label: 'Нахождение в реестре дисквалифицированных лиц',
					name: 'inRegisterOfDisqualifiedPersons',
					type: 'check',
				},
				{
					label: 'Наличие информации о судимости',
					name: 'hasCriminalRecords',
					type: 'check',
				},
				{
					label: 'Наличие информации об актуальных возбужднных уголовных делах',
					name: 'hasInitiatedCriminalCases',
					type: 'check',
				},
				{
					label: 'Наличие конфликта интересов, аффилированности с работником Корпорации',
					name: 'hasConflictOfInterest',
					type: 'check',
				},
				{
					label: 'Нахождение в списке лиц, попадающих под условия, предусмотренные подпунктом "ф" пункта 1 статьи 23 Закона о регистрации (Федеральный закон от 08.08.2001 № 129-ФЗ)',
					name: 'fallingUnderArticle231f',
					type: 'check',
				},
			]
		},
		{
			ind: 2,
			title: 'Локация, тип СПК',
			fields: [
				{
					label: 'Растояние от границы земельного участка до аэропорта',
					name: 'distanceToAirport',
					type: 'number',
					min: 0
				},
				{
					label: 'Растояние от границы земельного участка до автомобильной дороги регионального / федерального значения',
					name: 'distanceToHighway',
					type: 'number',
					min: 0
				},
				{
					label: 'Растояние от границы земельного участка до ж/д вокзала (станции)',
					name: 'distanceToRailwayStation',
					type: 'number',
					min: 0
				},
				{
					label: 'Расстояние до морского / речного порта',
					name: 'distanceToSeaPort',
					type: 'number',
					min: 0
				}
			],
		},
		{
			ind: 3,
			title: 'ТЭП, CAPEX',
			fields: [
				{
					label: 'Количество номеров в КСР, шт.',
					name: 'numberOfRooms',
					type: 'number',
					min: 0,
					calc: () => {
						calcFields.costPerRoom.calc()
						calcFields.revPAR.calc()
						calcFields.staffPerRoom.calc()
					}
				},
				{
					label: 'Вид работ по проекту',
					name: 'typeOfWork',
					type: 'select',
					options: [
						{
							title: 'Строительство',
							value: 'construction'
						},
						{
							title: 'Реконструкция',
							value: 'reconstruction'
						},
					]
				},
				{
					label: 'Стоимость 1 м² объекта, тыс. руб.',
					name: 'costPerSqMeter',
					type: 'number',
					disabled: true
				},
				{
					label: 'Стоимость 1 номера, тыс. руб.',
					name: 'costPerRoom',
					type: 'number',
					disabled: true
				},
				{
					label: 'Общая стоимость объектов и дополнительной инфраструктуры (с НДС, в ценах соответствующих лет), тыс. руб',
					name: 'totalCost',
					type: 'number',
					disabled: true
				},
				{
					label: 'Общая площадь объектов, м²',
					name: 'totalArea',
					type: 'number',
					disabled: true
				},
				{
					label: 'Стоимость строительства объектов, тыс. руб.',
					name: 'totalCostOfBuilding',
					type: 'number',
					disabled: true
				},
				{
					label: 'Площадь гостиницы, м²',
					name: 'hotelArea',
					type: 'number',
					disabled: true
				},
				{
					label: 'Стоимость строительства номерного фонда, включая апартаменты и места общего пользования, тыс. руб.',
					name: 'totalCostOfBuildingRooms',
					type: 'number',
					min: 0,
					calc: () => {
						calcFields.totalCostOfBuilding.calc()
					}
				},
				{
					label: 'Площадь номерного фонда, включая апартаменты и места общего пользования, м²',
					name: 'roomsArea',
					type: 'number',
					min: 0,
					calc: () => {
						calcFields.hotelArea.calc()
						calcFields.roomRevenuePerSqMeter.calc()
					}
				},
				{
					label: 'Доля площадей КСР в составе объекта (для МФК), %',
					name: 'shareOfRoomsArea',
					type: 'number',
					disabled: true
				},
				{
					label: 'Стоимость строительства ресторанов, тыс. руб.',
					name: 'totalCostOfBuildingRestaurants',
					type: 'number',
					min: 0,
					calc: () => {
						calcFields.totalCostOfBuilding.calc()
					}
				},
				{
					label: 'Площадь ресторанов, м²',
					name: 'restaurantsArea',
					type: 'number',
					min: 0,
					calc: () => {
						calcFields.hotelArea.calc()
						calcFields.restaurantsRevenuePerSqMeter.calc()
					}
				},
				{
					label: 'Стоимость строительства конференц-залов, тыс. руб.',
					name: 'totalCostOfBuildingConfRooms',
					type: 'number',
					min: 0,
					calc: () => {
						calcFields.totalCostOfBuilding.calc()
					}
				},
				{
					label: 'Площадь конференц-залов, м²',
					name: 'confRoomsArea',
					type: 'number',
					min: 0,
					calc: () => {
						calcFields.hotelArea.calc()
					}
				},
				{
					label: 'Стоимость строительства СПА и фитнес центров, тыс. руб.',
					name: 'totalCostOfBuildingSpaAndGym',
					type: 'number',
					min: 0,
					calc: () => {
						calcFields.totalCostOfBuilding.calc()
					}
				},
				{
					label: 'Площадь СПА и фитнес центров, м²',
					name: 'spaAndGymArea',
					type: 'number',
					min: 0,
					calc: () => {
						calcFields.hotelArea.calc()
						calcFields.spaAndGymRevenuePerSqMeter.calc()
					}
				},
				{
					label: 'Стоимость строительства бассейнов, тыс. руб.',
					name: 'totalCostOfBuildingPools',
					type: 'number',
					min: 0,
					calc: () => {
						calcFields.totalCostOfBuilding.calc()
					}
				},
				{
					label: 'Площадь бассейнов, м²',
					name: 'poolsArea',
					type: 'number',
					min: 0,
					calc: () => {
						calcFields.hotelArea.calc()
					}
				},
				{
					label: 'Стоимость строительства иных объектов, тыс. руб.',
					name: 'totalCostOfBuildingHotelOthers',
					type: 'number',
					min: 0,
					calc: () => {
						calcFields.totalCostOfBuilding.calc()
					}
				},
				{
					label: 'Площадь иных объектов, м²',
					name: 'hotelOthersArea',
					type: 'number',
					min: 0,
					calc: () => {
						calcFields.hotelArea.calc()
					}
				},
				{
					label: 'Стоимость строительства дополнительной инфраструктуры (отдельные объекты), тыс. руб.',
					name: 'totalCostOfBuildingInfrastructure',
					type: 'number',
					disabled: true
				},
				{
					label: 'Площадь дополнительной инфраструктуры (отдельные объекты), м²',
					name: 'infrastructureArea',
					type: 'number',
					disabled: true
				},
				{
					label: 'Стоимость строительства аквапарка, тыс. руб.',
					name: 'totalCostOfBuildingAquapark',
					type: 'number',
					min: 0,
					calc: () => {
						calcFields.totalCostOfBuildingInfrastructure.calc()
					}
				},
				{
					label: 'Площадь аквапарка, м²',
					name: 'aquaparkArea',
					type: 'number',
					min: 0,
					calc: () => {
						calcFields.infrastructureArea.calc()
						calcFields.aquaparkRevenuePerSqMeter.calc()
					}
				},
				{
					label: 'Стоимость строительства физкультурно-оздоровительный комплекса, тыс. руб.',
					name: 'totalCostOfBuildingSportComplex',
					type: 'number',
					min: 0,
					calc: () => {
						calcFields.totalCostOfBuildingInfrastructure.calc()
					}
				},
				{
					label: 'Площадь физкультурно-оздоровительный комплекса, м²',
					name: 'sportComplexArea',
					type: 'number',
					min: 0,
					calc: () => {
						calcFields.infrastructureArea.calc()
					}
				},
				{
					label: 'Стоимость строительства парк развлечений, аттракционов, тыс. руб.',
					name: 'totalCostOfBuildingAmusementPark',
					type: 'number',
					min: 0,
					calc: () => {
						calcFields.totalCostOfBuildingInfrastructure.calc()
					}
				},
				{
					label: 'Площадь парк развлечений, аттракционов, м²',
					name: 'amusementParkArea',
					type: 'number',
					min: 0,
					calc: () => {
						calcFields.infrastructureArea.calc()
						calcFields.amusementsRevenuePerSqMeter.calc()
					}
				},
				{
					label: 'Стоимость строительства термальный комплекса, тыс. руб.',
					name: 'totalCostOfBuildingThermalComplex',
					type: 'number',
					min: 0,
					calc: () => {
						calcFields.totalCostOfBuildingInfrastructure.calc()
					}
				},
				{
					label: 'Площадь термальный комплекса, м²',
					name: 'thermalComplexArea',
					type: 'number',
					min: 0,
					calc: () => {
						calcFields.infrastructureArea.calc()
					}
				},
				{
					label: 'Стоимость строительства иных объектов инфраструктуры, тыс. руб.',
					name: 'totalCostOfBuildingInfrastructureOthers',
					type: 'number',
					min: 0,
					calc: () => {
						calcFields.totalCostOfBuildingInfrastructure.calc()
					}
				},
				{
					label: 'Площадь иных объектов инфраструктуры, м²',
					name: 'infrastructureOthersArea',
					type: 'number',
					min: 0,
					calc: () => {
						calcFields.infrastructureArea.calc()
					}
				},
				{
					label: 'Общая протяженность ГЛК, м',
					name: 'totalLengthGLK',
					type: 'number',
					min: 0,
				},
				{
					label: 'Дата начала подготовки ПСД',
					name: 'startDateOfPSDPreparation',
					type: 'date',
				},
				{
					label: 'Дата окончания подготовки ПСД',
					name: 'endDateOfPSDPreparation',
					type: 'date',
				},
				{
					label: 'Дата начала СМР',
					name: 'startDateOfSMR',
					type: 'date',
				},
				{
					label: 'Дата окончания СМР',
					name: 'endDateOfSMR',
					type: 'date',
				},
				{
					label: 'Дата ввода в эксплуатацию',
					name: 'commissioningDate',
					type: 'date',
				},
				{
					label: 'Соответствие категории и вида разрешенного использования земельного участка целям проекта',
					name: 'complianceOfLandTypeWithProject',
					type: 'check',
				},
				{
					label: 'Расходы pre-opening, тыс. руб.',
					name: 'preOpeningCost',
					type: 'number',
					min: 0
				},
			],
		},
		{
			ind: 4,
			title: 'Экономические показатели',
			fields: [
				{
					label: 'Количество месяцев функционирования в году',
					name: 'numberOfOperationMonths',
					type: 'number',
					min: 0
				},
				{
					label: 'ADR — отпускной тариф, руб./сутки',
					name: 'adr',
					type: 'number',
					min: 0
				},
				{
					label: 'Рентабельность по EBITDA (прогноз Инвестора), %',
					name: 'marginEBITDA',
					type: 'number',
					min: 0,
					calc: () => calcFields.EBITDA.calc()
				},
				{
					label: 'Occupancy (OCC) — реальная заполняемость, %',
					name: 'occ',
					type: 'number',
					disabled: true
				},
				{
					label: 'Общее количество занятых номеров Total Rooms Occupied (за период)',
					name: 'totalRoomsOccupied',
					type: 'number',
					min: 0,
					calc: () => {
						calcFields.occ.calc()
						calcFields.doubleOcc.calc()
					}
				},
				{
					label: 'Double Occupancy — сколько гостей в среднем проживает в одном номере, чел./номер',
					name: 'doubleOcc',
					type: 'number',
					disabled: true
				},
				{
					label: 'Турпоток, чел./ночей за год',
					name: 'touristPerNightFlow',
					type: 'number',
					disabled: true
				},
				{
					label: 'Количество гостей Total Guests In-House (за период)',
					name: 'totalGuestsInHouse',
					type: 'number',
					min: 0,
					calc: () => calcFields.doubleOcc.calc()
				},
				{
					label: 'Турпоток, чел./год',
					name: 'touristFlow',
					type: 'number',
					disabled: true
				},
				{
					label: 'Общее количество внешних гостей',
					name: 'totalExternalGuests',
					type: 'number',
					min: 0,
					calc: () => calcFields.touristFlow.calc()
				},
				{
					label: 'Выручка на 1 м² (с НДС , после выхода на плановую загрузку (ориентировочно 3 год экспуатационной фазы), тыс. руб.',
					name: 'revenuePerSqMeter',
					type: 'number',
					disabled: true
				},
				{
					label: 'Общая выручка, тыс. руб. в год после выхода на проектную нагрузку',
					name: 'totalRevenues',
					type: 'number',
					disabled: true
				},
				{
					label: 'Выручка от реализации номеров (Room Revenue), тыс. руб. в год после выхода на проектную нагрузку',
					name: 'roomRevenue',
					type: 'number',
					min: 0,
					calc: () => {
						calcFields.totalRevenues.calc()
						calcFields.roomRevenuePerSqMeter.calc()
						calcFields.revPAR.calc()
					}
				},
				// {
				// 	label: 'Выручка на 1 м² от реализации номеров (Room Revenue), тыс. руб. в год после выхода на проектную нагрузку',
				// 	name: 'roomRevenuePerSqMeter',
				// 	type: 'number',
				// 	disabled: true
				// },
				{
					label: 'Выручка ресторанов, тыс. руб. в год после выхода на проектную нагрузку',
					name: 'restaurantsRevenue',
					type: 'number',
					min: 0,
					calc: () => {
						calcFields.totalRevenues.calc()
						calcFields.restaurantsRevenuePerSqMeter.calc()
					}
				},
				// {
				// 	label: 'Выручка на 1 м² ресторанов, тыс. руб. в год после выхода на проектную нагрузку',
				// 	name: 'restaurantsRevenuePerSqMeter',
				// 	type: 'number',
				// 	disabled: true
				// },
				{
					label: 'Выручка СПА и фитнес-центров, тыс. руб. в год после выхода на проектную нагрузку',
					name: 'spaAndGymRevenue',
					type: 'number',
					min: 0,
					calc: () => {
						calcFields.totalRevenues.calc()
						calcFields.spaAndGymRevenuePerSqMeter.calc()
					}
				},
				// {
				// 	label: 'Выручка на 1 м² СПА и фитнес-центров, тыс. руб. в год после выхода на проектную нагрузку',
				// 	name: 'spaAndGymRevenuePerSqMeter',
				// 	type: 'number',
				// 	disabled: true
				// },
				{
					label: 'Выручка аквапарка, тыс. руб. в год после выхода на проектную нагрузку',
					name: 'aquaparkRevenue',
					type: 'number',
					min: 0,
					calc: () => {
						calcFields.totalRevenues.calc()
						calcFields.aquaparkRevenuePerSqMeter.calc()
					}
				},
				// {
				// 	label: 'Выручка на 1 м² аквапарка, тыс. руб. в год после выхода на проектную нагрузку',
				// 	name: 'aquaparkRevenuePerSqMeter',
				// 	type: 'number',
				// 	disabled: true
				// },
				{
					label: 'Выручка инфраструктуры ГЛК, тыс. руб. в год после выхода на проектную нагрузку',
					name: 'glkRevenue',
					type: 'number',
					min: 0,
					calc: () => calcFields.totalRevenues.calc()
				},
				// {
				// 	label: 'Выручка на 1 м² инфраструктуры ГЛК, тыс. руб. в год после выхода на проектную нагрузку',
				// 	name: 'glkRevenuePerSqMeter',
				// 	type: 'number',
				// 	disabled: true
				// },
				{
					label: 'Выручка парка развлечений, аттракционов, тыс. руб. в год после выхода на проектную нагрузку',
					name: 'amusementsRevenue',
					type: 'number',
					min: 0,
					calc: () => {
						calcFields.totalRevenues.calc()
						calcFields.amusementsRevenuePerSqMeter.calc()
					}
				},
				// {
				// 	label: 'Выручка на 1 м² парка развлечений, аттракционов, тыс. руб. в год после выхода на проектную нагрузку',
				// 	name: 'amusementsRevenuePerSqMeter',
				// 	type: 'number',
				// 	disabled: true
				// },
				{
					label: 'Выручка прочее, тыс. руб. в год после выхода на проектную нагрузку',
					name: 'otherRevenue',
					type: 'number',
					min: 0,
					calc: () => calcFields.totalRevenues.calc()
				},
				// {
				// 	label: 'Выручка на 1 м² прочее, тыс. руб. в год после выхода на проектную нагрузку',
				// 	name: 'otherRevenuePerSqMeter',
				// 	type: 'number',
				// 	disabled: true
				// },
				{
					label: 'RevPAR — средняя выручка за номер в год, тыс. руб.',
					name: 'revPAR',
					type: 'number',
					disabled: true
				},
				{
					label: 'RevPAC — доход на гостя. Включает доход от продажи  номерного фонда и других услуг, тыс. руб.',
					name: 'revPAC',
					type: 'number',
					disabled: true
				},
				{
					label: 'Количество новых рабочих мест, чел.',
					name: 'numberOfNewJobs',
					type: 'number',
					min: 0,
					calc: () => calcFields.staffPerRoom.calc()
				},
				{
					label: 'Количество сотрудников на 1 номер, чел.',
					name: 'staffPerRoom',
					type: 'number',
					disabled: true
				},
				{
					label: 'Участие в проекте гостиничного оператора (вознаграждение за управление проектируемым объектом)',
					name: 'remunerationForManagement',
					type: 'number',
					min: 0,
				},
			],
		},
		{
			ind: 5,
			title: 'Финансирование',
			fields: [
				{
					label: 'Общий объем финансирования (Total Founds), тыс. руб.',
					name: 'totalFunds',
					type: 'number',
					disabled: true
				},
				{
					label: 'Собственные средства, тыс. руб.',
					name: 'ownFunds',
					type: 'number',
					disabled: true
				},
				{
					label: 'Взнос Инвестора в уставный капитал СПК в денежной форме, тыс. руб.',
					name: 'investorContributionCash',
					type: 'number',
					min: 0,
					calc: () => calcFields.ownFunds.calc()
				},
				{
					label: 'Имущественный взнос Инвестора в уставный капитал СПК (не в денежной форме), тыс. руб.',
					name: 'investorContributionNotCash',
					type: 'number',
					min: 0,
					calc: () => calcFields.ownFunds.calc()
				},
				{
					label: 'Имущественный взнос Инвестора без увеличения уставного капитала СПК (в денежной форме), тыс. руб.',
					name: 'investorContributionCashNotInCapital',
					type: 'number',
					min: 0,
					calc: () => calcFields.ownFunds.calc()
				},
				{
					label: 'Инвестор (заем), тыс. руб.',
					name: 'investorLoan',
					type: 'number',
					min: 0,
					calc: () => calcFields.ownFunds.calc()
				},
				{
					label: 'Корпорация Туризм.РФ  (взнос в уставный капитал СПК), тыс. руб.',
					name: 'corporationContributionCash',
					type: 'number',
					min: 0,
					calc: () => calcFields.ownFunds.calc()
				},
				{
					label: 'Корпорация Туризм.РФ  (заем), тыс. руб.',
					name: 'corporationLoan',
					type: 'number',
					min: 0,
					calc: () => calcFields.ownFunds.calc()
				},
				{
					label: 'Выручка от реализации земельных участков, объектов, помещений, паев и пр. (если применимо), тыс. руб.',
					name: 'landSaleRevenue',
					type: 'number',
					min: 0,
					calc: () => calcFields.ownFunds.calc()
				},
				{
					label: 'Кредит банка (DEBT), тыс. руб.',
					name: 'bankLoanAmount',
					type: 'number',
					min: 0,
					calc: () => {
						calcFields.totalFunds.calc()
						calcFields.creditFundsShare.calc()
						calcFields.interestPayments.calc()
						calcFields.loanBodyPayments.calc()
					}
				},
				{
					label: 'Планируемая ставка по кредиту, %',
					name: 'plannedLoanRate',
					type: 'number',
					min: 0,
					calc: () => calcFields.interestPayments.calc()
				},
				{
					label: 'Срок кредита, лет',
					name: 'loanTerm',
					type: 'number',
					min: 0,
					calc: () => {
						calcFields.interestPayments.calc()
						calcFields.loanBodyPayments.calc()
					}
				},
				{
					label: 'Потребность в льготном кредите (в т.ч. Постановление №141), тыс. руб.',
					name: 'needOfPreferentialLoan',
					type: 'check',
				},
				{
					label: 'Наличие банка кредитора (наименование)',
					name: 'bankName',
					type: 'text',
					min: 0,
				},
				{
					label: 'Доля средств Корпорации Туризм.РФ в уставном капитале, %',
					name: 'corporationFundsShare',
					type: 'number',
					disabled: true
				},
				{
					label: 'Доля кредитных средств в объеме финансирования, %',
					name: 'creditFundsShare',
					type: 'number',
					disabled: true
				},
				{
					label: 'Уровень долговой нагрузки, EBITDA / (I + D)',
					name: 'debtCoverageRatio',
					type: 'number',
					disabled: true
				},
				{
					label: 'EBITDA, руб. (за год после ввода в эксплуатацию)',
					name: 'EBITDA',
					type: 'number',
					disabled: true
				},
				{
					label: 'Процентные платежи в год (I), тыс. руб.',
					name: 'interestPayments',
					type: 'number',
					disabled: true
				},
				{
					label: 'Выплаты тела кредита, руб. в год (D)',
					name: 'loanBodyPayments',
					type: 'number',
					disabled: true
				},
			],
		}
	]

	function setInvestor(data) {
		if (!data?.investor)
			return

		investor = data.investor
		highlightSave = false
		activeInvestorTab = 1

		investor.regionsTitle = getTitleFromDirByValue('regions', 'title', investor.region)
		investor.buildingTypeTitle = getTitleFromDirByValue('buildingTypes', 'title', investor.buildingType)
		investor.buildingCategoryTitle = getTitleFromDirByValue('buildingCategory', 'title', investor.buildingCategory)

		Object.values(calcFields).forEach(field => field.calc())
	}

	function saveInvestor() {
		if (!investor?._id)
			return

		console.log('saveInvestor', investor)

		const id = investor._id
		const investorData = {}

		Object.keys(investor)
			.forEach(key => {
				if (!['_id', 'scoring'].includes(key))
					investorData[key] = investor[key]
			})

		fetch('/api/update_investor', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				id,
				investor: investorData
			})
		})
			.then(res => res.json())
			.then(res => {
				console.log('update_investor(), res', res)

				if (res?.res?.modifiedCount || res?.res?.matchedCount) {
					highlightSave = false
				}
			})
	}

	function estimateStopFactors() {
		console.log('estimateStopFactors(), investor', investor)
		investor.scoring = estimate(investor)
		activeInvestorTab = 0
		console.log('estimateStopFactors(), scoring', investor.scoring)
	}

	function deleteProject(showModal = true) {
		if (showModal)
			return openModal('Удалить проект?', [
				{
					title: 'Удалить',
					class: 'btn-accent',
					cb: () => deleteProject(false)
				},
				{
					title: 'Отменить',
					class: 'btn-outline',
				}
			])

		fetch('/api/delete_project', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				_id: investor._id
			})
		})
			.then(res => res.json())
			.then(res => {
				console.log('delete_project', res)

				if (res?.res?.deletedCount) {
					investors.update(arr => {
						return arr.filter(row => row._id !== investor._id)
					})

					goto('/projects')
				}
			})
	}
</script>

{#if investor}
	<div class="flex items-center gap-5">
		<div class="text-2xl">{investor.name}</div>
		<div class="flex items-center gap-5 ml-auto shrink-0">
			<button class="btn btn-accent btn-outline"
			        on:click={deleteProject}>
				Удалить
			</button>
			<button class="btn btn-primary"
			        class:btn-outline={!highlightSave}
			        on:click={saveInvestor}>
				Сохранить
			</button>
			<button class="btn btn-outline"
			        on:click={estimateStopFactors}>
				Провести оценку
			</button>
		</div>
	</div>
	<div class="my-10 flex flex-col gap-2">
		<Input name="theInvestorName"
		       label="Название"
		       placeholder="Название проекта"
		       on:change={() => highlightSave = true}
		       bind:value={investor.name}/>
		<Select name="theInvestorRegion"
		        label="Регион"
		        title="Выберите регион"
		        options={$DIRs['regions']?.values}
		        on:change={() => highlightSave = true}
		        bind:value={investor.region}
		/>
		<Select name="theInvestorBuildingType"
		        label="Тип объекта"
		        title="Выберите тип объекта"
		        options={$DIRs['buildingTypes']?.values}
		        on:change={() => highlightSave = true}
		        bind:value={investor.buildingType}
		/>
		<Select name="theInvestorBuildingCategory"
		        label="Категория объекта"
		        title="Выберите категорию объекта"
		        options={$DIRs['buildingCategory']?.values}
		        defaultDisabled={false}
		        on:change={() => highlightSave = true}
		        bind:value={investor.buildingCategory}
		/>
	</div>
	<div class="tabs mt-10">
		{#if investor.scoring}
			<a class="tab tab-lifted"
			   class:tab-active={activeInvestorTab === 0}
			   on:click={() => activeInvestorTab = 0}
			>Стоп-факторы</a>
		{/if}
		{#each tabs as tab}
			<a class="tab tab-lifted"
			   class:tab-active={activeInvestorTab === tab.ind}
			   on:click={() => activeInvestorTab = tab.ind}
			>{tab.title}</a>
		{/each}
	</div>
	<div>
		<div class="flex overflow-hidden">
			<div class="shrink-0 w-full overflow-hidden transition-all"
			     class:h-0={activeInvestorTab !== 0}
			     style="margin-left: {-activeInvestorTab * 100}%">
				{#if investor.scoring}
					<div class="overflow-x-auto mt-10">
						<table class="table w-full">
							<!-- head -->
							<thead>
							<tr>
								<th>Раздел</th>
								<th>Наименование показателя</th>
								<th>Значение</th>
								<th colspan="2" class="text-center">Стоп-фактор (Предварительная оценка)</th>
							</tr>
							<tr>
								<th class="w-2/12"></th>
								<th class="w-3/12"></th>
								<th class="w-1/12"></th>
								<th class="w-3/12 text-center">Общий</th>
								<th class="w-3/12 text-center">Дополнительный</th>
							</tr>
							</thead>
							<tbody>
							{#each investor.scoring as scoringRow}
								<tr>
									<td class="whitespace-pre-wrap">{scoringRow.section}</td>
									<td class="whitespace-pre-wrap">{scoringRow.fieldName}</td>
									<td class="whitespace-pre-wrap">{scoringRow.value || 0}</td>
									{#if scoringRow.error}
										<td colspan="2" class="whitespace-pre-wrap text-center text-accent">
											{scoringRow.error}
										</td>
									{:else if scoringRow.stopFactor?.type === 'common'}
										<td class="whitespace-pre-wrap bg-red-300 text-center">
											{scoringRow.stopFactor.text}
										</td>
										<td></td>
									{:else if scoringRow.stopFactor?.type === 'additional'}
										<td></td>
										<td class="whitespace-pre-wrap bg-yellow-300 text-center">
											{scoringRow.stopFactor.text}
										</td>
									{:else}
										<td colspan="2" class="text-center">Соответствует критериям</td>
									{/if}
								</tr>
							{/each}
							</tbody>
						</table>
					</div>
				{/if}
			</div>
			{#each tabs as tab}
				{#if tab.fields.length}
					<div class="shrink-0 w-full overflow-hidden transition-all"
					     class:h-10={activeInvestorTab !== tab.ind}>
						{#each tab.fields as field}
							<div class="max-w-lg p-5">
								{#if field.disabled}
									<div class="form-control w-full">
										<label class="label" for="{field.name}">
											<span class="label-text">{field.label}</span>
										</label>
										<input id="{field.name}" type="number" placeholder=""
										       value={investor[field.name]} disabled
										       class="input input-bordered w-full"/>
									</div>
								{:else if field.type === 'number' || field.type === 'date' || field.type === 'text'}
									<Input {...field}
									       on:change={() => (highlightSave = true) && field.calc && field.calc()}
									       bind:value={investor[field.name]}/>
								{:else if field.type === 'check'}
									<Check {...field}
									       on:change={() => (highlightSave = true)}
									       bind:checked={investor[field.name]}/>
								{:else if field.type === 'select'}
									<Select {...field}
									        on:change={() => (highlightSave = true)}
									        bind:value={investor[field.name]}/>
								{/if}
							</div>
							{#if errors[field.name]}
								<div class="alert alert-warning shadow-lg">
									<div>
										<svg xmlns="http://www.w3.org/2000/svg" class="stroke-current flex-shrink-0 h-6 w-6"
										     fill="none" viewBox="0 0 24 24">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
											      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
										</svg>
										<span>{errors[field.name]}</span>
									</div>
								</div>
							{/if}
						{/each}
					</div>
				{/if}
			{/each}
		</div>
		<div class="flex items-center gap-5 mt-10 sticky bottom-10">
			<div class="flex flex-col gap-5 ml-auto">
				<button class="btn btn-sm btn-accent btn-outline"
				        on:click={deleteProject}>
					Удалить
				</button>
				<button class="btn btn-primary"
				        class:btn-outline={!highlightSave}
				        on:click={saveInvestor}>
					Сохранить
				</button>
				<button class="btn btn-outline"
				        on:click={estimateStopFactors}>
					Провести оценку
				</button>
				<button class="btn btn-outline btn-secondary"
				     on:click={() => window.scrollTo({top: 0, behavior: 'smooth'})}>
					Наверх
				</button>
			</div>
		</div>
	</div>
{/if}