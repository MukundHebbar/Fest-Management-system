import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { Badge } from '@/components/ui/badge';

const OrganizerDashboard = () => {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchEvents = async () => {
            try {
                // Fetch events for the logged-in organizer
                const res = await axiosInstance.get('/organizers/events');
                setEvents(res.data);
                setLoading(false);
            } catch (err) {
                console.error("Failed to fetch events", err);
                setError("Failed to load events. Please try again.");
                setLoading(false);
            }
        };

        fetchEvents();
    }, []);

    const getStatusVariant = (status) => {
        switch (status?.toLowerCase()) {
            case 'published': return 'default';
            case 'ongoing': return 'secondary';
            case 'closed': return 'destructive';
            default: return 'outline'; // Draft
        }
    };

    if (loading) return <div className="p-8 text-center text-muted-foreground">Loading events...</div>;
    if (error) return <div className="p-8 text-center text-red-500">{error}</div>;

    return (
        <div className="container mx-auto py-8 space-y-8">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold tracking-tight">Dashboard - Events</h1>
                <Button onClick={() => navigate('/organizer/create')}>
                    Create Event
                </Button>
            </div>

            {events.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                    <p>No events found. Start by creating a draft!</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {events.map(event => (
                        <Card
                            key={event._id}
                            className="h-full flex flex-col hover:shadow-md transition-shadow cursor-pointer"
                            onClick={() => navigate(`/organizer/event/${event._id}`)}
                        >
                            <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                                <CardTitle className="text-xl font-bold truncate pr-2 leading-tight" title={event.name}>
                                    {event.name}
                                </CardTitle>
                                <Badge variant={getStatusVariant(event.status)} className="whitespace-nowrap ml-2">
                                    {event.status}
                                </Badge>
                            </CardHeader>
                            <CardContent className="flex-grow space-y-2">
                                <div className="text-sm">
                                    <span className="font-semibold text-muted-foreground">Type: </span>
                                    {event.eventType}
                                </div>
                                <CardDescription className="line-clamp-3">
                                    {event.description || "No description provided."}
                                </CardDescription>
                            </CardContent>
                            <CardFooter className="text-xs text-muted-foreground justify-between mt-auto pt-4 border-t">
                                <div>
                                    {event.startDate && new Date(event.startDate).toLocaleDateString()}
                                </div>
                                <div className="font-medium">
                                    {event.registrationFee === 0 ? 'Free' : `₹${event.registrationFee}`}
                                </div>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
};

export default OrganizerDashboard;
