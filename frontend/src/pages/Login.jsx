import React, { useState } from 'react'

function Login() {
    const [uname,setUname] = useState('')
    const [pass,setPassword] = useState('')
  return (
    <div>
      Username : <input type="text" onChange={(event)=> setUname( event.target.value )  }/> <br />
      Password : <input type="password" onChange={(event) => setPassword(event.target.value)}/> <br />
      <button > Login </button> 
    </div>
  )
}

export default Login
