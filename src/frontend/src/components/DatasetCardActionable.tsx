import { Card, CardSection, Image, Badge, Group, Text, Center, Avatar, ActionIcon, Tooltip, Modal, Button } from '@mantine/core';
import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { API_BASE_URL } from '@/config';
import { IconEye, IconPencil, IconTrash } from '@tabler/icons-react';
import axiosInstance from '@/utils/axiosInstance'; // Use the existing axios instance
import { notifications } from '@mantine/notifications';

interface DatasetCardProps {
    id: number;
    name: string;
    dataOwnerName: string;
    dataOwnerPhoto: string;
    description: string;
    createdAt: string;
    approvedAt: string | null;
    deniedAt: string | null;
    sliderImages: { id: number; fileName: string }[];
    tags: { name: string; icon: string }[];
    isControlled: boolean;
    onDelete?: () => void; // Callback function to notify parent of deletion
}

export function DatasetCardActionable({
    id,
    name,
    dataOwnerName,
    dataOwnerPhoto,
    description,
    createdAt,
    approvedAt,
    deniedAt,
    sliderImages,
    tags,
    isControlled,
    onDelete,
}: DatasetCardProps) {
    const navigate = useNavigate();
    const [deleteModalOpened, setDeleteModalOpened] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDelete = async () => {
        setIsDeleting(true);
        try {
            await axiosInstance.delete(`/datasets/${id}`); // Use axiosInstance for the delete request
            setDeleteModalOpened(false);
            notifications.show({
                title: 'Success',
                message: 'Dataset deleted successfully.',
                color: 'green',
            });
            // Call the onDelete callback if provided to trigger refresh in parent component
            if (onDelete) {
                onDelete();
            }
        } catch (error) {
            notifications.show({
                title: 'Error',
                message: 'Failed to delete dataset. Please try again.',
                color: 'red',
            });
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <>
            {/* Delete Confirmation Modal */}
            <Modal
                opened={deleteModalOpened}
                onClose={() => setDeleteModalOpened(false)}
                title="Confirm Deletion"
                centered
            >
                <Text>Are you sure you want to delete this dataset?</Text>
                <Group mt="md">
                    <Button variant="default" onClick={() => setDeleteModalOpened(false)}>
                        Cancel
                    </Button>
                    <Button color="red" onClick={handleDelete} loading={isDeleting}>
                        Delete
                    </Button>
                </Group>
            </Modal>

            <Card
                key={id}
                withBorder
                radius="md"
                p="md"
                className="card"
                style={{
                    border: 'none',
                    backgroundColor: '#333333',
                    width: '350px',
                    minHeight: '400px',
                    display: 'flex', // Make the card a flex container
                    flexDirection: 'column', // Arrange children vertically
                }}
            >
                <Card.Section style={{ position: 'relative' }}>
                    {/* Image */}
                    <Image
                        src={sliderImages[0] != null ? `${API_BASE_URL}/uploads/` + sliderImages[0].fileName : `/imgs/dataset-default.jpeg`}
                        alt={name}
                        height={180}
                    />

                    {/* Badge positioned at the bottom-left of the image */}
                    <Badge
                        size="sm"
                        variant="dark"
                        style={{
                            position: 'absolute',
                            bottom: 10,
                            left: 10,
                            backgroundColor: '#1f5753d1',
                            color: '#c9f3f1',
                        }}
                    >
                        Last updated: {createdAt
                            ? new Date(createdAt).toLocaleDateString(undefined, {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                            })
                            : 'Unknown'}
                    </Badge>
                    {isControlled && (
                        <Badge
                            size="sm"
                            variant="filled"
                            style={{
                                position: 'absolute',
                                bottom: 10,
                                right: 10,
                                backgroundColor: '#f7bf3c',
                                color: '#333333',
                            }}
                        >
                            Controlled
                        </Badge>
                    )}
                </Card.Section>

                <Card.Section className="section" mt="md">
                    <Group justify="apart">
                        <Text c="white" fz="lg" fw={500}
                            style={{
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                fontSize: 'clamp(12px, 2vw, 16px)' // Adjust min, preferred, and max font sizes as needed
                            }}>
                            {name}
                        </Text>
                    </Group>
                    <Group mt="xs" justify="apart">
                        <Center>
                            <Avatar size={30} radius="xl" mr="xs" bg={'#333333'} />
                            <Text c="white" fz="m" inline>
                                {dataOwnerName}
                            </Text>
                        </Center>
                    </Group>

                    <Text c="white" fz="sm" mt="xs" style={{
                        height: '60px', // Set a fixed height for the description section
                        overflow: 'hidden', // Hide overflowing text
                        textOverflow: 'ellipsis', // Add ellipsis for truncated text
                        whiteSpace: 'normal', // Allow wrapping of text
                        wordBreak: 'break-word', // Break long words to prevent overflow
                    }}>
                        {description.length > 80
                            ? `${description.substring(0, 110)}...`
                            : description}
                    </Text>
                </Card.Section>

                {/* Tags Section */}
                <Group
                    gap={7}
                    mt="auto" // Push this section to the bottom
                >
                    {tags.slice(0, 3).map((tag, index) => (
                        <Badge
                            key={index}
                            variant="outline"
                            color="#34C6C6"
                            leftSection={tag.icon}
                        >
                            {tag.name}
                        </Badge>
                    ))}
                </Group>

                {/* Action Buttons Section */}
                <Group justify="space-between" mt="md">
                    {deniedAt !== null ? (
                        <Badge color="pink" variant="filled">
                            Not Approved
                        </Badge>
                    ) : approvedAt === null ? (
                        <Badge color="grey" variant="filled">
                            Pending Approval
                        </Badge>
                    ) : null}

                    <Group ml="auto">
                        <Tooltip label="View" position="top" withArrow>
                            <ActionIcon
                                color="blue"
                                variant="dark"
                                onClick={() => navigate(`/dataset/${id}`)}
                            >
                                <IconEye size={18} />
                            </ActionIcon>
                        </Tooltip>
                        <Tooltip label="Edit" position="top" withArrow>
                            <ActionIcon
                                color="green"
                                variant="dark"
                                onClick={() => navigate(`/edit-dataset/${id}`)}
                            >
                                <IconPencil size={18} />
                            </ActionIcon>
                        </Tooltip>
                        <Tooltip label="Delete" position="top" withArrow>
                            <ActionIcon
                                color="red"
                                variant="dark"
                                onClick={() => setDeleteModalOpened(true)}
                            >
                                <IconTrash size={18} />
                            </ActionIcon>
                        </Tooltip>
                    </Group>
                </Group>
            </Card>
        </>
    );
}