import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../api/axios';
import Fuse from 'fuse.js';
import { Input } from '@/components/ui/input';
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
import { Checkbox } from '@/components/ui/checkbox';

const ParticipantEvents = () => {
    const [events, setEvents] = useState([]);
    const [filteredEvents, setFilteredEvents] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [followingOrgs, setFollowingOrgs] = useState([]);

    // Filter States
    const [filterType, setFilterType] = useState('all');
    const [filterEligibility, setFilterEligibility] = useState('all');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [showFollowedOnly, setShowFollowedOnly] = useState(false);

    const navigate = useNavigate();

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [eventsRes, meRes] = await Promise.all([
                    axiosInstance.get('/participants/events'),
                    axiosInstance.get('/participants/me')
                ]);

                setEvents(eventsRes.data);
                setFilteredEvents(eventsRes.data);

                // Extract followed organization IDs as strings for comparison
                const followed = (meRes.data.participant?.followingOrganizations || [])
                    .map(o => (o._id || o).toString());
                setFollowingOrgs(followed);

                setLoading(false);
            } catch (err) {
                console.error("Failed to fetch data", err);
                setError("Failed to load events.");
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    useEffect(() => {
        let result = events;

        // 1. Fuse.js Search
        if (searchQuery.trim()) {
            const fuse = new Fuse(events, {
                keys: ['name', 'organizer.name', 'description', 'tags'],
                threshold: 0.4,
            });
            result = fuse.search(searchQuery).map(res => res.item);
        }

        // 2. Filter by Type
        if (filterType !== 'all') {
            if (filterType === 'merchandise') {
                result = result.filter(e => e.eventType === 'merchandise');
            } else if (filterType === 'normal') {
                result = result.filter(e => e.eventType === 'normal');
            }
        }

        // 3. Filter by Eligibility
        if (filterEligibility !== 'all') {
            if (filterEligibility === 'iiith') {
                result = result.filter(e => e.eligibility === 'Y');
            } else if (filterEligibility === 'open') {
                result = result.filter(e => e.eligibility !== 'Y');
            }
        }

        // 4. Filter by Date Range
        if (startDate) {
            result = result.filter(e => e.startDate && new Date(e.startDate) >= new Date(startDate));
        }
        if (endDate) {
            result = result.filter(e => e.startDate && new Date(e.startDate) <= new Date(endDate));
        }

        // 5. Filter by Followed Clubs
        if (showFollowedOnly) {
            result = result.filter(e => {
                const orgId = (e.organizer?._id || e.organizer || '').toString();
                return followingOrgs.includes(orgId);
            });
        }

        setFilteredEvents(result);
    }, [searchQuery, events, filterType, filterEligibility, startDate, endDate, showFollowedOnly, followingOrgs]);

    if (loading) return <div className="p-4">Loading...</div>;
    if (error) return <div className="p-4 text-red-500">{error}</div>;

    return (
        <div className="p-4">
            <h1 className="text-2xl font-bold mb-4">Browse Events</h1>

            {/* Minimal Filter Section */}
            <div className="flex flex-wrap gap-4 mb-6 items-end">
                <Input
                    className="w-64"
                    placeholder="Search..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />

                <select
                    className="border p-2 rounded"
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                >
                    <option value="all">All Types</option>
                    <option value="normal">Event</option>
                    <option value="merchandise">Merch</option>
                </select>

                <select
                    className="border p-2 rounded"
                    value={filterEligibility}
                    onChange={(e) => setFilterEligibility(e.target.value)}
                >
                    <option value="all">Any Eligibility</option>
                    <option value="iiith">IIIT Only</option>
                    <option value="open">Open</option>
                </select>

                <input
                    type="date"
                    className="border p-2 rounded"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                />

                <input
                    type="date"
                    className="border p-2 rounded"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                />

                <div className="flex items-center gap-2">
                    <Checkbox
                        id="followed"
                        checked={showFollowedOnly}
                        onCheckedChange={(checked) => setShowFollowedOnly(checked)}
                    />
                    <label htmlFor="followed">Followed Only</label>
                </div>

                <Button

                    onClick={() => {
                        setSearchQuery('');
                        setFilterType('all');
                        setFilterEligibility('all');
                        setStartDate('');
                        setEndDate('');
                        setShowFollowedOnly(false);
                    }}
                >
                    Clear
                </Button>
            </div>

            {/* Event List */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredEvents.length === 0 ? (
                    <p>No events found.</p>
                ) : (
                    filteredEvents.map(event => (
                        <Card
                            key={event._id}
                            onClick={() => navigate(`/events/${event._id}`)}
                        >
                            <CardHeader className="pb-2">
                                <div className="flex justify-between">
                                    <CardTitle className="text-lg">{event.name}</CardTitle>
                                    {event.status !== 'Published' && <Badge>{event.status}</Badge>}
                                </div>
                                <CardDescription>by {event.organizer?.name}</CardDescription>
                            </CardHeader>
                            <CardContent className="pb-2">
                                <p className="text-sm truncate mb-2">{event.description}</p>
                                <div className="flex gap-2 text-xs">
                                    <Badge>
                                        {event.eventType === 'merchandise' ? 'Merch' : 'Event'}
                                    </Badge>
                                    <Badge>
                                        {event.registrationFee === 0 ? 'Free' : `₹${event.registrationFee}`}
                                    </Badge>
                                    {event.eligibility === 'Y' && <Badge>IIIT Only</Badge>}
                                </div>
                            </CardContent>
                            <CardFooter className="text-xs text-muted-foreground pt-0">
                                {event.startDate ? new Date(event.startDate).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) : 'Date TBA'}
                            </CardFooter>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
};

export default ParticipantEvents;
