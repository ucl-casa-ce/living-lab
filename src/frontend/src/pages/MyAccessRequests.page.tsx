import { useEffect, useState } from 'react';
import { Flex, Text, Center, Loader, Space, Breadcrumbs, Group, Badge, Button, Divider } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconClock, IconCheck, IconX } from '@tabler/icons-react';
import { Link } from 'react-router-dom';
import axiosInstance from '@/utils/axiosInstance';

interface Dataset {
    id: number;
    name: string;
    dataOwnerName: string;
    datasetType: string;
}

interface AccessRequest {
    id: number;
    jobTitle: string;
    company: string;
    contactEmail: string;
    department?: string;
    projectDescription: string;
    usageDetails: string;
    endTime?: string;
    approvedAt?: string;
    deniedAt?: string;
    createdAt: string;
    dataset: Dataset;
}

export function MyAccessRequestsPage() {
    const [accessRequests, setAccessRequests] = useState<AccessRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const breadcrumbs = [
        { label: 'Home', path: '/' },
        { label: 'My Access Requests', path: '/my-access-requests' },
    ];

    useEffect(() => {
        axiosInstance
            .get('/access-requests/user/me')
            .then((response) => {
                setAccessRequests(response.data);
                setLoading(false);
            })
            .catch((err) => {
                console.error('Error fetching access requests:', err);
                notifications.show({
                    title: 'Error',
                    message: 'Failed to load access requests.',
                    color: 'red',
                });
                setError('Failed to load access requests.');
                setLoading(false);
            });
    }, []);

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
                <Text ta="center" size="xl" c="blue">My Access Requests</Text>
                <Space h="md" />
                <Center style={{ height: '60vh' }}>
                    <Text c="white" fz="lg" fw={500}>
                        {error}
                    </Text>
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
            <Text ta="center" size="xl" c="blue">My Access Requests</Text>
            <Space h="md" />
            <Flex
                gap="xl"
                justify="center"
                align="center"
                style={{ maxWidth: '1200px', margin: '0 auto' }}
                wrap="wrap"
            >
                {accessRequests.map((request) => (
                    <div
                        key={request.id}
                        style={{
                            border: '1px solid #ccc',
                            borderRadius: '12px',
                            padding: '20px',
                            width: '100%',
                            backgroundColor: '#1F1F1F',
                            boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
                        }}
                    >
                        <Group mb="md">
                            <Text
                                fw={700}
                                size="lg"
                                style={{ color: '#34C6C6', cursor: 'pointer', textDecoration: 'underline' }}
                                component={Link}
                                to={`/dataset/${request.dataset.id}`}
                            >
                                {request.dataset.name}
                            </Text>
                            <Badge
                                color={request.approvedAt ? 'green' : request.deniedAt ? 'red' : 'yellow'}
                                size="lg"
                            >
                                {request.approvedAt ? 'Approved' : request.deniedAt ? 'Denied' : 'Pending'}
                            </Badge>
                        </Group>
                        <Text size="sm" c="dimmed" mb="sm">
                            <strong>Requested on:</strong> {new Date(request.createdAt).toLocaleDateString()}
                        </Text>
                        <Divider my="sm" color="gray" />
                        <Group mb="xs">
                            <Text size="sm" fw={500} style={{ color: '#888888' }}>
                                Job Title:
                            </Text>
                            <Text size="sm">{request.jobTitle}</Text>
                        </Group>
                        <Group mb="xs">
                            <Text size="sm" fw={500} style={{ color: '#888888' }}>
                                Company:
                            </Text>
                            <Text size="sm">{request.company}</Text>
                        </Group>
                        <Group mb="xs">
                            <Text size="sm" fw={500} style={{ color: '#888888' }}>
                                Contact Email:
                            </Text>
                            <Text size="sm">{request.contactEmail}</Text>
                        </Group>
                        {request.department && (
                            <Group mb="xs">
                                <Text size="sm" fw={500} style={{ color: '#888888' }}>
                                    Department:
                                </Text>
                                <Text size="sm">{request.department}</Text>
                            </Group>
                        )}
                        <Divider my="sm" color="gray" />
                        <Text size="sm" fw={500} style={{ color: '#34C6C6', marginBottom: '4px' }}>
                            Project Description:
                        </Text>
                        <Text size="sm" style={{ whiteSpace: 'pre-wrap' }}>
                            {request.projectDescription}
                        </Text>
                        <Text size="sm" fw={500} style={{ color: '#34C6C6', marginTop: '12px', marginBottom: '4px' }}>
                            Usage Details:
                        </Text>
                        <Text size="sm" style={{ whiteSpace: 'pre-wrap' }}>
                            {request.usageDetails}
                        </Text>
                        {request.endTime && (
                            <Text size="sm" mt="sm">
                                <strong>Access End Time:</strong> {new Date(request.endTime).toLocaleDateString()}
                            </Text>
                        )}
                        <Divider my="sm" color="gray" />
                        <Group>
                            <Text size="sm" fw={500} style={{ color: '#888888' }}>
                                Dataset Type:
                            </Text>
                            <Text size="sm">{request.dataset.datasetType}</Text>
                        </Group>
                    </div>
                ))}
            </Flex>
            <Space h="xl" />
            <Space h="xl" />

        </>
    );
}
