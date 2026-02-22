import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const Login = () => {
    const { user, login, loading } = useAuth();
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    // Redirect to dashboard if already logged in
    useEffect(() => {
        if (user) {
            if (user.role === 'participant') {
                navigate('/dashboard');
            } else if (user.role === 'organizer') {
                navigate('/organizer/dashboard');
            }
        }
    }, [user, navigate]);

    const handleLogin = async () => {
        setError(null);
        const result = await login(username, password);
        if (!result.success) {
            setError(result.message);
        } else {
            const role = result.user?.role;
            if (role === 'participant') {
                navigate('/dashboard');
            } else if (role === 'organizer') {
                navigate('/organizer/dashboard');
            }
        }
    };

    if (loading) return <div className="flex h-screen items-center justify-center">Loading...</div>;

    if (user) return <div className="flex h-screen items-center justify-center">Redirecting...</div>;

    return (
  <Card className="max-w-sm mx-auto mt-20 p-6">
    <CardHeader>
      <CardTitle>Login</CardTitle>
      <CardDescription>
        Enter your username and password.
      </CardDescription>
    </CardHeader>

    <CardContent>
      {error && (
        <p className="text-red-500 text-sm mb-3">{error}</p>
      )}

      <Label htmlFor="username">Username</Label>
      <Input
        id="username"
        type="text"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        className="mb-4"
        required
      />

      <Label htmlFor="password">Password</Label>
      <Input
        id="password"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="mb-6"
        required
      />

      <Button className="w-full mb-4" onClick={handleLogin}>
        Login
      </Button>

      <p className="text-sm text-center">
        Don’t have an account?{" "}
        <Link to="/signup" className="underline">
          Sign Up
        </Link>
      </p>
    </CardContent>
  </Card>
);

};

export default Login;