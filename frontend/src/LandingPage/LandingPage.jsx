import { useNavigate } from 'react-router-dom';
import './landingpage.css'
function LandingPage(){
      const navigate = useNavigate()
    
   return(
    <div className='landing-page'>
        <h1>Welcome to <span className='briefly'>BRIEFLY</span> </h1>
        <p>Simple, modern, and clean.... “in brief”</p>
        <button  onClick={() =>  navigate('/login')}>Start</button>
    </div>
   )
}
export default LandingPage