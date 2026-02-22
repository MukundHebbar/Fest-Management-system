import { Outlet } from "react-router-dom";
import Navbar from "../components/organizer/Navbar"

const OrganizerLayout = () => {
    return (
        <div className="app-container">
            <Navbar/>
            <main className="content-area">
            <Outlet/>
            </main>
        </div>
    )
}; 

export default OrganizerLayout