'use server'

import { fetcher } from '../fetch'
import { ApiResponse } from '../types'

interface User {
	id: string
	name: string
}

export async function getUsers() {
	return await fetcher<ApiResponse<User[]>>('/users', {
		cache: 'no-store'
	})
}
