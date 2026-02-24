import { useState, useEffect } from 'react';
import axiosInstance from '../../api/axios';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';

const ManageClubs = () => {
    const [organizers, setOrganizers] = useState([]);
    const [credentials, setCredentials] = useState(null);
    const [selectedOrg, setSelectedOrg] = useState(null);
    const [loading, setLoading] = useState(true);
    const [creating, setCreating] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchOrganizers();
    }, []);

    const fetchOrganizers = async () => {
        try {
            const res = await axiosInstance.get('/admin/organizers');
            setOrganizers(res.data);
        } catch (err) {
            console.error("Failed to fetch organizers", err);
            setError("Failed to load organizers.");
        } finally {
            setLoading(false);
        }
    };

    const handleCreateOrganizer = async () => {
        setCreating(true);
        setError(null);
        setCredentials(null);
        try {
            const res = await axiosInstance.get('/admin/createOrg');
            setCredentials(res.data.credentials);
            fetchOrganizers();
        } catch (err) {
            console.error("Failed to create organizer", err);
            setError(err.response?.data?.error || "Failed to create organizer.");
        } finally {
            setCreating(false);
        }
    };

    const handleDelete = async (orgId) => {
        if (!window.confirm("Are you sure? This will permanently delete the organizer, all their events, registrations, and teams.")) return;
        setError(null);
        try {
            await axiosInstance.delete(`/admin/${orgId}/remove`);
            setOrganizers(prev => prev.filter(o => o._id !== orgId));
            setSelectedOrg(null);
        } catch (err) {
            console.error("Failed to delete organizer", err);
            setError(err.response?.data?.error || "Failed to delete organizer.");
        }
    };

    if (loading) return <div className="p-8 text-center text-muted-foreground">Loading organizers...</div>;

    return (
        <div className="container mx-auto py-8 space-y-8">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold tracking-tight">Manage Clubs</h1>
                <Button onClick={handleCreateOrganizer} disabled={creating}>
                    {creating ? "Creating..." : "Create Organizer"}
                </Button>
            </div>

            {error && <p className="text-red-500 text-sm">{error}</p>}

            {credentials && (
                <Card className="max-w-md border-green-300">
                    <CardHeader>
                        <CardTitle className="text-lg text-green-600">Organizer Created</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                        <p><span className="font-semibold">Email: </span><code className="bg-gray-100 px-2 py-1 rounded">{credentials.username}</code></p>
                        <p><span className="font-semibold">Password: </span><code className="bg-gray-100 px-2 py-1 rounded">{credentials.password}</code></p>
                    </CardContent>
                </Card>
            )}

            {organizers.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                    <p>No organizers found.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {organizers.map(org => (
                        <Card
                            key={org._id}
                            className="cursor-pointer hover:shadow-md transition-shadow"
                            onClick={() => setSelectedOrg(org)}
                        >
                            <CardHeader>
                                <CardTitle className="text-lg">{org.name}</CardTitle>
                            </CardHeader>
                            <CardContent className="text-sm">
                                <p className="text-muted-foreground">{org.email}</p>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            <Dialog open={!!selectedOrg} onOpenChange={(open) => { if (!open) setSelectedOrg(null); }}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{selectedOrg?.name}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-3 text-sm">
                        <p><span className="font-semibold">Email: </span>{selectedOrg?.email}</p>
                        {selectedOrg?.category && <p><span className="font-semibold">Category: </span>{selectedOrg.category}</p>}
                        {selectedOrg?.description && <p><span className="font-semibold">Description: </span>{selectedOrg.description}</p>}
                        <p><span className="font-semibold">Reset Request: </span>{selectedOrg?.resetRequest?.reason || "None"}</p>
                        <div className="border-t pt-3">
                            <Button

                                size="sm"
                                onClick={() => handleDelete(selectedOrg._id)}
                            >
                                Delete Organizer
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default ManageClubs;
