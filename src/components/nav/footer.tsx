'use client'

import Link from 'next/link'
import { getYear } from 'date-fns'
import { TZDate } from '@date-fns/tz';
import { Github } from 'lucide-react'

export function Footer() {
	const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;

	return (
		<footer className='border-t'>
			<div className='mx-auto max-w-7xl px-4 py-6 sm:px-6 md:flex md:items-center md:justify-between lg:px-8'>
				<div className='flex justify-center space-x-6 md:order-2'>
					<Link
						href='#'
						className='text-muted-foreground hover:text-primary'
						// target='_blank'
					>
						<Github className='h-5 w-5' />
					</Link>
				</div>
				<div className='mt-8 md:order-1 md:mt-0'>
					<p className='text-center text-sm text-muted-foreground'>
						&copy; {getYear(new TZDate(new Date(), tz))} Mark-AI Labs, Inc.
					</p>
				</div>
			</div>
		</footer>
	)
}
