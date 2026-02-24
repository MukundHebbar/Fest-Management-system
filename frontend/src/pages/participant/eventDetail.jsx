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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';


const EventDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [event, setEvent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState('');

    // Merchandise State
    const [selectedVariant, setSelectedVariant] = useState(null);
    // Normal Event Form State
    const [formResponses, setFormResponses] = useState({});
    // Team Event State
    const [teamMode, setTeamMode] = useState('create'); // 'create' or 'join'
    const [teamName, setTeamName] = useState('');
    const [teamCapacity, setTeamCapacity] = useState(2);
    const [teamCode, setTeamCode] = useState('');

    const fetchEvent = async () => {
        try {
            const res = await axiosInstance.get(`/participants/events/${id}`);
            setEvent(res.data);
            setLoading(false);

            // Auto-select first available variant for merchandise
            if (res.data.eventType === 'merchandise' && res.data.merchandise?.items?.variants) {
                const available = res.data.merchandise.items.variants.find(v => v.stock > 0);
                if (available) setSelectedVariant(available);
            }

        } catch (err) {
            console.error("Failed to fetch event", err);
            setError("Failed to load event details.");
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchEvent();
    }, [id]);

    const handleInputChange = (fieldLabel, value) => {
        setFormResponses(prev => ({
            ...prev,
            [fieldLabel]: value
        }));
    };

    const handleCheckboxChange = (fieldLabel, option, checked) => {
        setFormResponses(prev => {
            const current = prev[fieldLabel] || [];
            if (checked) {
                return { ...prev, [fieldLabel]: [...current, option] };
            } else {
                return { ...prev, [fieldLabel]: current.filter(item => item !== option) };
            }
        });
    };

    const handleFileChange = (fieldLabel, file) => {
        setFormResponses(prev => ({
            ...prev,
            [fieldLabel]: file
        }));
    };

    const handleRegister = async () => {
        setError(null);
        setSuccessMessage('');

        if (event.eventType === 'merchandise' && !selectedVariant) {
            setError("Please select a variant to purchase.");
            return;
        }

        try {
            let payload;
            let headers = {};

            if (event.eventType === 'merchandise') {
                payload = {
                    merchandise: {
                        items: {
                            variants: {
                                size: selectedVariant.size,
                                color: selectedVariant.color
                            }
                        }
                    }
                };
            } else {
                // Ensure payload for normal events does not contain 'merchandise'

                if (event.registrationForm && event.registrationForm.length > 0) {
                    const formData = new FormData();

                    // Separate files from other responses
                    const responses = {};

                    Object.keys(formResponses).forEach(key => {
                        const value = formResponses[key];
                        if (value instanceof File) {
                            formData.append(key, value);
                        } else {
                            responses[key] = value;
                        }
                    });

                    // Append non-file responses as a JSON string
                    formData.append('formResponse', JSON.stringify(responses));

                    // Append team data if team event
                    if (event.TeamEvent) {
                        if (teamMode === 'create') {
                            formData.append('createTeam', JSON.stringify({ teamName, capacity: teamCapacity }));
                        } else {
                            formData.append('joinTeam', teamCode);
                        }
                    }

                    payload = formData;
                    headers = { 'Content-Type': 'multipart/form-data' };
                } else {
                    // No registration form, but might still be a team event
                    payload = {};
                    if (event.TeamEvent) {
                        if (teamMode === 'create') {
                            payload.createTeam = { teamName, capacity: teamCapacity };
                        } else {
                            payload.joinTeam = teamCode.trim(' ');
                        }
                    }
                }
            }

            // Double check to ensure no merchandise field leakage if payload is object
            if (payload && !(payload instanceof FormData) && payload.merchandise && event.eventType !== 'merchandise') {
                delete payload.merchandise;
            }

            const response = await axiosInstance.post(`/participants/register/${id}`, payload, { headers });

            let msg = "Successfully registered!";
            if (response.data?.team?.teamCode) {
                msg += ` Team Code: ${response.data.team.teamCode} — share this with your teammates!`;
            }
            setSuccessMessage(msg);

            await fetchEvent();
            setSelectedVariant(null);
            setFormResponses({});
            setTeamName('');
            setTeamCode('');

        } catch (err) {
            console.error("Registration failed", err);
            setError(err.response?.data?.error || "Registration failed. Please try again.");
        }
    };

    if (loading) return <div>Loading...</div>;
    if (!event) return <div>Event not found</div>;

    const isDeadlinePassed = event.registrationDeadline && new Date() > new Date(event.registrationDeadline);
    const isFull = event.registrationLimit && event.registeredCount >= event.registrationLimit;

    let isOutOfStock = false;
    let variants = [];
    if (event.eventType === 'merchandise' && event.merchandise?.items?.variants) {
        variants = event.merchandise.items.variants;
        const totalStock = variants.reduce((acc, curr) => acc + curr.stock, 0);
        isOutOfStock = totalStock <= 0;
    }

    let buttonText = event.eventType === 'merchandise' ? "Buy Item" : "Register";
    let isBlocking = false;

    if (error && !event) return <div className="text-red-500">{error}</div>;

    if (isDeadlinePassed) {
        buttonText = "Deadline Passed";
        isBlocking = true;
    } else if (isFull) {
        buttonText = "Registration Full";
        isBlocking = true;
    } else if (isOutOfStock) {
        buttonText = "Out of Stock";
        isBlocking = true;
    } else if (event.status !== 'Published' && event.status !== 'Ongoing') {
        buttonText = "Not Open";
        isBlocking = true;
    }

    const formatDate = (date) => date ? new Date(date).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) : 'TBA';

    return (
        <div className="container mx-auto p-4 max-w-3xl">
            <Button onClick={() => navigate(-1)} className="mb-4">
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
                        <Badge>
                            {event.status}
                        </Badge>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex gap-2 text-sm">
                        <Badge>
                            {event.eventType === 'merchandise' ? 'Merchandise' : 'Standard Event'}
                        </Badge>
                        <Badge>
                            {event.registrationFee === 0 ? 'Free' : `₹${event.registrationFee}`}
                        </Badge>
                        {event.eligibility === 'Y' && (
                            <Badge>IIIT Only</Badge>
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

                    {/* Team Info for registered participants */}
                    {event.teamInfo && (
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-base">Your Team: {event.teamInfo.teamName}</CardTitle>
                                <CardDescription>Code: {event.teamInfo.teamCode}</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm font-medium mb-1">Members</p>
                                <div className="flex flex-wrap gap-1">
                                    {event.teamInfo.members.map((username, i) => (
                                        <Badge key={i}>{username}</Badge>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Merchandise Selection */}
                    {event.eventType === 'merchandise' && variants.length > 0 && (
                        <div className="space-y-2">
                            <h4 className="font-semibold">Select {event.merchandise.items?.name || 'Item'}:</h4>
                            <select
                                className="w-full p-2 border rounded border-gray-300"
                                onChange={(e) => {
                                    const idx = e.target.value;
                                    if (idx !== "") setSelectedVariant(variants[idx]);
                                    else setSelectedVariant(null);
                                }}
                                value={selectedVariant ? variants.indexOf(selectedVariant) : ""}
                            >
                                <option value="" disabled>Select an option</option>
                                {variants.map((variant, idx) => (
                                    <option key={idx} value={idx} disabled={variant.stock <= 0}>
                                        {variant.size} - {variant.color}
                                        {variant.stock <= 0 ? " (Sold Out)" : ` (${variant.stock} available)`}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    {/* Normal Event Registration Form */}
                    {event.eventType === 'normal' && event.registrationForm && event.registrationForm.length > 0 && (
                        <div className="space-y-4 border-t pt-4">
                            <h3 className="font-semibold text-lg">Registration Form</h3>
                            {event.registrationForm.map((field, index) => (
                                <div key={index} className="space-y-2">
                                    <Label>
                                        {field.label}
                                        {field.required && <span className="text-red-500 ml-1">*</span>}
                                    </Label>

                                    {field.type === 'text' && (
                                        <Input
                                            type="text"
                                            required={field.required}
                                            onChange={(e) => handleInputChange(field.label, e.target.value)}
                                            value={formResponses[field.label] || ''}
                                            placeholder={`Enter ${field.label}`}
                                        />
                                    )}

                                    {field.type === 'dropdown' && (
                                        <select
                                            className="w-full p-2 border rounded border-gray-300 bg-white"
                                            required={field.required}
                                            onChange={(e) => handleInputChange(field.label, e.target.value)}
                                            value={formResponses[field.label] || ''}
                                        >
                                            <option value="" disabled>Select {field.label}</option>
                                            {field.options?.map((opt, i) => (
                                                <option key={i} value={opt}>{opt}</option>
                                            ))}
                                        </select>
                                    )}

                                    {field.type === 'checkbox' && (
                                        <div className="space-y-2">
                                            {field.options?.map((opt, i) => (
                                                <div key={i} className="flex items-center space-x-2">
                                                    <input
                                                        type="checkbox"
                                                        id={`${field.label}-${i}`}
                                                        className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                                        checked={(formResponses[field.label] || []).includes(opt)}
                                                        onChange={(e) => handleCheckboxChange(field.label, opt, e.target.checked)}
                                                    />
                                                    <label htmlFor={`${field.label}-${i}`} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                                        {opt}
                                                    </label>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {field.type === 'file' && (
                                        <Input
                                            type="file"
                                            required={field.required}
                                            onChange={(e) => handleFileChange(field.label, e.target.files[0])}
                                            className="cursor-pointer"
                                        />
                                    )}
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Team Event Section */}
                    {event.eventType === 'normal' && event.TeamEvent && (
                        <div className="space-y-4 border-t pt-4">
                            <h3 className="font-semibold text-lg">Team Registration</h3>
                            <div className="flex gap-2">
                                <Button
                                    type="button"
                                    variant={teamMode === 'create' ? 'default' : 'outline'}
                                    size="sm"
                                    onClick={() => setTeamMode('create')}
                                >
                                    Create Team
                                </Button>
                                <Button
                                    type="button"
                                    size="sm"
                                    onClick={() => setTeamMode('join')}
                                >
                                    Join Team
                                </Button>
                            </div>

                            {teamMode === 'create' && (
                                <div className="space-y-3">
                                    <div className="space-y-2">
                                        <Label>Team Name</Label>
                                        <Input
                                            type="text"
                                            value={teamName}
                                            onChange={(e) => setTeamName(e.target.value)}
                                            placeholder="Enter team name"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Team Capacity (2-5)</Label>
                                        <Input
                                            type="number"
                                            min={2}
                                            max={5}
                                            value={teamCapacity}
                                            onChange={(e) => setTeamCapacity(Number(e.target.value))}
                                        />
                                    </div>
                                </div>
                            )}

                            {teamMode === 'join' && (
                                <div className="space-y-2">
                                    <Label>Team Code</Label>
                                    <Input
                                        type="text"
                                        value={teamCode}
                                        onChange={(e) => setTeamCode(e.target.value)}
                                        placeholder="Enter 6-character team code"
                                        maxLength={7}
                                    />
                                </div>
                            )}
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
                <CardFooter className="flex-col items-start gap-4 border-t pt-6">
                    {event.registrationDeadline && (
                        <p className="text-sm text-muted-foreground">
                            Registration closes on {formatDate(event.registrationDeadline)}
                        </p>
                    )}

                    <div className="w-full space-y-2">
                        {error && <p className="text-sm text-red-500 font-medium">{error}</p>}
                        {successMessage && <p className="text-sm text-green-600 font-medium">{successMessage}</p>}

                        <Button
                            className="w-full md:w-auto"
                            disabled={isBlocking || (event.eventType === 'merchandise' && !selectedVariant)}
                            onClick={handleRegister}
                        >
                            {buttonText}
                        </Button>

                        {isBlocking && (
                            <p className="text-sm text-red-500 mt-2">
                                Currently unavailable: {buttonText}
                            </p>
                        )}
                    </div>
                </CardFooter>
            </Card>


        </div>
    );
};

export default EventDetail;
