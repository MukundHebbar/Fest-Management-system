import { useState, useEffect } from 'react';
import axiosInstance from '../../api/axios';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const PasswordReset = () => {
    const [organizers, setOrganizers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedOrg, setSelectedOrg] = useState(null);
    const [resetResult, setResetResult] = useState(null);
    const [resetting, setResetting] = useState(false);

    useEffect(() => {
        fetchRequests();
    }, []);

    const fetchRequests = async () => {
        try {
            const res = await axiosInstance.get('/admin/resetRequests');
            setOrganizers(res.data);
            setLoading(false);
        } catch (err) {
            console.error("Failed to fetch reset requests", err);
            setError("Failed to load reset requests.");
            setLoading(false);
        }
    };

    const handleReset = async (orgId) => {
        setResetting(true);
        setResetResult(null);
        try {
            const res = await axiosInstance.get(`/admin/${orgId}/reset`);
            setResetResult(res.data);
            setOrganizers(prev => prev.filter(o => o._id !== orgId));
            setSelectedOrg(null);
        } catch (err) {
            console.error("Failed to reset password", err);
            setResetResult({ error: err.response?.data?.error || "Reset failed" });
        } finally {
            setResetting(false);
        }
    };

    const handleReject = async (orgId) => {
        setResetting(true);
        setResetResult(null);
        try {
            await axiosInstance.patch(`/admin/${orgId}/reject`);
            setResetResult({ message: "Request rejected" });
            setOrganizers(prev => prev.filter(o => o._id !== orgId));
            setSelectedOrg(null);
        } catch (err) {
            console.error("Failed to reject request", err);
            setResetResult({ error: err.response?.data?.error || "Reject failed" });
        } finally {
            setResetting(false);
        }
    };

    if (loading) return <div className="p-8 text-center text-muted-foreground">Loading reset requests...</div>;
    if (error) return <div className="p-8 text-center text-red-500">{error}</div>;

    return (
        <div className="container mx-auto py-8 space-y-8">
            <h1 className="text-3xl font-bold tracking-tight">Password Reset Requests</h1>

            {resetResult && (
                <Card className={resetResult.error ? "border-red-300" : "border-green-300"}>
                    <CardContent className="pt-4">
                        {resetResult.error ? (
                            <p className="text-red-500">{resetResult.error}</p>
                        ) : (
                            <div>
                                <p className="text-green-600 font-semibold">{resetResult.message}</p>
                                {resetResult.newPassword && (
                                    <p className="text-sm mt-1">New Password: <code className="bg-gray-100 px-2 py-1 rounded">{resetResult.newPassword}</code></p>
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}

            {organizers.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                    <p>No pending password reset requests.</p>
                </div>
            ) : (
                <div className="flex flex-wrap gap-4">
                    {organizers.map(org => (
                        <Card
                            key={org._id}
                            className={`cursor-pointer hover:shadow-md transition-shadow ${selectedOrg?._id === org._id ? 'ring-2 ring-primary' : ''}`}
                            onClick={() => setSelectedOrg(org)}
                        >
                            <CardHeader>
                                <CardTitle className="text-lg">{org.name}</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-1 text-sm">
                                <p><span className="font-semibold text-muted-foreground">Email: </span>{org.email}</p>
                                {org.category && <p><span className="font-semibold text-muted-foreground">Category: </span>{org.category}</p>}
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {selectedOrg && (
                <Card className="mt-6">
                    <CardHeader>
                        <CardTitle>Reset Request — {selectedOrg.name}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <p><span className="font-semibold">Email: </span>{selectedOrg.email}</p>
                        {selectedOrg.description && <p><span className="font-semibold">Description: </span>{selectedOrg.description}</p>}
                        {selectedOrg.category && <p><span className="font-semibold">Category: </span>{selectedOrg.category}</p>}
                        <div className="border-t pt-3">
                            <p className="font-semibold">Reason for reset:</p>
                            <p className="mt-1 text-muted-foreground">{selectedOrg.resetRequest?.reason}</p>
                        </div>
                        <div className="flex gap-2">
                            <Button
                                onClick={() => handleReset(selectedOrg._id)}
                                disabled={resetting}
                            >
                                {resetting ? "Processing..." : "Approve & Reset"}
                            </Button>
                            <Button

                                onClick={() => handleReject(selectedOrg._id)}
                                disabled={resetting}
                            >
                                {resetting ? "Processing..." : "Reject"}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
};

export default PasswordReset;
