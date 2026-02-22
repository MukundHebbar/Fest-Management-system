import { Outlet } from "react-router-dom";
import Navbar from "../components/participant/Navbar"

const ParticipantLayout = () => {
    return (
        <div className="app-container">
            <Navbar/>
            <main className="content-area">
            <Outlet/>
            </main>
        </div>
    )
}; 

export default ParticipantLayout