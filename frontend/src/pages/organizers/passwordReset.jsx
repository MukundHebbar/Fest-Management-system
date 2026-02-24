import { useState, useEffect } from 'react';
import axiosInstance from '../../api/axios';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';

const OrganizerPasswordReset = () => {
    const [reason, setReason] = useState('');
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [message, setMessage] = useState(null);

    const fetchHistory = async () => {
        try {
            const res = await axiosInstance.get('/organizers/reset/history');
            setHistory(res.data);
        } catch (err) {
            console.error("Failed to fetch reset history", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchHistory();
    }, []);

    const hasPending = history.some(r => r.status === 'Pending');

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!reason.trim()) return;
        setSubmitting(true);
        setMessage(null);
        try {
            const res = await axiosInstance.post('/organizers/reset', { reason: reason.trim() });
            setMessage({ type: 'success', text: res.data.message });
            setReason('');
            fetchHistory();
        } catch (err) {
            setMessage({ type: 'error', text: err.response?.data?.error || 'Failed to submit request' });
        } finally {
            setSubmitting(false);
        }
    };

    const statusBadge = (status) => {
        return <Badge>{status}</Badge>;
    };

    return (
        <div className="container mx-auto py-8 space-y-8 max-w-3xl">
            <h1 className="text-2xl font-bold">Password Reset</h1>


            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Request Password Reset</CardTitle>
                </CardHeader>
                <CardContent>
                    {hasPending ? (
                        <p className="text-sm text-muted-foreground">
                            You have a pending request. Please wait for the admin to review it.
                        </p>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-3">
                            <div className="space-y-1">
                                <Label>Reason</Label>
                                <Input
                                    value={reason}
                                    onChange={(e) => setReason(e.target.value)}
                                    required
                                />
                            </div>
                            <Button type="submit" disabled={submitting || !reason.trim()}>
                                {submitting ? 'Submitting...' : 'Submit Request'}
                            </Button>
                        </form>
                    )}
                    {message && (
                        <p className={`text-sm mt-3 ${message.type === 'success' ? 'text-green-600' : 'text-red-500'}`}>
                            {message.text}
                        </p>
                    )}
                </CardContent>
            </Card>


            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Request History</CardTitle>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <p className="text-sm text-muted-foreground">Loading...</p>
                    ) : history.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No previous requests.</p>
                    ) : (
                        <div className="border rounded-md">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Reason</TableHead>
                                        <TableHead>Status</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {history.map((entry, i) => (
                                        <TableRow key={i}>
                                            <TableCell className="text-sm">
                                                {new Date(entry.requestedAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
                                            </TableCell>
                                            <TableCell className="text-sm">{entry.reason}</TableCell>
                                            <TableCell>{statusBadge(entry.status)}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export default OrganizerPasswordReset;
