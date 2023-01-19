<script>
	import { DIRs, projects } from '$lib/stores'
	import { estimate } from '$lib/stopFactors'
	import Input from '$lib/components/input.svelte'
	import Check from '$lib/components/check.svelte'
	import Select from '$lib/components/select.svelte'
	import { openModal } from '$lib/components/modals.svelte'
	import { goto } from '$app/navigation'

	// todo check tab problem

	export let data

	let project
	let highlightSave = false
	let activeProjectTab = 1
	let errors = {}

	$: {
		console.log('projects/[slug], data', data)
		setProject(data)
	}

	function getDirValue(dirName) {
		const values = $DIRs[dirName]?.values || []
		for (const valueRow of values)
			if (valueRow.region === project.region
				&& valueRow.buildingType === project.buildingType
				&& (valueRow.buildingCategory || '') === (project.buildingCategory || ''))
				return [true, valueRow.value]

		const dirTitle = $DIRs[dirName] ? $DIRs[dirName].title : dirName
		const searchFieldsStr = `${project.regionsTitle}, ${project.buildingTypeTitle}`
			+ (project.buildingCategoryTitle ? `, ${project.buildingCategoryTitle}` : '')
		return [false, `В справочнике "${dirTitle}" не указано значение по параметрам: ${searchFieldsStr}.`]
	}

	function getTitleFromDirByValue(dirName, dirTitleField, value) {
		const values = $DIRs[dirName].values.filter(row => row.name === value)
		if (values.length)
			return values[0][dirTitleField]
		return ''
	}

	function updateProjectProp(field, value = '') {
		if (project[field] !== value) {
			project[field] = value
			highlightSave = true
		}
	}

	const calcFields = {
		absLiqRatio: {
			label: 'Коэффициент абсолютной ликвидности',
			name: 'absLiqRatio',
			calc: function () {
				if (!project.kfv || !project.ds || !project.ko)
					return updateProjectProp(this.name)
				const a = parseFloat(project.kfv || 0) + parseFloat(project.ds || 0)
				const value = a / project.ko
				updateProjectProp(this.name, +value.toFixed(2))
			}
		},
		fastLiqRatio: {
			label: 'Коэффициент быстрой ликвидности',
			name: 'fastLiqRatio',
			calc: function () {
				if (!project.kdz || !project.kfv || !project.ds || !project.ko)
					return updateProjectProp(this.name)
				const a = parseFloat(project.kdz || 0) + parseFloat(project.kfv || 0) + parseFloat(project.ds || 0)
				const value = a / project.ko
				updateProjectProp(this.name, +value.toFixed(2))
			}
		},
		currentLiqRatio: {
			label: 'Коэффициент текущей ликвидности',
			name: 'currentLiqRatio',
			calc: function () {
				if (!project.oa || !project.ko)
					return updateProjectProp(this.name)
				const value = project.oa / project.ko
				updateProjectProp(this.name, +value.toFixed(2))
			}
		},
		debtToEquityRatio: {
			label: 'Коэфициент соотношения заемных и собственных средств',
			name: 'debtToEquityRatio',
			calc: function () {
				if (!project.sk || !project.ko || !project.do)
					return updateProjectProp(this.name)
				const a = parseFloat(project.do || 0) + parseFloat(project.ko || 0)
				const value = a / project.sk
				updateProjectProp(this.name, +value.toFixed(2))
			}
		},
		solvencyRatio: {
			label: 'Коэффициент общей платежеспособности',
			name: 'solvencyRatio',
			calc: function () {
				if (!project.kr || !project.ko || !project.do)
					return updateProjectProp(this.name)
				const a = parseFloat(project.do || 0) + parseFloat(project.ko || 0)
				const value = project.k / a
				updateProjectProp(this.name, +value.toFixed(2))
			}
		},
		costPerSqMeter: {
			label: 'Стоимость 1 м² объекта, тыс. руб.',
			name: 'costPerSqMeter',
			calc: function () {
				if (!project.totalCost || !project.totalArea)
					return updateProjectProp(this.name)
				const value = project.totalCost / project.totalArea
				updateProjectProp(this.name, +value.toFixed(2))
			}
		},
		costPerRoom: {
			label: 'Стоимость 1 номера, тыс. руб.',
			name: 'costPerRoom',
			calc: function () {
				if (!project.totalCost || !project.numberOfRooms)
					return updateProjectProp(this.name)
				const value = project.totalCost / project.numberOfRooms
				updateProjectProp(this.name, +value.toFixed(2))
			}
		},
		shareOfRoomsArea: {
			label: 'Доля площадей КСР в составе объекта (для МФК), %',
			name: 'shareOfRoomsArea',
			calc: function () {
				if (!project.totalArea || !project.roomsArea)
					return updateProjectProp(this.name)
				const value = (project.roomsArea / project.totalArea) * 100
				updateProjectProp(this.name, +value.toFixed(2))
			}
		},
		totalArea: {
			label: 'Общая площадь объектов, м²',
			name: 'totalArea',
			calc: function () {
				const value = parseFloat(project.hotelArea || 0) + parseFloat(project.infrastructureArea || 0)
				updateProjectProp(this.name, +value.toFixed(2))
				calcFields.costPerSqMeter.calc()
				calcFields.revenuePerSqMeter.calc()
			}
		},
		hotelArea: {
			label: 'Площадь гостиницы, м²',
			name: 'hotelArea',
			calc: function () {
				const value = parseFloat(project.roomsArea || 0)
					+ parseFloat(project.restaurantsArea || 0)
					+ parseFloat(project.confRoomsArea || 0)
					+ parseFloat(project.spaAndGymArea || 0)
					+ parseFloat(project.poolsArea || 0)
					+ parseFloat(project.hotelOthersArea || 0)
				updateProjectProp(this.name, +value.toFixed(2))
				calcFields.totalArea.calc()
			}
		},
		infrastructureArea: {
			label: 'Площадь дополнительной инфраструктуры (отдельные объекты), м²',
			name: 'infrastructureArea',
			calc: function () {
				const value = parseFloat(project.aquaparkArea || 0)
					+ parseFloat(project.sportComplexArea || 0)
					+ parseFloat(project.amusementParkArea || 0)
					+ parseFloat(project.thermalComplexArea || 0)
					+ parseFloat(project.infrastructureOthersArea || 0)
				updateProjectProp(this.name, +value.toFixed(2))
				calcFields.totalArea.calc()
			}
		},
		totalCost: {
			label: 'Общая стоимость объектов и дополнительной инфраструктуры (с НДС, в ценах соответствующих лет), тыс. руб',
			name: 'totalCost',
			calc: function () {
				const value = parseFloat(project.totalCostOfBuilding || 0)
					+ parseFloat(project.totalCostOfBuildingInfrastructure || 0)
				updateProjectProp(this.name, +value.toFixed(2))
				calcFields.costPerRoom.calc()
				calcFields.costPerSqMeter.calc()
			}
		},
		totalCostOfBuilding: {
			label: 'Стоимость строительства объектов, тыс. руб.',
			name: 'totalCostOfBuilding',
			calc: function () {
				const value = parseFloat(project.totalCostOfBuildingRooms || 0)
					+ parseFloat(project.totalCostOfBuildingRestaurants || 0)
					+ parseFloat(project.totalCostOfBuildingConfRooms || 0)
					+ parseFloat(project.totalCostOfBuildingSpaAndGym || 0)
					+ parseFloat(project.totalCostOfBuildingPools || 0)
					+ parseFloat(project.totalCostOfBuildingHotelOthers || 0)
				updateProjectProp(this.name, +value.toFixed(2))
				calcFields.totalCost.calc()
			}
		},
		totalCostOfBuildingInfrastructure: {
			label: 'Стоимость строительства дополнительной инфраструктуры (отдельные объекты), тыс. руб.',
			name: 'totalCostOfBuildingInfrastructure',
			calc: function () {
				const value = parseFloat(project.totalCostOfBuildingAquapark || 0)
					+ parseFloat(project.totalCostOfBuildingSportComplex || 0)
					+ parseFloat(project.totalCostOfBuildingAmusementPark || 0)
					+ parseFloat(project.totalCostOfBuildingThermalComplex || 0)
					+ parseFloat(project.totalCostOfBuildingInfrastructureOthers || 0)
				updateProjectProp(this.name, +value.toFixed(2))
				calcFields.totalCost.calc()
			}
		},
		occ: {
			label: 'Occupancy (OCC) — реальная заполняемость, %',
			name: 'occ',
			calc: function () {
				if (!project.totalRoomsOccupied || !project.numberOfRooms)
					return updateProjectProp(this.name)
				const value = (project.totalRoomsOccupied / project.numberOfRooms) * 100
				updateProjectProp(this.name, +value.toFixed(2))
			}
		},
		doubleOcc: {
			label: 'Double Occupancy — сколько гостей в среднем проживает в одном номере, чел./номер',
			name: 'doubleOcc',
			calc: function () {
				if (!project.totalRoomsOccupied || !project.totalGuestsInHouse) {
					updateProjectProp(this.name)
					calcFields.touristFlow.calc()
					calcFields.touristPerNightFlow.calc()
					return
				}
				const value = project.totalGuestsInHouse / project.totalRoomsOccupied
				updateProjectProp(this.name, +value.toFixed(2))
				calcFields.touristFlow.calc()
				calcFields.touristPerNightFlow.calc()
			}
		},
		touristPerNightFlow: {
			label: 'Турпоток, чел./ночей за год',
			name: 'touristPerNightFlow',
			calc: function () {
				if (!project.totalRoomsOccupied || !project.doubleOcc)
					return updateProjectProp(this.name)
				const value = project.totalRoomsOccupied * project.doubleOcc * 365
				updateProjectProp(this.name, +value.toFixed(2))
			}
		},
		touristFlow: {
			label: 'Турпоток, чел./год',
			name: 'touristFlow',
			calc: function () {
				if (!project.totalRoomsOccupied || !project.doubleOcc) {
					updateProjectProp(this.name)
					calcFields.revPAC.calc()
					return
				}

				const [status, dirValue] = getDirValue('averageLengthOfStay')
				if (!status) {
					errors[this.name] = dirValue
					updateProjectProp(this.name)
					calcFields.revPAC.calc()
					return
				}

				const value = (project.totalRoomsOccupied * project.doubleOcc * 365) / dirValue.value
					+ parseFloat(project.totalExternalGuests || 0) * 365
				updateProjectProp(this.name, +value.toFixed(2))
				calcFields.revPAC.calc()
			}
		},
		totalRevenues: {
			label: 'Общая выручка, тыс. руб. в год после выхода на проектную нагрузку',
			name: 'totalRevenues',
			calc: function () {
				const value = parseFloat(project.roomRevenue || 0)
					+ parseFloat(project.restaurantsRevenue || 0)
					+ parseFloat(project.spaAndGymRevenue || 0)
					+ parseFloat(project.aquaparkRevenue || 0)
					+ parseFloat(project.glkRevenue || 0)
					+ parseFloat(project.amusementsRevenue || 0)
					+ parseFloat(project.otherRevenue || 0)
				updateProjectProp(this.name, +value.toFixed(2))
				calcFields.revPAC.calc()
				calcFields.revenuePerSqMeter.calc()
			}
		},
		revPAR: {
			label: 'RevPAR — средняя выручка за номер в год, тыс. руб.',
			name: 'revPAR',
			calc: function () {
				if (!project.roomRevenue || !project.numberOfRooms)
					return updateProjectProp(this.name)

				const value = project.roomRevenue / project.numberOfRooms
				updateProjectProp(this.name, +value.toFixed(2))
			}
		},
		revPAC: {
			label: 'RevPAC — доход на гостя. Включает доход от продажи  номерного фонда и других услуг, тыс. руб.',
			name: 'revPAC',
			calc: function () {
				if (!project.totalRevenues || !project.touristFlow)
					return updateProjectProp(this.name)

				const value = project.totalRevenues / project.touristFlow
				updateProjectProp(this.name, +value.toFixed(2))
			}
		},
		staffPerRoom: {
			label: 'Количество сотрудников на 1 номер, чел.',
			name: 'staffPerRoom',
			calc: function () {
				if (!project.numberOfNewJobs || !project.numberOfRooms)
					return updateProjectProp(this.name)

				const value = project.numberOfNewJobs / project.numberOfRooms
				updateProjectProp(this.name, +value.toFixed(2))
			}
		},
		revenuePerSqMeter: {
			label: 'Выручка на 1 м² (с НДС , после выхода на плановую загрузку (ориентировочно 3 год экспуатационной фазы), тыс. руб.',
			name: 'revenuePerSqMeter',
			calc: function () {
				if (!project.totalRevenues || !project.totalArea)
					return updateProjectProp(this.name)

				const value = project.totalRevenues / project.totalArea
				updateProjectProp(this.name, +value.toFixed(2))
			}
		},
		roomRevenuePerSqMeter: {
			label: 'Выручка на 1 м² от реализации номеров (Room Revenue), тыс. руб. в год после выхода на проектную нагрузку',
			name: 'roomRevenuePerSqMeter',
			calc: function () {
				if (!project.roomRevenue || !project.roomsArea)
					return updateProjectProp(this.name)

				const value = project.roomRevenue / project.roomsArea
				updateProjectProp(this.name, +value.toFixed(2))
			}
		},
		restaurantsRevenuePerSqMeter: {
			label: 'Выручка на 1 м² ресторанов, тыс. руб. в год после выхода на проектную нагрузку',
			name: 'restaurantsRevenuePerSqMeter',
			calc: function () {
				if (!project.restaurantsRevenue || !project.restaurantsArea)
					return updateProjectProp(this.name)

				const value = project.restaurantsRevenue / project.restaurantsArea
				updateProjectProp(this.name, +value.toFixed(2))
			}
		},
		spaAndGymRevenuePerSqMeter: {
			label: 'Выручка на 1 м² СПА и фитнес-центров, тыс. руб. в год после выхода на проектную нагрузку',
			name: 'spaAndGymRevenuePerSqMeter',
			calc: function () {
				if (!project.spaAndGymRevenue || !project.spaAndGymArea)
					return updateProjectProp(this.name)

				const value = project.spaAndGymRevenue / project.spaAndGymArea
				updateProjectProp(this.name, +value.toFixed(2))
			}
		},
		aquaparkRevenuePerSqMeter: {
			label: 'Выручка на 1 м² аквапарка, тыс. руб. в год после выхода на проектную нагрузку',
			name: 'aquaparkRevenuePerSqMeter',
			calc: function () {
				if (!project.aquaparkRevenue || !project.aquaparkArea)
					return updateProjectProp(this.name)

				const value = project.aquaparkRevenue / project.aquaparkArea
				updateProjectProp(this.name, +value.toFixed(2))
			}
		},
		amusementsRevenuePerSqMeter: {
			label: 'Выручка на 1 м² парка развлечений, аттракционов, тыс. руб. в год после выхода на проектную нагрузку',
			name: 'amusementsRevenuePerSqMeter',
			calc: function () {
				if (!project.amusementsRevenue || !project.amusementParkArea)
					return updateProjectProp(this.name)

				const value = project.amusementsRevenue / project.amusementParkArea
				updateProjectProp(this.name, +value.toFixed(2))
			}
		},
		totalFunds: {
			label: 'Общий объем финансирования (Total Founds), тыс. руб.',
			name: 'totalFunds',
			calc: function () {
				const value = parseFloat(project.ownFunds || 0) + parseFloat(project.bankLoanAmount || 0)
				updateProjectProp(this.name, +value.toFixed(2))
				calcFields.creditFundsShare.calc()
				calcFields.EBITDA.calc()
			}
		},
		ownFunds: {
			label: 'Собственные средства, тыс. руб.',
			name: 'ownFunds',
			calc: function () {
				const value = parseFloat(project.investorContributionCash || 0)
					+ parseFloat(project.investorContributionNotCash || 0)
					+ parseFloat(project.investorContributionCashNotInCapital || 0)
					+ parseFloat(project.investorLoan || 0)
					+ parseFloat(project.corporationContributionCash || 0)
					+ parseFloat(project.corporationLoan || 0)
					+ parseFloat(project.landSaleRevenue || 0)
				updateProjectProp(this.name, +value.toFixed(2))
				calcFields.totalFunds.calc()
			}
		},
		corporationFundsShare: {
			label: 'Доля средств Корпорации Туризм.РФ в уставном капитале, %',
			name: 'corporationFundsShare',
			calc: function () {
				if (!(project.corporationContributionCash || project.corporationLoan)
					|| !(project.investorContributionCash || project.investorContributionNotCash))
					return updateProjectProp(this.name)

				const corporationContribution = parseFloat(project.corporationContributionCash || 0)
					+ parseFloat(project.corporationLoan || 0)
				const investorContribution = parseFloat(project.investorContributionCash || 0)
					+ parseFloat(project.investorContributionNotCash || 0)
				const value = corporationContribution / (corporationContribution + investorContribution) * 100
				updateProjectProp(this.name, +value.toFixed(2))
			}
		},
		creditFundsShare: {
			label: 'Доля кредитных средств в объеме финансирования, %',
			name: 'creditFundsShare',
			calc: function () {
				if (!project.bankLoanAmount || !project.totalFunds)
					return updateProjectProp(this.name)

				const value = (project.bankLoanAmount / project.totalFunds) * 100
				updateProjectProp(this.name, +value.toFixed(2))
			}
		},
		debtCoverageRatio: {
			label: 'Уровень долговой нагрузки, EBITDA / (I + D)',
			name: 'debtCoverageRatio',
			calc: function () {
				if (!project.EBITDA || !project.interestPayments || !project.loanBodyPayments)
					return updateProjectProp(this.name)

				const a = parseFloat(project.interestPayments || 0) + parseFloat(project.loanBodyPayments || 0)
				const value = project.EBITDA / a
				updateProjectProp(this.name, +value.toFixed(2))
			}
		},
		EBITDA: {
			label: 'EBITDA, руб. (за год после ввода в эксплуатацию)',
			name: 'EBITDA',
			calc: function () {
				if (!project.totalFunds || !project.marginEBITDA) {
					updateProjectProp(this.name)
					calcFields.debtCoverageRatio.calc()
					return
				}

				const value = project.totalFunds * project.marginEBITDA
				updateProjectProp(this.name, +value.toFixed(2))
				calcFields.debtCoverageRatio.calc()
			}
		},
		interestPayments: {
			label: 'Процентные платежи в год (I)',
			name: 'interestPayments',
			calc: function () {
				if (!project.bankLoanAmount || !project.plannedLoanRate || !project.loanTerm) {
					updateProjectProp(this.name)
					calcFields.debtCoverageRatio.calc()
					return
				}

				const value = project.bankLoanAmount / project.loanTerm * (project.plannedLoanRate / 100)
				updateProjectProp(this.name, +value.toFixed(2))
				calcFields.debtCoverageRatio.calc()
			}
		},
		loanBodyPayments: {
			label: 'Выплаты тела кредита, руб. в год (D)',
			name: 'loanBodyPayments',
			calc: function () {
				if (!project.bankLoanAmount || !project.loanTerm) {
					updateProjectProp(this.name)
					calcFields.debtCoverageRatio.calc()
					return
				}

				const value = project.bankLoanAmount / project.loanTerm
				updateProjectProp(this.name, +value.toFixed(2))
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
							name: 'construction'
						},
						{
							title: 'Реконструкция',
							name: 'reconstruction'
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

	function setProject(data) {
		if (!data?.project)
			return

		project = data.project
		highlightSave = false
		activeProjectTab = 1

		project.regionsTitle = getTitleFromDirByValue('regions', 'title', project.region)
		project.buildingTypeTitle = getTitleFromDirByValue('buildingTypes', 'title', project.buildingType)
		project.buildingCategoryTitle = getTitleFromDirByValue('buildingCategory', 'title', project.buildingCategory)

		Object.values(calcFields).forEach(field => field.calc())
	}

	function saveProject() {
		if (!project?._id)
			return

		console.log('saveProject', project)

		const id = project._id
		const projectData = {}

		Object.keys(project)
			.forEach(key => {
				if (!['_id', 'scoring'].includes(key))
					projectData[key] = project[key]
			})

		fetch('/api/update_project', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				id,
				project: projectData
			})
		})
			.then(res => res.json())
			.then(res => {
				console.log('update_project(), res', res)

				if (res?.res?.modifiedCount || res?.res?.matchedCount) {
					highlightSave = false
				}
			})
	}

	function estimateStopFactors() {
		console.log('estimateStopFactors(), project', project)
		project.scoring = estimate(project)
		activeProjectTab = 0
		console.log('estimateStopFactors(), scoring', project.scoring)
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
				_id: project._id
			})
		})
			.then(res => res.json())
			.then(res => {
				console.log('delete_project', res)

				if (res?.res?.deletedCount) {
					projects.update(arr => {
						return arr.filter(row => row._id !== project._id)
					})

					goto('/projects')
				}
			})
	}
