import { createContext, useState, useEffect, useContext } from "react";
import axiosInstance from "../api/axios";

export const AuthContext = createContext();

export const useAuth = () => {
    return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // Check if user is logged in on mount
    useEffect(() => {
        const checkUserLoggedIn = async () => {
            try {
                const res = await axiosInstance.get("/me");
                setUser(res.data);
            } catch (error) {
                console.log("Not logged in");
                setUser(null);
            } finally {
                setLoading(false);
            }
        };

        checkUserLoggedIn();
    }, []);

    const login = async (username, password) => {
        try {
            const res = await axiosInstance.post("/auth/login", { username, password });
            setUser(res.data);
            return { success: true };
        } catch (error) {
            console.error("Login failed", error);
            return { success: false, message: error.response?.data?.error || "Login failed" };
        }
    };

    const signup = async (userData) => {
        try {
            const res = await axiosInstance.post("/auth/signup", userData);
            setUser(res.data); // Assuming signup also logs the user in
            return { success: true };
        } catch (error) {
            console.error("Signup failed", error);
            
            return { success: false, message: error.response?.data?.error || "Signup failed" };
        }
    };

    const logout = async () => {
        try {
            await axiosInstance.post("/auth/logout");
            setUser(null);
            return { success: true };
        } catch (error) {
            console.error("Logout failed", error);
            return { success: false, message: "Logout failed" };
        }
    };

    return (
        <AuthContext.Provider value={{ user, login, signup, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
};
