import { Card, CardSection, Image, Badge, Group, Text, Avatar } from '@mantine/core';
import { Link } from 'react-router-dom';
import { API_BASE_URL } from '@/config';
import { IconMovie } from '@tabler/icons-react';

interface HomeShowcaseCardProps {
    id: number;
    title: string;
    description: string;
    sliderImages: { id: number; fileName: string; isTeaser: boolean }[];
    user: {
        id: string;
        firstName: string;
        lastName: string;
        photoUrl?: string;
    };
    youtubeLink?: string;
}

export function HomeShowcaseCard({
    id,
    title,
    description,
    sliderImages,
    user,
    youtubeLink,
}: HomeShowcaseCardProps) {
    // Get teaser image or first image or default
    const teaserImage = sliderImages.find(img => img.isTeaser);
    const displayImage = teaserImage || (sliderImages.length > 0 ? sliderImages[0] : null);

    return (
        <Card
            key={id}
            withBorder
            radius="md"
            p="md"
            className="card"
            component={Link}
            to={`/showcase/${id}`}
            style={{
                border: 'none',
                backgroundColor: '#333333',
                textDecoration: 'none',
                height: '100%', // Ensure consistent height
                display: 'flex',
                flexDirection: 'column',
            }}
        >
            <Card.Section style={{ position: 'relative' }}>
                <Image
                    src={displayImage ? `${API_BASE_URL}/uploads/${displayImage.fileName}` : `/imgs/showcase-default.jpeg`}
                    alt={title}
                    height={160}
                />

                {youtubeLink && (
                    <Badge
                        size="xs"
                        variant="filled"
                        color="red"
                        leftSection={<IconMovie size={12} />}
                        style={{
                            position: 'absolute',
                            top: 10,
                            right: 10,
                        }}
                    >
                        Video
                    </Badge>
                )}
            </Card.Section>

            <Group mt="sm" mb="xs">
                <Avatar
                    src={user.photoUrl ? `${API_BASE_URL}/uploads/${user.photoUrl}` : undefined}
                    size={24}
                    radius="xl"
                />
                <Text size="xs" c="dimmed">
                    {user.firstName} {user.lastName}
                </Text>
            </Group>

            <Text fw={500} size="sm" lineClamp={1} c="#ffffff">
                {title}
            </Text>

            <Text size="xs" c="dimmed" mt="xs" lineClamp={2}>
                {description}
            </Text>
        </Card>
    );
}
