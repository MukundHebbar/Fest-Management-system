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
import { CalendarIcon, TagIcon } from 'lucide-react';

const AdminEventDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [event, setEvent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchEvent = async () => {
            try {
                const res = await axiosInstance.get(`/admin/events/${id}`);
                setEvent(res.data);
                setLoading(false);
            } catch (err) {
                console.error("Failed to fetch event", err);
                setError("Failed to load event details.");
                setLoading(false);
            }
        };
        fetchEvent();
    }, [id]);

    if (loading) return <div>Loading...</div>;
    if (error) return <div className="text-red-500">{error}</div>;
    if (!event) return <div>Event not found</div>;

    const formatDate = (date) => date ? new Date(date).toLocaleDateString() : 'TBA';

    return (
        <div className="container mx-auto p-4 max-w-3xl">
            <Button onClick={() => navigate('/admin/dashboard')} className="mb-4">
                &larr; Back to Events
            </Button>

            <Card>
                <CardHeader>
                    <div className="flex justify-between items-start gap-4">
                        <div>
                            <CardTitle className="text-2xl font-bold">{event.name}</CardTitle>
                            <CardDescription className="text-lg">
                                by {event.organizer?.name}
                            </CardDescription>
                        </div>
                        <Badge variant={event.status === 'Published' ? 'default' : 'secondary'}>
                            {event.status}
                        </Badge>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex gap-2 text-sm">
                        <Badge variant="secondary">
                            {event.eventType === 'merchandise' ? 'Merchandise' : 'Standard Event'}
                        </Badge>
                        <Badge variant="secondary">
                            {event.registrationFee === 0 ? 'Free' : `₹${event.registrationFee}`}
                        </Badge>
                        {event.eligibility === 'Y' && (
                            <Badge variant="outline">IIIT Only</Badge>
                        )}
                    </div>

                    <div className="flex items-start gap-2 text-muted-foreground">
                        <CalendarIcon className="h-5 w-5 mt-0.5" />
                        <div className="flex flex-col">
                            <span>Starts: {formatDate(event.startDate)}</span>
                            {event.endDate && <span>Ends: {formatDate(event.endDate)}</span>}
                        </div>
                    </div>

                    {event.description && (
                        <div>
                            <h3 className="font-semibold mb-2">Description</h3>
                            <p className="whitespace-pre-wrap">{event.description}</p>
                        </div>
                    )}

                    {/* Merchandise Info (view only) */}
                    {event.eventType === 'merchandise' && event.merchandise?.items?.variants?.length > 0 && (
                        <div className="space-y-2">
                            <h4 className="font-semibold">{event.merchandise.items?.name || 'Merchandise'} Variants:</h4>
                            <div className="space-y-1 text-sm">
                                {event.merchandise.items.variants.map((variant, idx) => (
                                    <p key={idx}>
                                        {variant.size} - {variant.color}
                                        {` (${variant.stock} in stock)`}
                                    </p>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Registration Form Info (view only) */}
                    {event.eventType === 'normal' && event.registrationForm?.length > 0 && (
                        <div className="space-y-2 border-t pt-4">
                            <h3 className="font-semibold">Registration Form Fields</h3>
                            <ul className="list-disc pl-5 text-sm space-y-1">
                                {event.registrationForm.map((field, index) => (
                                    <li key={index}>
                                        {field.label} ({field.type}){field.required && <span className="text-red-500"> *</span>}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {event.tags && event.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 pt-2">
                            {event.tags.map((tag, i) => (
                                <Badge key={i} className="text-xs">
                                    <TagIcon className="h-3 w-3 mr-1" />{tag}
                                </Badge>
                            ))}
                        </div>
                    )}
                </CardContent>
                <CardFooter className="flex-col items-start gap-2 border-t pt-6">
                    {event.registrationDeadline && (
                        <p className="text-sm text-muted-foreground">
                            Registration deadline: {formatDate(event.registrationDeadline)}
                        </p>
                    )}
                    {event.registrationLimit && (
                        <p className="text-sm text-muted-foreground">
                            Registrations: {event.registeredCount || 0} / {event.registrationLimit}
                        </p>
                    )}
                </CardFooter>
            </Card>
        </div>
    );
};

export default AdminEventDetail;
