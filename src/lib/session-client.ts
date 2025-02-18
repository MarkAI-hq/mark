'use client'

import { jwtDecode } from 'jwt-decode'

interface User {
	id: string
	name: string
	email: string
	role: string
	isVerified: boolean
}

interface JwtPayload {
	exp: number
	user: User
}

export async function getSession(token: string) {
	try {
		if (!token) return null

		const decoded = jwtDecode<JwtPayload>(token)
		if (!decoded) return null

		return {
			user: decoded.user,
			expires: new Date(decoded.exp * 1000)
		}
	} catch {
		return null
	}
}

export function isTokenExpired(token: string) {
	try {
		const decoded = jwtDecode<JwtPayload>(token)
		const currentTime = Math.floor(Date.now() / 1000)

		return decoded.exp <= currentTime
	} catch {
		return true
	}
}
