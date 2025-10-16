import {
    IconAdjustments,
    IconDatabase,
    IconHome,
    IconTag,
    IconUser,
} from '@tabler/icons-react';
import { Box, Code, Group, Modal, ScrollArea, Text } from '@mantine/core';
import classes from './Admin.page.module.css';
import { LinksGroup } from '@/components/NavbarLinksGroup/NavbarLinksGroup';
import { changelog, version } from '@/components/Header/changelog';
import { useDisclosure } from '@mantine/hooks';
import { Outlet, NavLink } from 'react-router-dom';
import { AdminSettingsPage } from './AdminSettings.page';

const menuData = [
    {
        label: 'Home',
        icon: IconHome,
        link: '/admin'
    },
    {
        label: 'Datasets',
        icon: IconDatabase,
        initiallyOpened: true,
        links: [
            { label: 'Manage all', link: '/admin/datasets' },
            { label: 'Add requests', link: '/admin/datasets/requests' },
            { label: 'Access requests', link: '/admin/datasets/access-requests' }, // Updated
        ],
    },
    {
        label: 'Tags',
        icon: IconTag,
        links: [
            { label: 'Manage all', link: '/admin/tags' },
            { label: 'Add requests', link: '/admin/tags/requests' },
        ],
    },
    {
        label: 'Showcases',
        icon: IconTag,
        links: [
            { label: 'Manage all', link: '/admin/showcases' },
            { label: 'Add requests', link: '/admin/showcases/requests' },
        ],
    },
    {
        label: 'Users',
        icon: IconUser,
        links: [
            { label: 'Manage all', link: '/admin/users' },
        ],
    },
    { label: 'Settings', icon: IconAdjustments, link: '/admin/settings' },
];

export function AdminPage() {
    const links = menuData.map((item) => <LinksGroup {...item} key={item.label} />);
    const [modalOpened, { open: openModal, close: closeModal }] = useDisclosure(false);

    return (
        <div style={{ display: 'flex' }}>
            <nav className={classes.navbar}>
                <div className={classes.header}>
                    <Group justify="space-between">
                        <Text size="lg">Admin dashboard</Text>
                        <Code style={{ cursor: 'pointer' }} onClick={openModal} fw={700}>{version}</Code>
                    </Group>
                </div>

                <ScrollArea className={classes.links}>
                    <div className={classes.linksInner}>{links}</div>
                </ScrollArea>

                <Modal
                    opened={modalOpened}
                    onClose={closeModal}
                    c='#34C6C6'
                    className={classes.modalcustom}
                    title="Changelog"
                    size="md"
                    zIndex={999999}
                    centered
                >
                    {changelog.map((log) => (
                        <Box key={log.version} mb="sm">
                            <Text c='white' fw={700} mb="xs">
                                {log.version}
                            </Text>
                            <ul>
                                {log.changes.map((change, index) => (
                                    <li key={index}>
                                        <Text c='white' size="sm">{change}</Text>
                                    </li>
                                ))}
                            </ul>
                        </Box>
                    ))}
                </Modal>
            </nav>

            <main style={{ flex: 1, padding: '20px' }}>
                <Outlet /> {/* Rendering child routes here */}
            </main>
        </div>
    );
}