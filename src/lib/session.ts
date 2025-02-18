import { jwtDecode } from 'jwt-decode'
import { cookies } from 'next/headers'

interface JwtPayload {
  exp: number
  iat: number
  sub: string
}

export async function getSession() {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('token')

    if (!token?.value) {
      return null
    }

    const decoded = jwtDecode<JwtPayload>(token.value)
    const currentTime = Math.floor(Date.now() / 1000)

    // Check if token is expired or will expire in the next 5 minutes
    if (decoded.exp <= currentTime + 300) {
      return null
    }

    return {
      user: {
        id: decoded.sub,
      },
      expires: new Date(decoded.exp * 1000),
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