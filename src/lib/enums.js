export const ROLES_ENUM = {
	INVESTOR: 'INVESTOR',
	SECURITY: 'SECURITY',
	MANAGER: 'MANAGER',
}

export const PROJECT_STATUS_ENUM = {
	CREATED: {
		name: 'CREATED',
		title: 'Создан'
	},
	WAITING_FOR_APPLICANT_APPROVAL: {
		name: 'WAITING_FOR_APPLICANT_APPROVAL',
		title: 'Ожидает подтверждения благонадежности'
	},
	APPLICANT_APPROVED: {
		name: 'APPLICANT_APPROVED',
		title: 'Благонадежность инвестора подтверждена'
	},
	SCORING_RESULT_APPROVED: {
		name: 'SCORING_RESULT_APPROVED',
		title: 'Результаты скоринга подтверждены'
	},
}