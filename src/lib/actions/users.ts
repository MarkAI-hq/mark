'use server'

import { fetcher } from '../fetch'
import { ServerActionResponse } from '../types'

interface User {
	id: string
	name: string
}

export async function getUsers() {
	return await fetcher<ServerActionResponse<User[]>>('/users', {
		cache: 'no-store'
	})
}
