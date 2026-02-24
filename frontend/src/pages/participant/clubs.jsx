import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../api/axios';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const Clubs = () => {
    const [clubs, setClubs] = useState([]);
    const [followedIds, setFollowedIds] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [clubsRes, meRes] = await Promise.all([
                    axiosInstance.get('/participants/clubs'),
                    axiosInstance.get('/participants/me')
                ]);
                setClubs(clubsRes.data);
                const followed = (meRes.data.participant?.followingOrganizations || [])
                    .map(o => (o._id || o).toString());
                setFollowedIds(followed);
            } catch (err) {
                console.error("Failed to fetch clubs", err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    if (loading) return <div className="p-8 text-center text-muted-foreground">Loading clubs...</div>;

    return (
        <div className="p-4">
            <h1 className="text-2xl font-bold mb-4">Clubs</h1>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {clubs.length === 0 ? (
                    <p className="text-muted-foreground">No clubs found.</p>
                ) : (
                    clubs.map(club => (
                        <Card
                            key={club._id}
                            className="cursor-pointer hover:shadow-md transition-shadow"
                            onClick={() => navigate(`/clubs/${club._id}`)}
                        >
                            <CardHeader className="pb-2">
                                <div className="flex justify-between items-start">
                                    <CardTitle className="text-lg">{club.name}</CardTitle>
                                    {followedIds.includes(club._id) && (
                                        <Badge>Following</Badge>
                                    )}
                                </div>
                            </CardHeader>
                            <CardContent className="text-sm space-y-1">
                                <p>{club.email}</p>
                                {club.category && <p><span className="font-semibold">Category: </span>{club.category}</p>}
                                {club.description && <p className="truncate">{club.description}</p>}
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
};

export default Clubs;
