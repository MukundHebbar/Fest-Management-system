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

            {events.length === 0 ? null : (
                <div className="flex flex-wrap gap-4">
                    {events.map(event => (
                        <Card
                            key={event._id}
                            className="cursor-pointer"
                            onClick={() => navigate(`/organizer/event/${event._id}`)}
                        >
                            <CardHeader className="flex flex-row justify-between pb-2">
                                <CardTitle className="text-xl truncate">
                                    {event.name}
                                </CardTitle>
                                <Badge>
                                    {event.status}
                                </Badge>
                            </CardHeader>
                            <CardContent>
                                <div className="text-sm">{event.eventType}</div>
                                <CardDescription>{event.description}</CardDescription>
                            </CardContent>
                            <CardFooter className="text-xs justify-between">
                                <div>{event.startDate && new Date(event.startDate).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</div>
                                <div>{event.registrationFee === 0 ? 'Free' : `₹${event.registrationFee}`}</div>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
};

export default OrganizerDashboard;
