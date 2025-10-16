import {
    Container,
    Text,
    Center,
    Loader,
    Group,
    Badge,
    ActionIcon,
    Button,
    SegmentedControl,
    Tooltip,
    Modal,
} from '@mantine/core';
import { DataTable } from 'mantine-datatable';
import { useEffect, useState } from 'react';
import axiosInstance from '@/utils/axiosInstance';
import { notifications } from '@mantine/notifications';
import { IconEye, IconCheck, IconX } from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';
import { DateInput } from '@mantine/dates';
import '@mantine/dates/styles.css';

interface AccessRequest {
    id: number;
    jobTitle: string;
    company: string;
    department: string;
    contactEmail: string;
    projectDescription: string;
    usageDetails: string;
    endTime?: string;
    approvedAt?: string;
    deniedAt?: string | null;
    createdAt: string;
    user: {
        id: string;
        firstName: string;
        lastName: string;
    };
    dataset: {
        id: number;
        name: string;
    };
}

export function AdminAccessRequestsPage() {
    const [accessRequests, setAccessRequests] = useState<AccessRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [groupBy, setGroupBy] = useState<'users' | 'datasets'>('datasets');
    const [viewRequestModalOpened, setViewRequestModalOpened] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState<AccessRequest | null>(null);
    const [approveRequestModalOpened, setApproveRequestModalOpened] = useState(false);
    const [selectedRequestForApproval, setSelectedRequestForApproval] = useState<AccessRequest | null>(null);
    const [accessEndDate, setAccessEndDate] = useState<Date | null>(null);
    const [isApproving, setIsApproving] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        axiosInstance
            .get('/access-requests')
            .then((response) => {
                setAccessRequests(response.data);
                setLoading(false);
            })
            .catch((error) => {
                console.error('Error fetching access requests:', error);
                notifications.show({
                    title: 'Error',
                    message: 'Failed to fetch access requests.',
                    color: 'red',
                });
                setError('Failed to fetch access requests.');
                setLoading(false);
            });
    }, []);

    const handleApproveRequest = (id: number) => {
        setSelectedRequestForApproval(accessRequests.find((request) => request.id === id) || null);
        setApproveRequestModalOpened(true);
    };

    const confirmApproveRequest = () => {
        if (!selectedRequestForApproval) return;

        setIsApproving(true);
        axiosInstance
            .put(`/access-requests/${selectedRequestForApproval.id}/approve`, {
                accessEndDate: accessEndDate ? accessEndDate.toISOString() : null,
            })
            .then(() => {
                notifications.show({
                    title: 'Success',
                    message: 'Access request approved successfully.',
                    color: 'green',
                });
                setAccessRequests((prev) =>
                    prev.map((request) =>
                        request.id === selectedRequestForApproval.id
                            ? {
                                ...request,
                                approvedAt: new Date().toISOString(),
                                deniedAt: null,
                                endTime: accessEndDate ? accessEndDate.toISOString() : null,
                            }
                            : request
                    ) as AccessRequest[]
                );
                setApproveRequestModalOpened(false);
                setSelectedRequestForApproval(null);
                setAccessEndDate(null);
            })
            .catch((error) => {
                console.error('Error approving access request:', error);
                notifications.show({
                    title: 'Error',
                    message: 'Failed to approve access request.',
                    color: 'red',
                });
            })
            .finally(() => {
                setIsApproving(false);
            });
    };

    const handleDenyRequest = (id: number) => {
        axiosInstance
            .put(`/access-requests/${id}/deny`)
            .then(() => {
                notifications.show({
                    title: 'Success',
                    message: 'Access request denied successfully.',
                    color: 'green',
                });
                setAccessRequests((prev) =>
                    prev.map((request) =>
                        request.id === id
                            ? {
                                ...request,
                                deniedAt: new Date().toISOString(),
                                approvedAt: null,
                            }
                            : request
                    ) as AccessRequest[]
                )
            })
            .catch((error) => {
                console.error('Error denying access request:', error);
                notifications.show({
                    title: 'Error',
                    message: 'Failed to deny access request.',
                    color: 'red',
                });
            });
    };

    const handleViewRequest = (request: AccessRequest) => {
        setSelectedRequest(request);
        setViewRequestModalOpened(true);
    };

    if (loading) {
        return (
            <Center style={{ height: '80vh' }}>
                <Loader size="lg" color="blue" />
            </Center>
        );
    }

    if (error) {
        return (
            <Center style={{ height: '80vh' }}>
                <Text color="red">{error}</Text>
            </Center>
        );
    }

    const groupedRequests =
        groupBy === 'users'
            ? accessRequests.reduce((acc, request) => {
                const userKey = `${request.user.id}-${request.user.firstName} ${request.user.lastName}`;
                if (!acc[userKey]) acc[userKey] = [];
                acc[userKey].push(request);
                return acc;
            }, {} as Record<string, AccessRequest[]>)
            : accessRequests.reduce((acc, request) => {
                const datasetKey = `${request.dataset.id}-${request.dataset.name}`;
                if (!acc[datasetKey]) acc[datasetKey] = [];
                acc[datasetKey].push(request);
                return acc;
            }, {} as Record<string, AccessRequest[]>);

    return (
        <Container>
            <Group justify="space-between" mb="lg">
                <Text size="xl" fw={700}>
                    Access Requests
                </Text>
                <SegmentedControl
                    value={groupBy}
                    onChange={(value) => setGroupBy(value as 'users' | 'datasets')}
                    data={[
                        { label: 'Group by Datasets', value: 'datasets' },
                        { label: 'Group by Users', value: 'users' },
                    ]}
                />
            </Group>

            {Object.entries(groupedRequests).map(([key, requests]) => (
                <div key={key} style={{ marginBottom: '2rem' }}>
                    <Text fw={700} size="lg" mb="sm">
                        {groupBy === 'users' ? `User: ${key.split('-')[1]}` : `Dataset: ${key.split('-')[1]}`}
                    </Text>
                    <DataTable
                        withTableBorder
                        textSelectionDisabled
                        columns={[
                            {
                                accessor: 'jobTitle',
                                title: 'Job Title',
                                render: (record) => <Text fw={500}>{record.jobTitle}</Text>,
                            },
                            {
                                accessor: 'company',
                                title: 'Company',
                            },
                            {
                                accessor: 'contactEmail',
                                title: 'Contact Email',
                            },
                            {
                                accessor: 'status',
                                title: 'Status',
                                render: (record) => (
                                    <Badge
                                        color={
                                            record.approvedAt
                                                ? 'green'
                                                : record.deniedAt
                                                    ? 'red'
                                                    : 'yellow'
                                        }
                                    >
                                        {record.approvedAt
                                            ? 'Approved'
                                            : record.deniedAt
                                                ? 'Denied'
                                                : 'Pending'}
                                    </Badge>
                                ),
                            },
                            {
                                accessor: 'createdAt',
                                title: 'Requested On',
                                render: (record) => new Date(record.createdAt).toLocaleDateString(),
                            },
                            {
                                accessor: 'actions',
                                title: 'Actions',
                                render: (record) => (
                                    <Group gap={4} justify="right" wrap="nowrap">
                                        <Tooltip label="Approve request" position="top" withArrow>
                                            <ActionIcon
                                                size="sm"
                                                variant="subtle"
                                                color="green"
                                                onClick={() => handleApproveRequest(record.id)}
                                            >
                                                <IconCheck size={16} />
                                            </ActionIcon>
                                        </Tooltip>
                                        <Tooltip label="Deny request" position="top" withArrow>
                                            <ActionIcon
                                                size="sm"
                                                variant="subtle"
                                                color="red"
                                                onClick={() => handleDenyRequest(record.id)}
                                            >
                                                <IconX size={16} />
                                            </ActionIcon>
                                        </Tooltip>
                                        <Tooltip label="View access request" position="top" withArrow>
                                            <ActionIcon
                                                size="sm"
                                                variant="subtle"
                                                color="blue"
                                                onClick={() => handleViewRequest(record)}
                                            >
                                                <IconEye size={16} />
                                            </ActionIcon>
                                        </Tooltip>
                                    </Group>
                                ),
                            },
                        ]}
                        records={requests}
                        emptyState={
                            <Text ta="center" c="dimmed">
                                No access requests found
                            </Text>
                        }
                    />
                </div>
            ))}

            <Modal
                opened={viewRequestModalOpened}
                onClose={() => setViewRequestModalOpened(false)}
                centered
            >
                {selectedRequest && (
                    <div style={{ padding: '20px' }}>
                        <Group mb="md">
                            <Text fw={700} size="lg" style={{ color: '#34C6C6' }}>
                                Access Request for Dataset:
                            </Text>
                            <Text
                                fw={700}
                                size="lg"
                                style={{
                                    color: '#1E90FF',
                                    cursor: 'pointer',
                                    textDecoration: 'underline',
                                }}
                                onClick={() => navigate(`/dataset/${selectedRequest.dataset.id}`)}
                            >
                                {selectedRequest.dataset.name}
                            </Text>
                            <Badge
                                color={
                                    selectedRequest.approvedAt
                                        ? 'green'
                                        : selectedRequest.deniedAt
                                            ? 'red'
                                            : 'yellow'
                                }
                                size="lg"
                            >
                                {selectedRequest.approvedAt
                                    ? 'Approved'
                                    : selectedRequest.deniedAt
                                        ? 'Denied'
                                        : 'Pending'}
                            </Badge>
                        </Group>
                        <div style={{ marginBottom: '1rem' }}>
                            <Text fw={500} size="sm" style={{ color: '#888888' }}>
                                Requested By:
                            </Text>
                            <Text size="sm">
                                {selectedRequest.user.firstName} {selectedRequest.user.lastName}
                            </Text>
                        </div>
                        <div style={{ marginBottom: '1rem' }}>
                            <Text fw={500} size="sm" style={{ color: '#888888' }}>
                                Job Title:
                            </Text>
                            <Text size="sm">{selectedRequest.jobTitle}</Text>
                        </div>
                        <div style={{ marginBottom: '1rem' }}>
                            <Text fw={500} size="sm" style={{ color: '#888888' }}>
                                Company:
                            </Text>
                            <Text size="sm">{selectedRequest.company}</Text>
                        </div>
                        <div style={{ marginBottom: '1rem' }}>
                            <Text fw={500} size="sm" style={{ color: '#888888' }}>
                                Contact Email:
                            </Text>
                            <Text size="sm">{selectedRequest.contactEmail}</Text>
                        </div>
                        {selectedRequest.department && (
                            <div style={{ marginBottom: '1rem' }}>
                                <Text fw={500} size="sm" style={{ color: '#888888' }}>
                                    Department:
                                </Text>
                                <Text size="sm">{selectedRequest.department}</Text>
                            </div>
                        )}
                        <div style={{ marginBottom: '1rem' }}>
                            <Text fw={500} size="sm" style={{ color: '#34C6C6' }}>
                                Project Description:
                            </Text>
                            <Text size="sm" style={{ whiteSpace: 'pre-wrap' }}>
                                {selectedRequest.projectDescription}
                            </Text>
                        </div>
                        <div style={{ marginBottom: '1rem' }}>
                            <Text fw={500} size="sm" style={{ color: '#34C6C6' }}>
                                Usage Details:
                            </Text>
                            <Text size="sm" style={{ whiteSpace: 'pre-wrap' }}>
                                {selectedRequest.usageDetails}
                            </Text>
                        </div>

                        <div style={{ marginBottom: '1rem' }}>
                            <Text fw={500} size="sm" style={{ color: '#888888' }}>
                                Access End Time:
                            </Text>
                            <Text size="sm">
                                {selectedRequest.endTime != null ? (
                                    new Date(selectedRequest.endTime).toLocaleDateString()
                                ) : ('Unlimited')}
                            </Text>
                        </div>

                        <div style={{ marginBottom: '1rem' }}>
                            <Text fw={500} size="sm" style={{ color: '#888888' }}>
                                Requested On:
                            </Text>
                            <Text size="sm">
                                {new Date(selectedRequest.createdAt).toLocaleDateString()}
                            </Text>
                        </div>
                        {selectedRequest.approvedAt && (
                            <div style={{ marginBottom: '1rem' }}>
                                <Text fw={500} size="sm" style={{ color: '#888888' }}>
                                    Approved On:
                                </Text>
                                <Text size="sm">
                                    {new Date(selectedRequest.approvedAt).toLocaleDateString()}
                                </Text>
                            </div>
                        )}
                        {selectedRequest.deniedAt && (
                            <div style={{ marginBottom: '1rem' }}>
                                <Text fw={500} size="sm" style={{ color: '#888888' }}>
                                    Denied On:
                                </Text>
                                <Text size="sm">
                                    {new Date(selectedRequest.deniedAt).toLocaleDateString()}
                                </Text>
                            </div>
                        )}
                    </div>
                )}
            </Modal>

            <Modal
                opened={approveRequestModalOpened}
                onClose={() => {
                    setApproveRequestModalOpened(false);
                    setSelectedRequestForApproval(null);
                    setAccessEndDate(null);
                }}
                title="Approve Access Request"
                yOffset={100}
            >
                {selectedRequestForApproval && (
                    <div>
                        <Text fw={500} mb="sm">
                            Approving access request for dataset:
                        </Text>
                        <Text fw={700} mb="md" style={{ color: '#1E90FF' }}>
                            {selectedRequestForApproval.dataset.name}
                        </Text>
                        <Text fw={500} mb="sm">
                            Requested by:
                        </Text>
                        <Text mb="md">
                            {selectedRequestForApproval.user.firstName} {selectedRequestForApproval.user.lastName}
                        </Text>
                        <DateInput
                            label="Access End Date (optional)"
                            placeholder="Select a date or leave empty for unlimited access"
                            value={accessEndDate}
                            onChange={setAccessEndDate}
                            clearable
                            maw={400}
                            mx="auto"
                        />
                        <Group justify="right" mt="md">
                            <Button
                                variant="default"
                                onClick={() => {
                                    setApproveRequestModalOpened(false);
                                    setSelectedRequestForApproval(null);
                                    setAccessEndDate(null);
                                }}
                                disabled={isApproving}
                            >
                                Cancel
                            </Button>
                            <Button
                                color="green"
                                onClick={confirmApproveRequest}
                                loading={isApproving}
                            >
                                Approve
                            </Button>
                        </Group>
                    </div>
                )}
            </Modal>
        </Container>
    );
}
