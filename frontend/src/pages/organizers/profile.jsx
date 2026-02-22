import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import axiosInstance from '../../api/axios';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

const OrganizerProfile = () => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [successMsg, setSuccessMsg] = useState(null);

    const { register, handleSubmit, reset, setValue, formState: { isSubmitting } } = useForm({
        defaultValues: {
            name: '',
            description: '',
            category: '',
            email: '',
            login: '' // Read-only
        }
    });

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const res = await axiosInstance.get('/organizers/organizer');
                const data = res.data;

                // Populate form with fetched data
                reset({
                    name: data.name || '',
                    description: data.description || '',
                    category: data.category || '',
                    email: data.email || '',
                    login: data.login || '' // From user model via backend join/logic
                });
                setLoading(false);
            } catch (err) {
                console.error("Failed to fetch profile", err);
                setError("Failed to load profile data.");
                setLoading(false);
            }
        };

        fetchProfile();
    }, [reset]);

    const onSubmit = async (data) => {
        setError(null);
        setSuccessMsg(null);
        try {
            // Only send editable fields
            const payload = {
                name: data.name,
                description: data.description,
                category: data.category,
                email: data.email
            };

            await axiosInstance.put('/organizers/profile', payload);
            setSuccessMsg("Profile updated successfully!");
        } catch (err) {
            console.error("Failed to update profile", err);
            setError(err.response?.data?.error || "Failed to update profile.");
        }
    };

    if (loading) return <div className="p-8 text-center text-muted-foreground">Loading profile...</div>;

    return (
        <div className="container mx-auto max-w-2xl py-8 space-y-6">
            <h1 className="text-3xl font-bold tracking-tight">Organizer Profile</h1>

            {successMsg && <div className="p-4 bg-green-100 text-green-700 rounded-md">{successMsg}</div>}
            {error && <div className="p-4 bg-red-100 text-red-700 rounded-md">{error}</div>}

            <Card>
                <CardHeader>
                    <CardTitle>Organization Details</CardTitle>
                    <CardDescription>Manage your organization's public profile and contact information.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

                        <div className="space-y-2">
                            <Label htmlFor="login">Login Email / Username</Label>
                            <Input
                                id="login"
                                disabled
                                className="bg-muted"
                                {...register("login")}
                            />
                            <p className="text-xs text-muted-foreground">This is your login identifier and cannot be changed here.</p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="name">Organization Name</Label>
                            <Input
                                id="name"
                                placeholder="e.g. Coding Club"
                                {...register("name", { required: "Name is required" })}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="category">Category</Label>
                            <Input
                                id="category"
                                placeholder="e.g. Technical, Cultural, Sports"
                                {...register("category")}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="email">Contact Email</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="contact@example.com"
                                {...register("email", { required: "Contact email is required" })}
                            />
                            <p className="text-xs text-muted-foreground">Publicly visible email for inquiries.</p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description">Description</Label>
                            <Textarea
                                id="description"
                                placeholder="Describe your organization..."
                                rows={5}
                                {...register("description")}
                            />
                        </div>

                        <div className="pt-4 flex justify-end">
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting ? "Saving..." : "Save Changes"}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
};

export default OrganizerProfile;
