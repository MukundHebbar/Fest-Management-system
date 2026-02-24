import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import {
    NavigationMenu, NavigationMenuItem,
    NavigationMenuLink, NavigationMenuList,
    navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu"


const Navbar = () => {
    const { logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = async () => {
        await logout();
        navigate('/');
    };

    const displayItems = [
        { item: 'Dashboard', path: '/organizer/dashboard' },
        { item: 'Profile', path: '/organizer/profile' },
        { item: 'Reset Password', path: '/organizer/reset' },
    ]
    return (
        <nav className="flex items-center justify-between px-6 py-4 border-b bg-white">
            <NavigationMenu>
                <NavigationMenuList>
                    {displayItems.map(
                        (link) => (
                            <NavigationMenuItem key={link.path}>
                                <Link to={link.path} className={navigationMenuTriggerStyle()}>
                                    {link.item}
                                </Link>
                            </NavigationMenuItem>
                        )
                    )}
                </NavigationMenuList>
            </NavigationMenu>

            <button onClick={handleLogout}
                className={`${navigationMenuTriggerStyle()} text-white hover:text-white`}>
                Logout
            </button>
        </nav>
    );
};

export default Navbar;
