import { useEffect, useState } from 'react';
import axiosInstance from '../../api/axios';
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
import { Badge } from '@/components/ui/badge';

const Profile = () => {
    const [profile, setProfile] = useState({
        firstName: "",
        lastName: "",
        contactNumber: "",
        orgName: ""
    });
    const [selectedTags, setSelectedTags] = useState([]);
    const [allAvailableTags, setAllAvailableTags] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState(null);
    const [successMsg, setSuccessMsg] = useState(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            console.log("Free");
            const res = await axiosInstance.get("/participants/me");

            const { participant, all_tags } = res.data;

            setProfile({
                firstName: participant.firstName || "",
                lastName: participant.lastName || "",
                contactNumber: participant.contactNumber || "",
                orgName: participant.orgName || ""
            });

            const currentTagObjects = participant.tags || [];
            const currentlySelected = currentTagObjects.map(t => typeof t === 'string' ? t : t.type || t.tag || t.toString());
            setSelectedTags(currentlySelected);

            const allTags = (all_tags || []).map(t => t.tag || t.type || t).filter(Boolean);
            setAllAvailableTags(allTags);
            setLoading(false);
        } catch (err) {
            console.error(err);
            setError("Failed to fetch profile data");
            setLoading(false);
        }
    };

    const handleProfileChange = (e) => {
        setProfile({ ...profile, [e.target.name]: e.target.value });
    };

    const handleTagChange = (tag) => {
        if (selectedTags.includes(tag)) {
            setSelectedTags(selectedTags.filter(t => t !== tag));
        } else {
            setSelectedTags([...selectedTags, tag]);
        }
    };

    const handleSave = async () => {
        setError(null);
        setSuccessMsg(null);
        setIsSaving(true);
        try {
            await Promise.all([
                axiosInstance.put("/participants/me", profile),
                axiosInstance.put("/participants/me/tags", { tags: selectedTags })
            ]);
            setSuccessMsg("Profile and interests updated successfully!");
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.error || "Failed to update profile");
        } finally {
            setIsSaving(false);
        }
    };

    if (loading) return <div className="p-8 text-center">Loading profile...</div>;

    return (
        <div className="container mx-auto max-w-2xl py-8 space-y-8">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold">Profile Settings</h1>
                <Button onClick={handleSave} disabled={isSaving}>
                    {isSaving ? "Saving..." : "Save Changes"}
                </Button>
            </div>

            {error && <div className="text-red-500 text-sm">{error}</div>}
            {successMsg && <div className="text-green-500 text-sm">{successMsg}</div>}

            <Card>
                <CardHeader>
                    <CardTitle>Personal Details</CardTitle>
                    <CardDescription>Update your personal information.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="firstName">First Name</Label>
                            <Input id="firstName" name="firstName" value={profile.firstName} onChange={handleProfileChange} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="lastName">Last Name</Label>
                            <Input id="lastName" name="lastName" value={profile.lastName} onChange={handleProfileChange} />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="contactNumber">Contact Number</Label>
                        <Input id="contactNumber" name="contactNumber" value={profile.contactNumber} onChange={handleProfileChange} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="orgName">Organization Name</Label>
                        <Input
                            id="orgName"
                            name="orgName"
                            value={profile.orgName}
                            onChange={handleProfileChange}
                            disabled={profile.orgName === "IIITH"}
                        />
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Interests</CardTitle>
                    <CardDescription>Select topics you are interested in.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-wrap gap-2">
                        {allAvailableTags.length === 0 ? <p className="text-muted-foreground">No tags available.</p> :
                            allAvailableTags.map(tag => (
                                <Badge
                                    key={tag}
                                    variant={selectedTags.includes(tag) ? "default" : "secondary"}
                                    className="cursor-pointer text-sm py-1 px-3 hover:opacity-80 transition-opacity"
                                    onClick={() => handleTagChange(tag)}
                                >
                                    {selectedTags.includes(tag) && <span className="mr-1">✓</span>}
                                    {tag}
                                </Badge>
                            ))
                        }
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default Profile;