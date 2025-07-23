// components/common/LogoutButton.jsx
import React from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import axios from 'axios'

const LogoutButton = () => {
  const location = useLocation()
  const navigate = useNavigate()

  const handleLogout = async () => {
    try {
      await axios.post('/api/logout/', null, { withCredentials: true }) // optional backend logout
      // Determine if current path is admin or user
      const isAdmin = location.pathname.startsWith('/admin')
      navigate(isAdmin ? '/admin/login' : '/login')
    } catch (err) {
      console.error('Logout failed:', err)
    }
  }

  return (
    <button
      onClick={handleLogout}
      className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
    >
      Logout
    </button>
  )
}

export default LogoutButton
