import { useEffect, useState, useCallback } from 'react';
import { ShowcaseCard } from '@/components/ShowcaseCard';
import { Flex, Text, Center, Button, Stack, Breadcrumbs, Space, Loader } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconDatabaseOff, IconCloudOff } from '@tabler/icons-react';
import axiosInstance from '@/utils/axiosInstance';
import { NavLink, Link, useNavigate } from 'react-router-dom';

interface ShowcaseLocation {
    id: number;
    lon: number;
    lat: number;
    description?: string;
    imageLink?: string;
    linkTitle?: string;
    linkAddress?: string;
}

interface ShowcaseSliderImage {
    id: number;
    fileName: string;
    isTeaser: boolean;
}

interface ShowcaseItem {
    id: number;
    title: string;
    description: string;
    youtubeLink?: string;
    datasetId?: number;
    createdAt: string;
    updatedAt: string;
    approvedAt?: string;
    sliderImages: ShowcaseSliderImage[];
    locations?: ShowcaseLocation[];
    user: {
        id: string;
        firstName: string;
        lastName: string;
        photoUrl?: string;
    };
    dataset?: {
        id: number;
        name: string;
    };
}

export function MyShowcasesPage() {
    const [showcases, setShowcases] = useState<ShowcaseItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();

    const breadcrumbs = [
        { label: 'Home', path: '/' },
        { label: 'My Showcases', path: '/my-showcases' },
    ];

    const fetchShowcases = useCallback(() => {
        setLoading(true);
        axiosInstance
            .get('/showcases/user/me')
            .then((response) => {
                setShowcases(response.data);
                setLoading(false);
            })
            .catch((error) => {
                console.error('Error fetching showcases:', error);
                notifications.show({
                    title: 'Error',
                    message: 'Failed to connect to server.',
                    color: 'red',
                });
                setError('Failed to connect to the server. Please check your internet connection.');
                setLoading(false);
            });
    }, []);

    useEffect(() => {
        fetchShowcases();
    }, [fetchShowcases]);

    if (loading) {
        return (
            <Center style={{ height: '80vh' }}>
                <Loader size="lg" color="blue" />
            </Center>
        );
    }

    if (error) {
        return (
            <>
                <Space h="md" />
                <div style={{ paddingLeft: '40px' }}>
                    <Breadcrumbs separator=">">
                        {breadcrumbs.map((crumb) => (
                            <Link to={crumb.path} key={crumb.path} className="breadcrumb-link">
                                {crumb.label}
                            </Link>
                        ))}
                    </Breadcrumbs>
                </div>
                <Text ta="center" size="xl" c="blue">My Showcases</Text>
                <Space h="md" />
                <Center style={{ height: '60vh' }}>
                    <Stack align="center">
                        <IconCloudOff size={64} color="#34C6C6" />
                        <Text c="white" fz="lg" fw={500}>
                            {error}
                        </Text>
                        <Button variant="light" color="blue" onClick={() => window.location.reload()}>
                            Retry
                        </Button>
                    </Stack>
                </Center>
            </>
        );
    }

    if (showcases.length === 0) {
        return (
            <>
                <Space h="md" />
                <div style={{ paddingLeft: '40px' }}>
                    <Breadcrumbs separator=">">
                        {breadcrumbs.map((crumb) => (
                            <Link to={crumb.path} key={crumb.path} className="breadcrumb-link">
                                {crumb.label}
                            </Link>
                        ))}
                    </Breadcrumbs>
                </div>
                <Text ta="center" size="xl" c="blue">My Showcases</Text>
                <Space h="md" />
                <Center style={{ height: '60vh' }}>
                    <Stack align="center">
                        <IconDatabaseOff size={64} color="#34C6C6" />
                        <Text c="white" fz="lg" fw={500}>
                            No showcases found
                        </Text>
                        <Text c="dimmed" fz="sm">
                            You haven't added any showcases yet. Start by adding your first showcase!
                        </Text>
                        <Button variant="light" color="blue" component={NavLink} to="/add-showcase">
                            Add Showcase
                        </Button>
                    </Stack>
                </Center>
            </>
        );
    }

    return (
        <>
            <Space h="md" />
            <div style={{ paddingLeft: '40px' }}>
                <Breadcrumbs separator=">">
                    {breadcrumbs.map((crumb) => (
                        <Link to={crumb.path} key={crumb.path} className="breadcrumb-link">
                            {crumb.label}
                        </Link>
                    ))}
                </Breadcrumbs>
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'relative' }}>
                <Text ta="center" size="xl" c="blue" style={{ flex: 1 }}>
                    My Showcases
                </Text>
                <Button
                    variant="light"
                    color="blue"
                    onClick={() => navigate('/add-showcase')}
                    style={{ position: 'absolute', right: '40px' }}
                >
                    Add Showcase
                </Button>
            </div>
            <Space h="xl" />
            <Flex
                gap="xl"
                justify="center"
                align="center"
                style={{ maxWidth: '1600px', margin: '0 auto' }}
                wrap="wrap"
                mb={'xl'}
                mr={'xl'}
                ml={'xl'}
            >
                {showcases.map((showcase) => (
                    <ShowcaseCard
                        key={showcase.id}
                        id={showcase.id}
                        title={showcase.title}
                        description={showcase.description}
                        createdAt={showcase.createdAt}
                        sliderImages={showcase.sliderImages}
                        user={showcase.user}
                        actionable={true}
                    />
                ))}
            </Flex>
        </>
    );
}
