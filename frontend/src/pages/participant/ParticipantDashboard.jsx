import { useState, useEffect } from 'react';
import axiosInstance from '../../api/axios';
import QRCode from 'react-qr-code'; // Assuming installation is done as per user
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';

const ParticipantDashboard = () => {
    const [registrations, setRegistrations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchRegistrations = async () => {
            try {
                const res = await axiosInstance.get('/participants/registrations');
                setRegistrations(res.data);
                setLoading(false);
            } catch (err) {
                console.error("Failed to fetch registrations", err);
                setError("Failed to load your registrations.");
                setLoading(false);
            }
        };

        fetchRegistrations();
    }, []);

    if (loading) return <div className="p-4">Loading dashboard...</div>;
    if (error) return <div className="p-4 text-red-500">{error}</div>;

    const upcomingEvents = registrations.filter(reg =>
        reg.EventId && (reg.EventId.status === 'Published' || reg.EventId.status === 'Ongoing')
    );

    const pastEvents = registrations.filter(reg =>
        !reg.EventId || (reg.EventId.status !== 'Published' && reg.EventId.status !== 'Ongoing')
    );

    const TicketDialog = ({ registration }) => {
        const event = registration.EventId;
        if (!event) return null;

        return (
            <Dialog>
                <DialogTrigger asChild>
                    <Button  size="sm" className="w-full">
                        View Ticket
                    </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Ticket Details</DialogTitle>
                    </DialogHeader>
                    <div className="flex flex-col items-center space-y-4 py-4">
                        <div className="bg-white p-4 rounded-lg shadow-sm border">
                            {/* QR Code using qrcode.react */}
                            <QRCode value={registration.ticketId} size={150} />
                        </div>
                        <div className="text-center space-y-1">
                            <h3 className="text-lg font-bold">{event.name}</h3>
                            <p className="text-sm text-gray-500">Ticket ID: <span className="font-mono font-semibold">{registration.ticketId}</span></p>
                            <Badge>
                                {event.eventType === 'merchandise' ? 'Merchandise' : 'Event Registration'}
                            </Badge>
                        </div>

                        <div className="w-full text-sm space-y-2 border-t pt-4">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Organizer:</span>
                                <span>{event.organizer?.name}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Date:</span>
                                <span>{event.startDate ? new Date(event.startDate).toLocaleDateString() : 'N/A'}</span>
                            </div>

                            {registration.merchandise?.items && (
                                <div className="mt-2 bg-gray-50 p-2 rounded">
                                    <p className="font-semibold text-xs mb-1">Merchandise:</p>
                                    <div className="flex justify-between text-xs">
                                        <span>{registration.merchandise.items.name}</span>
                                        <span>
                                            {registration.merchandise.items.variants.size} / {registration.merchandise.items.variants.color}
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        );
    };

    const EventCard = ({ registration }) => {
        const event = registration.EventId;
        if (!event) return null; // Handle edge case where event might be deleted

        return (
            <Card>
                <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                        <div>
                            <CardTitle className="text-lg">{event.name}</CardTitle>
                            <CardDescription className="text-xs">
                                Registered on {new Date(registration.createdAt).toLocaleDateString()}
                            </CardDescription>
                        </div>
                        <Badge >{event.status}</Badge>
                    </div>
                </CardHeader>
                <CardContent className="pb-2 text-sm">
                    <p className="truncate mb-2">{event.description}</p>
                    <div className="flex gap-2">
                        {event.eventType === 'merchandise' && <Badge variant="secondary">Merch</Badge>}
                        {registration.merchandise && <Badge >Item Ordered</Badge>}
                    </div>
                </CardContent>
                <CardFooter className="pt-2">
                    <TicketDialog registration={registration} />
                </CardFooter>
            </Card>
        );
    };

    return (
        <div className="p-4 max-w-7xl mx-auto">
            <h1 className="text-2xl font-bold mb-6">My Dashboard</h1>

            <section className="mb-8">
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                    Upcoming & Ongoing
                    <Badge className="ml-2">{upcomingEvents.length}</Badge>
                </h2>
                {upcomingEvents.length === 0 ? (
                    <p className="text-gray-500">No active registrations found.</p>
                ) : (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {upcomingEvents.map(reg => (
                            <EventCard key={reg._id} registration={reg} />
                        ))}
                    </div>
                )}
            </section>

            {pastEvents.length > 0 && (
                <section>
                    <h2 className="text-xl font-semibold mb-4 text-gray-500">History</h2>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 opacity-75">
                        {pastEvents.map(reg => (
                            <EventCard key={reg._id} registration={reg} />
                        ))}
                    </div>
                </section>
            )}
        </div>
    );
};

export default ParticipantDashboard;
