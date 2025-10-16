import { useEffect, useState, useCallback } from 'react';
import { DatasetCard } from '@/components/DatasetCard';
import { Flex, Text, Center, Button, Stack, Breadcrumbs, Space, Loader } from '@mantine/core';
import { Notifications, notifications } from '@mantine/notifications';
import { IconDatabaseOff, IconCloudOff } from '@tabler/icons-react';
import axiosInstance from '@/utils/axiosInstance';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { DatasetCardActionable } from '@/components/DatasetCardActionable';

interface DatasetItem {
    id: number;
    name: string;
    dataOwnerName: string;
    dataOwnerPhoto: string;
    description: string;
    createdAt: string;
    approvedAt: string | null;
    deniedAt: string | null;
    sliderImages: { id: number; fileName: string }[];
    datasetType: string;
    tags: { name: string; icon: string }[];
}

export function MyDatasetsPage() {
    const [datasets, setDatasets] = useState<DatasetItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();

    const breadcrumbs = [
        { label: 'Home', path: '/' },
        { label: 'My Datasets', path: '/my-datasets' },
    ];

    // Function to fetch datasets
    const fetchDatasets = useCallback(() => {
        setLoading(true);
        axiosInstance
            .get('/datasets/search/me')
            .then((response) => {
                setDatasets(response.data);
                console.log('Fetched datasets:', response.data);
                setLoading(false);
            })
            .catch((error) => {
                console.error('Error fetching datasets:', error);
                notifications.show({
                    title: 'Error',
                    message: 'Failed to connect to server.',
                    color: 'red',
                });
                setError('Failed to connect to the server. Please check your internet connection.');
                setLoading(false);
            });
    }, []);

    // Handler for dataset deletion
    const handleDatasetDeleted = useCallback(() => {
        // Refresh the dataset list after deletion
        fetchDatasets();
    }, [fetchDatasets]);

    useEffect(() => {
        fetchDatasets();
    }, [fetchDatasets]);

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
                <Text ta="center" size="xl" c="blue">My Datasets</Text>
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

    if (datasets.length === 0) {
        return (
            <>
                <Space h="md" />
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
                <Text ta="center" size="xl" c="blue">My Datasets</Text>
                <Space h="md" />
                <Center style={{ height: '60vh' }}>
                    <Stack align="center">
                        <IconDatabaseOff size={64} color="#34C6C6" />
                        <Text c="white" fz="lg" fw={500}>
                            No datasets found
                        </Text>
                        <Text c="dimmed" fz="sm">
                            You haven't added any datasets yet. Start by adding your first dataset!
                        </Text>
                        <Button variant="light" color="blue" component={NavLink} to="/add-dataset">
                            Add Dataset
                        </Button>
                    </Stack>
                </Center>
            </>
        );
    }

    return (
        <>
            <Space h="md" />
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
                    My Datasets
                </Text>
                <Button
                    variant="light"
                    color="blue"
                    onClick={() => navigate('/add-dataset')}
                    style={{ position: 'absolute', right: '40px' }}
                >
                    Add Dataset
                </Button>
            </div>
            <Space h="xl" />
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
                {datasets.map((dataset) => (
                    <DatasetCardActionable
                        key={dataset.id}
                        id={dataset.id}
                        name={dataset.name}
                        dataOwnerName={dataset.dataOwnerName}
                        dataOwnerPhoto={dataset.dataOwnerPhoto}
                        isControlled={dataset.datasetType === 'controlled'}
                        description={dataset.description}
                        createdAt={dataset.createdAt}
                        approvedAt={dataset.approvedAt}
                        deniedAt={dataset.deniedAt}
                        sliderImages={dataset.sliderImages}
                        tags={dataset.tags.map((tag) => ({
                            name: tag.name,
                            icon: '',
                        }))}
                        onDelete={handleDatasetDeleted}
                    />
                ))}
            </Flex>
        </>
    );
}
