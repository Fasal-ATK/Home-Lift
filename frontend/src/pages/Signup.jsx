import React, { useEffect, useState } from 'react'
import axios from 'axios'
import api from '../API/api'

function Signup() {
  useEffect(() => { 
    console.log('mounted or updated')
    return(()=>{
        console.log('unmounted')
    })
  }, []);

    const [fname,setFname] = useState('') 
    const [lname,setLname] = useState('') 
    const [uname,setUname] = useState('')
    const [phone,setPhone] = useState('')
    const [email,setEmail] = useState('') 
    const [pass1,setPass1] = useState('') 
    const [pass2,setPass2] = useState('') 

    const [passMatch,setPassMatch] = useState(false)
    const [error, setErrorState] = useState(''); 
    const [loading, setLoading] = useState(false);
    
    const handleSubmit = async(e)=>{
        e.preventDefault();
        if (pass1 !== pass2){
            setPassMatch(true);
            return
        }

        setPassMatch(true)
        setErrorState('')

        if (pass1.length < 6){
            setErrorState('Password need to be 6 or more charecter')
            return
        }
        if (!/^\d{10}$/.test(phone)) {
            setErrorState('Please enter a valid 10-digit phone number');
            setLoading(false);
            return;
        }

        setLoading(true)
        try{
            const response = await axios.post(`${api}/register/`,{
                first_name: fname,
                last_name : lname,
                username : uname,
                phone : `+91${phone}`,
                email : email,
                password : pass1,
            })
        }
        catch{
            setLoading(false)
        }
        
        if (error.response) {
            const errorData = error.response.data;
            setErrorState(Object.values(errorData).join('\n')); // Display error message from API
        } else if (error.request) {
            console.error('Error: No response from the server', error.request);
            setErrorState('No response from the server. Please try again later.');
        } else {
            console.error('Error:', error.message);
            setErrorState('Something went wrong. Please try again later.');
    }
}
  return (
    <div>
        <form onSubmit={handleSubmit}>
            First Name : <input type="text" onChange={(event) => setFname(event.target.value)} /> <br />
            Last Name : <input type="text" onChange={(event) => setLname(event.target.value)} />  <br />
            Username : <input type="text" onChange={(event) => setUname(event.target.value)} /> <br />
            Phone : <input type="number" onChange={(event) => setPhone(event.target.value)} /> <br />
            Email : <input type="email" onChange={(event) => setEmail(event.target.value)} /> <br />
            Password : <input type="password"  onChange={(event)=> setPass1(event.target.value)} /> <br />
            Confirm Password : <input type="password"  onChange={(event)=> setPass2(event.target.value)} /> <br />
            <button type='submit'>Submit</button>
        </form>
    </div>
  )
}
export default Signup
