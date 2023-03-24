<script>
	import Input from '$lib/components/input.svelte'
	import Check from '$lib/components/check.svelte'
	import Select from '$lib/components/select.svelte'
	import CircleProgress from '$lib/components/circle-progress.svelte'
	import { openModal } from '$lib/components/modals.svelte'
	import { goto } from '$app/navigation'
	import { browser } from '$app/environment'
	import { page } from '$app/stores'
	import { DIRs } from '$lib/stores'
	import { ROLES_ENUM, PROJECT_STATUS_ENUM } from '$lib/enums'
	import { ogrnMask, innMask, phoneMask, getNumberStr, getNumber } from '$lib/numbersTransformer'
	import { getMonthDiff } from '$lib/dateFuncs'

	export let data

	let role
	let project
	let highlightSave = false
	let activeObject = null
	let activeInfrastructureObject = null
	let drawer = true
	let visibleTabs = []
	let hasStopFactors = true

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
					type: 'phone'
				},
				{
					label: 'Наименование юридического лица',
					name: 'applicantLegalEntityName',
					type: 'text'
				},
				{
					label: 'ОГРН',
					name: 'applicantOGRN',
					type: 'ogrn'
				},
				{
					label: 'ИНН',
					name: 'applicantINN',
					type: 'inn'
				},
				{
					label: 'Вид заявителя',
					name: 'applicantType',
					type: 'select',
					options: [
						{
							name: 'individual',
							title: 'Физическое лицо',
						},
						{
							name: 'legal',
							title: 'Юридическое лицо'
						}
					]
				}
			]
		},
		{
			ind: 3,
			title: 'Оценка инвестора',
			name: 'investorScore',
			fields: [
				{
					label: 'Наличие права пользования/владения на имущество (объекты, земельные участки), вносимым в виде имущественного взноса',
					tip: 'Выписка из ЕГРН',
					name: 'hasOwnershipRight',
					type: 'check',
				},
				{
					label: 'Наличие обременения на имущество (объекты, земельные участки) вносимое в виде имущественного взноса',
					tip: 'Выписка из ЕГРН',
					name: 'hasPropertyEncumbrance',
					type: 'check',
				},
				{
					label: 'Для физических лиц - наличие документов, подтверждающих источники происхождения собственных средств (доходов, имущества)',
					tip: 'Справка  2-НДФЛ, копия  3-НДФЛ',
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
					label: 'Отсутствие работников в штате',
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
			title: 'Данные бухгалтерского баланса за прошедший год',
			name: 'balanceSheetData',
			fields: [
				{
					label: 'Краткосрочные финансовые вложения, руб.',
					tip: 'Строка 1240 бухгалтерского баланса',
					name: 'kfv',
					type: 'number',
					min: 0,
					calc: () => {
						calcFields.absLiqRatio.calc()
						calcFields.fastLiqRatio.calc()
					}
				},
				{
					label: 'Денежные средства и их эквиваленты, руб.',
					tip: 'Строка 1250 бухгалтерского баланса',
					name: 'ds',
					type: 'number',
					min: 0,
					calc: () => {
						calcFields.absLiqRatio.calc()
						calcFields.fastLiqRatio.calc()
					}
				},
				{
					label: 'Краткосрочные обязательства, руб.',
					tip: 'Итого по разделу V, строка 1500 бухгалтерского баланса',
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
					label: 'Краткосрочная дебиторская задолженность, руб.',
					tip: 'Строка 1520 бухгалтерского баланса',
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
					label: 'Оборотные активы, руб.',
					tip: 'Строка 1200 бухгалтерского баланса, руб.',
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
					label: 'Собственный капитал, руб.',
					tip: 'Строка 1300 бухгалтерского баланса',
					name: 'sk',
					type: 'number',
					min: 0,
					calc: () => calcFields.debtToEquityRatio.calc()
				},
				{
					label: 'Долгосрочные обязательства, руб.',
					tip: 'Строка 1400 бухгалтерского баланса',
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
					label: 'Сумма долгосрочных и краткосрочных обязательств, руб.',
					tip: 'Строки 1410, 1435, 1510, 1520 и 1545 бухгалтерского баланса',
					name: 'doAndKoSum',
					type: 'number',
					disabled: true
				},
				{
					label: 'Коэфициент соотношения заемных и собственных средств',
					name: 'debtToEquityRatio',
					type: 'number',
					disabled: true
				},
				{
					label: 'Капитал и резервы, руб.',
					tip: 'Строка 1300 (итого по разделу III) бухгалтерского баланса',
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
			]
		},
		{
			ind: 5,
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
					options: $DIRs['region'].values,
					calc: () => setReferenceValues()
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
					label: 'Тип объекта',
					name: 'buildingType',
					type: 'select',
					options: $DIRs['buildingType']?.values,
					calc: () => setReferenceValues()
				},
				{
					label: 'Категория объекта',
					name: 'buildingCategory',
					type: 'select',
					options: $DIRs['buildingCategory']?.values,
					calc: () => setReferenceValues()
				},
				{
					label: 'Особенности объекта',
					name: 'projectFeature',
					type: 'select',
					options: [
						{
							name: 'okn',
							title: 'В здании ОКН',
						},
						{
							name: 'skiResort',
							title: 'Курорт горнолыжный',
						},
						{
							name: 'seasideResort',
							title: 'Курорт морской',
						},
						{
							name: 'sanatoriumResort',
							title: 'Курорт санаторного типа',
						},
						{
							name: 'hasApartments',
							title: 'Наличие апартаментов',
						},
						{
							name: 'other',
							title: 'Иное',
						},
					]
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
					label: 'Дата начала подготовки ПИР',
					name: 'startDateOfPSDPreparation',
					type: 'date',
				},
				{
					label: 'Дата окончания подготовки ПИР',
					name: 'endDateOfPSDPreparation',
					type: 'date',
				},
				{
					label: 'Длительность выполнения ПИР, мес.',
					name: 'pirDuration',
					type: 'number',
					disabled: true
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
					label: 'Длительность выполнения СМР',
					name: 'smrDuration',
					type: 'number',
					disabled: true
				},
				{
					label: 'Дата ввода в эксплуатацию',
					name: 'commissioningDate',
					type: 'date',
				},
				{
					label: 'Расходы pre-opening, руб.',
					name: 'preOpeningCost',
					type: 'number',
					min: 0
				},
			]
		},
		{
			ind: 6,
			title: 'Транспортная доступность',
			name: 'transportAccessibility',
			fields: [
				{
					label: 'Расстояние от границы земельного участка до аэропорта, км',
					name: 'distanceToAirport',
					type: 'number',
					min: 0
				},
				{
					label: 'Расстояние от границы земельного участка до автомобильной дороги регионального / федерального значения, км',
					name: 'distanceToHighway',
					type: 'number',
					min: 0
				},
				{
					label: 'Расстояние от границы земельного участка до ж/д вокзала (станции), км',
					name: 'distanceToRailwayStation',
					type: 'number',
					min: 0
				},
				{
					label: 'Расстояние до морского / речного порта, км',
					name: 'distanceToSeaPort',
					type: 'number',
					min: 0
				}
			]
		},
		{
			ind: 8,
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
					min: 0,
					bottomLabel: `Референсные значения: ${Math.round(65 * 0.83)} - ${Math.round(65 * 1.17)}`,
					calc: () => {
						calcFields.touristFlow.calc()
						calcFields.roomRevenue.calc()
					}
				},
				{
					label: 'Double Occupancy — сколько гостей в среднем проживает в одном номере, чел./номер',
					name: 'doubleOcc',
					type: 'number',
					min: 0,
					calc: () => {
						calcFields.touristFlow.calc()
					}
				},
				{
					buildingType: 'hotel',
					label: 'Турпоток, чел./ночей за год',
					name: 'touristFlow',
					type: 'number',
					disabled: true
				},
				{
					buildingType: 'complex',
					label: 'Турпоток, чел./год',
					name: 'touristFlow',
					type: 'number',
					disabled: true
				},
				{
					buildingType: 'complex',
					label: 'Общее количество внешних гостей, чел.',
					name: 'totalExternalGuests',
					type: 'number',
					min: 0,
					calc: () => calcFields.touristFlow.calc()
				},
				{
					label: 'Выручка на 1 м² (с НДС , после выхода на плановую загрузку (ориентировочно 3 год экспуатационной фазы), руб.',
					name: 'revenuePerSqMeter',
					type: 'number',
					disabled: true
				},
				{
					label: 'Общая выручка в год после выхода на проектную нагрузку, руб.',
					name: 'totalRevenues',
					type: 'number',
					disabled: true
				},
				{
					label: 'Выручка от реализации номеров (Room Revenue) в год после выхода на проектную нагрузку, руб.',
					name: 'roomRevenue',
					type: 'number',
					disabled: true,
				},
				{
					label: 'Выручка ресторанов в год после выхода на проектную нагрузку, руб.',
					name: 'restaurantsRevenue',
					type: 'number',
					min: 0,
					calc: () => {
						calcFields.totalRevenues.calc()
					}
				},
				{
					label: 'Выручка СПА и фитнес-центров в год после выхода на проектную нагрузку, руб.',
					name: 'spaAndGymRevenue',
					type: 'number',
					min: 0,
					calc: () => {
						calcFields.totalRevenues.calc()
					}
				},
				{
					label: 'Выручка аквапарка в год после выхода на проектную нагрузку, руб.',
					name: 'aquaparkRevenue',
					type: 'number',
					min: 0,
					calc: () => {
						calcFields.totalRevenues.calc()
					}
				},
				{
					label: 'Выручка инфраструктуры ГЛК в год после выхода на проектную нагрузку, руб.',
					name: 'glkRevenue',
					type: 'number',
					min: 0,
					calc: () => calcFields.totalRevenues.calc()
				},
				{
					label: 'Выручка парка развлечений, аттракционов в год после выхода на проектную нагрузку, руб.',
					name: 'amusementsRevenue',
					type: 'number',
					min: 0,
					calc: () => {
						calcFields.totalRevenues.calc()
					}
				},
				{
					label: 'Выручка прочее в год после выхода на проектную нагрузку, руб.',
					name: 'otherRevenue',
					type: 'number',
					min: 0,
					calc: () => calcFields.totalRevenues.calc()
				},
				{
					label: 'RevPAR — средняя выручка за номер в год, руб.',
					name: 'revPAR',
					type: 'number',
					disabled: true
				},
				{
					label: 'RevPAC — доход на гостя. Включает доход от продажи  номерного фонда и других услуг, руб.',
					name: 'revPAC',
					type: 'number',
					disabled: true
				},
				{
					label: 'Общее количество новых рабочих мест, чел.',
					name: 'totalNumberOfNewJobs',
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
					label: 'Участие в проекте гостиничного оператора (вознаграждение за управление проектируемым объектом), %',
					name: 'remunerationForManagement',
					type: 'number',
					min: 0,
				},
			]
		},
		{
			ind: 9,
			title: 'Финансирование',
			name: 'financing',
			fields: [
				{
					label: 'Общий объем финансирования (Total Founds), руб.',
					name: 'totalFunds',
					type: 'number',
					disabled: true
				},
				{
					label: 'Собственные средства, руб.',
					name: 'ownFunds',
					type: 'number',
					disabled: true
				},
				{
					label: 'Взнос Инвестора в уставный капитал СПК в денежной форме, руб.',
					name: 'investorContributionCash',
					type: 'number',
					min: 0,
					calc: () => {
						calcFields.ownFunds.calc()
						calcFields.corporationFundsShare.calc()
					}
				},
				{
					label: 'Имущественный взнос Инвестора в уставный капитал СПК (не в денежной форме), руб.',
					name: 'investorContributionNotCash',
					type: 'number',
					min: 0,
					calc: () => {
						calcFields.ownFunds.calc()
						calcFields.corporationFundsShare.calc()
					}
				},
				{
					label: 'Имущественный взнос Инвестора без увеличения уставного капитала СПК (в денежной форме), руб.',
					name: 'investorContributionCashNotInCapital',
					type: 'number',
					min: 0,
					calc: () => calcFields.ownFunds.calc()
				},
				{
					label: 'Инвестор (заем), руб.',
					name: 'investorLoan',
					type: 'number',
					min: 0,
					calc: () => calcFields.ownFunds.calc()
				},
				{
					label: 'Корпорация Туризм.РФ (взнос в уставный капитал СПК), руб.',
					name: 'corporationContributionCash',
					type: 'number',
					min: 0,
					calc: () => {
						calcFields.ownFunds.calc()
						calcFields.corporationFundsShare.calc()
					}
				},
				{
					label: 'Корпорация Туризм.РФ (заем), руб.',
					name: 'corporationLoan',
					type: 'number',
					min: 0,
					calc: () => {
						calcFields.ownFunds.calc()
						calcFields.corporationFundsShare.calc()
					}
				},
				{
					label: 'Выручка от реализации земельных участков, объектов, помещений, паев и пр. (если применимо), руб.',
					name: 'landSaleRevenue',
					type: 'number',
					min: 0,
					calc: () => calcFields.ownFunds.calc()
				},
				{
					label: 'Кредит банка (DEBT), руб.',
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
					label: 'Потребность в льготном кредите (в т.ч. Постановление №141)',
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
					label: 'EBITDA (за год после ввода в эксплуатацию)',
					name: 'EBITDA',
					type: 'number',
					disabled: true
				},
				{
					label: 'Процентные платежи в год (I)',
					name: 'interestPayments',
					type: 'number',
					disabled: true
				},
				{
					label: 'Выплаты тела кредита в год (D), руб.',
					name: 'loanBodyPayments',
					type: 'number',
					disabled: true
				},
			],
		},
		{
			ind: 7,
			title: 'Информация об объектах в составе проекта',
			name: 'objectsInfo',
			fields: [
				{
					label: 'Вид работ по проекту',
					name: 'typeOfWork',
					type: 'select',
					options: $DIRs['typeOfWork']?.values
				},
				{
					label: 'Общее количество номеров в КСР, шт.',
					name: 'totalNumberOfRooms',
					type: 'number',
					disabled: true
				},
				{
					buildingType: 'complex',
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
					label: 'Стоимость 1 м² объекта, руб.',
					name: 'costPerSqMeter',
					type: 'number',
					disabled: true
				},
				{
					label: 'Стоимость 1 номера, руб.',
					name: 'costPerRoom',
					type: 'number',
					disabled: true
				},
				{
					label: 'Общая стоимость объектов и дополнительной инфраструктуры (с НДС, в ценах соответствующих лет), руб',
					name: 'totalCost',
					type: 'number',
					disabled: true
				},
				{
					label: 'Стоимость строительства гостиниц(ы), руб.',
					name: 'totalCostOfHotel',
					type: 'number',
					disabled: true
				},
				{
					label: 'Стоимость строительства дополнительной инфраструктуры (отдельные объекты), руб.',
					name: 'totalCostOfBuildingInfrastructure',
					type: 'number',
					disabled: true
				},
			]
		},
	]

	const calcFields = {
		absLiqRatio: {
			label: 'Коэффициент абсолютной ликвидности',
			name: 'absLiqRatio',
			calc: function () {
				if (!project.ko)
					return updateProjectProp(this.name)

				const a = getNumber(project.kfv) + getNumber(project.ds)
				const value = a / getNumber(project.ko)

				updateProjectProp(this.name, +value.toFixed(2))
			}
		},
		fastLiqRatio: {
			label: 'Коэффициент быстрой ликвидности',
			name: 'fastLiqRatio',
			calc: function () {
				if (!project.ko)
					return updateProjectProp(this.name)

				const a = getNumber(project.kdz) + getNumber(project.kfv) + getNumber(project.ds)
				const value = a / getNumber(project.ko)

				updateProjectProp(this.name, +value.toFixed(2))
			}
		},
		currentLiqRatio: {
			label: 'Коэффициент текущей ликвидности',
			name: 'currentLiqRatio',
			calc: function () {
				if (!project.ko)
					return updateProjectProp(this.name)

				const value = getNumber(project.oa) / getNumber(project.ko)

				updateProjectProp(this.name, +value.toFixed(2))
			}
		},
		debtToEquityRatio: {
			label: 'Коэфициент соотношения заемных и собственных средств',
			name: 'debtToEquityRatio',
			calc: function () {
				if (!project.sk)
					return updateProjectProp(this.name)

				const a = getNumber(project.do) + getNumber(project.ko)
				const value = a / getNumber(project.sk)

				updateProjectProp(this.name, +value.toFixed(2))
			}
		},
		solvencyRatio: {
			label: 'Коэффициент общей платежеспособности',
			name: 'solvencyRatio',
			calc: function () {
				if (!project.ko && !project.do)
					return updateProjectProp(this.name)

				const a = getNumber(project.do) + getNumber(project.ko)
				const value = getNumber(project.kr) / a

				updateProjectProp(this.name, +value.toFixed(2))
			}
		},
		doAndKoSum: {
			label: 'Сумма долгосрочных и краткосрочных обязательств, руб.',
			name: 'doAndKoSum',
			calc: function () {
				const value = getNumber(project.do) + getNumber(project.ko)
				updateProjectProp(this.name, value)
			}
		},
		totalArea: {
			label: 'Общая площадь объектов, м²',
			name: 'totalArea',
			calc: function () {
				const value = getNumber(project.hotelArea)
					+ getNumber(project.infrastructureArea)

				updateProjectProp(this.name, value)
				calcFields.costPerSqMeter.calc()
				calcFields.revenuePerSqMeter.calc()
				calcFields.shareOfRoomsArea.calc()
			}
		},
		hotelArea: {
			label: 'Площадь гостиницы, м²',
			name: 'hotelArea',
			calc: function () {
				const value = project.objects && project.objects.reduce((acc, object) => {
					object[this.name] = getNumber(object.roomsArea)
						+ getNumber(object.restaurantsArea)
						+ getNumber(object.confRoomsArea)
						+ getNumber(object.spaAndGymArea)
						+ getNumber(object.poolsArea)
						+ getNumber(object.hotelOthersArea)

					acc += object[this.name]
					return acc
				}, 0)

				updateProjectProp(this.name, value)
				calcFields.totalArea.calc()
			}
		},
		infrastructureArea: {
			label: 'Площадь дополнительной инфраструктуры (отдельные объекты), м²',
			name: 'infrastructureArea',
			calc: function () {
				const value = project.infrastructureObjects && project.infrastructureObjects.reduce((acc, object) => {
					acc += getNumber(object.area)
					return acc
				}, 0)

				updateProjectProp(this.name, value)
				calcFields.totalArea.calc()
			}
		},
		totalCost: {
			label: 'Общая стоимость объектов и дополнительной инфраструктуры (с НДС, в ценах соответствующих лет), руб',
			name: 'totalCost',
			calc: function () {
				const value = getNumber(project.totalCostOfHotel)
					+ getNumber(project.totalCostOfBuildingInfrastructure)

				updateProjectProp(this.name, value)
				calcFields.costPerSqMeter.calc()
			}
		},
		totalCostOfHotel: {
			label: 'Стоимость строительства объектов, руб.',
			name: 'totalCostOfHotel',
			calc: function () {
				const value = project.objects && project.objects.reduce((acc, object) => {
					object[this.name] = getNumber(object.totalCostOfBuildingRooms)
						+ getNumber(object.totalCostOfBuildingRestaurants)
						+ getNumber(object.totalCostOfBuildingConfRooms)
						+ getNumber(object.totalCostOfBuildingSpaAndGym)
						+ getNumber(object.totalCostOfBuildingPools)
						+ getNumber(object.totalCostOfBuildingHotelOthers)

					acc += object[this.name]
					return acc
				}, 0)

				updateProjectProp(this.name, value)
				calcFields.totalCost.calc()
				calcFields.costPerRoom.calc()
			}
		},
		totalCostOfBuildingInfrastructure: {
			label: 'Стоимость строительства дополнительной инфраструктуры (отдельные объекты), руб.',
			name: 'totalCostOfBuildingInfrastructure',
			calc: function () {
				const value = project.infrastructureObjects && project.infrastructureObjects.reduce((acc, object) => {
					acc += getNumber(object.cost)
					return acc
				}, 0)

				updateProjectProp(this.name, value)
				calcFields.totalCost.calc()
			}
		},
		totalNumberOfRooms: {
			label: 'Общее количество номеров в КСР, шт.',
			name: 'totalNumberOfRooms',
			calc: function () {
				const value = project.objects && project.objects.reduce((acc, object) => {
					acc += getNumber(object.numberOfRooms)
					return acc
				}, 0)

				updateProjectProp(this.name, value)
				calcFields.costPerRoom.calc()
				calcFields.touristFlow.calc()
				calcFields.roomRevenue.calc()
				calcFields.staffPerRoom.calc()
			}
		},
		costPerSqMeter: {
			label: 'Стоимость 1 м² объекта, руб.',
			name: 'costPerSqMeter',
			calc: function () {
				if (!project.totalCost || !project.totalArea)
					return updateProjectProp(this.name)

				const value = getNumber(project.totalCost) / getNumber(project.totalArea)
				updateProjectProp(this.name, +value.toFixed(2))
			}
		},
		costPerRoom: {
			label: 'Стоимость 1 номера, руб.',
			name: 'costPerRoom',
			calc: function () {
				if (!project.totalCostOfHotel || !project.totalNumberOfRooms)
					return updateProjectProp(this.name)

				const value = getNumber(project.totalCostOfHotel) / getNumber(project.totalNumberOfRooms)
				updateProjectProp(this.name, +value.toFixed(2))
			}
		},
		shareOfRoomsArea: {
			buildingType: 'complex',
			label: 'Доля площадей КСР в составе объекта (для МФК), %',
			name: 'shareOfRoomsArea',
			calc: function () {
				if (project.buildingType !== this.buildingType || !project.totalArea)
					return updateProjectProp(this.name)

				const value = (getNumber(project.hotelArea) / getNumber(project.totalArea)) * 100
				updateProjectProp(this.name, +value.toFixed(2))
			}
		},
		touristFlow: {
			buildingType: 'hotel',
			label: 'Турпоток, чел./ночей за год',
			name: 'touristFlow',
			calc: async function () {
				if (!project.totalNumberOfRooms || !project.doubleOcc || !project.occ)
					return updateProjectProp(this.name)

				let value = 0

				if (project.buildingType === 'hotel')
					value = getNumber(project.totalNumberOfRooms)
						* getNumber(project.doubleOcc)
						* 365
						* (getNumber(project.occ) / 100)
				else if (project.buildingType === 'complex') {
					const dirValue = await getAvLengthOfStay()

					if (dirValue)
						value = (getNumber(project.totalNumberOfRooms)
								* getNumber(project.doubleOcc)
								* 365
								* (getNumber(project.occ) / 100)) / dirValue
							+ getNumber(project.totalExternalGuests)
				}

				updateProjectProp(this.name, Math.round(value))
			}
		},
		totalRevenues: {
			label: 'Общая выручка в год после выхода на проектную нагрузку, руб.',
			name: 'totalRevenues',
			calc: function () {
				const value = getNumber(project.roomRevenue)
					+ getNumber(project.restaurantsRevenue)
					+ getNumber(project.spaAndGymRevenue)
					+ getNumber(project.aquaparkRevenue)
					+ getNumber(project.glkRevenue)
					+ getNumber(project.amusementsRevenue)
					+ getNumber(project.otherRevenue)
				updateProjectProp(this.name, +value.toFixed(2))
				calcFields.revPAC.calc()
				calcFields.revenuePerSqMeter.calc()
				calcFields.EBITDA.calc()
			}
		},
		roomRevenue: {
			label: 'Выручка от реализации номеров (Room Revenue) в год после выхода на проектную нагрузку, руб.',
			name: 'roomRevenue',
			calc: function () {
				if (!project.occ)
					return updateProjectProp(this.name)

				const value = project.objects && project.objects.reduce((acc, object) => {
					object[this.name] = getNumber(object.adr)
						* getNumber(object.numberOfRooms)
						* (getNumber(project.occ) / 100)
						* 365

					acc += object[this.name]
					return acc
				}, 0)
				updateProjectProp(this.name, value)
				calcFields.totalRevenues.calc()
				calcFields.revPAR.calc()
			}
		},
		revenuePerSqMeter: {
			label: 'Выручка на 1 м² (с НДС , после выхода на плановую загрузку (ориентировочно 3 год экспуатационной фазы), руб.',
			name: 'revenuePerSqMeter',
			calc: function () {
				if (!project.totalRevenues || !project.totalArea)
					return updateProjectProp(this.name)

				const value = getNumber(project.totalRevenues) / getNumber(project.totalArea)
				updateProjectProp(this.name, +value.toFixed(2))
			}
		},
		revPAR: {
			label: 'RevPAR — средняя выручка за номер в год, руб.',
			name: 'revPAR',
			calc: function () {
				if (!project.roomRevenue || !project.totalNumberOfRooms)
					return updateProjectProp(this.name)

				const value = getNumber(project.roomRevenue) / getNumber(project.totalNumberOfRooms)
				updateProjectProp(this.name, +value.toFixed(2))
			}
		},
		revPAC: {
			label: 'RevPAC — доход на гостя. Включает доход от продажи  номерного фонда и других услуг, руб.',
			name: 'revPAC',
			calc: function () {
				if (!project.totalRevenues || !project.touristFlow)
					return updateProjectProp(this.name)

				const value = getNumber(project.totalRevenues) / getNumber(project.touristFlow)
				updateProjectProp(this.name, +value.toFixed(2))
			}
		},
		staffPerRoom: {
			label: 'Количество сотрудников на 1 номер, чел.',
			name: 'staffPerRoom',
			calc: function () {
				if (!project.totalNumberOfRooms || !project.totalNumberOfNewJobs)
					return updateProjectProp(this.name)

				const value = getNumber(project.totalNumberOfNewJobs) / getNumber(project.totalNumberOfRooms)
				updateProjectProp(this.name, +value.toFixed(2))
			}
		},
		totalFunds: {
			label: 'Общий объем финансирования (Total Founds), руб.',
			name: 'totalFunds',
			calc: function () {
				const value = getNumber(project.ownFunds) + getNumber(project.bankLoanAmount)
				updateProjectProp(this.name, +value.toFixed(2))
				calcFields.creditFundsShare.calc()
			}
		},
		ownFunds: {
			label: 'Собственные средства, руб.',
			name: 'ownFunds',
			calc: function () {
				const value = getNumber(project.investorContributionCash)
					+ getNumber(project.investorContributionNotCash)
					+ getNumber(project.investorContributionCashNotInCapital)
					+ getNumber(project.investorLoan)
					+ getNumber(project.corporationContributionCash)
					+ getNumber(project.corporationLoan)
					+ getNumber(project.landSaleRevenue)
				updateProjectProp(this.name, +value.toFixed(2))
				calcFields.totalFunds.calc()
			}
		},
		corporationFundsShare: {
			label: 'Доля средств Корпорации Туризм.РФ в уставном капитале, %',
			name: 'corporationFundsShare',
			calc: function () {
				if (!(project.investorContributionCash || project.investorContributionNotCash))
					return updateProjectProp(this.name)

				const corporationContribution = getNumber(project.corporationContributionCash)
					+ getNumber(project.corporationLoan)
				const investorContribution = getNumber(project.investorContributionCash)
					+ getNumber(project.investorContributionNotCash)
				const value = (corporationContribution / (corporationContribution + investorContribution)) * 100
				updateProjectProp(this.name, +value.toFixed(2))
			}
		},
		creditFundsShare: {
			label: 'Доля кредитных средств в объеме финансирования, %',
			name: 'creditFundsShare',
			calc: function () {
				if (!project.bankLoanAmount || !project.totalFunds)
					return updateProjectProp(this.name)

				const value = (getNumber(project.bankLoanAmount) / getNumber(project.totalFunds)) * 100
				updateProjectProp(this.name, +value.toFixed(2))
			}
		},
		debtCoverageRatio: {
			label: 'Уровень долговой нагрузки, EBITDA / (I + D)',
			name: 'debtCoverageRatio',
			calc: function () {
				if (!project.EBITDA || !project.interestPayments || !project.loanBodyPayments)
					return updateProjectProp(this.name)

				const a = getNumber(project.interestPayments) + getNumber(project.loanBodyPayments)
				const value = getNumber(project.EBITDA) / a
				updateProjectProp(this.name, +value.toFixed(2))
			}
		},
		EBITDA: {
			label: 'EBITDA (за год после ввода в эксплуатацию)',
			name: 'EBITDA',
			calc: function () {
				const value = getNumber(project.totalRevenues) * getNumber(project.marginEBITDA)
				updateProjectProp(this.name, +value.toFixed(2))
				calcFields.debtCoverageRatio.calc()
			}
		},
		interestPayments: {
			label: 'Процентные платежи в год (I), руб.',
			name: 'interestPayments',
			calc: function () {
				if (!project.bankLoanAmount || !project.plannedLoanRate || !project.loanTerm) {
					updateProjectProp(this.name)
					calcFields.debtCoverageRatio.calc()
					return
				}

				const value = getNumber(project.bankLoanAmount)
					/ getNumber(project.loanTerm)
					* (getNumber(project.plannedLoanRate) / 100)
				updateProjectProp(this.name, +value.toFixed(2))
				calcFields.debtCoverageRatio.calc()
			}
		},
		loanBodyPayments: {
			label: 'Выплаты тела кредита в год (D), руб.',
			name: 'loanBodyPayments',
			calc: function () {
				if (!project.bankLoanAmount || !project.loanTerm) {
					updateProjectProp(this.name)
					calcFields.debtCoverageRatio.calc()
					return
				}

				const value = getNumber(project.bankLoanAmount) / getNumber(project.loanTerm)
				updateProjectProp(this.name, +value.toFixed(2))
				calcFields.debtCoverageRatio.calc()
			}
		},
		pirDuration: {
			label: 'Длительность выполнения ПИР, мес.',
			name: 'pirDuration',
			calc: function () {
				let value = ''

				try {
					const startDateOfPSDPreparation = new Date(project.startDateOfPSDPreparation)
					const endDateOfPSDPreparation = new Date(project.endDateOfPSDPreparation)
					value = getMonthDiff(startDateOfPSDPreparation, endDateOfPSDPreparation)
				} catch (e) {
				}

				updateProjectProp(this.name, value)
			}
		},
		smrDuration: {
			label: 'Длительность выполнения СМР, мес.',
			name: 'smrDuration',
			calc: function () {
				let value = ''

				try {
					const startDateOfSMR = new Date(project.startDateOfSMR)
					const endDateOfSMR = new Date(project.endDateOfSMR)
					value = getMonthDiff(startDateOfSMR, endDateOfSMR)
				} catch (e) {
				}

				updateProjectProp(this.name, value)
			}
		},
	}

	const objectFields = [
		{
			label: 'Звездность гостиницы',
			name: 'hotelRating',
			type: 'select',
			options: $DIRs['hotelRating'].values,
			calc: () => setADR() && setReferenceValues()
		},
		{
			label: 'Название гостиницы',
			name: 'objectName',
			type: 'text',
		},
		{
			label: 'Количество номеров в КСР, шт.',
			name: 'numberOfRooms',
			type: 'number',
			min: 0,
			calc: () => calcFields.totalNumberOfRooms.calc()
		},
		{
			label: 'ADR — отпускной тариф с учетом сезонности, руб./сутки',
			name: 'adr',
			type: 'number',
			min: 0,
			calc: () => calcFields.roomRevenue.calc()
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
			label: 'Стоимость строительства гостиницы, руб.',
			name: 'totalCostOfHotel',
			type: 'number',
			disabled: true
		},
		{
			label: 'Стоимость строительства номерного фонда, включая апартаменты и места общего пользования, руб.',
			name: 'totalCostOfBuildingRooms',
			type: 'number',
			min: 0,
			calc: () => calcFields.totalCostOfHotel.calc()
		},
		{
			label: 'Стоимость строительства ресторанов, руб.',
			name: 'totalCostOfBuildingRestaurants',
			type: 'number',
			min: 0,
			calc: () => calcFields.totalCostOfHotel.calc()
		},
		{
			label: 'Стоимость строительства конференц-залов, руб.',
			name: 'totalCostOfBuildingConfRooms',
			type: 'number',
			min: 0,
			calc: () => calcFields.totalCostOfHotel.calc()
		},
		{
			label: 'Стоимость строительства СПА и фитнес центров, руб.',
			name: 'totalCostOfBuildingSpaAndGym',
			type: 'number',
			min: 0,
			calc: () => calcFields.totalCostOfHotel.calc()
		},
		{
			label: 'Стоимость строительства бассейнов, руб.',
			name: 'totalCostOfBuildingPools',
			type: 'number',
			min: 0,
			calc: () => calcFields.totalCostOfHotel.calc()
		},
		{
			label: 'Стоимость строительства иных объектов, руб.',
			name: 'totalCostOfBuildingHotelOthers',
			type: 'number',
			min: 0,
			calc: () => calcFields.totalCostOfHotel.calc()
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
			label: 'Название объекта',
			name: 'objectName',
			type: 'text',
		},
		{
			label: 'Площадь объекта дополнительной инфраструктуры, м²',
			name: 'area',
			type: 'number',
			min: 0,
			calc: () => calcFields.infrastructureArea.calc()
		},
		{
			label: 'Стоимость строительства объекта дополнительной инфраструктуры, руб.',
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
	]

	$: setProject(data)

	function getTitleFromDirByValue(dirName, dirTitleField, value) {
		if (!$DIRs[dirName]) {
			console.error(`Справочник "${dirName}" не найден.`)
			return ''
		}

		const values = $DIRs[dirName].values.filter(row => row.name === value)
		if (values.length)
			return values[0][dirTitleField]
		return ''
	}

	function updateProjectProp(field, value = null) {
		if (project[field] != value) {
			console.log('update', `"${field}"`, 'cur', `"${project[field]}"`, 'new', `"${value}"`)
			project[field] = value
			highlightSave = true
		}
	}

	function getCurrentRole() {
		const roleFromURL = $page.url.searchParams.get('role')
		if (ROLES_ENUM[roleFromURL && roleFromURL.toUpperCase()])
			return ROLES_ENUM[roleFromURL.toUpperCase()]
		return ROLES_ENUM.INVESTOR
	}

	function setProject(data) {
		console.log('setProject, data', data)

		if (!data?.project)
			return

		project = data.project
		highlightSave = false
		activeInfrastructureObject = null
		hasStopFactors = true

		role = getCurrentRole()

		if (!project.status)
			project.status = PROJECT_STATUS_ENUM.CREATED.name

		console.log('role', role, 'status', project.status)

		if (!browser)
			return

		if (!project.objects || !project.objects.length)
			addObject()
		else
			selectObject(0)
		if (!project.infrastructureObjects)
			project.infrastructureObjects = []

		project.regionTitle = getTitleFromDirByValue('region', 'title', project.region)
		project.buildingTypeTitle = getTitleFromDirByValue('buildingType', 'title', project.buildingType)
		project.buildingCategoryTitle = getTitleFromDirByValue('buildingCategory', 'title', project.buildingCategory)

		Object.values(calcFields).forEach(field => field.calc())

		if (browser) {
			setVisibleTabs()
			setReferenceValues()
		}
	}

	function setVisibleTabs() {
		if (role === ROLES_ENUM.INVESTOR) {
			if (project.status === PROJECT_STATUS_ENUM.CREATED.name
				|| project.status === PROJECT_STATUS_ENUM.WAITING_FOR_APPLICANT_APPROVAL.name)
				visibleTabs = [tabs[0]]
			else if (project.status === PROJECT_STATUS_ENUM.APPLICANT_APPROVED.name
				|| project.status === PROJECT_STATUS_ENUM.SCORING_RESULT_APPROVED.name)
				visibleTabs = tabs.filter(tab => tab.name !== 'investorScore')
		} else if (role === ROLES_ENUM.SECURITY) {
			visibleTabs = [tabs[0], tabs[1]]
		} else if (role === ROLES_ENUM.MANAGER) {
			visibleTabs = tabs
		}
	}

	function addObject() {
		project.objects = [...(project.objects || []), {
			title: 'Гостиница'
		}]
		selectObject(project.objects.length - 1)
		highlightSave = true
	}

	function removeObject(showModal = true) {
		if (showModal)
			return openModal('Удалить объект?', [
				{
					title: 'Удалить',
					class: 'btn-accent btn-outline',
					cb: () => removeObject(false)
				},
				{
					title: 'Отменить',
					class: 'btn-outline',
				}
			])

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

	function removeInfrastructureObject(showModal = true) {
		if (showModal)
			return openModal('Удалить объект?', [
				{
					title: 'Удалить',
					class: 'btn-accent btn-outline',
					cb: () => removeInfrastructureObject(false)
				},
				{
					title: 'Отменить',
					class: 'btn-outline',
				}
			])

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

			setADR()
		}
		drawer = false
	}

	function getObjectName(object, infrastructure = false) {
		if (infrastructure) {
			if (object.infrastructureType)
				object.title = getTitleFromDirByValue('infrastructureType', 'title', object.infrastructureType)
			if (object.objectName)
				return object.objectName
			else
				return `${object.title}`
		} else {
			if (object.objectName)
				return object.objectName
			else
				return `${object.title} ${object.hotelRating ? object.hotelRating + '*' : ''}`
		}
	}

	function saveProject(cb) {
		if (!project?._id)
			return

		console.log('saveProject', project)

		const id = project._id
		const projectData = getProjectWithNumbers()

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

				if (res.redirect)
					goto('/')
				if (res?.res?.modifiedCount || res?.res?.matchedCount)
					highlightSave = false
				if (typeof cb === 'function')
					cb()
			})
	}

	function getProjectWithNumbers() {
		const projectData = {}

		const fieldsTypes = tabs.reduce((acc, row) => {
			row.fields.forEach(field => {
				acc[field.name] = field.type
			})
			return acc
		}, {})

		Object.keys(project)
			.forEach(key => {
				if (['_id', 'scoring'].includes(key))
					return

				let value = project[key]

				if (fieldsTypes[key] === 'number')
					value = getNumber(value)

				projectData[key] = value
			})

		return projectData
	}

	async function setReferenceValues() {
		const fieldsToUpdate = [
			{
				tab: 'economicIndicators',
				field: 'doubleOcc',
				get: getDoubleOCCDirValue
			},
			{
				tab: 'economicIndicators',
				field: 'marginEBITDA',
				get: getMarginEBITDADirValue
			},
			{
				tab: 'projectInfo',
				field: 'pirDuration',
				get: getPIRDirValue
			},
			{
				tab: 'projectInfo',
				field: 'smrDuration',
				get: getSMRDirValue
			},
			{
				tab: 'economicIndicators',
				field: 'totalNumberOfNewJobs',
				get: getNumberOfNewJobs
			},
			{
				tab: 'economicIndicators',
				field: 'staffPerRoom',
				get: getStaffPerRoom
			},
			{
				tab: 'objectsInfo',
				field: 'costPerSqMeter',
				get: getCostPerSqMeter
			},
		]

		for (const f of fieldsToUpdate)
			for (const tab of visibleTabs)
				if (tab.name === f.tab) {
					for (const field of tab.fields) {
						if (field.name === f.field) {
							field.bottomLabel = await f.get()
						}
					}
				}

		visibleTabs = visibleTabs
	}

	async function getStaffPerRoom() {
		const conditions = [
			{
				field: 'region',
				value: project.region
			},
			{
				field: 'buildingType',
				value: project.buildingType
			}
		]

		if (project.type === 'hotel' && project.objects.length)
			conditions.push({
				field: 'hotelRating',
				value: project.objects[0].hotelRating
			})

		const res = await fetch('/api/get_dir_value', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				name: 'staffPerRoom',
				conditions
			})
		})
		const json = await res.json()

		console.log('staffPerRoom', json, conditions)

		if (json.res?.length && json.res[0].values?.length) {
			const value = json.res[0].values[0].value
			return `Референсные значения: ${value.from} - ${value.to}`
		}

		return ''
	}

	async function getNumberOfNewJobs() {
		const conditions = [
			{
				field: 'buildingType',
				value: project.buildingType
			},
		]

		if (project.type === 'hotel' && project.objects.length) {
			conditions.push({
				field: 'hotelRating',
				value: project.objects[0].hotelRating
			})
			conditions.push({
				field: 'buildingCategory',
				value: project.buildingCategory
			})
		}

		const res = await fetch('/api/get_dir_value', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				name: 'numberOfNewJobs',
				conditions
			})
		})
		const json = await res.json()

		console.log('getNumberOfNewJobs', json, conditions)

		if (json.res?.length && json.res[0].values?.length) {
			const value = json.res[0].values[0].value
			return `Референсные значения: ${value.from * project.totalNumberOfRooms} - ${value.to * project.totalNumberOfRooms}`
		}

		return ''
	}

	async function getCostPerSqMeter() {
		const res = await fetch('/api/get_dir_value', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				name: 'costPerSqMeter',
				conditions: [
					{
						field: 'region',
						value: project.region
					}
				]
			})
		})
		const json = await res.json()

		console.log('getCostPerSqMeter', json)

		if (json.res?.length && json.res[0].values?.length) {
			const value = json.res[0].values[0].value
			return `Референсное значение: ${getNumberStr(value.value)}`
		}

		return ''
	}

	async function getDoubleOCCDirValue() {
		const res = await fetch('/api/get_dir_value', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				name: 'doubleOcc',
				conditions: [
					{
						field: 'buildingCategory',
						value: project.buildingCategory
					}
				]
			})
		})
		const json = await res.json()

		console.log('getDoubleOCCDirValue', json)

		if (json.res?.length && json.res[0].values?.length) {
			const value = json.res[0].values[0].value
			return `Референсные значения: ${value.from} - ${value.to}`
		}

		return ''
	}

	async function getMarginEBITDADirValue() {
		const conditions = [
			{
				field: 'region',
				value: project.region
			},
			{
				field: 'buildingType',
				value: project.buildingType
			}
		]

		if (project.type === 'hotel' && project.objects.length)
			conditions.push({
				field: 'hotelRating',
				value: project.objects[0].hotelRating
			})

		const res = await fetch('/api/get_dir_value', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				name: 'marginEBITDA',
				conditions
			})
		})
		const json = await res.json()

		console.log('getMarginEBITDADirValue', json)

		if (json.res?.length && json.res[0].values?.length) {
			const value = json.res[0].values[0].value
			return `Референсные значения: ${value.from * 0.8} - ${value.to * 1.2}`
		}

		return ''
	}

	async function setADR() {
		const object = project.objects[activeObject]

		const conditions = [
			{
				field: 'region',
				value: project.region
			},
			{
				field: 'buildingCategory',
				value: project.buildingCategory
			},
			{
				field: 'hotelRating',
				value: object.hotelRating
			}
		]

		const res = await fetch('/api/get_dir_value', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				name: 'adr',
				conditions
			})
		})
		const json = await res.json()

		console.log('getADR', json, object.hotelRating)

		let value = ''

		if (json.res?.length && json.res[0].values?.length)
			value = json.res[0].values[0].value.value
			value = `Референсное значение: ${getNumberStr(value * 0.9)} - ${getNumberStr(value * 1.1)}`


		for (let i = 0; i < objectFields.length; i++) {
			const field = objectFields[i]
			if (field.name === 'adr') {
				field.bottomLabel = value
				objectFields[i] = field
				break
			}
		}
	}

	async function getPIRDirValue() {
		const res = await fetch('/api/get_dir_value', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				name: 'pirDates',
				conditions: [
					{
						field: 'buildingType',
						value: project.buildingType
					}
				]
			})
		})
		const json = await res.json()

		console.log('getPIRDirValue', json)

		if (json.res?.length && json.res[0].values?.length) {
			let value = json.res[0].values[0].value.value

			if (project.buildingType === 'hotel')
				for (const dirValue of json.res[0].values) {
					if (dirValue.objectCategory.from && project.totalArea < dirValue.objectCategory.from)
						continue
					if (dirValue.objectCategory.to && project.totalArea > dirValue.objectCategory.to)
						continue

					value = dirValue.value.value
					break
				}

			return `Макс. срок: ${value} мес.`
		}

		return ''
	}

	async function getSMRDirValue() {
		const res = await fetch('/api/get_dir_value', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				name: 'smrDates',
				conditions: [
					{
						field: 'buildingType',
						value: project.buildingType
					}
				]
			})
		})
		const json = await res.json()

		console.log('getSMRDirValue', json)

		if (json.res?.length && json.res[0].values?.length) {
			let value = json.res[0].values[0].value.value

			if (project.buildingType === 'hotel')
				for (const dirValue of json.res[0].values) {
					if (dirValue.objectCategory.from && project.totalArea < dirValue.objectCategory.from)
						continue
					if (dirValue.objectCategory.to && project.totalArea > dirValue.objectCategory.to)
						continue

					value = dirValue.value.value
					break
				}

			return `Макс. срок: ${value} мес.`
		}

		return ''
	}

	async function getAvLengthOfStay() {
		const res = await fetch('/api/get_dir_value', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				name: 'averageLengthOfStay',
				conditions: [
					{
						field: 'region',
						value: project.region
					}
				]
			})
		})
		const json = await res.json()

		console.log('averageLengthOfStay', json)

		if (json.res?.length && json.res[0].values?.length)
			return json.res[0].values[0].value.value

		return null
	}

	function declOfNum(number, titles) {
		const cases = [2, 0, 1, 1, 1, 2]
		return titles[(number % 100 > 4 && number % 100 < 20) ? 2 : cases[(number % 10 < 5) ? number % 10 : 5]]
	}

	function estimateStopFactors() {
		const projectData = getProjectWithNumbers()

		fetch('/api/check_stop_factors', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ project: projectData, role })
		})
			.then(res => res.json())
			.then(res => {
				console.log('check_stop_factors', res)

				if (res.redirect)
					goto('/')

				console.log('project', res.project)
				console.log('dirs', res.dirs)
				console.log('scoring', res.scoring)

				project.scoring = res.scoring
				project.scoring.sections.forEach(section => {
					const d = declOfNum(section.passedCount, [
						['представлен', 'показатель'],
						['представлено', 'показателя'],
						['представлено', 'показателей'],
					])
					const part1 = `${d[0]} ${section.passedCount} ${d[1]}`
					section.status = `(${part1} из ${section.indicators.length})`

					hasStopFactors = section.hasCommonStops
				})

				location.hash = ''
				setTimeout(() => location.hash = 'scoring')
				drawer = false
			})
	}

	function deleteProject(showModal = true) {
		if (showModal)
			return openModal('Удалить проект?', [
				{
					title: 'Удалить',
					class: 'btn-accent btn-outline',
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
			body: JSON.stringify({ _id: project._id })
		})
			.then(res => res.json())
			.then(res => {
				console.log('delete_project', res)

				if (res.redirect)
					goto('/')
				if (res?.res?.deletedCount)
					goto('/projects')
			})
	}

	function sendForApproval() {
		project.status = PROJECT_STATUS_ENUM.WAITING_FOR_APPLICANT_APPROVAL.name
		saveProject(() => window.open($page.url.origin + $page.url.pathname + '?role=security', '_blank').focus())
	}

	function approveApplicant() {
		project.status = PROJECT_STATUS_ENUM.APPLICANT_APPROVED.name
		saveProject(() => window.open($page.url.origin + $page.url.pathname + '?role=investor', '_blank').focus())
	}

	function goToTop() {
		document.querySelector('.drawer-content').scrollTo({ top: 0, behavior: 'smooth' })
		document.querySelector('.drawer-side').scrollTo({ top: 0, behavior: 'smooth' })
		location.hash = ''
	}

	if (browser) {
		const hash = location.hash
		if (hash) {
			location.hash = ''
			setTimeout(() => location.hash = hash, 500)
		}
	}
</script>

<div class="drawer drawer-mobile">
	<input id="my-drawer" type="checkbox" class="drawer-toggle" bind:checked={drawer}/>
	<div class="drawer-content flex flex-col" style="scroll-behavior: smooth;">
		<div class="navbar bg-base-100 relative justify-center shrink-0 h-20 md:px-24">
			<div class="flex items-center justify-center h-full w-full max-w-7xl z-10">
				<ul class="menu menu-horizontal px-1 gap-5 lg:ml-auto">
					<li><a class="btn btn-ghost text-base font-medium" href="/projects">Проекты</a></li>
					<li><a class="btn btn-ghost text-secondary text-base font-medium" href="/dirs">Справочники</a></li>
				</ul>
			</div>
			<div class="absolute inset-0 items-end justify-end overflow-hidden">
				<img src="/hill-line-left.png" alt="" class="max-w-none -mr-14 md:mr-0">
			</div>
		</div>
		<div class="px-5 md:px-10 pb-48 w-full max-w-7xl mx-auto">
			{#if project}
				{#if project.scoring}
					<a id="scoring"></a>
					<p class="text-xl font-bold text-secondary mt-12 mb-5 uppercase">Предварительная оценка</p>
					<div class="flex flex-col gap-5">
						{#each project.scoring.sections as section}
							<div class="collapse collapse-arrow border rounded">
								<input type="checkbox"/>
								<div class="collapse-title text-xl font-medium">
									<div class="flex items-center justify-start gap-5">
										<CircleProgress progress={section.progress}
										                color={section.hasCommonStops ? 'salmon' : section.hasAdditionalStops ? 'orange' : 'yellowgreen'}/>
										<div class="">
											<p class="text-base sm:text-xl">{section.title}</p>
											<p class="text-sm">{section.status}</p>
											{#if section.hasCommonStops}
												<p class="text-sm">Выявлен(ы) общий(е) стоп-фактор(ы)</p>
											{:else if section.hasAdditionalStops}
												<p class="text-sm">Выявлен(ы) дополнительный(е) стоп-фактор(ы)</p>
											{:else}
												<p class="text-sm">Стоп-факторы не выявлены</p>
											{/if}
										</div>
									</div>
								</div>
								<div class="collapse-content">
									<div class="overflow-x-auto mt-10">
										<table class="table w-full">
											<thead>
											<tr>
												<th class="!relative">Наименование показателя</th>
												<th>Значение</th>
												<th class="text-center">Стоп-фактор (Предварительная оценка)</th>
											</tr>
											</thead>
											<tbody>
											{#each section.indicators as indicator}
												<tr>
													<td class="whitespace-pre-wrap w-5/12">{indicator.label}</td>
													<td class="whitespace-pre-wrap w-2/12">{indicator.value || 0}</td>
													<td class="whitespace-pre-wrap text-center w-5/12">
														<div class="flex gap-5 items-center">
															<div class="w-4 h-4 rounded-full shrink-0"
															     class:bg-lime-400={!indicator.error && !indicator.stopFactor}
															     class:bg-rose-400={indicator.stopFactor?.type === 'common'}
															     class:bg-yellow-400={indicator.stopFactor?.type === 'additional'}
															     class:bg-zinc-300={indicator.error}></div>
															<div class="text-center w-full">
																{#if indicator.error}
																	{indicator.error}
																{:else if indicator.stopFactor}
																	{indicator.stopFactor.title}
																{:else}
																	Соответствует критериям
																{/if}
															</div>
														</div>
													</td>
												</tr>
											{/each}
											</tbody>
										</table>
									</div>
								</div>
							</div>
						{/each}
					</div>
					<div class="flex justify-end mt-10">
						<button class="btn btn-outline btn-secondary">Утвердить проект</button>
					</div>
					<div class="divider my-20"></div>
				{/if}
				{#each visibleTabs as tab}
					<a id="{tab.name}"></a>
					<p class="text-xl font-bold text-secondary mt-12 mb-5 uppercase">{tab.title}</p>
					{#if tab.fields.length}
						{#each tab.fields as field}
							{#if !field.buildingType || project.buildingType === field.buildingType}
								<div class="max-w-lg p-2">
									{#if field.disabled}
										<Input {...field}
										       disabled={true}
										       type="text"
										       transformer={getNumberStr}
										       bind:value={project[field.name]}/>
									{:else if field.type === 'phone'}
										<Input {...field}
										       type="text"
										       transformer={phoneMask}
										       bind:value={project[field.name]}
										       on:change={() => (highlightSave = true) && field.calc && field.calc()}
										/>
									{:else if field.type === 'inn'}
										<Input {...field}
										       type="text"
										       transformer={innMask}
										       bind:value={project[field.name]}
										       on:change={() => (highlightSave = true) && field.calc && field.calc()}
										/>
									{:else if field.type === 'ogrn'}
										<Input {...field}
										       type="text"
										       transformer={ogrnMask}
										       bind:value={project[field.name]}
										       on:change={() => (highlightSave = true) && field.calc && field.calc()}
										/>
									{:else if field.type === 'number'}
										<Input {...field}
										       type="text"
										       transformer={getNumberStr}
										       bind:value={project[field.name]}
										       on:change={() => (highlightSave = true) && field.calc && field.calc()}
										/>
									{:else if field.type === 'date' || field.type === 'text'}
										<Input {...field}
										       bind:value={project[field.name]}
										       on:change={() => (highlightSave = true) && field.calc && field.calc()}
										/>
									{:else if field.type === 'check'}
										<Check {...field}
										       bind:checked={project[field.name]}
										       on:change={() => (highlightSave = true)}
										/>
									{:else if field.type === 'select'}
										<Select {...field}
										        bind:value={project[field.name]}
										        on:change={() => (highlightSave = true) && field.calc && field.calc()}
										/>
									{/if}
								</div>
							{/if}
						{/each}
					{/if}
					{#if tab.name === 'objectsInfo'}
						<a id="objects"></a>
						<div class="divider"></div>
						{#if project.buildingType === 'complex'}
							<div class="flex flex-col md:flex-row items-stretch gap-5">
								<button class="btn btn-outline"
								        on:click={addObject}>
									Добавить гостиницу
								</button>
								<button class="btn btn-outline md:mr-auto"
								        on:click={addInfrastructureObject}>
									Добавить инфраструктуру
								</button>
								{#if activeObject !== null}
									<button class="btn btn-accent btn-outline"
									        on:click={removeObject}>
										Удалить объект
									</button>
								{/if}
								{#if activeInfrastructureObject !== null}
									<button class="btn btn-accent btn-outline"
									        on:click={removeInfrastructureObject}>
										Удалить объект
									</button>
								{/if}
							</div>
							<div class="divider"></div>
						{/if}
						{#if activeObject !== null}
							<p class="text-xl font-bold text-secondary mt-5 mb-5 uppercase">
								{getObjectName(project.objects[activeObject])}
							</p>
							{#each objectFields as field}
								<div class="max-w-lg p-2">
									{#if field.disabled}
										<Input {...field}
										       disabled={true}
										       name="object-{field.name}"
										       type="text"
										       transformer={getNumberStr}
										       bind:value={project.objects[activeObject][field.name]}/>
									{:else if field.type === 'number'}
										<Input {...field}
										       type="text"
										       transformer={getNumberStr}
										       name="object-{field.name}"
										       bind:value={project.objects[activeObject][field.name]}
										       on:change={() => (highlightSave = true) && field.calc && field.calc()}
										/>
									{:else if field.type === 'date' || field.type === 'text'}
										<Input {...field}
										       name="object-{field.name}"
										       bind:value={project.objects[activeObject][field.name]}
										       on:change={() => (highlightSave = true) && field.calc && field.calc()}
										/>
									{:else if field.type === 'check'}
										<Check {...field}
										       name="object-{field.name}"
										       bind:checked={project.objects[activeObject][field.name]}
										       on:change={() => (highlightSave = true)}
										/>
									{:else if field.type === 'select'}
										<Select {...field}
										        name="object-{field.name}"
										        bind:value={project.objects[activeObject][field.name]}
										        on:change={() => (highlightSave = true) && field.calc && field.calc()}
										/>
									{/if}
								</div>
							{/each}
						{/if}
						{#if activeInfrastructureObject !== null}
							<p class="text-xl font-bold text-secondary mt-5 mb-5 uppercase">
								{getObjectName(project.infrastructureObjects[activeInfrastructureObject])}
							</p>
							{#each objectInfrastructureFields as field}
								<div class="max-w-lg p-2">
									{#if !field.condition || field.condition(project.infrastructureObjects[activeInfrastructureObject])}
										{#if field.disabled}
											<Input {...field}
											       disabled={true}
											       name="infrastructure-{field.name}"
											       type="text"
											       transformer={getNumberStr}
											       bind:value={project.infrastructureObjects[activeInfrastructureObject][field.name]}/>
										{:else if field.type === 'number'}
											<Input {...field}
											       type="text"
											       transformer={getNumberStr}
											       name="object-{field.name}"
											       bind:value={project.infrastructureObjects[activeInfrastructureObject][field.name]}
											       on:change={() => (highlightSave = true) && field.calc && field.calc()}
											/>
										{:else if field.type === 'date' || field.type === 'text'}
											<Input {...field}
											       name="infrastructure-{field.name}"
											       bind:value={project.infrastructureObjects[activeInfrastructureObject][field.name]}
											       on:change={() => (highlightSave = true) && field.calc && field.calc()}
											/>
										{:else if field.type === 'check'}
											<Check {...field}
											       name="infrastructure-{field.name}"
											       bind:checked={project.infrastructureObjects[activeInfrastructureObject][field.name]}
											       on:change={() => (highlightSave = true)}
											/>
										{:else if field.type === 'select'}
											<Select {...field}
											        name="infrastructure-{field.name}"
											        bind:value={project.infrastructureObjects[activeInfrastructureObject][field.name]}
											        on:change={() => (highlightSave = true)}
											/>
										{/if}
									{/if}
								</div>
							{/each}
						{/if}
					{/if}
				{/each}
			{/if}
		</div>
	</div>
	<div class="drawer-side shadow-2xl">
		<label for="my-drawer" class="drawer-overlay"></label>
		<aside class="w-80 xl:w-96 h-full flex flex-col bg-base-100 lg:!max-w-full" style="max-width: 90%;">
			<div class="flex items-center justify-center h-20 relative">
				<a href="/projects" class="font-medium text-xl px-5 z-10">
					<img class="h-8" src="/logo.png" alt="Логотип Туризм.РФ">
				</a>
				<div class="absolute inset-0 flex items-end justify-start overflow-hidden">
					<img src="/hill-line-left.png" alt="" class="max-w-none">
				</div>
			</div>
			<p class="text-center m-4 mt-8 font-bold text-xl text-secondary">{project.projectName}</p>
			<p class="text-center m-4 text-secondary">
				Статус проекта:
				<br>
				<span class="font-medium uppercase">{PROJECT_STATUS_ENUM[project.status].title}</span>
			</p>
			{#if role === ROLES_ENUM.INVESTOR}
				{#if project.status === PROJECT_STATUS_ENUM.CREATED.name}
					<button class="btn btn-outline btn-secondary mx-10 my-4"
					        on:click={sendForApproval}>
						Отправить на согласование
					</button>
				{:else if project.status === PROJECT_STATUS_ENUM.APPLICANT_APPROVED.name}
					<button class="btn btn-outline btn-secondary mx-10 my-4"
					        on:click={estimateStopFactors}>
						Провести оценку
					</button>
				{/if}
			{:else if role === ROLES_ENUM.SECURITY}
				{#if project.status === PROJECT_STATUS_ENUM.WAITING_FOR_APPLICANT_APPROVAL.name}
					<button class="btn btn-outline btn-secondary mx-10 my-4"
					        on:click={estimateStopFactors}>
						Оценить благонадежность
					</button>
					{#if !hasStopFactors}
						<button class="btn btn-secondary mx-10 my-4"
						        on:click={approveApplicant}>
							Подтвердить благонадежность
						</button>
					{/if}
				{/if}
			{:else if role === ROLES_ENUM.MANAGER}
				{#if project.status !== PROJECT_STATUS_ENUM.CREATED.name}
					<button class="btn btn-outline btn-secondary mx-10 my-4"
					        on:click={estimateStopFactors}>
						Провести оценку
					</button>
				{/if}
			{/if}
			{#if visibleTabs.length > 1}
				<ul class="m-4">
					{#if project.scoring}
						<li class="flex flex-col items-stretch">
							<a href="#scoring"
							   on:click={() => drawer = false}
							   class="rounded py-2 px-4 hover:bg-base-200 font-medium text-secondary uppercase">
								Предварительная оценка
							</a>
							<div class="divider ml-4 mr-4 my-1"></div>
						</li>
					{/if}
					{#each visibleTabs as tab}
						<li class="flex flex-col items-stretch">
							<a href="#{tab.name}"
							   on:click={() => drawer = false}
							   class="rounded py-2 px-4 hover:bg-base-200 font-medium text-secondary uppercase">
								{tab.title}
							</a>
							{#if tab.name === 'objectsInfo'}
								<ul class="pl-4">
									{#each project.objects as object, i}
										<li class="flex hover:bg-base-200 rounded my-0.5"
										    on:click={() => selectObject(i)}>
											<a href="#objects"
											   class="px-5 py-2 w-full text-secondary uppercase">
												{getObjectName(object)}
											</a>
										</li>
									{/each}
								</ul>
								<ul class="pl-4">
									{#each project.infrastructureObjects || [] as object, i}
										<li class="flex hover:bg-base-200 rounded my-0.5"
										    on:click={() => selectObject(i, true)}>
											<a href="#objects"
											   class="px-5 py-2 w-full text-secondary uppercase">
												{getObjectName(object, true)}
											</a>
										</li>
									{/each}
								</ul>
							{/if}
						</li>
					{/each}
				</ul>
			{/if}
			<button class="btn btn-outline btn-secondary text-accent mx-10 my-5"
			        on:click={deleteProject}>
				Удалить проект
			</button>
		</aside>
	</div>
</div>
<div class="flex flex-col gap-3 fixed bottom-5 md:bottom-10 right-5 md:right-10 opacity-75">
	<button class="btn btn-ghost bg-base-200/30"
	        on:click={goToTop}>
		<img class="w-5 md:w-6" src="/up.svg" alt="Наверх">
	</button>
	<button class="btn btn-ghost bg-base-200/50"
	        class:border={highlightSave}
	        class:border-black={highlightSave}
	        on:click={() => saveProject()}>
		<img class="w-5 md:w-6" src="/save.svg" alt="Наверх">
	</button>
	<label for="my-drawer"
	       class="btn btn-ghost bg-base-200/75 lg:hidden">
		<img class="w-5 md:w-6" src="/menu.svg" alt="Меню">
	</label>
</div>