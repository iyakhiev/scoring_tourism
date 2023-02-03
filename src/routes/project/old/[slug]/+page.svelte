<script>
	import { DIRs, projects } from '$lib/stores'
	import { estimate } from '$lib/stopFactors'
	import Input from '$lib/components/input.svelte'
	import Check from '$lib/components/check.svelte'
	import Select from '$lib/components/select.svelte'
	import { openModal } from '$lib/components/modals.svelte'
	import { goto } from '$app/navigation'

	// todo check tab problem
	// todo check RevPAC, which touristFlow use to calc? another one
	// todo add another touristFlow? yes
	// todo fix object for hotels, not complex
	// todo add name field for objects

	export let data

	let project
	let highlightSave = false
	let activeProjectTab = 1
	let activeObject = 0
	let activeInfrastructureObject = null
	let errors = {}

	const tabs = [
		{
			ind: 2,
			title: 'Информация о заявителе',
			name: 'applicantInfo',
			fields: [
				{
					label: 'Фамилия контактного лица',
					name: 'applicantFamilyName',
					type: 'text'
				},
				{
					label: 'Имя контактного лица',
					name: 'applicantName',
					type: 'text'
				},
				{
					label: 'Электронная почта',
					name: 'applicantEmail',
					type: 'text'
				},
				{
					label: 'Номер телефона',
					name: 'applicantPhone',
					type: 'number'
				},
				{
					label: 'Наименование юридического лица',
					name: 'applicantLegalEntityName',
					type: 'text'
				},
				{
					label: 'ОГРН',
					name: 'applicantOGRN',
					type: 'number'
				},
				{
					label: 'ИНН',
					name: 'applicantINN',
					type: 'number'
				}
			]
		},
		{
			ind: 3,
			title: 'Данные бухгалтерского баланса',
			name: 'balanceSheetData',
			fields: [
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
						calcFields.doAndKoSum.calc()
					}
				},
				{
					label: 'Коэффициент абсолютной ликвидности',
					name: 'absLiqRatio',
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
					label: 'Коэффициент быстрой ликвидности',
					name: 'fastLiqRatio',
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
					label: 'Коэффициент текущей ликвидности',
					name: 'currentLiqRatio',
					type: 'number',
					disabled: true
				},
				{
					label: 'Собственный капитал',
					name: 'sk',
					type: 'number',
					min: 0,
					calc: () => calcFields.debtToEquityRatio.calc()
				},
				{
					label: 'Коэфициент соотношения заемных и собственных средств',
					name: 'debtToEquityRatio',
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
					label: 'Коэффициент общей платежеспособности',
					name: 'solvencyRatio',
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
						calcFields.doAndKoSum.calc()
					}
				},
				{
					label: 'Сумма долгосрочных и краткосрочных обязательств',
					name: 'doAndKoSum',
					type: 'number',
					disabled: true
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
			ind: 4,
			title: 'Общая информация о проекте',
			name: 'projectInfo',
			fields: [
				{
					label: 'Наименование проекта',
					name: 'projectName',
					type: 'text',
				},
				{
					label: 'Субъект Российской Федерации',
					name: 'region',
					type: 'select',
					options: $DIRs['regions'].values,
				},
				{
					label: 'Населенный пункт',
					name: 'locality',
					type: 'text'
				},
				{
					label: 'Адрес объекта',
					name: 'address',
					type: 'text'
				},
				{
					label: 'Статус СПК',
					name: 'statusOfSPK',
					type: 'select',
					options: [
						{
							name: 'new',
							title: 'Новая',
						},
						{
							name: 'operating',
							title: 'Действующая',
						},
					]
				},
				{
					label: 'Соответствие категории и вида разрешенного использования земельного участка целям проекта',
					name: 'complianceOfLandTypeWithProject',
					type: 'check',
				},
				{
					label: 'Дата поступления анкеты',
					name: 'applicationSubmissionDate',
					type: 'date',
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
					label: 'Расходы pre-opening, тыс. руб.',
					name: 'preOpeningCost',
					type: 'number',
					min: 0
				},
			]
		},
		{
			ind: 5,
			title: 'Транспортная доступность',
			name: 'transportAccessibility',
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
			]
		},
		{
			ind: 6,
			title: 'Информация об объектах в составе проекта',
			name: 'objectsInfo',
			fields: [
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
					label: 'Общее количество номеров в КСР, шт.',
					name: 'totalNumberOfRooms',
					type: 'number',
					disabled: true
				},
				{
					label: 'Доля площадей КСР в составе объекта (для МФК), %',
					name: 'shareOfRoomsArea',
					type: 'number',
					disabled: true
				},
				{
					label: 'Общая площадь объектов и дополнительной инфраструктуры, м²',
					name: 'totalArea',
					type: 'number',
					disabled: true
				},
				{
					label: 'Площадь гостиниц(ы), м²',
					name: 'hotelArea',
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
					label: 'Стоимость строительства гостиниц(ы), тыс. руб.',
					name: 'totalCostOfBuilding',
					type: 'number',
					disabled: true
				},
				{
					label: 'Стоимость строительства дополнительной инфраструктуры (отдельные объекты), тыс. руб.',
					name: 'totalCostOfBuildingInfrastructure',
					type: 'number',
					disabled: true
				},
			]
		},
		{
			ind: 7,
			title: 'Экономические показатели',
			name: 'economicIndicators',
			fields: [
				{
					label: 'Количество месяцев функционирования в году',
					name: 'numberOfOperationMonths',
					type: 'number',
					min: 0
				},
				{
					label: 'Occupancy (OCC) — реальная заполняемость, %',
					name: 'occ',
					type: 'number',
					disabled: true
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
						calcFields.revPAR.calc()
					}
				},
				{
					label: 'Выручка ресторанов, тыс. руб. в год после выхода на проектную нагрузку',
					name: 'restaurantsRevenue',
					type: 'number',
					min: 0,
					calc: () => {
						calcFields.totalRevenues.calc()
					}
				},
				{
					label: 'Выручка СПА и фитнес-центров, тыс. руб. в год после выхода на проектную нагрузку',
					name: 'spaAndGymRevenue',
					type: 'number',
					min: 0,
					calc: () => {
						calcFields.totalRevenues.calc()
					}
				},
				{
					label: 'Выручка аквапарка, тыс. руб. в год после выхода на проектную нагрузку',
					name: 'aquaparkRevenue',
					type: 'number',
					min: 0,
					calc: () => {
						calcFields.totalRevenues.calc()
					}
				},
				{
					label: 'Выручка инфраструктуры ГЛК, тыс. руб. в год после выхода на проектную нагрузку',
					name: 'glkRevenue',
					type: 'number',
					min: 0,
					calc: () => calcFields.totalRevenues.calc()
				},
				{
					label: 'Выручка парка развлечений, аттракционов, тыс. руб. в год после выхода на проектную нагрузку',
					name: 'amusementsRevenue',
					type: 'number',
					min: 0,
					calc: () => {
						calcFields.totalRevenues.calc()
					}
				},
				{
					label: 'Выручка прочее, тыс. руб. в год после выхода на проектную нагрузку',
					name: 'otherRevenue',
					type: 'number',
					min: 0,
					calc: () => calcFields.totalRevenues.calc()
				},
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
					label: 'Общее количество новых рабочих мест, чел.',
					name: 'totalNumberOfNewJobs',
					type: 'number',
					disabled: true
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
			]
		},
		{
			ind: 8,
			title: 'Финансирование',
			name: 'financing',
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
					calc: () => {
						calcFields.ownFunds.calc()
						calcFields.corporationFundsShare.calc()
					}
				},
				{
					label: 'Имущественный взнос Инвестора в уставный капитал СПК (не в денежной форме), тыс. руб.',
					name: 'investorContributionNotCash',
					type: 'number',
					min: 0,
					calc: () => {
						calcFields.ownFunds.calc()
						calcFields.corporationFundsShare.calc()
					}
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
					calc: () => {
						calcFields.ownFunds.calc()
						calcFields.corporationFundsShare.calc()
					}
				},
				{
					label: 'Корпорация Туризм.РФ  (заем), тыс. руб.',
					name: 'corporationLoan',
					type: 'number',
					min: 0,
					calc: () => {
						calcFields.ownFunds.calc()
						calcFields.corporationFundsShare.calc()
					}
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
					name: 'needOfSoftLoan',
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
					label: 'EBITDA, тыс. руб. (за год после ввода в эксплуатацию)',
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
					label: 'Выплаты тела кредита, тыс. руб. в год (D)',
					name: 'loanBodyPayments',
					type: 'number',
					disabled: true
				},
			],
		}
	]

	$: setProject(data)

	function getDirValue(dirName) {
		const values = $DIRs[dirName]?.values || []
		for (const valueRow of values)
			if (valueRow.region === project.region
				&& valueRow.buildingType === project.buildingType
				&& (valueRow.buildingCategory || '') === (project.buildingCategory || ''))
				return [true, valueRow.value]

		const dirTitle = $DIRs[dirName] ? $DIRs[dirName].title : dirName
		const searchFieldsStr = `${project.regionTitle}, ${project.buildingTypeTitle}`
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
		if (project[field] != value) {
			console.log('updateProjectProp', `"${field}"`, 'current value', `"${project[field]}"`, 'new value', `"${value}"`)
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
				const value = project.kr / a
				updateProjectProp(this.name, +value.toFixed(2))
			}
		},
		doAndKoSum: {
			label: 'Сумма долгосрочных и краткосрочных обязательств',
			name: 'doAndKoSum',
			calc: function () {
				const value = parseFloat(project.do || 0) + parseFloat(project.ko || 0)
				updateProjectProp(this.name, value)
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
				let value = ''

				if (project.totalCost && project.totalNumberOfRooms) {
					value = project.totalCost / project.totalNumberOfRooms
					value = +value.toFixed(2)
				}

				updateProjectProp(this.name, value)
			}
		},
		shareOfRoomsArea: {
			label: 'Доля площадей КСР в составе объекта (для МФК), %',
			name: 'shareOfRoomsArea',
			calc: function () {
				if (!project.totalArea)
					return updateProjectProp(this.name)

				const roomsArea = project.objects
					&& project.objects.reduce((acc, object) => {
						acc += parseFloat(object.roomsArea || 0)
						return acc
					}, 0)

				const value = (roomsArea / project.totalArea) * 100
				updateProjectProp(this.name, +value.toFixed(2))
			}
		},
		totalArea: {
			label: 'Общая площадь объектов, м²',
			name: 'totalArea',
			calc: function () {
				let value = 0

				if (project.hotelArea || project.infrastructureArea)
					value = parseFloat(project.hotelArea || 0)
						+ parseFloat(project.infrastructureArea || 0)

				updateProjectProp(this.name, value)
				calcFields.costPerSqMeter.calc()
				calcFields.revenuePerSqMeter.calc()
			}
		},
		hotelArea: {
			label: 'Площадь гостиницы, м²',
			name: 'hotelArea',
			calc: function () {
				let value = 0

				if (project.objects && project.objects.length)
					for (const key in project.objects) {
						const object = project.objects[key]

						object[this.name] = parseFloat(object.roomsArea || 0)
							+ parseFloat(object.restaurantsArea || 0)
							+ parseFloat(object.confRoomsArea || 0)
							+ parseFloat(object.spaAndGymArea || 0)
							+ parseFloat(object.poolsArea || 0)
							+ parseFloat(object.hotelOthersArea || 0)

						value += object[this.name]

						// project.objects[key] = object
					}

				updateProjectProp(this.name, value)
				calcFields.totalArea.calc()
			}
		},
		infrastructureArea: {
			label: 'Площадь дополнительной инфраструктуры (отдельные объекты), м²',
			name: 'infrastructureArea',
			calc: function () {
				let value = 0

				if (project.infrastructureObjects && project.infrastructureObjects.length)
					for (const key in project.infrastructureObjects) {
						const infrastructure = project.infrastructureObjects[key]

						value += parseFloat(infrastructure.area || 0)
					}

				updateProjectProp(this.name, value)
				calcFields.totalArea.calc()
			}
		},
		totalCost: {
			label: 'Общая стоимость объектов и дополнительной инфраструктуры (с НДС, в ценах соответствующих лет), тыс. руб',
			name: 'totalCost',
			calc: function () {
				let value = 0

				if (project.totalCostOfBuilding || project.totalCostOfBuildingInfrastructure)
					value = parseFloat(project.totalCostOfBuilding || 0)
						+ parseFloat(project.totalCostOfBuildingInfrastructure || 0)

				updateProjectProp(this.name, value)
				calcFields.costPerRoom.calc()
				calcFields.costPerSqMeter.calc()
			}
		},
		totalCostOfBuilding: {
			label: 'Стоимость строительства объектов, тыс. руб.',
			name: 'totalCostOfBuilding',
			calc: function () {
				let value = 0

				if (project.objects && project.objects.length)
					for (const key in project.objects) {
						const object = project.objects[key]

						object[this.name] = parseFloat(object.totalCostOfBuildingRooms || 0)
							+ parseFloat(object.totalCostOfBuildingRestaurants || 0)
							+ parseFloat(object.totalCostOfBuildingConfRooms || 0)
							+ parseFloat(object.totalCostOfBuildingSpaAndGym || 0)
							+ parseFloat(object.totalCostOfBuildingPools || 0)
							+ parseFloat(object.totalCostOfBuildingHotelOthers || 0)

						value += object[this.name]

						// project.objects[key] = object
					}

				updateProjectProp(this.name, value)
				calcFields.totalCost.calc()
			}
		},
		totalCostOfBuildingInfrastructure: {
			label: 'Стоимость строительства дополнительной инфраструктуры (отдельные объекты), тыс. руб.',
			name: 'totalCostOfBuildingInfrastructure',
			calc: function () {
				let value = 0

				if (project.infrastructureObjects && project.infrastructureObjects.length)
					for (const key in project.infrastructureObjects) {
						const infrastructure = project.infrastructureObjects[key]

						value += parseFloat(infrastructure.cost || 0)
					}

				updateProjectProp(this.name, value)
				calcFields.totalCost.calc()
			}
		},
		occ: {
			label: 'Occupancy (OCC) — реальная заполняемость, %',
			name: 'occ',
			calc: function () {
				if (project.objects && project.objects.length) {
					for (const key in project.objects) {
						const object = project.objects[key]

						if (!object.totalRoomsOccupied || !object.numberOfRooms)
							continue

						let value = (object.totalRoomsOccupied / object.numberOfRooms) * 100
						value = +value.toFixed(2)
						object[this.name] = value

						// project.objects[key] = object
					}
				}
			}
		},
		doubleOcc: {
			label: 'Double Occupancy — сколько гостей в среднем проживает в одном номере, чел./номер',
			name: 'doubleOcc',
			calc: function () {
				if (project.objects && project.objects.length) {
					for (const key in project.objects) {
						const object = project.objects[key]

						if (!object.totalRoomsOccupied || !object.numberOfRooms)
							continue

						let value = object.totalGuestsInHouse / object.totalRoomsOccupied
						value = +value.toFixed(2)
						object[this.name] = value

						// project.objects[key] = object
					}
				}

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
				calcFields.EBITDA.calc()
			}
		},
		revPAR: {
			label: 'RevPAR — средняя выручка за номер в год, тыс. руб.',
			name: 'revPAR',
			calc: function () {
				let value = ''

				if (project.roomRevenue && project.totalNumberOfRooms) {
					value = project.roomRevenue / project.totalNumberOfRooms
					value = +value.toFixed(2)
				}

				updateProjectProp(this.name, value)
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
				let value = 0

				if (project.objects && project.objects.length) {
					const total = {
						numberOfNewJobs: 0,
						numberOfRooms: 0
					}

					for (const key in project.objects) {
						const object = project.objects[key]

						const numberOfNewJobs = parseFloat(object.numberOfNewJobs || 0)
						const numberOfRooms = parseFloat(object.numberOfRooms || 0)

						total.numberOfNewJobs += numberOfNewJobs
						total.numberOfRooms += numberOfRooms

						if (numberOfRooms) {
							let value = numberOfNewJobs / numberOfRooms
							value = +value.toFixed(2)
							object[this.name] = value
						}
					}

					if (total.numberOfRooms) {
						value = total.numberOfNewJobs / total.numberOfRooms
						value = +value.toFixed(2)
					}
				}

				updateProjectProp(this.name, value)
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
		totalFunds: {
			label: 'Общий объем финансирования (Total Founds), тыс. руб.',
			name: 'totalFunds',
			calc: function () {
				const value = parseFloat(project.ownFunds || 0) + parseFloat(project.bankLoanAmount || 0)
				updateProjectProp(this.name, +value.toFixed(2))
				calcFields.creditFundsShare.calc()
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
			label: 'EBITDA, тыс. руб. (за год после ввода в эксплуатацию)',
			name: 'EBITDA',
			calc: function () {
				if (!project.totalRevenues || !project.marginEBITDA) {
					updateProjectProp(this.name)
					calcFields.debtCoverageRatio.calc()
					return
				}

				const value = project.totalRevenues * project.marginEBITDA
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
			label: 'Выплаты тела кредита, тыс. руб. в год (D)',
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
		totalNumberOfRooms: {
			label: 'Общее количество номеров в КСР, шт.',
			name: 'totalNumberOfRooms',
			calc: function () {
				let value = ''

				if (project.objects && project.objects.length)
					value = project.objects.reduce((acc, row) => {
						acc += parseFloat(row.numberOfRooms || 0)
						return acc
					}, 0)

				updateProjectProp(this.name, value)
				calcFields.costPerRoom.calc()
				calcFields.revPAR.calc()
				calcFields.staffPerRoom.calc()
			}
		},
		totalNumberOfNewJobs: {
			label: 'Общее количество новых рабочих мест, чел.',
			name: 'totalNumberOfNewJobs',
			calc: function () {
				let value = 0

				if (project.objects && project.objects.length)
					value = project.objects.reduce((acc, object) => {
						acc += parseFloat(object.numberOfNewJobs || 0)
						return acc
					}, 0)

				if (project.infrastructureObjects && project.infrastructureObjects.length)
					value += project.infrastructureObjects.reduce((acc, row) => {
						acc += parseFloat(row.numberOfNewJobs || 0)
						return acc
					}, 0)

				updateProjectProp(this.name, value)
				calcFields.staffPerRoom.calc()
			}
		},
	}

	const tabs1 = [
		{
			ind: 2,
			title: 'Оценка Инвестора',
			fields: [
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
					label: 'Коэффициент абсолютной ликвидности',
					name: 'absLiqRatio',
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
					label: 'Коэффициент быстрой ликвидности',
					name: 'fastLiqRatio',
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
					label: 'Коэффициент текущей ликвидности',
					name: 'currentLiqRatio',
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
					label: 'Сумма долгосрочных и краткосрочных обязательств',
					name: 'doAndKoSum',
					type: 'number',
					disabled: true
				},
				{
					label: 'Собственный капитал',
					name: 'sk',
					type: 'number',
					min: 0,
					calc: () => calcFields.debtToEquityRatio.calc()
				},
				{
					label: 'Коэфициент соотношения заемных и собственных средств',
					name: 'debtToEquityRatio',
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
					label: 'Коэффициент общей платежеспособности',
					name: 'solvencyRatio',
					type: 'number',
					disabled: true
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
			ind: 3,
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
			ind: 4,
			title: 'ТЭП, CAPEX',
			fields: [
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
					label: 'Общее количество номеров в КСР, шт.',
					name: 'totalNumberOfRooms',
					type: 'number',
					disabled: true
				},
				{
					label: 'Доля площадей КСР в составе объекта (для МФК), %',
					name: 'shareOfRoomsArea',
					type: 'number',
					disabled: true
				},
				{
					label: 'Общая площадь объектов и дополнительной инфраструктуры, м²',
					name: 'totalArea',
					type: 'number',
					disabled: true
				},
				{
					label: 'Площадь гостиниц(ы), м²',
					name: 'hotelArea',
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
					label: 'Стоимость строительства гостиниц(ы), тыс. руб.',
					name: 'totalCostOfBuilding',
					type: 'number',
					disabled: true
				},
				{
					label: 'Стоимость строительства дополнительной инфраструктуры (отдельные объекты), тыс. руб.',
					name: 'totalCostOfBuildingInfrastructure',
					type: 'number',
					disabled: true
				},
				{
					label: 'Дата поступления анкеты',
					name: 'applicationSubmissionDate',
					type: 'date',
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
			ind: 5,
			title: 'Экономические показатели',
			fields: [
				{
					label: 'Количество месяцев функционирования в году',
					name: 'numberOfOperationMonths',
					type: 'number',
					min: 0
				},
				{
					label: 'Occupancy (OCC) — реальная заполняемость, %',
					name: 'occ',
					type: 'number',
					disabled: true
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
						calcFields.revPAR.calc()
					}
				},
				{
					label: 'Выручка ресторанов, тыс. руб. в год после выхода на проектную нагрузку',
					name: 'restaurantsRevenue',
					type: 'number',
					min: 0,
					calc: () => {
						calcFields.totalRevenues.calc()
					}
				},
				{
					label: 'Выручка СПА и фитнес-центров, тыс. руб. в год после выхода на проектную нагрузку',
					name: 'spaAndGymRevenue',
					type: 'number',
					min: 0,
					calc: () => {
						calcFields.totalRevenues.calc()
					}
				},
				{
					label: 'Выручка аквапарка, тыс. руб. в год после выхода на проектную нагрузку',
					name: 'aquaparkRevenue',
					type: 'number',
					min: 0,
					calc: () => {
						calcFields.totalRevenues.calc()
					}
				},
				{
					label: 'Выручка инфраструктуры ГЛК, тыс. руб. в год после выхода на проектную нагрузку',
					name: 'glkRevenue',
					type: 'number',
					min: 0,
					calc: () => calcFields.totalRevenues.calc()
				},
				{
					label: 'Выручка парка развлечений, аттракционов, тыс. руб. в год после выхода на проектную нагрузку',
					name: 'amusementsRevenue',
					type: 'number',
					min: 0,
					calc: () => {
						calcFields.totalRevenues.calc()
					}
				},
				{
					label: 'Выручка прочее, тыс. руб. в год после выхода на проектную нагрузку',
					name: 'otherRevenue',
					type: 'number',
					min: 0,
					calc: () => calcFields.totalRevenues.calc()
				},
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
					label: 'Общее количество новых рабочих мест, чел.',
					name: 'totalNumberOfNewJobs',
					type: 'number',
					disabled: true
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
			ind: 6,
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
					calc: () => {
						calcFields.ownFunds.calc()
						calcFields.corporationFundsShare.calc()
					}
				},
				{
					label: 'Имущественный взнос Инвестора в уставный капитал СПК (не в денежной форме), тыс. руб.',
					name: 'investorContributionNotCash',
					type: 'number',
					min: 0,
					calc: () => {
						calcFields.ownFunds.calc()
						calcFields.corporationFundsShare.calc()
					}
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
					calc: () => {
						calcFields.ownFunds.calc()
						calcFields.corporationFundsShare.calc()
					}
				},
				{
					label: 'Корпорация Туризм.РФ  (заем), тыс. руб.',
					name: 'corporationLoan',
					type: 'number',
					min: 0,
					calc: () => {
						calcFields.ownFunds.calc()
						calcFields.corporationFundsShare.calc()
					}
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
					name: 'needOfSoftLoan',
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
					label: 'EBITDA, тыс. руб. (за год после ввода в эксплуатацию)',
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
					label: 'Выплаты тела кредита, тыс. руб. в год (D)',
					name: 'loanBodyPayments',
					type: 'number',
					disabled: true
				},
			],
		}
	]

	const objectFields = [
		{
			label: 'Звездность гостиницы',
			name: 'hotelRating',
			type: 'select',
			options: $DIRs['hotelRating'].values,
		},
		{
			label: 'Количество номеров в КСР, шт.',
			name: 'numberOfRooms',
			type: 'number',
			min: 0,
			calc: () => calcFields.totalNumberOfRooms.calc()
		},
		{
			label: 'Количество новых рабочих мест, чел.',
			name: 'numberOfNewJobs',
			type: 'number',
			min: 0,
			calc: () => calcFields.totalNumberOfNewJobs.calc()
		},
		{
			label: 'Количество сотрудников на 1 номер, чел.',
			name: 'staffPerRoom',
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
			label: 'Количество гостей Total Guests In-House (за период)',
			name: 'totalGuestsInHouse',
			type: 'number',
			min: 0,
			calc: () => calcFields.doubleOcc.calc()
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
			label: 'Площадь гостиницы, м²',
			name: 'hotelArea',
			type: 'number',
			disabled: true
		},
		{
			label: 'Площадь номерного фонда, включая апартаменты и места общего пользования, м²',
			name: 'roomsArea',
			type: 'number',
			min: 0,
			calc: () => calcFields.hotelArea.calc()
		},
		{
			label: 'Площадь ресторанов, м²',
			name: 'restaurantsArea',
			type: 'number',
			min: 0,
			calc: () => calcFields.hotelArea.calc()
		},
		{
			label: 'Площадь конференц-залов, м²',
			name: 'confRoomsArea',
			type: 'number',
			min: 0,
			calc: () => calcFields.hotelArea.calc()
		},
		{
			label: 'Площадь СПА и фитнес центров, м²',
			name: 'spaAndGymArea',
			type: 'number',
			min: 0,
			calc: () => calcFields.hotelArea.calc()
		},
		{
			label: 'Площадь бассейнов, м²',
			name: 'poolsArea',
			type: 'number',
			min: 0,
			calc: () => calcFields.hotelArea.calc()
		},
		{
			label: 'Площадь иных объектов, м²',
			name: 'hotelOthersArea',
			type: 'number',
			min: 0,
			calc: () => calcFields.hotelArea.calc()
		},
		{
			label: 'Стоимость строительства гостиницы, тыс. руб.',
			name: 'totalCostOfBuilding',
			type: 'number',
			disabled: true
		},
		{
			label: 'Стоимость строительства номерного фонда, включая апартаменты и места общего пользования, тыс. руб.',
			name: 'totalCostOfBuildingRooms',
			type: 'number',
			min: 0,
			calc: () => calcFields.totalCostOfBuilding.calc()
		},
		{
			label: 'Стоимость строительства ресторанов, тыс. руб.',
			name: 'totalCostOfBuildingRestaurants',
			type: 'number',
			min: 0,
			calc: () => calcFields.totalCostOfBuilding.calc()
		},
		{
			label: 'Стоимость строительства конференц-залов, тыс. руб.',
			name: 'totalCostOfBuildingConfRooms',
			type: 'number',
			min: 0,
			calc: () => calcFields.totalCostOfBuilding.calc()
		},
		{
			label: 'Стоимость строительства СПА и фитнес центров, тыс. руб.',
			name: 'totalCostOfBuildingSpaAndGym',
			type: 'number',
			min: 0,
			calc: () => calcFields.totalCostOfBuilding.calc()
		},
		{
			label: 'Стоимость строительства бассейнов, тыс. руб.',
			name: 'totalCostOfBuildingPools',
			type: 'number',
			min: 0,
			calc: () => calcFields.totalCostOfBuilding.calc()
		},
		{
			label: 'Стоимость строительства иных объектов, тыс. руб.',
			name: 'totalCostOfBuildingHotelOthers',
			type: 'number',
			min: 0,
			calc: () => calcFields.totalCostOfBuilding.calc()
		},
	]

	const objectInfrastructureFields = [
		{
			label: 'Тип дополнительной инфраструктуры',
			name: 'infrastructureType',
			type: 'select',
			options: $DIRs['infrastructureType'].values,
		},
		{
			label: 'Площадь объекта дополнительной инфраструктуры, м²',
			name: 'area',
			type: 'number',
			min: 0,
			calc: () => calcFields.infrastructureArea.calc()
		},
		{
			label: 'Стоимость строительства объекта дополнительной инфраструктуры, тыс. руб.',
			name: 'cost',
			type: 'number',
			min: 0,
			calc: () => calcFields.totalCostOfBuildingInfrastructure.calc()
		},
		{
			label: 'Общая протяженность ГЛК, м',
			name: 'totalLengthGLK',
			type: 'number',
			min: 0,
			condition: object => object.infrastructureType === 'glkComplex'
		},
		{
			label: 'Количество новых рабочих мест, чел.',
			name: 'numberOfNewJobs',
			type: 'number',
			min: 0,
			calc: () => calcFields.totalNumberOfNewJobs.calc()
		},
	]

	function setProject(data) {
		console.log('setProject, data', data)

		if (!data?.project)
			return

		project = data.project
		highlightSave = false
		activeProjectTab = 1
		activeObject = 0
		activeInfrastructureObject = null

		if (!project.objects || !project.objects.length)
			addObject()
		if (!project.infrastructureObjects)
			project.infrastructureObjects = []

		project.regionTitle = getTitleFromDirByValue('regions', 'title', project.region)
		project.buildingTypeTitle = getTitleFromDirByValue('buildingTypes', 'title', project.buildingType)
		project.buildingCategoryTitle = getTitleFromDirByValue('buildingCategory', 'title', project.buildingCategory)

		Object.values(calcFields).forEach(field => field.calc())
	}

	function addObject() {
		project.objects = [...(project.objects || []), {
			title: 'Гостиница'
		}]
		selectObject(project.objects.length - 1)
		highlightSave = true
	}

	function removeObject() {
		if (project.objects.length === 1)
			return
		project.objects = project.objects.filter((row, i) => i !== activeObject)

		const activeInd = activeObject === project.objects.length ? activeObject - 1 : activeObject
		selectObject(activeInd)

		highlightSave = true
	}

	function addInfrastructureObject() {
		project.infrastructureObjects = [...(project.infrastructureObjects || []), {
			title: 'Инфраструктура'
		}]
		selectObject(project.infrastructureObjects.length - 1, true)
		highlightSave = true
	}

	function removeInfrastructureObject() {
		project.infrastructureObjects = project.infrastructureObjects
			.filter((row, i) => i !== activeInfrastructureObject)

		if (project.infrastructureObjects.length === 0)
			selectObject(null, true)
		else {
			const ind = activeInfrastructureObject === project.infrastructureObjects.length
				? activeInfrastructureObject - 1 : activeInfrastructureObject
			selectObject(ind, true)
		}

		highlightSave = true
	}

	function selectObject(ind, infrastructure = false) {
		if (infrastructure) {
			activeInfrastructureObject = ind
			activeObject = null
		} else {
			activeInfrastructureObject = null
			activeObject = ind
		}
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
		fetch('/api/check_stop_factors', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ project })
		})
			.then(res => res.json())
			.then(res => {
				console.log('check_stop_factors', res)
				console.log('project', res.project)
				console.log('dirs', res.dirs)
				console.log('scoring', res.scoring)

				project.scoring = res.scoring
				activeProjectTab = 0
			})

		// console.log('estimateStopFactors(), project', project)
		// project.scoring = estimate(project)
		// activeProjectTab = 0
		// console.log('estimateStopFactors(), scoring', project.scoring)
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
	<div class="p-10">
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
			<a class="tab tab-lifted"
			   class:tab-active={activeProjectTab === 1}
			   on:click={() => activeProjectTab = 1}
			>Объекты</a>
			{#each tabs as tab}
				<div class="tab tab-lifted"
				     class:tab-active={activeProjectTab === tab.ind}
				     on:click={() => activeProjectTab = tab.ind}
				>{tab.title}</div>
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
<!--									<th>Раздел</th>-->
									<th>Наименование показателя</th>
									<th>Значение</th>
									<th colspan="2" class="text-center">Стоп-фактор (Предварительная оценка)</th>
								</tr>
								<tr>
<!--									<th class="w-2/12"></th>-->
									<th class="w-3/12"></th>
									<th class="w-1/12"></th>
									<th class="w-3/12 text-center">Общий</th>
									<th class="w-3/12 text-center">Дополнительный</th>
								</tr>
								</thead>
								<tbody>
								{#each project.scoring as scoringRow}
									<tr>
<!--										<td class="whitespace-pre-wrap">{scoringRow.section}</td>-->
										<td class="whitespace-pre-wrap">{scoringRow.label}</td>
										<td class="whitespace-pre-wrap">{scoringRow.value || 0}</td>
										{#if scoringRow.error}
											<td colspan="2" class="whitespace-pre-wrap text-center text-accent">
												{scoringRow.error}
											</td>
										{:else if scoringRow.stopFactor?.type === 'common'}
											<td class="whitespace-pre-wrap bg-red-300 text-center">
												{scoringRow.stopFactor.title}
											</td>
											<td></td>
										{:else if scoringRow.stopFactor?.type === 'additional'}
											<td></td>
											<td class="whitespace-pre-wrap bg-yellow-300 text-center">
												{scoringRow.stopFactor.title}
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
				<div class="shrink-0 w-full overflow-hidden transition-all"
				     class:h-0={activeProjectTab !== 1}>
					<div class="p-5 py-10">
						<div class="flex">
							<div class="mr-10">
								<div class="text-xl mb-2">Гостиницы:</div>
								<ul class="w-full">
									{#each project.objects as object, i}
										<li class="px-5 py-2 cursor-pointer w-full hover:bg-base-200"
										    class:bg-base-200={activeObject === i}
										    on:click={() => selectObject(i)}>
											{i + 1}. {object.title} {object.hotelRating ? object.hotelRating + '*' : ''}
										</li>
									{/each}
								</ul>
							</div>
							<div class="">
								<div class="text-xl mb-2">Объекты инфраструктуры:</div>
								<ul class="w-full">
									{#each project.infrastructureObjects || [] as object, i}
										<li class="px-5 py-2 cursor-pointer w-full hover:bg-base-200"
										    class:bg-base-200={activeInfrastructureObject === i}
										    on:click={() => selectObject(i, true)}>
											{i + 1}. {object.title}
										</li>
									{/each}
								</ul>
							</div>
							<div class="flex flex-col gap-5 ml-auto">
								{#if project.buildingType === 'complex'}
									<button class="btn btn-outline"
									        on:click={addObject}>
										Добавить гостиницу
									</button>
								{/if}
								<button class="btn btn-outline"
								        on:click={addInfrastructureObject}>
									Добавить инфраструктуру
								</button>
							</div>
						</div>
						<div class="divider"></div>
						{#if activeObject !== null}
							<div class="flex justify-between">
								<div>
									{#each objectFields as field}
										<div class="max-w-lg p-5">
											{#if field.disabled}
												<div class="form-control w-full">
													<label class="label" for="object-{field.name}">
														<span class="label-text">{field.label}</span>
													</label>
													<input id="object-{field.name}" type="number" placeholder=""
													       value={project.objects[activeObject][field.name]} disabled
													       class="input input-bordered w-full"/>
												</div>
											{:else if field.type === 'number' || field.type === 'date' || field.type === 'text'}
												<Input {...field}
												       name="object-{field.name}"
												       on:change={() => (highlightSave = true) && field.calc && field.calc()}
												       bind:value={project.objects[activeObject][field.name]}/>
											{:else if field.type === 'check'}
												<Check {...field}
												       name="object-{field.name}"
												       on:change={() => (highlightSave = true)}
												       bind:checked={project.objects[activeObject][field.name]}/>
											{:else if field.type === 'select'}
												<Select {...field}
												        name="object-{field.name}"
												        on:change={() => (highlightSave = true)}
												        bind:value={project.objects[activeObject][field.name]}/>
											{/if}
										</div>
										{#if errors[field.name]}
											<div class="alert alert-warning shadow-lg">
												<div>
													<svg xmlns="http://www.w3.org/2000/svg"
													     class="stroke-current flex-shrink-0 h-6 w-6"
													     fill="none" viewBox="0 0 24 24">
														<path stroke-linecap="round" stroke-linejoin="round"
														      stroke-width="2"
														      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
													</svg>
													<span>{errors[field.name]}</span>
												</div>
											</div>
										{/if}
									{/each}
								</div>
								<button class="btn btn-accent" on:click={removeObject}>Удалить объект</button>
							</div>
						{/if}
						{#if activeInfrastructureObject !== null}
							<div class="flex justify-between">
								<div>
									{#each objectInfrastructureFields as field}
										<div class="max-w-lg p-5">
											{#if field.disabled}
												<div class="form-control w-full">
													<label class="label" for="object-{field.name}">
														<span class="label-text">{field.label}</span>
													</label>
													<input id="infrastructure-{field.name}" type="number" placeholder=""
													       value={project.infrastructureObjects[activeInfrastructureObject][field.name]}
													       disabled
													       class="input input-bordered w-full"/>
												</div>
											{:else if field.type === 'number' || field.type === 'date' || field.type === 'text'}
												<Input {...field}
												       name="infrastructure-{field.name}"
												       on:change={() => (highlightSave = true) && field.calc && field.calc()}
												       bind:value={project.infrastructureObjects[activeInfrastructureObject][field.name]}/>
											{:else if field.type === 'check'}
												<Check {...field}
												       name="infrastructure-{field.name}"
												       on:change={() => (highlightSave = true)}
												       bind:checked={project.infrastructureObjects[activeInfrastructureObject][field.name]}/>
											{:else if field.type === 'select'}
												<Select {...field}
												        name="infrastructure-{field.name}"
												        on:change={() => (highlightSave = true)}
												        bind:value={project.infrastructureObjects[activeInfrastructureObject][field.name]}/>
											{/if}
										</div>
										{#if errors[field.name]}
											<div class="alert alert-warning shadow-lg">
												<div>
													<svg xmlns="http://www.w3.org/2000/svg"
													     class="stroke-current flex-shrink-0 h-6 w-6"
													     fill="none" viewBox="0 0 24 24">
														<path stroke-linecap="round" stroke-linejoin="round"
														      stroke-width="2"
														      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
													</svg>
													<span>{errors[field.name]}</span>
												</div>
											</div>
										{/if}
									{/each}
								</div>
								<button class="btn btn-accent"
								        on:click={removeInfrastructureObject}>Удалить объект
								</button>
							</div>
						{/if}
					</div>
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
	</div>
{/if}