import { Outlet } from "react-router-dom";
import Navbar from "../components/admin/Navbar"

const AdminLayout = () => {
    return (
        <div className="app-container">
            <Navbar />
            <main className="content-area">
                <Outlet />
            </main>
        </div>
    )
};

export default AdminLayout
