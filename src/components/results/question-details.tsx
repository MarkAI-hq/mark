import type { Question } from '@/lib/types'

interface QuestionDetailsProps {
	questionData: Question
}

export default function QuestionDetails({
	questionData
}: QuestionDetailsProps) {

	return (
		<div className='border-b last:border-b-0 p-6'>
			<div className='flex justify-between items-start mb-2'>
				<h3 className='font-medium'>{questionData.question}</h3>
				<div
					className={`px-2 py-1 rounded-full text-sm font-medium ${
						questionData.score >= questionData.maxScore / 2
							? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100'
							: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100'
					}`}
				>
					Score: {questionData?.score}/{questionData?.maxScore}
				</div>
			</div>

			<p>{questionData.feedback}</p>

			{questionData.issues && questionData.issues.length > 0 && (
				<div className='mt-2'>
					<p className='text-red-500 font-medium'>Issues:</p>
					<ul className='list-disc list-inside text-red-500 pl-2'>
						{questionData.issues.map((issue, index) => (
							<li key={index}>{issue}</li>
						))}
					</ul>
				</div>
			)}
		</div>
	)
}
