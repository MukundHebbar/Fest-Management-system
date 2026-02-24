import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';

import { Checkbox } from '@/components/ui/checkbox';

import RegistrationsList from './registrations';
import QrAttendance from './scanQr';

const MerchandiseSection = ({ control, register, isDraft }) => {
    const { fields: variantFields, append: appendVariant, remove: removeVariant } = useFieldArray({
        control,
        name: "merchandise.items.variants"
    });

    return (
        <div className="space-y-4 rounded-md border p-4 bg-gray-50">
            <h3 className="font-semibold text-lg">Merchandise Configuration</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="item-name">Item Name</Label>
                    <Input
                        id="item-name"
                        disabled={!isDraft}
                        {...register("merchandise.items.name", { required: true })}
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="purchase-limit">Purchase Limit / Participant</Label>
                    <Input
                        type="number"
                        id="purchase-limit"
                        disabled={!isDraft}
                        {...register("merchandise.purchaseLimitPerParticipant")}
                        min={1}
                    />
                </div>
            </div>

            <div className="space-y-2">
                <Label>Variants</Label>
                {variantFields.map((field, index) => (
                    <div key={field.id} className="grid grid-cols-3 gap-2 items-end">
                        <Input
                            disabled={!isDraft}
                            {...register(`merchandise.items.variants.${index}.size`)}
                        />
                        <Input
                            disabled={!isDraft}
                            {...register(`merchandise.items.variants.${index}.color`)}
                        />
                        <div className="flex gap-2">
                            <Input
                                type="number"
                                disabled={!isDraft}
                                {...register(`merchandise.items.variants.${index}.stock`, { valueAsNumber: true })}
                            />
                            {isDraft && (
                                <Button type="button" size="icon" onClick={() => removeVariant(index)}>
                                    X
                                </Button>
                            )}
                        </div>
                    </div>
                ))}
                {isDraft && (
                    <Button type="button" size="sm" onClick={() => appendVariant({ size: '', color: '', stock: 0 })}>
                        + Add Variant
                    </Button>
                )}
            </div>
        </div>
    );
};

const RegistrationFormSection = ({ control, register, isDraft }) => {
    const { fields, append, remove } = useFieldArray({
        control,
        name: "registrationForm"
    });

    return (
        <div className="space-y-4 rounded-md border p-4 bg-gray-50">
            <h3 className="font-semibold text-lg">Registration Form Configuration</h3>


            <div className="space-y-4">
                {fields.map((field, index) => (
                    <div key={field.id} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start border-b pb-4 last:border-0">
                        <div className="md:col-span-4 space-y-2">
                            <Label>Label</Label>
                            <Input
                                disabled={!isDraft}
                                {...register(`registrationForm.${index}.label`, { required: true })}
                            />
                        </div>
                        <div className="md:col-span-3 space-y-2">
                            <Label>Type</Label>
                            <select
                                className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                disabled={!isDraft}
                                {...register(`registrationForm.${index}.type`)}
                            >
                                <option value="text">Text Input</option>
                                <option value="dropdown">Dropdown</option>
                                <option value="checkbox">Checkbox</option>
                                <option value="file">File Upload</option>
                            </select>
                        </div>
                        <div className="md:col-span-4 space-y-2">
                            <Label>Options (comma separated)</Label>
                            <Input
                                disabled={!isDraft}
                                {...register(`registrationForm.${index}.options`)}
                            />

                        </div>

                        <div className="md:col-span-1 flex items-center justify-center h-full pt-6">
                            {isDraft && (
                                <Button type="button" variant="ghost" size="icon" className="text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => remove(index)}>
                                    X
                                </Button>
                            )}
                        </div>
                        <div className="md:col-span-12 flex items-center space-x-2">
                            <input
                                type="checkbox"
                                id={`req-${index}`}
                                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                disabled={!isDraft}
                                {...register(`registrationForm.${index}.required`)}
                            />
                            <Label htmlFor={`req-${index}`} className="text-sm font-normal cursor-pointer">Required Field</Label>
                        </div>
                    </div>
                ))}
            </div>

            {isDraft && (
                <Button
                    type="button"
                    size="sm"
                    onClick={() => append({ label: '', type: 'text', required: false, options: '' })}
                >
                    + Add Field
                </Button>
            )}
        </div>
    );
};

