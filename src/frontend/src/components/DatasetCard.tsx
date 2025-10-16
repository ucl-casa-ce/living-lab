import { Card, CardSection, Image, Badge, Group, Text, Center, Avatar } from '@mantine/core';
import { Link } from 'react-router-dom';
import { API_BASE_URL } from '@/config';

interface DatasetCardProps {
    id: number;
    name: string;
    dataOwnerName: string;
    dataOwnerPhoto: string;
    description: string;
    createdAt: string;
    isControlled: boolean;
    sliderImages: { id: number; fileName: string }[];
    tags: { name: string; icon: string }[];
}

export function DatasetCard({
    id,
    name,
    dataOwnerName,
    dataOwnerPhoto,
    description,
    createdAt,
    sliderImages,
    isControlled,
    tags,
}: DatasetCardProps) {
    return (
        <Link
            key={id}
            to={`/dataset/${id}`}
            style={{ textDecoration: 'none', color: 'inherit' }}
        >
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

                    {/* Last updated badge */}
                    <Badge
                        size="sm"
                        variant="dark"
                        style={{
                            position: 'absolute',
                            bottom: 10,
                            left: 10,
                            backgroundColor: '#212121d1',
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

                    {/* Controlled badge */}
                    {isControlled && (
                        <Badge
                            size="sm"
                            variant="filled"
                            style={{
                                position: 'absolute',
                                bottom: 10,
                                right: 10,
                                backgroundColor: '#34C6C6',
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
            </Card>
        </Link>
    )
}