import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axiosInstance from '../../api/axios';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';

const ClubInfo = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [club, setClub] = useState(null);
    const [upcomingEvents, setUpcomingEvents] = useState([]);
    const [pastEvents, setPastEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [clubsRes, eventsRes] = await Promise.all([
                    axiosInstance.get('/participants/clubs'),
                    axiosInstance.get('/participants/events')
                ]);

                const foundClub = clubsRes.data.find(c => c._id === id);
                if (!foundClub) {
                    setError("Club not found.");
                    setLoading(false);
                    return;
                }
                setClub(foundClub);

                // Filter events for this club
                const clubEvents = eventsRes.data.filter(e => {
                    const orgId = (e.organizer?._id || e.organizer || '').toString();
                    return orgId === id;
                });

                const now = new Date();
                const upcoming = clubEvents.filter(e => !e.endDate || new Date(e.endDate) >= now);
                const past = clubEvents.filter(e => e.endDate && new Date(e.endDate) < now);

                setUpcomingEvents(upcoming);
                setPastEvents(past);
                setLoading(false);
            } catch (err) {
                console.error("Failed to fetch club info", err);
                setError("Failed to load club information.");
                setLoading(false);
            }
        };
        fetchData();
    }, [id]);

    if (loading) return <div className="p-8 text-center text-muted-foreground">Loading...</div>;
    if (error) return <div className="p-4 text-red-500">{error}</div>;
    if (!club) return <div className="p-4">Club not found</div>;

    const EventCard = ({ event }) => (
        <Card
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => navigate(`/events/${event._id}`)}
        >
            <CardHeader className="pb-2">
                <div className="flex justify-between">
                    <CardTitle className="text-lg">{event.name}</CardTitle>
                    <Badge variant="outline">{event.status}</Badge>
                </div>
            </CardHeader>
            <CardContent className="pb-2">
                <p className="text-sm truncate mb-2">{event.description}</p>
                <div className="flex gap-2 text-xs">
                    <Badge variant="secondary">
                        {event.eventType === 'merchandise' ? 'Merch' : 'Event'}
                    </Badge>
                    <Badge variant="secondary">
                        {event.registrationFee === 0 ? 'Free' : `₹${event.registrationFee}`}
                    </Badge>
                    {event.eligibility === 'Y' && <Badge variant="outline">IIIT Only</Badge>}
                </div>
            </CardContent>
            <CardFooter className="text-xs text-muted-foreground pt-0">
                {event.startDate ? new Date(event.startDate).toLocaleDateString() : 'Date TBA'}
            </CardFooter>
        </Card>
    );

    return (
        <div className="container mx-auto p-4 max-w-4xl">
            <Button onClick={() => navigate('/clubs')} className="mb-4">
                &larr; Back to Clubs
            </Button>

            {/* Club Info Card */}
            <Card className="mb-8">
                <CardHeader>
                    <CardTitle className="text-2xl">{club.name}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                    <p>{club.email}</p>
                    {club.category && <p><span className="font-semibold">Category: </span>{club.category}</p>}
                    {club.description && <p>{club.description}</p>}
                </CardContent>
            </Card>

            {/* Upcoming Events */}
            <h2 className="text-xl font-bold mb-4">Upcoming Events ({upcomingEvents.length})</h2>
            {upcomingEvents.length === 0 ? (
                <p className="text-muted-foreground mb-8">No upcoming events.</p>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 mb-8">
                    {upcomingEvents.map(event => (
                        <EventCard key={event._id} event={event} />
                    ))}
                </div>
            )}

            {/* Past Events */}
            <h2 className="text-xl font-bold mb-4">Past Events ({pastEvents.length})</h2>
            {pastEvents.length === 0 ? (
                <p className="text-muted-foreground">No past events.</p>
            ) : (
                <div className="grid gap-4 md:grid-cols-2">
                    {pastEvents.map(event => (
                        <EventCard key={event._id} event={event} />
                    ))}
                </div>
            )}
        </div>
    );
};

export default ClubInfo;
