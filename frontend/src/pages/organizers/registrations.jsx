import { useState, useEffect, useMemo } from 'react';
import axiosInstance from '../../api/axios';
import Fuse from 'fuse.js';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';

const RegistrationsList = ({ eventId }) => {
    const [registrations, setRegistrations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedRegId, setSelectedRegId] = useState(null);
    const [details, setDetails] = useState(null);
    const [loadingDetails, setLoadingDetails] = useState(false);
    const [attendanceError, setAttendanceError] = useState('');

    const [searchQuery, setSearchQuery] = useState('');
    const [attendanceFilter, setAttendanceFilter] = useState('all'); // 'all' | 'attended' | 'not_attended'

    const fetchRegistrations = async () => {
        try {
            const res = await axiosInstance.get(`/organizers/events/${eventId}/registrations`);
            setRegistrations(res.data);
        } catch (error) {
            console.error("Failed to fetch registrations", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (eventId) fetchRegistrations();
    }, [eventId]);

    // Fuse.js setup for fuzzy search on participant names
    const fuse = useMemo(() => new Fuse(registrations, {
        keys: ['participantId.firstName', 'participantId.lastName'],
        threshold: 0.4,
    }), [registrations]);

    // Filter and search
    const filteredRegistrations = useMemo(() => {
        let results = searchQuery
            ? fuse.search(searchQuery).map(r => r.item)
            : registrations;

        if (attendanceFilter === 'attended') {
            results = results.filter(r => r.attended);
        } else if (attendanceFilter === 'not_attended') {
            results = results.filter(r => !r.attended);
        }

        return results;
    }, [searchQuery, attendanceFilter, registrations, fuse]);

    const handleRowClick = async (regId) => {
        setSelectedRegId(regId);
        setLoadingDetails(true);
        try {
            const res = await axiosInstance.get(`/organizers/registrations/${regId}`);
            setDetails(res.data);
        } catch (error) {
            console.error("Failed to fetch registration details", error);
        } finally {
            setLoadingDetails(false);
        }
    };

    const handleToggleAttendance = async () => {
        if (!details) return;
        setAttendanceError('');
        const newAction = !details.attended;
        try {
            await axiosInstance.patch(`/organizers/events/attend/${details._id}/${newAction}`);
            setDetails({ ...details, attended: newAction });
            // Update in the list too
            setRegistrations(prev =>
                prev.map(r => r._id === details._id ? { ...r, attended: newAction } : r)
            );
        } catch (error) {
            console.error("Failed to update attendance", error);
            setAttendanceError(error.response?.data?.error || "Failed to update attendance");
        }
    };

    const handleDownload = (fileId) => {
        window.open(`http://localhost:5000/api/organizers/registrations/file/${fileId}`, '_blank');
    };

    const handleCsvDownload = () => {
        window.open(`http://localhost:5000/api/organizers/events/${eventId}/registrations/csv`, '_blank');
    };

    if (loading) return <div>Loading registrations...</div>;

    return (
        <div className="mt-8">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold">Registrations ({registrations.length})</h2>
                <Button size="sm" onClick={handleCsvDownload}>
                    Download CSV
                </Button>
            </div>

            {/* Search and Filter */}
            <div className="flex gap-2 mb-4">
                <Input
                    placeholder="Search participants..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="max-w-xs"
                />
                <Button
                    size="sm"
                    onClick={() => setAttendanceFilter('all')}
                >
                    All
                </Button>
                <Button
                    size="sm"
                    onClick={() => setAttendanceFilter('attended')}
                >
                    Attended
                </Button>
                <Button
                    size="sm"
                    onClick={() => setAttendanceFilter('not_attended')}
                >
                    Not Attended
                </Button>
            </div>

            <div className="border rounded-md">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Participant</TableHead>
                            <TableHead>Ticket ID</TableHead>
                            <TableHead>Registered At</TableHead>
                            <TableHead>Attendance</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredRegistrations.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={4} className="text-center h-24 text-muted-foreground">
                                    No registrations found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredRegistrations.map((reg) => (
                                <TableRow
                                    key={reg._id}
                                    className="cursor-pointer hover:bg-muted/50"
                                    onClick={() => handleRowClick(reg._id)}
                                >
                                    <TableCell className="font-medium">
                                        {reg.participantId?.firstName} {reg.participantId?.lastName}
                                        <div className="text-xs text-muted-foreground">{reg.participantId?.email}</div>
                                    </TableCell>
                                    <TableCell className="font-mono">{reg.ticketId}</TableCell>
                                    <TableCell>{new Date(reg.createdAt).toLocaleDateString()}</TableCell>
                                    <TableCell>
                                        <Badge variant={reg.attended ? 'default' : 'secondary'}>
                                            {reg.attended ? 'Attended' : 'Absent'}
                                        </Badge>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            <Dialog open={!!selectedRegId} onOpenChange={(open) => !open && setSelectedRegId(null)}>
                <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                        <DialogTitle>Registration Details</DialogTitle>
                    </DialogHeader>
                    {loadingDetails ? (
                        <div className="py-8 text-center">Loading details...</div>
                    ) : details ? (
                        <ScrollArea className="max-h-[60vh]">
                            <div className="space-y-4 pr-4">
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <span className="font-semibold block">Ticket ID</span>
                                        <span className="font-mono">{details.ticketId}</span>
                                    </div>
                                    <div>
                                        <span className="font-semibold block">Date</span>
                                        <span>{new Date(details.createdAt).toLocaleString()}</span>
                                    </div>
                                </div>

                                {/* Attendance toggle */}
                                <div className="flex items-center justify-between border rounded-md p-3">
                                    <div>
                                        <span className="font-semibold text-sm">Attendance</span>
                                        <Badge variant={details.attended ? 'default' : 'secondary'} className="ml-2">
                                            {details.attended ? 'Attended' : 'Absent'}
                                        </Badge>
                                    </div>
                                    <Button
                                        size="sm"
                                        variant={details.attended ? 'outline' : 'default'}
                                        onClick={handleToggleAttendance}
                                    >
                                        {details.attended ? 'Mark Unattended' : 'Mark Attended'}
                                    </Button>
                                </div>
                                {attendanceError && (
                                    <p className="text-sm text-red-500">{attendanceError}</p>
                                )}

                                {details.eventType === 'merchandise' && details.merchandise?.items && (
                                    <div className="border p-4 rounded-md bg-muted/20">
                                        <h3 className="font-semibold mb-2">Merchandise Order</h3>
                                        <div className="grid grid-cols-2 gap-2 text-sm">
                                            <div><span className="text-muted-foreground">Item:</span> {details.merchandise.items.name}</div>
                                            <div><span className="text-muted-foreground">Size:</span> {details.merchandise.items.variants.size}</div>
                                            <div><span className="text-muted-foreground">Color:</span> {details.merchandise.items.variants.color}</div>
                                        </div>
                                    </div>
                                )}

                                {details.eventType === 'normal' && details.EventId?.registrationForm && (
                                    <div className="space-y-3">
                                        <h3 className="font-semibold border-b pb-2">Form Responses</h3>
                                        {details.EventId.registrationForm.map((field) => {
                                            const label = field.label;
                                            const value = details.formResponse[label];
                                            const isFile = field.type === 'file';

                                            return (
                                                <div key={label} className="text-sm">
                                                    <span className="font-medium text-muted-foreground block mb-1">{label}</span>
                                                    <div className="p-2 bg-muted/30 rounded border flex items-center justify-between">
                                                        {isFile ? (
                                                            value ? (
                                                                <>
                                                                    <span className="truncate mr-2 font-mono text-xs text-muted-foreground">File ID: {value}</span>
                                                                    <Button
                                                                        variant="outline"
                                                                        size="sm"
                                                                        className="h-7 text-xs"
                                                                        onClick={() => handleDownload(value)}
                                                                    >
                                                                        Download File
                                                                    </Button>
                                                                </>
                                                            ) : <span className="text-muted-foreground italic">No file uploaded</span>
                                                        ) : (
                                                            <span className="truncate mr-2">{Array.isArray(value) ? value.join(', ') : (value || '-')}</span>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </ScrollArea>
                    ) : (
                        <div>No details found.</div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default RegistrationsList;
