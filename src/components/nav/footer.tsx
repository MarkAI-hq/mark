'use client'

import { getYear } from 'date-fns'
import { TZDate } from '@date-fns/tz';

export function Footer() {
	const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;

	return (
		<footer className='border-t border-border/40 mt-auto flex-shrink-0'>
			<div className='mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8'>
				<p className='text-center text-sm text-muted-foreground'>
					&copy; {getYear(new TZDate(new Date(), tz))} Mirror Intelligence. All rights reserved.
				</p>
			</div>
		</footer>
	)
}