</script>

{#if project}
	<div class="flex items-center gap-5">
		<div class="text-2xl">{project.name}</div>
		<div class="flex items-center gap-5 ml-auto shrink-0">
			<button class="btn btn-accent btn-outline"
			        on:click={deleteProject}>
				Удалить
			</button>
			<button class="btn btn-primary"
			        class:btn-outline={!highlightSave}
			        on:click={saveProject}>
				Сохранить
			</button>
			<button class="btn btn-outline"
			        on:click={estimateStopFactors}>
				Провести оценку
			</button>
		</div>
	</div>
	<div class="my-10 flex flex-col gap-2">
		<Input name="theProjectName"
		       label="Название"
		       placeholder="Название проекта"
		       on:change={() => highlightSave = true}
		       bind:value={project.name}/>
		<Select name="theProjectRegion"
		        label="Регион"
		        title="Выберите регион"
		        options={$DIRs['regions']?.values}
		        on:change={() => highlightSave = true}
		        bind:value={project.region}
		/>
		<Select name="theProjectBuildingType"
		        label="Тип объекта"
		        title="Выберите тип объекта"
		        options={$DIRs['buildingTypes']?.values}
		        on:change={() => highlightSave = true}
		        bind:value={project.buildingType}
		/>
		<Select name="theProjectBuildingCategory"
		        label="Категория объекта"
		        title="Выберите категорию объекта"
		        options={$DIRs['buildingCategory']?.values}
		        defaultDisabled={false}
		        on:change={() => highlightSave = true}
		        bind:value={project.buildingCategory}
		/>
	</div>
	<div class="tabs mt-10">
		{#if project.scoring}
			<a class="tab tab-lifted"
			   class:tab-active={activeProjectTab === 0}
			   on:click={() => activeProjectTab = 0}
			>Стоп-факторы</a>
		{/if}
		{#each tabs as tab}
			<a class="tab tab-lifted"
			   class:tab-active={activeProjectTab === tab.ind}
			   on:click={() => activeProjectTab = tab.ind}
			>{tab.title}</a>
		{/each}
	</div>
	<div>
		<div class="flex overflow-hidden">
			<div class="shrink-0 w-full overflow-hidden transition-all"
			     class:h-0={activeProjectTab !== 0}
			     style="margin-left: {-activeProjectTab * 100}%">
				{#if project.scoring}
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
							{#each project.scoring as scoringRow}
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
					     class:h-10={activeProjectTab !== tab.ind}>
						{#each tab.fields as field}
							<div class="max-w-lg p-5">
								{#if field.disabled}
									<div class="form-control w-full">
										<label class="label" for="{field.name}">
											<span class="label-text">{field.label}</span>
										</label>
										<input id="{field.name}" type="number" placeholder=""
										       value={project[field.name]} disabled
										       class="input input-bordered w-full"/>
									</div>
								{:else if field.type === 'number' || field.type === 'date' || field.type === 'text'}
									<Input {...field}
									       on:change={() => (highlightSave = true) && field.calc && field.calc()}
									       bind:value={project[field.name]}/>
								{:else if field.type === 'check'}
									<Check {...field}
									       on:change={() => (highlightSave = true)}
									       bind:checked={project[field.name]}/>
								{:else if field.type === 'select'}
									<Select {...field}
									        on:change={() => (highlightSave = true)}
									        bind:value={project[field.name]}/>
								{/if}
							</div>
							{#if errors[field.name]}
								<div class="alert alert-warning shadow-lg">
									<div>
										<svg xmlns="http://www.w3.org/2000/svg"
										     class="stroke-current flex-shrink-0 h-6 w-6"
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
				        on:click={saveProject}>
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