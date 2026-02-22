import { useState } from 'react';
import { Scanner } from '@yudiel/react-qr-scanner';
import axiosInstance from '../../api/axios';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const QrAttendance = ({ eventId }) => {
    const [scannerOpen, setScannerOpen] = useState(false);
    const [status, setStatus] = useState(null); // { type: 'success' | 'error', message: string }
    const [manualTicket, setManualTicket] = useState('');

    const markAttendance = async (ticketId) => {
        setStatus(null);
        try {
            const res = await axiosInstance.patch(`/organizers/events/${eventId}/attend-ticket/${ticketId.trim()}`, { action: true });
            const reg = res.data;
            const name = reg.participantId
                ? `${reg.participantId.firstName} ${reg.participantId.lastName}`
                : 'Participant';
            setStatus({ type: 'success', message: `${name} marked as attended (${reg.ticketId})` });
        } catch (error) {
            setStatus({ type: 'error', message: error.response?.data?.error || 'Failed to mark attendance' });
        }
    };

    const handleScan = (result) => {
        if (result?.[0]?.rawValue) {
            setScannerOpen(false);
            markAttendance(result[0].rawValue);
        }
    };

    const handleManualSubmit = () => {
        if (manualTicket.trim()) {
            markAttendance(manualTicket);
            setManualTicket('');
        }
    };

    return (
        <div className="mt-6 border rounded-md p-4 space-y-3">
            <h3 className="font-semibold text-lg">Attendance Scanner</h3>

            <div className="flex gap-2">
                <Button size="sm" onClick={() => { setScannerOpen(true); setStatus(null); }}>
                    Scan QR
                </Button>
            </div>

            {/* Manual ticket input */}
            <div className="flex gap-2 items-end">
                <div className="space-y-1 flex-1">
                    <Label>Ticket ID</Label>
                    <Input
                        value={manualTicket}
                        onChange={(e) => setManualTicket(e.target.value)}
                        placeholder="Enter ticket ID manually"
                        maxLength={6}
                    />
                </div>
                <Button size="sm" onClick={handleManualSubmit}>
                    Mark Attended
                </Button>
            </div>

            {/* Status message */}
            {status && (
                <p className={`text-sm font-medium ${status.type === 'success' ? 'text-green-600' : 'text-red-500'}`}>
                    {status.message}
                </p>
            )}

            {/* Scanner dialog */}
            <Dialog open={scannerOpen} onOpenChange={setScannerOpen}>
                <DialogContent className="sm:max-w-[400px]">
                    <DialogHeader>
                        <DialogTitle>Scan QR Code</DialogTitle>
                    </DialogHeader>
                    <div className="w-full">
                        <Scanner onScan={handleScan} />
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default QrAttendance;
