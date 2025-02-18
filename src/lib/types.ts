export type ApiResponse<T> = {
	data?: T
	error?: { message: string; status: number }
}

export type LoginResponse = {
	accessToken: string
	refreshToken: string
	user: {
		id: string
		name: string
		email: string
		role: string
		isVerified: boolean
	}
}

export type RefreshTokenResponse = {
	accessToken: string
	refreshToken: string
}

export type DashboardStats = {
	totalCourses: number
	totalStudents: number
	totalExams: number
	markedPapers: number
	recentActivity: Array<{
		id: string
		description: string
		timestamp: string
	}>
	upcomingDeadlines: Array<{
		id: string
		title: string
		dueDate: string
	}>
}

export type Student = {
	id: string
	name: string
	class: string
	stream: string
	createdBy: string
	createdAt: string
	updatedAt: string
}

export type Subject = {
	id: string
	code: string
	title: string
	description?: string
	createdAt: string
	updatedAt: string
}

export type Exam = {
	id: string
	title: string
	courseId: string
	courseName: string
	totalMarks: number
	questionCount: number
	createdBy: string
	createdAt: string
	updatedAt: string
	questions?: Question[]
}

export type CreateExamDto = {
	title: string
	courseId: string
	totalMarks: number
	questionCount: number
	description?: string
}

export type Question = {
	id: string
	text: string
	type: 'Text' // Can be expanded if there are other types
	components: AssessmentComponent[]
	totalMarks: number
	questionNumber: number
}

export type AssessmentComponent = {
	marks: number
	description: string
}

export type ExamStats = {
	totalStudents: number
	averageScore: number
	highestScore: number
	lowestScore: number
	passRate: number
}

export type StudentResult = {
	studentId: string
	studentName: string
	score: number
	totalMarks: number
	percentage: number
}

export type QuestionStat = {
	questionNumber: number
	totalPossibleMarks: number
	highestScore: number
	lowestScore: number
	averageScore: number
	percentageScore: number
	attemptsCount: number
}
