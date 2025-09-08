import React from 'react'
import { Link } from 'react-router-dom'

function Landing() {
  return (
    <div style={{ textAlign: 'center', marginTop: '100px' }}>
            <Link to='/login'>User Login</Link>
            <br /><br />
            <Link to='/admin/login'>Admin Login</Link>
            <br /><br />
            <Link to='/login'>ProviderLogin</Link>
            <br /><br />
    </div>
  )
}

export default Landing
