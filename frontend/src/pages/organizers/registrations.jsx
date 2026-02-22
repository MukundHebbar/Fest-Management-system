import { useState, useEffect } from 'react';
import axiosInstance from '../../api/axios';
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
import { ScrollArea } from '@/components/ui/scroll-area';

const RegistrationsList = ({ eventId }) => {
    const [registrations, setRegistrations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedRegId, setSelectedRegId] = useState(null);
    const [details, setDetails] = useState(null);
    const [loadingDetails, setLoadingDetails] = useState(false);

    useEffect(() => {
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

        if (eventId) fetchRegistrations();
    }, [eventId]);

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

    const handleDownload = (fileId) => {
        // Direct download link

        window.open(`http://localhost:5000/api/organizers/registrations/file/${fileId}`, '_blank');
    };

    if (loading) return <div>Loading registrations...</div>;

    const handleCsvDownload = () => {
        window.open(`http://localhost:5000/api/organizers/events/${eventId}/registrations/csv`, '_blank');
    };

    return (
        <div className="mt-8">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold">Registrations ({registrations.length})</h2>
                <Button  size="sm" onClick={handleCsvDownload}>
                    Download CSV
                </Button>
            </div>
            <div className="border rounded-md">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Participant</TableHead>
                            <TableHead>Ticket ID</TableHead>
                            <TableHead>Registered At</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {registrations.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={3} className="text-center h-24 text-muted-foreground">
                                    No registrations yet.
                                </TableCell>
                            </TableRow>
                        ) : (
                            registrations.map((reg) => (
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
