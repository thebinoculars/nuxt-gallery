export const useAuth = () => {
  const user = useState('auth.user', () => null)
  const token = useState('auth.token', () => null)
  const isLoading = useState('auth.loading', () => false)

  // Initialize auth state from localStorage and verify with server
  const init = async () => {
    const savedToken = localStorage.getItem('auth.token')

    if (savedToken) {
      token.value = savedToken
      await checkMe()
    }
  }

  // Check current user with server
  const checkMe = async () => {
    if (!token.value) {
      user.value = null
      return false
    }

    try {
      const response = await $fetch('/api/auth/me', {
        headers: {
          Authorization: `Bearer ${token.value}`,
        },
      })

      if (response.success) {
        user.value = response.data
        return true
      } else {
        logout()
        return false
      }
    } catch (error) {
      console.error('Check me error:', error)
      logout()
      return false
    }
  }

  const login = async (email, password) => {
    isLoading.value = true
    try {
      const response = await $fetch('/api/auth/login', {
        method: 'POST',
        body: { email, password },
      })

      if (response.success) {
        token.value = response.data.token
        user.value = response.data.user

        // Save to localStorage
        localStorage.setItem('auth.token', response.data.token)

        return response.data
      } else {
        throw new Error(response.message || 'Login failed')
      }
    } catch (error) {
      if (error.data?.message) {
        throw new Error(error.data.message)
      }
      throw new Error(error.message || 'Login failed')
    } finally {
      isLoading.value = false
    }
  }

  const register = async (email, password) => {
    isLoading.value = true
    try {
      const response = await $fetch('/api/auth/register', {
        method: 'POST',
        body: { email, password },
      })

      if (response.success) {
        return response.data
      } else {
        throw new Error(response.message || 'Registration failed')
      }
    } catch (error) {
      if (error.data?.message) {
        throw new Error(error.data.message)
      }
      throw new Error(error.message || 'Registration failed')
    } finally {
      isLoading.value = false
    }
  }

  const logout = () => {
    user.value = null
    token.value = null

    localStorage.removeItem('auth.token')
    window.location.href = '/login'
  }

  return {
    user: readonly(user),
    token: readonly(token),
    isLoading: readonly(isLoading),
    login,
    register,
    logout,
    checkMe,
    init,
  }
}