const EventCard = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [event, setEvent] = useState(null);
    const [loading, setLoading] = useState(id); // Only load if editing
    const [error, setError] = useState(null);
    const [successMsg, setSuccessMsg] = useState(null);

    // Check if we are in "Create" mode
    const isCreateMode = !id;

    const { register, control, handleSubmit, reset, setValue, watch, formState: { isSubmitting } } = useForm({
        defaultValues: {
            name: '',
            description: '',
            eventType: 'normal',
            startDate: '',
            endDate: '',
            registrationFee: 0,
            registrationLimit: '',
            registrationDeadline: '',
            eligibility: false, // Default to false (N)
            TeamEvent: false,
            closeRegistration: false,
            registrationForm: [], // For normal events
            merchandise: {
                items: {
                    name: '',
                    variants: []
                },
                purchaseLimitPerParticipant: 1
            },
            tags: ''
        }
    });


    // Watch status to handle conditional disabling and validation
    // In create mode, we treat it as a "Draft" effectively (everything editable)
    const status = isCreateMode ? 'Draft' : event?.status;
    const isDraft = status === 'Draft';
    const isPublished = status === 'Published';
    const eventType = watch('eventType');

    useEffect(() => {
        if (isCreateMode) return;

        const fetchEvent = async () => {
            try {
                // Fetch event details using the stats endpoint
                const res = await axiosInstance.get(`/organizers/events/${id}/stats`);
                const foundEvent = res.data;

                if (foundEvent) {
                    setEvent(foundEvent);
                    // Reset form with fetched data
                    reset({
                        ...foundEvent,
                        startDate: foundEvent.startDate ? new Date(foundEvent.startDate).toISOString().split('T')[0] : '',
                        endDate: foundEvent.endDate ? new Date(foundEvent.endDate).toISOString().split('T')[0] : '',
                        registrationDeadline: foundEvent.registrationDeadline ? new Date(foundEvent.registrationDeadline).toISOString().split('T')[0] : '',
                        eligibility: foundEvent.eligibility === 'Y', // Convert 'Y'/'N' to boolean
                        TeamEvent: foundEvent.TeamEvent || false,
                        merchandise: foundEvent.merchandise || { items: { name: '', variants: [] }, purchaseLimitPerParticipant: 1 },
                        // If options come as array, join them for display.
                        registrationForm: foundEvent.registrationForm?.map(f => ({
                            ...f,
                            options: Array.isArray(f.options) ? f.options.join(', ') : f.options
                        })) || [],
                        tags: Array.isArray(foundEvent.tags) ? foundEvent.tags.join(', ') : (foundEvent.tags || '')
                    });
                } else {
                    setError("Event not found.");
                }
                setLoading(false);
            } catch (err) {
                console.error("Failed to fetch event details", err);
                setError("Failed to load event details.");
                setLoading(false);
            }
        };
        fetchEvent();
    }, [id, reset, isCreateMode]);

    const onSubmit = async (data) => {
        setError(null);
        setSuccessMsg(null);
        try {
            // Process tags back to array and eligibility back to string
            const payload = {
                ...data,
                eligibility: data.eligibility ? 'Y' : 'N',
                tags: data.tags.split(',').map(t => t.trim()).filter(Boolean),
                // Process registration form options: string -> array
                registrationForm: data.registrationForm?.map(f => ({
                    ...f,
                    options: typeof f.options === 'string' ? f.options.split(',').map(o => o.trim()).filter(Boolean) : f.options
                })) || []
            };

            if (isCreateMode) {
                // Create new event: POST /organizers/events
                // According to organizer.routes.js: router.post("/events", createEvent);
                await axiosInstance.post('/organizers/events', payload);
                setSuccessMsg("Event created successfully!");
                // Optionally redirect to dashboard or the new event's edit page
                setTimeout(() => navigate('/organizer/dashboard'), 1500);
            } else {
                // Update existing event: PUT /organizers/events/:id
                await axiosInstance.put(`/organizers/events/${id}`, payload);
                setSuccessMsg("Event saved successfully!");
                // Update local event state
                setEvent(prev => ({ ...prev, ...payload }));
            }

        } catch (err) {
            console.error("Failed to save event", err);
            setError(err.response?.data?.error || "Failed to save event.");
        }
    };

    const handlePublish = async () => {
        if (isCreateMode) return; // Cannot publish before creating

        setError(null);
        setSuccessMsg(null);
        try {
            await axiosInstance.post(`/organizers/events/${id}/publish`);
            setSuccessMsg("Event published successfully!");

            // Refresh event state
            const res = await axiosInstance.get(`/organizers/events/${id}/stats`);
            if (res.data) {
                setEvent(res.data);
            }
        } catch (err) {
            console.error("Failed to publish event", err);
            setError(err.response?.data?.error || "Failed to publish event. Check minimal requirements.");
        }
    };

    // const getStatusVariant = (status) => {
    //     switch (status?.toLowerCase()) {
    //         case 'published': return 'default';
    //         case 'ongoing': return 'secondary';
    //         case 'closed': return 'destructive';
    //         default: return 'outline';
    //     }
    // };

    if (loading) return <div className="p-8 text-center text-muted-foreground">Loading event details...</div>;
    if (error && !event && !isCreateMode) return <div className="p-8 text-center text-red-500">{error}</div>;

    return (
        <div className="container mx-auto max-w-4xl py-8 space-y-6">


            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold tracking-tight">
                    {isCreateMode ? 'Create New Event' : 'Manage Event'}
                </h1>
                {!isCreateMode && (
                    <Badge variant="outline" className="text-lg px-4 py-1">
                        {event?.status}
                    </Badge>
                )}
            </div>

            {successMsg && <div className="p-4 bg-green-100 text-green-700 rounded-md">{successMsg}</div>}
            {error && <div className="p-4 bg-red-100 text-red-700 rounded-md">{error}</div>}

            <Card>
                <form onSubmit={handleSubmit(onSubmit)}>
                    <CardHeader>
                        <CardTitle>Event Details</CardTitle>

                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label htmlFor="name">Event Name</Label>
                                <Input
                                    id="name"
                                    disabled={!isDraft}
                                    {...register("name", { required: true })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="eventType">Event Type</Label>
                                <select
                                    id="eventType"
                                    disabled={!isDraft}
                                    {...register("eventType")}
                                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    <option value="normal">Normal</option>
                                    <option value="merchandise">Merchandise</option>
                                </select>
                            </div>
                        </div>


                        <div className="space-y-2">
                            <Label htmlFor="description">Description</Label>
                            <Textarea
                                id="description"
                                rows={5}
                                {...register("description")}
                            />
                        </div>

                        {eventType === 'normal' && (
                            <RegistrationFormSection control={control} register={register} isDraft={isDraft} />
                        )}

                        {eventType === 'normal' && (
                            <div className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                                <Controller
                                    name="TeamEvent"
                                    control={control}
                                    render={({ field }) => (
                                        <Checkbox
                                            checked={field.value}
                                            onCheckedChange={field.onChange}
                                            disabled={!isDraft}
                                            id="TeamEvent"
                                        />
                                    )}
                                />
                                <div className="space-y-1 leading-none">
                                    <Label htmlFor="TeamEvent">
                                        Team Event
                                    </Label>

                                </div>
                            </div>
                        )}

                        {eventType === 'merchandise' && (
                            <MerchandiseSection control={control} register={register} isDraft={isDraft} />
                        )}

                        <div className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                            <Controller
                                name="eligibility"
                                control={control}
                                render={({ field }) => (
                                    <Checkbox
                                        checked={field.value}
                                        onCheckedChange={field.onChange}
                                        disabled={!isDraft}
                                        id="eligibility"
                                    />
                                )}
                            />
                            <div className="space-y-1 leading-none">
                                <Label htmlFor="eligibility">
                                    IIITH Student Only?
                                </Label>

                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label htmlFor="startDate">Start Date</Label>
                                <Input
                                    type="date"
                                    id="startDate"
                                    disabled={!isDraft}
                                    {...register("startDate")}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="endDate">End Date</Label>
                                <Input
                                    type="date"
                                    id="endDate"
                                    disabled={!isDraft}
                                    {...register("endDate")}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="space-y-2">
                                <Label htmlFor="registrationFee">Registration Fee (₹)</Label>
                                <Input
                                    type="number"
                                    id="registrationFee"
                                    disabled={!isDraft}
                                    {...register("registrationFee")}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="registrationLimit">Registration Limit</Label>
                                <Input
                                    type="number"
                                    id="registrationLimit"
                                    {...register("registrationLimit")}
                                    min={event?.registrationLimit}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="registrationDeadline">Registration Deadline</Label>
                                <Input
                                    type="date"
                                    id="registrationDeadline"
                                    {...register("registrationDeadline")}
                                    min={isPublished ? new Date().toISOString().split('T')[0] : undefined}
                                />
                            </div>
                        </div>

                        {isPublished && (
                            <div className="flex items-center space-x-2 mt-4">
                                <input
                                    type="checkbox"
                                    id="closeRegistration"
                                    {...register("closeRegistration")}
                                />
                                <Label htmlFor="closeRegistration" >
                                    Close Registration
                                </Label>
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label htmlFor="tags">Tags (comma separated)</Label>
                            <Input
                                id="tags"
                                disabled={!isDraft}
                                {...register("tags")}
                            />
                        </div>

                    </CardContent>
                    <CardFooter className="flex justify-between border-t pt-6">
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? "Saving..." : (isCreateMode ? "Create Draft" : "Save Changes")}
                        </Button>

                        {!isCreateMode && isDraft && (
                            <Button type="button" onClick={handlePublish} disabled={isSubmitting}>
                                {isSubmitting ? "Publishing..." : "Publish Event"}
                            </Button>
                        )}
                    </CardFooter>
                </form>
            </Card >
            {!isCreateMode && (
                <div>
                    <QrAttendance eventId={id} />
                    <RegistrationsList eventId={id} />
                </div>
            )}
        </div >
    );
};
export default EventCard;
