<script>
	import { DIRs } from '$lib/stores'
	import { estimate } from '$lib/stopFactors'
	import Input from '$lib/components/input.svelte'
	import Check from '$lib/components/check.svelte'

	// todo check tab problem
	// todo sticky save button

	export let data

	let investor
	let highlightSave = false
	let activeInvestorTab = 1
	let errors = {}

	$: {
		console.log('projects/[slug], data', data)
		setInvestor(data)
	}

	function getBuildingCostFromDIR() {
		for (const cost of $DIRs.costPerSqMeter.values)
			if (cost.region === investor.region
				&& cost.type === investor.buildingType
				&& cost.category === investor.buildingCategory
				&& cost.value)
				return [true, cost.value]
		const searchFieldsStr = `${investor.regionsTitle}, ${investor.buildingTypeTitle}`
			+ (investor.buildingCategoryTitle ? `, ${investor.buildingCategoryTitle}` : '')
		return [false, `В справочнике "Стоимость 1 м² объекта" не указано значение по параметрам: ${searchFieldsStr}.`]
	}

	function getDirValue(dirName, dirValueField, dirTitleField, value) {
		const values = $DIRs[dirName].values.filter(row => row[dirValueField] === value)
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
				investor[this.name] = value.toFixed(2)
			}
		},
		fastLiqRatio: {
			label: 'Коэффициент быстрой ликвидности',
			name: 'fastLiqRatio',
			calc: function () {
				if (!investor.kdz || !investor.kfv || !investor.ds || !investor.ko)
					return investor[this.name] = ''
				const value = (investor.kdz + investor.kfv + investor.ds) / investor.ko
				investor[this.name] = value.toFixed(2)
			}
		},
		currentLiqRatio: {
			label: 'Коэффициент текущей ликвидности',
			name: 'currentLiqRatio',
			calc: function () {
				if (!investor.oa || !investor.ko)
					return investor[this.name] = ''
				const value = investor.oa / investor.ko
				investor[this.name] = value.toFixed(2)
			}
		},
		debtToEquityRatio: {
			label: 'Коэфициент соотношения заемных и собственных средств',
			name: 'debtToEquityRatio',
			calc: function () {
				if (!investor.sk || !investor.ko || !investor.do)
					return investor[this.name] = ''
				const value = (investor.do + investor.ko) / investor.sk
				investor[this.name] = value.toFixed(2)
			}
		},
		solvencyRatio: {
			label: 'Коэффициент общей платежеспособности',
			name: 'solvencyRatio',
			calc: function () {
				if (!investor.kr || !investor.ko || !investor.do)
					return investor[this.name] = ''
				const value = investor.kr / (investor.do + investor.ko)
				investor[this.name] = value.toFixed(2)
			}
		},
		costPerSqMeter: {
			label: 'Стоимость 1 м² объекта, тыс.руб.',
			name: 'costPerSqMeter',
			calc: function () {
				if (!investor.totalCost || !investor.totalArea)
					return investor[this.name] = ''
				const value = investor.totalCost / investor.totalArea
				investor[this.name] = value.toFixed(2)
			}
		},
		totalArea: {
			label: 'Общая площадь объектов, м²',
			name: 'totalArea',
			calc: function () {
				if (!investor.hotelArea && !investor.infrastructureArea) {
					investor[this.name] = ''
					calcFields.costPerSqMeter.calc()
					return
				}
				const value = parseFloat(investor.hotelArea || 0)
					+ parseFloat(investor.infrastructureArea || 0)
				investor[this.name] = value.toFixed(2)
				calcFields.costPerSqMeter.calc()
			}
		},
		hotelArea: {
			label: 'Площадь гостиницы, м²',
			name: 'hotelArea',
			calc: function () {
				if (!investor.roomsArea && !investor.restaurantsArea && !investor.confRoomsArea
					&& !investor.spaAndGymArea && !investor.poolsArea && !investor.hotelOthersArea) {
					investor[this.name] = ''
					calcFields.totalArea.calc()
					return
				}
				const value = parseFloat(investor.roomsArea || 0)
					+ parseFloat(investor.restaurantsArea || 0)
					+ parseFloat(investor.confRoomsArea || 0)
					+ parseFloat(investor.spaAndGymArea || 0)
					+ parseFloat(investor.poolsArea || 0)
					+ parseFloat(investor.hotelOthersArea || 0)
				investor[this.name] = value.toFixed(2)
				calcFields.totalArea.calc()
			}
		},
		infrastructureArea: {
			label: 'Площадь дополнительной инфраструктуры (отдельные объекты), м²',
			name: 'infrastructureArea',
			calc: function () {
				if (!investor.aquaparkArea && !investor.sportComplexArea && !investor.amusementParkArea
					&& !investor.thermalComplexArea && !investor.infrastructureOthersArea) {
					investor[this.name] = ''
					calcFields.totalArea.calc()
					return
				}
				const value = parseFloat(investor.aquaparkArea || 0)
					+ parseFloat(investor.sportComplexArea || 0)
					+ parseFloat(investor.amusementParkArea || 0)
					+ parseFloat(investor.thermalComplexArea || 0)
					+ parseFloat(investor.infrastructureOthersArea || 0)
				investor[this.name] = value.toFixed(2)
				calcFields.totalArea.calc()
			}
		},
		totalCost: {
			label: 'Общая стоимость объектов и дополнительной инфраструктуры (с НДС, в ценах соответствующих лет), тыс. руб',
			name: 'totalCost',
			calc: function () {
				if (!investor.totalCostOfBuilding && !investor.totalCostOfBuildingInfrastructure) {
					investor[this.name] = ''
					calcFields.costPerSqMeter.calc()
					return
				}
				const value = parseFloat(investor.totalCostOfBuilding || 0)
					+ parseFloat(investor.totalCostOfBuildingInfrastructure || 0)
				investor[this.name] = value.toFixed(2)
				calcFields.costPerSqMeter.calc()
			}
		},
		totalCostOfBuilding: {
			label: 'Стоимость строительства объектов, тыс. руб.',
			name: 'totalCostOfBuilding',
			calc: function () {
				if (!investor.totalCostOfBuildingRooms && !investor.totalCostOfBuildingRestaurants
					&& !investor.totalCostOfBuildingConfRooms && !investor.totalCostOfBuildingSpaAndGym
					&& !investor.totalCostOfBuildingPools && !investor.totalCostOfBuildingHotelOthers) {
					investor[this.name] = ''
					calcFields.totalCost.calc()
					return
				}
				const value = parseFloat(investor.totalCostOfBuildingRooms || 0)
					+ parseFloat(investor.totalCostOfBuildingRestaurants || 0)
					+ parseFloat(investor.totalCostOfBuildingConfRooms || 0)
					+ parseFloat(investor.totalCostOfBuildingSpaAndGym || 0)
					+ parseFloat(investor.totalCostOfBuildingPools || 0)
					+ parseFloat(investor.totalCostOfBuildingHotelOthers || 0)
				investor[this.name] = value.toFixed(2)
				calcFields.totalCost.calc()
			}
		},
		totalCostOfBuildingRooms: {
			label: 'Стоимость строительства номерного фонда, включая апартаменты и места общего пользования, тыс. руб.',
			name: 'totalCostOfBuildingRooms',
			calc: function () {
				if (!investor.roomsArea) {
					investor[this.name] = ''
					calcFields.totalCostOfBuilding.calc()
					return
				}
				const [status, price] = getBuildingCostFromDIR(investor)
				if (!status) {
					errors[this.name] = price
					investor[this.name] = ''
					calcFields.totalCostOfBuilding.calc()
					return
				}
				const value = parseFloat(investor.roomsArea || 0) * price
				investor[this.name] = value.toFixed(2)
				calcFields.totalCostOfBuilding.calc()
			}
		},
		totalCostOfBuildingRestaurants: {
			label: 'Стоимость строительства ресторанов, тыс. руб.',
			name: 'totalCostOfBuildingRestaurants',
			calc: function () {
				if (!investor.restaurantsArea) {
					investor[this.name] = ''
					calcFields.totalCostOfBuilding.calc()
					return
				}
				const [status, price] = getBuildingCostFromDIR(investor)
				if (!status) {
					errors[this.name] = price
					investor[this.name] = ''
					calcFields.totalCostOfBuilding.calc()
					return
				}
				const value = parseFloat(investor.restaurantsArea || 0) * price
				investor[this.name] = value.toFixed(2)
				calcFields.totalCostOfBuilding.calc()
			}
		},
		totalCostOfBuildingConfRooms: {
			label: 'Стоимость строительства конференц-залов, тыс. руб.',
			name: 'totalCostOfBuildingConfRooms',
			calc: function () {
				if (!investor.confRoomsArea) {
					investor[this.name] = ''
					calcFields.totalCostOfBuilding.calc()
					return
				}
				const [status, price] = getBuildingCostFromDIR(investor)
				if (!status) {
					errors[this.name] = price
					investor[this.name] = ''
					calcFields.totalCostOfBuilding.calc()
					return
				}
				const value = parseFloat(investor.confRoomsArea || 0) * price
				investor[this.name] = value.toFixed(2)
				calcFields.totalCostOfBuilding.calc()
			}
		},
		totalCostOfBuildingSpaAndGym: {
			label: 'Стоимость строительства СПА и фитнес центров, тыс. руб.',
			name: 'totalCostOfBuildingSpaAndGym',
			calc: function () {
				if (!investor.spaAndGymArea) {
					investor[this.name] = ''
					calcFields.totalCostOfBuilding.calc()
					return
				}
				const [status, price] = getBuildingCostFromDIR(investor)
				if (!status) {
					errors[this.name] = price
					investor[this.name] = ''
					calcFields.totalCostOfBuilding.calc()
					return
				}
				const value = parseFloat(investor.spaAndGymArea || 0) * price
				investor[this.name] = value.toFixed(2)
				calcFields.totalCostOfBuilding.calc()
			}
		},
		totalCostOfBuildingPools: {
			label: 'Стоимость строительства бассейнов, тыс. руб.',
			name: 'totalCostOfBuildingPools',
			calc: function () {
				if (!investor.poolsArea) {
					investor[this.name] = ''
					calcFields.totalCostOfBuilding.calc()
					return
				}
				const [status, price] = getBuildingCostFromDIR(investor)
				if (!status) {
					errors[this.name] = price
					investor[this.name] = ''
					calcFields.totalCostOfBuilding.calc()
					return
				}
				const value = parseFloat(investor.poolsArea || 0) * price
				investor[this.name] = value.toFixed(2)
				calcFields.totalCostOfBuilding.calc()
			}
		},
		totalCostOfBuildingHotelOthers: {
			label: 'Стоимость строительства иных объектов, тыс. руб.',
			name: 'totalCostOfBuildingHotelOthers',
			calc: function () {
				if (!investor.hotelOthersArea) {
					investor[this.name] = ''
					calcFields.totalCostOfBuilding.calc()
					return
				}
				const [status, price] = getBuildingCostFromDIR(investor)
				if (!status) {
					errors[this.name] = price
					investor[this.name] = ''
					calcFields.totalCostOfBuilding.calc()
					return
				}
				const value = parseFloat(investor.hotelOthersArea || 0) * price
				investor[this.name] = value.toFixed(2)
				calcFields.totalCostOfBuilding.calc()
			}
		},
		totalCostOfBuildingInfrastructure: {
			label: 'Стоимость строительства дополнительной инфраструктуры (отдельные объекты), тыс. руб.',
			name: 'totalCostOfBuildingInfrastructure',
			calc: function () {
				if (!investor.totalCostOfBuildingAquapark && !investor.totalCostOfBuildingSportComplex
					&& !investor.totalCostOfBuildingAmusementPark && !investor.totalCostOfBuildingThermalComplex
					&& !investor.totalCostOfBuildingInfrastructureOthers) {
					investor[this.name] = ''
					calcFields.totalCost.calc()
					return
				}
				const value = parseFloat(investor.totalCostOfBuildingAquapark || 0)
					+ parseFloat(investor.totalCostOfBuildingSportComplex || 0)
					+ parseFloat(investor.totalCostOfBuildingAmusementPark || 0)
					+ parseFloat(investor.totalCostOfBuildingThermalComplex || 0)
					+ parseFloat(investor.totalCostOfBuildingInfrastructureOthers || 0)
				investor[this.name] = value.toFixed(2)
				calcFields.totalCost.calc()
			}
		},
		totalCostOfBuildingAquapark: {
			label: 'Стоимость строительства аквапарка, тыс. руб.',
			name: 'totalCostOfBuildingAquapark',
			calc: function () {
				if (!investor.aquaparkArea) {
					investor[this.name] = ''
					calcFields.totalCostOfBuildingInfrastructure.calc()
					return
				}
				const [status, price] = getBuildingCostFromDIR(investor)
				if (!status) {
					errors[this.name] = price
					investor[this.name] = ''
					calcFields.totalCostOfBuildingInfrastructure.calc()
					return
				}
				const value = parseFloat(investor.aquaparkArea || 0) * price
				investor[this.name] = value.toFixed(2)
				calcFields.totalCostOfBuildingInfrastructure.calc()
			}
		},
		totalCostOfBuildingSportComplex: {
			label: 'Стоимость строительства физкультурно-оздоровительный комплекса, тыс. руб.',
			name: 'totalCostOfBuildingSportComplex',
			calc: function () {
				if (!investor.sportComplexArea) {
					investor[this.name] = ''
					calcFields.totalCostOfBuildingInfrastructure.calc()
					return
				}
				const [status, price] = getBuildingCostFromDIR(investor)
				if (!status) {
					errors[this.name] = price
					investor[this.name] = ''
					calcFields.totalCostOfBuildingInfrastructure.calc()
					return
				}
				const value = parseFloat(investor.sportComplexArea || 0) * price
				investor[this.name] = value.toFixed(2)
				calcFields.totalCostOfBuildingInfrastructure.calc()
			}
		},
		totalCostOfBuildingAmusementPark: {
			label: 'Стоимость строительства парк развлечений, аттракционов, тыс. руб.',
			name: 'totalCostOfBuildingAmusementPark',
			calc: function () {
				if (!investor.amusementParkArea) {
					investor[this.name] = ''
					calcFields.totalCostOfBuildingInfrastructure.calc()
					return
				}
				const [status, price] = getBuildingCostFromDIR(investor)
				if (!status) {
					errors[this.name] = price
					investor[this.name] = ''
					calcFields.totalCostOfBuildingInfrastructure.calc()
					return
				}
				const value = parseFloat(investor.amusementParkArea || 0) * price
				investor[this.name] = value.toFixed(2)
				calcFields.totalCostOfBuildingInfrastructure.calc()
			}
		},
		totalCostOfBuildingThermalComplex: {
			label: 'Стоимость строительства термальный комплекса, тыс. руб.',
			name: 'totalCostOfBuildingThermalComplex',
			calc: function () {
				if (!investor.thermalComplexArea) {
					investor[this.name] = ''
					calcFields.totalCostOfBuildingInfrastructure.calc()
					return
				}
				const [status, price] = getBuildingCostFromDIR(investor)
				if (!status) {
					errors[this.name] = price
					investor[this.name] = ''
					calcFields.totalCostOfBuildingInfrastructure.calc()
					return
				}
				const value = parseFloat(investor.thermalComplexArea || 0) * price
				investor[this.name] = value.toFixed(2)
				calcFields.totalCostOfBuildingInfrastructure.calc()
			}
		},
		totalCostOfBuildingInfrastructureOthers: {
			label: 'Стоимость строительства иных объектов инфраструктуры, тыс. руб.',
			name: 'totalCostOfBuildingInfrastructureOthers',
			calc: function () {
				if (!investor.infrastructureOthersArea) {
					investor[this.name] = ''
					calcFields.totalCostOfBuildingInfrastructure.calc()
					return
				}
				const [status, price] = getBuildingCostFromDIR(investor)
				if (!status) {
					errors[this.name] = price
					investor[this.name] = ''
					calcFields.totalCostOfBuildingInfrastructure.calc()
					return
				}
				const value = parseFloat(investor.infrastructureOthersArea || 0) * price
				investor[this.name] = value.toFixed(2)
				calcFields.totalCostOfBuildingInfrastructure.calc()
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
				},
				{
					label: 'Стоимость 1 м² объекта, тыс.руб.',
					name: 'costPerSqMeter',
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
					disabled: true
				},
				{
					label: 'Площадь номерного фонда, включая апартаменты и места общего пользования, м²',
					name: 'roomsArea',
					type: 'number',
					min: 0,
					calc: () => {
						calcFields.hotelArea.calc()
						calcFields.totalCostOfBuildingRooms.calc()
					}
				},
				{
					label: 'Стоимость строительства ресторанов, тыс. руб.',
					name: 'totalCostOfBuildingRestaurants',
					type: 'number',
					disabled: true
				},
				{
					label: 'Площадь ресторанов, м²',
					name: 'restaurantsArea',
					type: 'number',
					min: 0,
					calc: () => {
						calcFields.hotelArea.calc()
						calcFields.totalCostOfBuildingRestaurants.calc()
					}
				},
				{
					label: 'Стоимость строительства конференц-залов, тыс. руб.',
					name: 'totalCostOfBuildingConfRooms',
					type: 'number',
					disabled: true
				},
				{
					label: 'Площадь конференц-залов, м²',
					name: 'confRoomsArea',
					type: 'number',
					min: 0,
					calc: () => {
						calcFields.hotelArea.calc()
						calcFields.totalCostOfBuildingConfRooms.calc()
					}
				},
				{
					label: 'Стоимость строительства СПА и фитнес центров, тыс. руб.',
					name: 'totalCostOfBuildingSpaAndGym',
					type: 'number',
					disabled: true
				},
				{
					label: 'Площадь СПА и фитнес центров, м²',
					name: 'spaAndGymArea',
					type: 'number',
					min: 0,
					calc: () => {
						calcFields.hotelArea.calc()
						calcFields.totalCostOfBuildingSpaAndGym.calc()
					}
				},
				{
					label: 'Стоимость строительства бассейнов, тыс. руб.',
					name: 'totalCostOfBuildingPools',
					type: 'number',
					disabled: true
				},
				{
					label: 'Площадь бассейнов, м²',
					name: 'poolsArea',
					type: 'number',
					min: 0,
					calc: () => {
						calcFields.hotelArea.calc()
						calcFields.totalCostOfBuildingPools.calc()
					}
				},
				{
					label: 'Стоимость строительства иных объектов, тыс. руб.',
					name: 'totalCostOfBuildingHotelOthers',
					type: 'number',
					disabled: true
				},
				{
					label: 'Площадь иных объектов, м²',
					name: 'hotelOthersArea',
					type: 'number',
					min: 0,
					calc: () => {
						calcFields.hotelArea.calc()
						calcFields.totalCostOfBuildingHotelOthers.calc()
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
					disabled: true
				},
				{
					label: 'Площадь аквапарка, м²',
					name: 'aquaparkArea',
					type: 'number',
					min: 0,
					calc: () => {
						calcFields.infrastructureArea.calc()
						calcFields.totalCostOfBuildingAquapark.calc()
					}
				},
				{
					label: 'Стоимость строительства физкультурно-оздоровительный комплекса, тыс. руб.',
					name: 'totalCostOfBuildingSportComplex',
					type: 'number',
					disabled: true
				},
				{
					label: 'Площадь физкультурно-оздоровительный комплекса, м²',
					name: 'sportComplexArea',
					type: 'number',
					min: 0,
					calc: () => {
						calcFields.infrastructureArea.calc()
						calcFields.totalCostOfBuildingSportComplex.calc()
					}
				},
				{
					label: 'Стоимость строительства парк развлечений, аттракционов, тыс. руб.',
					name: 'totalCostOfBuildingAmusementPark',
					type: 'number',
					disabled: true
				},
				{
					label: 'Площадь парк развлечений, аттракционов, м²',
					name: 'amusementParkArea',
					type: 'number',
					min: 0,
					calc: () => {
						calcFields.infrastructureArea.calc()
						calcFields.totalCostOfBuildingAmusementPark.calc()
					}
				},
				{
					label: 'Стоимость строительства термальный комплекса, тыс. руб.',
					name: 'totalCostOfBuildingThermalComplex',
					type: 'number',
					disabled: true
				},
				{
					label: 'Площадь термальный комплекса, м²',
					name: 'thermalComplexArea',
					type: 'number',
					min: 0,
					calc: () => {
						calcFields.infrastructureArea.calc()
						calcFields.totalCostOfBuildingThermalComplex.calc()
					}
				},
				{
					label: 'Стоимость строительства иных объектов инфраструктуры, тыс. руб.',
					name: 'totalCostOfBuildingInfrastructureOthers',
					type: 'number',
					disabled: true
				},
				{
					label: 'Площадь иных объектов инфраструктуры, м²',
					name: 'infrastructureOthersArea',
					type: 'number',
					min: 0,
					calc: () => {
						calcFields.infrastructureArea.calc()
						calcFields.totalCostOfBuildingInfrastructureOthers.calc()
					}
				},
				{
					label: 'Общая протяженность ГЛК, м',
					name: 'totalLengthGLK',
					type: 'number',
					min: 0,
				},
			],
		},
		{
			ind: 4,
			title: 'Экономические показатели',
			fields: [],
		},
		{
			ind: 5,
			title: 'Финансирование',
			fields: [],
		}
	]

	function setInvestor(data) {
		if (!data?.investor)
			return

		investor = data.investor
		highlightSave = false
		activeInvestorTab = 1

		investor.regionsTitle = getDirValue('regions', 'iso_code', 'title', investor.region)
		investor.buildingTypeTitle = getDirValue('buildingTypes', 'name', 'title', investor.buildingType)
		investor.buildingCategoryTitle = getDirValue('buildingCategory', 'name', 'title', investor.buildingCategory)

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
</script>

{#if investor}
	<div class="flex items-center gap-5">
		<div class="text-2xl">{investor.name}</div>
		<button class="btn btn-primary ml-auto"
		        class:btn-outline={!highlightSave}
		        on:click={saveInvestor}>Сохранить
		</button>
		<button class="btn btn-outline"
		        on:click={estimateStopFactors}>
			Провести оценку
		</button>
	</div>
	<div class="my-10 flex flex-col gap-2">
		<div class="form-control w-full">
			<label class="label" for="theInvestorName">
				<span class="label-text">Название</span>
			</label>
			<input id="theInvestorName" type="text" placeholder="Название проекта"
			       on:change={() => highlightSave = true}
			       bind:value={investor.name}
			       class="input input-bordered w-full"/>
		</div>
		<div class="form-control">
			<label class="label" for="theInvestorRegion">
				<span class="label-text">Регион</span>
			</label>
			<select class="select select-bordered" id="theInvestorRegion"
			        on:change={() => highlightSave = true}
			        bind:value={investor.region}>
				<option disabled selected value="">Выберите регион</option>
				{#each $DIRs['regions']?.values || [] as region}
					<option value="{region.iso_code}">{region.title}</option>
				{/each}
			</select>
		</div>
		<div class="form-control">
			<label class="label" for="theInvestorBuildingType">
				<span class="label-text">Тип объекта</span>
			</label>
			<select class="select select-bordered" id="theInvestorBuildingType"
			        on:change={() => highlightSave = true}
			        bind:value={investor.buildingType}>
				<option disabled selected value="">Выберите тип объекта</option>
				{#each $DIRs['buildingTypes']?.values || [] as bType}
					<option value="{bType.name}">{bType.title}</option>
				{/each}
			</select>
		</div>
		<div class="form-control">
			<label class="label" for="theInvestorBuildingCategory">
				<span class="label-text">Категория объекта</span>
			</label>
			<select class="select select-bordered" id="theInvestorBuildingCategory"
			        on:change={() => highlightSave = true}
			        bind:value={investor.buildingCategory}>
				<option selected value="">Выберите категорию объекта</option>
				{#each $DIRs['buildingCategory']?.values || [] as bType}
					<option value="{bType.name}">{bType.title}</option>
				{/each}
			</select>
		</div>
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
				     class:h-0={activeInvestorTab !== tab.ind}>
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
							{:else if field.type === 'number'}
								<Input {...field}
								       on:change={() => (highlightSave = true) && field.calc && field.calc()}
								       bind:value={investor[field.name]}/>
							{:else if field.type === 'check'}
								<Check {...field}
								       on:change={() => (highlightSave = true)}
								       bind:checked={investor[field.name]}/>
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
		<div class="shrink-0 w-full overflow-hidden transition-all"
		     class:h-0={activeInvestorTab !== tabs[3].ind}>
			<div class="form-control w-full p-5">
				<label class="label" for="totalFunds">
					<span class="label-text">Общий объем финансирования, тыс. руб.</span>
				</label>
				<input id="totalFunds" type="number" placeholder=""
				       bind:value={investor.totalFunds}
				       on:change={() => highlightSave = true}
				       class="input input-bordered w-full max-w-lg"/>
			</div>
			<div class="form-control w-full p-5">
				<label class="label" for="bankLoanAmount">
					<span class="label-text">Кредит банка, тыс. руб.</span>
				</label>
				<input id="bankLoanAmount" type="number" placeholder=""
				       bind:value={investor.bankLoanAmount}
				       on:change={() => highlightSave = true}
				       class="input input-bordered w-full max-w-lg"/>
			</div>
			<div class="form-control w-full p-5">
				<label class="label" for="investorContributionCash">
					<span class="label-text">Взнос Инвестора в уставный капитал СПК в денежной форме, тыс. руб.</span>
				</label>
				<input id="investorContributionCash" type="number" placeholder=""
				       bind:value={investor.investorContributionCash}
				       on:change={() => highlightSave = true}
				       class="input input-bordered w-full max-w-lg"/>
			</div>
			<div class="form-control w-full p-5">
				<label class="label" for="investorContributionNotCash">
					<span class="label-text">Имущественный взнос Инвестора в уставный капитал СПК (не в денежной форме), тыс. руб.</span>
				</label>
				<input id="investorContributionNotCash" type="number" placeholder=""
				       bind:value={investor.investorContributionNotCash}
				       on:change={() => highlightSave = true}
				       class="input input-bordered w-full max-w-lg"/>
			</div>
			<div class="form-control w-full p-5">
				<label class="label" for="corporationContribution">
					<span class="label-text">Корпорация Туризм.РФ (взнос в уставный капитал СПК), тыс. руб.</span>
				</label>
				<input id="corporationContribution" type="number" placeholder=""
				       bind:value={investor.corporationContribution}
				       on:change={() => highlightSave = true}
				       class="input input-bordered w-full max-w-lg"/>
			</div>
			<div class="form-control w-full p-5">
				<label class="label" for="debtCoverageRatio">
					<span class="label-text">Уровень долговой нагрузки</span>
				</label>
				<input id="debtCoverageRatio" type="number" placeholder=""
				       bind:value={investor.debtCoverageRatio}
				       on:change={() => highlightSave = true}
				       class="input input-bordered w-full max-w-lg"/>
			</div>
		</div>
		<div class="shrink-0 w-full overflow-hidden transition-all"
		     class:h-0={activeInvestorTab !== tabs[4].ind}>
			<div class="form-control w-full p-5">
				<label class="label" for="numberOfOperationMonths">
					<span class="label-text">Количество месяцев функционирования в году</span>
				</label>
				<input id="numberOfOperationMonths" type="number" placeholder=""
				       bind:value={investor.numberOfOperationMonths}
				       on:change={() => highlightSave = true}
				       class="input input-bordered w-full max-w-lg"/>
			</div>
			<div class="form-control w-full p-5">
				<label class="label" for="adr">
					<span class="label-text">ADR — отпускной тариф, руб./сутки</span>
				</label>
				<input id="adr" type="number" placeholder=""
				       bind:value={investor.adr}
				       on:change={() => highlightSave = true}
				       class="input input-bordered w-full max-w-lg"/>
			</div>
			<div class="form-control w-full p-5">
				<label class="label" for="marginEBITDA">
					<span class="label-text">Рентабельность по EBITDA (прогноз Инвестора), %</span>
				</label>
				<input id="marginEBITDA" type="number" placeholder=""
				       bind:value={investor.marginEBITDA}
				       on:change={() => highlightSave = true}
				       class="input input-bordered w-full max-w-lg"/>
			</div>
			<div class="form-control w-full p-5">
				<label class="label" for="occ">
					<span class="label-text">Occupancy (OCC) — реальная заполняемость, %</span>
				</label>
				<input id="occ" type="number" placeholder=""
				       bind:value={investor.occ}
				       on:change={() => highlightSave = true}
				       class="input input-bordered w-full max-w-lg"/>
			</div>
			<div class="form-control w-full p-5">
				<label class="label" for="doubleOcc">
					<span class="label-text">Double Occupancy — сколько гостей в среднем проживает в одном номере, чел./номер</span>
				</label>
				<input id="doubleOcc" type="number" placeholder=""
				       bind:value={investor.doubleOcc}
				       on:change={() => highlightSave = true}
				       class="input input-bordered w-full max-w-lg"/>
			</div>
			<div class="form-control w-full p-5">
				<label class="label" for="touristFlow">
					<span class="label-text">Турпоток, чел./год</span>
				</label>
				<input id="touristFlow" type="number" placeholder=""
				       bind:value={investor.touristFlow}
				       on:change={() => highlightSave = true}
				       class="input input-bordered w-full max-w-lg"/>
			</div>
			<div class="form-control w-full p-5">
				<label class="label" for="numberOfStaff">
					<span class="label-text">Количество сотрудников, чел.</span>
				</label>
				<input id="numberOfStaff" type="number" placeholder=""
				       bind:value={investor.numberOfStaff}
				       on:change={() => highlightSave = true}
				       class="input input-bordered w-full max-w-lg"/>
			</div>
		</div>
	</div>

	<div class="flex items-center gap-5 mt-10">
		<button class="btn btn-primary ml-auto"
		        class:btn-outline={!highlightSave}
		        on:click={saveInvestor}>Сохранить
		</button>
		<button class="btn btn-outline"
		        on:click={estimateStopFactors}>
			Провести оценку
		</button>
	</div>
{/if}