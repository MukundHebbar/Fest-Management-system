import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useForm, Controller } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardFooter,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';

const Signup = () => {
    const { user, signup, loading } = useAuth();
    const navigate = useNavigate();
    const [error, setError] = useState(null);
    const { register, handleSubmit, control, watch, setValue, formState: { errors } } = useForm({
        defaultValues: {
            username: '',
            password: '',
            firstName: '',
            lastName: '',
            contactNumber: '',
            orgName: '',
            isIIITStudent: false
        }
    });

    const isIIITStudent = watch("isIIITStudent");

    useEffect(() => {
        if (user) {
            navigate(user.role === 'organizer' ? '/organizer/dashboard' : '/dashboard');
        }
    }, [user, navigate]);

    useEffect(() => {
        if (isIIITStudent) {
            setValue("orgName", "IIITH");
        } else {
            setValue("orgName", "");
        }
    }, [isIIITStudent, setValue]);

    const onSubmit = async (data) => {
        setError(null);
        const userData = {
            ...data,
            type: data.isIIITStudent ? 'Y' : 'N',
            orgName: data.isIIITStudent ? "IIITH" : data.orgName
        };

        const { username, password, firstName, lastName, contactNumber, orgName, type } = userData;

        const result = await signup({ username, password, firstName, lastName, contactNumber, orgName, type });
        if (!result.success) {
            setError(result.message);
        }
    };

    if (loading || user) return <div className="flex h-screen items-center justify-center">Loading...</div>;

    return (
        <div className="flex h-screen items-center justify-center p-4">
            <Card className="w-full max-w-sm shadow-none border-0 sm:border sm:shadow">
                <CardHeader className="text-center pb-2">
                    <CardTitle className="text-xl">Create Account</CardTitle>
                </CardHeader>
                <CardContent>
                    {error && <div className="text-red-500 text-sm mb-3 text-center">{error}</div>}
                    <form onSubmit={handleSubmit(onSubmit)} className="grid gap-3">
                        <div className="grid grid-cols-2 gap-3">
                            <Input {...register("firstName", { required: true })} placeholder="First Name" />
                            <Input {...register("lastName", { required: true })} placeholder="Last Name" />
                        </div>

                        <Input
                            {...register("username", { required: true })}
                            type="email"
                            placeholder={isIIITStudent ? "student@students.iiit.ac.in" : "Email"}
                        />

                        <Input
                            {...register("password", { required: true })}
                            type="password"
                            placeholder="Password"
                        />

                        <Input
                            {...register("contactNumber", { required: true })}
                            placeholder="Contact Number"
                        />

                        <div className="flex items-center space-x-2 py-1">
                            <Controller
                                name="isIIITStudent"
                                control={control}
                                render={({ field }) => (
                                    <Checkbox
                                        id="iiitStudent"
                                        checked={field.value}
                                        onCheckedChange={field.onChange}
                                    />
                                )}
                            />
                            <Label htmlFor="iiitStudent" className="text-sm font-normal cursor-pointer">I am an IIIT Student</Label>
                        </div>

                        <Input
                            {...register("orgName", { required: !isIIITStudent })}
                            placeholder="Organization Name"
                            disabled={isIIITStudent}
                            readOnly={isIIITStudent}
                        />

                        <Button type="submit" className="w-full mt-2">Sign Up</Button>
                    </form>
                </CardContent>
                <CardFooter className="flex flex-col gap-3 pt-0">
                    <div className="text-center text-xs text-muted-foreground">
                        Already have an account?{" "}
                        <Link to="/" className="underline hover:text-primary">
                            Login
                        </Link>
                    </div>
                </CardFooter>
            </Card>
        </div>
    );
};

export default Signup;