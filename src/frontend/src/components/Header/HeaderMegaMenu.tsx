import {
  IconBook,
  IconChartPie3,
  IconChevronDown,
  IconCode,
  IconCoin,
  IconFingerprint,
  IconNotification,
  IconPlane,
  IconPlant,
  IconBuilding,
  IconCat,
  IconPower,
  IconSunElectricity,
  IconHeart,
  IconMenu,
  IconMenu2,
  IconMenu3,
  IconCategory,
  IconLayoutDashboard,
  IconLayoutDashboardFilled,
  IconPhoto,
  IconMessageCircle,
  IconSearch,
  IconSettings,
  IconDatabase,
  IconHome,
  IconNews,
  IconLockAccess,
  IconCircleDashedCheck,
  IconLogout,
  IconUser,
  IconPassword,
  IconLock,
  IconUserCircle,
  IconList,
} from '@tabler/icons-react';
import {
  ActionIcon,
  Anchor,
  Avatar,
  Box,
  Breadcrumbs,
  Burger,
  Button,
  Center,
  Collapse,
  Divider,
  Drawer,
  Group,
  HoverCard,
  Menu,
  Modal,
  ScrollArea,
  SimpleGrid,
  Text,
  ThemeIcon,
  UnstyledButton,
  useMantineTheme,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { NavLink, useLocation } from 'react-router-dom';
import { useContext, useState, useEffect } from 'react';
import axiosInstance from '@/utils/axiosInstance';
import { AuthContext } from '@/context/AuthContext';
import classes from './HeaderMegaMenu.module.css';
import { changelog, version } from './changelog';
import cx from 'clsx';
import IconManager from '@deck.gl/layers/dist/icon-layer/icon-manager';

const mockdata = [
  {
    icon: IconPlane,
    title: 'Aircraft',
    description: 'Explore live data on aircraft activity over Queen Elizabeth Park.',
  },
  {
    icon: IconPlant,
    title: 'Environment & Nature',
    description: 'Insights into the park’s natural ecosystems, flora, and fauna.',
  },
  {
    icon: IconBuilding,
    title: 'Built Environment',
    description: 'Detailed data on structures and infrastructure within the park.',
  },
  {
    icon: IconCat,
    title: 'People',
    description: 'Discover visitor trends and demographic insights in the park.',
  },
  {
    icon: IconSunElectricity,
    title: 'Solar Power',
    description: 'Comprehensive analytics and visualizations of park data.',
  },
  {
    icon: IconList,
    title: 'Show all',
  }
];

export function HeaderMegaMenu() {
  const [drawerOpened, { toggle: toggleDrawer, close: closeDrawer }] = useDisclosure(false);
  const [linksOpened, { toggle: toggleLinks }] = useDisclosure(false);
  const [modalOpened, { open: openModal, close: closeModal }] = useDisclosure(false);
  const [userMenuOpened, setUserMenuOpened] = useState(false);
  const [dashboardMenuOpened, setDashboardMenuOpened] = useState(false);
  const [adminMenuOpened, setAdminMenuOpened] = useState(false);
  const [latestTags, setLatestTags] = useState<{ id?: number; icon: any; title: string; description?: string }[]>([]);

  const theme = useMantineTheme();

  // Detect current route
  const location = useLocation();
  const isHome = location.pathname === '/';

  const authContext = useContext(AuthContext);

  const isAuthenticated = authContext?.isAuthenticated;
  const user = authContext?.user;
  const logout = authContext?.logout;

  useEffect(() => {
    // Fetch the latest tags from the backend using the general axios instance
    axiosInstance.get('/tags/navbar')
      .then((response) => {
        const fetchedTags = response.data.map((tag: any) => ({
          id: tag.id, // Store the tag ID for navigation
          icon: IconCategory, // Replace with a dynamic icon if available
          title: tag.name,
          description: `Explore datasets tagged with "${tag.name}".`,
        }));
        // Add the "Show all" item at the end
        setLatestTags([...fetchedTags, { icon: IconList, title: 'Show all' }]);
      })
      .catch((error) => {
        console.error('Error fetching latest tags:', error);
      });
  }, []);

  const links = latestTags.map((item) => (
    <UnstyledButton
      className={classes.subLink}
      key={item.title}
      component={NavLink}
      to={item.title === 'Show all' ? '/data-menu' : `/data-menu/tag/${item.id}`}
    >
      <Group wrap="nowrap" >
        <ThemeIcon size={34} variant="default" radius="md">
          <item.icon size={22} color={'#34C6C6'} />
        </ThemeIcon>
        <Text size="sm"  {...item.title.includes('all') ? { color: '#34C6C6', fw: 500, td: 'underline' } : { fw: 500 }}>
          {item.title}
        </Text>
      </Group>
    </UnstyledButton>
  ));

  const myDashboardMenuItems = (
    <>
      <Menu.Item component={NavLink}
        to="/my-datasets" leftSection={<IconDatabase size={18} />}>
        Datasets
      </Menu.Item>
      <Menu.Item component={NavLink}
        to="/my-showcases" leftSection={<IconNews size={18} />}>
        Showcases
      </Menu.Item>
      <Menu.Item component={NavLink}
        to="/my-access-requests" leftSection={<IconCircleDashedCheck size={18} />}>
        Access requests
      </Menu.Item>
    </>
  );

  const userMenuItems = (
    <>
      <Menu.Item style={{ cursor: 'not-allowed' }} leftSection={<IconUser size={18} />}>
        Profile
      </Menu.Item>
      <Menu.Item style={{ cursor: 'not-allowed' }} leftSection={<IconLock size={18} />}>
        Change password
      </Menu.Item>
      <Menu.Item component={NavLink}
        onClick={logout} to={''} leftSection={<IconLogout size={18} />}>
        Sign out
      </Menu.Item>
    </>
  );

  return (
    <Box
      style={{ backgroundColor: 'transparent' }}
    >
      <header className={classes.header}
        style={{
          borderBottom: isHome ? 'none' : `none`,
          backgroundColor: isHome ? 'transparent' : '#333333',
          position: isHome ? 'absolute' : 'relative',
          width: '100%',
          zIndex: 1000,
        }}
      >
        <Group justify="space-between" h="100%">
          <a href="/" className="logo" style={{ display: 'flex', alignItems: 'normal', textDecoration: 'none' }}>
            <span style={{ marginTop: 8, marginLeft: 10, color: 'rgb(255, 255, 255)', fontSize: 19, fontWeight: 600, textDecoration: 'none' }}>UCL</span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 2 22"
              style={{
                display: 'inline-block',
                marginLeft: '10px', /* Adjust spacing between logo and line */
                height: '28px',
                width: '3px',
                fill: '#34C6C6',
                marginTop: '6px',
                backgroundColor: '#34C6C6', /* Matches logo's color */
              }}
            >
            </svg>
            <span
              style={{
                marginTop: '10px',
                marginLeft: '10px', // Adjust spacing between line and text
                color: '#ffffff', // Text color
                fontSize: '17px', // Adjust text size
                fontWeight: 'normal', // Make the text bold
                textDecoration: 'none', // Remove underline
              }}

            >
              Living Lab
            </span>
          </a>

          {/* <Text fw={700} size="lg">
            Living Lab
          </Text> */}

          <Group h="100%" gap={0} visibleFrom="sm">
            <NavLink to="/" className={classes.link}>
              Home
            </NavLink>

            <HoverCard
              openDelay={100} closeDelay={300}
              width={600} position="bottom"
              radius="md" shadow="md"
              transitionProps={{ transition: 'fade-down' }}
              offset={20}
              withinPortal>
              <HoverCard.Target>
                <NavLink to="/data-menu" className={classes.link}>
                  <Center inline>
                    <Box component="span" mr={5}>
                      Data menu
                    </Box>
                    <IconChevronDown size={16} color={'#34C6C6'} />
                  </Center>
                </NavLink>
              </HoverCard.Target>

              <HoverCard.Dropdown style={{ overflow: 'hidden' }}>
                <Group justify="space-between" px="md">
                  <Text fw={500}>Latest tags</Text>
                </Group>
                <Divider color={'#888888'} my="xs" size={'xs'} />
                <SimpleGrid cols={2} spacing={0}>
                  {links}
                </SimpleGrid>
              </HoverCard.Dropdown>
            </HoverCard>

            <NavLink to="/showcases" className={classes.link}>
              Showcases
            </NavLink>
            <NavLink to="/about" className={classes.link}>
              About
            </NavLink>
          </Group>

          <Group >
            <Button
              variant="outline"
              style={{
                color: '#ffffffdd',
                backgroundColor: 'transparent',
                border: '1px solid #ffffff00',
                fontWeight: 'normal',
                padding: '2px 0px',
                transition: 'all 0.3s ease',
                fontSize: '13px',
                visibility: 'hidden'
              }}
              onClick={openModal}>
              {version}
            </Button>
            {isAuthenticated && user?.isAdmin && (<UnstyledButton component={NavLink}
              to="/admin"
              className={cx(classes.menu, { [classes.menuActive]: adminMenuOpened })}
            >
              <Group gap={7}>
                <IconSettings radius="xl" size={24} />
                <Text fw={500} size="sm" lh={1} mr={3}>
                  Admin
                </Text>
              </Group>
            </UnstyledButton>)}
            {isAuthenticated && (<Menu
              width={260}
              position="bottom-end"
              transitionProps={{ transition: 'pop-top-right' }}
              onClose={() => setDashboardMenuOpened(false)}
              onOpen={() => setDashboardMenuOpened(true)}
              withinPortal
              offset={20}
              trigger="hover" openDelay={100} closeDelay={300}
            >
              <Menu.Target>
                <UnstyledButton
                  className={cx(classes.menu, { [classes.menuActive]: dashboardMenuOpened })}
                >
                  <Group gap={7}>
                    <IconLayoutDashboardFilled radius="xl" size={24} />
                    <Text fw={500} size="sm" lh={1} mr={3}>
                      My items
                    </Text>
                    <IconChevronDown size={12} stroke={1.5} />
                  </Group>
                </UnstyledButton>
              </Menu.Target>
              <Menu.Dropdown >{myDashboardMenuItems}</Menu.Dropdown>
            </Menu>)}
            {isAuthenticated ? (
              <Menu
                width={260}
                position="bottom-end"
                transitionProps={{ transition: 'pop-top-right' }}
                onClose={() => setUserMenuOpened(false)}
                onOpen={() => setUserMenuOpened(true)}
                trigger="hover" openDelay={100} closeDelay={100}
                offset={20}
                withinPortal
              >
                <Menu.Target>
                  <UnstyledButton
                    className={cx(classes.menu, { [classes.menuActive]: userMenuOpened })}
                  >
                    <Group gap={7}>
                      <IconUserCircle radius="xl" size={24} />
                      <Text fw={500} size="sm" lh={1} mr={3}>
                        {user?.firstName ? user.firstName : 'User'}
                      </Text>
                      <IconChevronDown size={12} stroke={1.5} />
                    </Group>
                  </UnstyledButton>
                </Menu.Target>
                <Menu.Dropdown >{userMenuItems}</Menu.Dropdown>
              </Menu>
            ) : (
              <Button
                variant="outline"
                style={{ color: '#ffffff', border: '1px solid #fff' }}
                component={NavLink}
                to="/signin"
              >
                Sign In
              </Button>
            )}

          </Group>
        </Group>
      </header>
      <Modal opened={modalOpened} onClose={closeModal} c='#34C6C6' className={classes.modalcustom} // Use the custom class here
        title="Changelog" size="md" zIndex={999999} centered>
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

      <Drawer
        opened={drawerOpened}
        onClose={closeDrawer}
        size="100%"
        padding="md"
        title="Navigation"
        hiddenFrom="sm"
        zIndex={1000000}
        position="right"
      >
        <ScrollArea h="calc(100vh - 80px)" mx="-md">
          <Divider my="sm" />

          <NavLink to="/" className={classes.link}>
            Home
          </NavLink>
          <UnstyledButton className={classes.link} onClick={toggleLinks}>
            <Center inline>
              <Box component="span" mr={5}>
                Features
              </Box>
              <IconChevronDown size={16} color={theme.colors.blue[6]} />
            </Center>
          </UnstyledButton>
          <Collapse in={linksOpened}>{links}</Collapse>
          <NavLink to="/learn" className={classes.link}>
            Learn
          </NavLink>
          <NavLink to="/academy" className={classes.link}>
            Academy
          </NavLink>

          <Divider my="sm" />

          <Group justify="center" grow pb="xl" px="md">
            <Button variant="default" component={NavLink} to="/login">
              Log in
            </Button>
            <Button component={NavLink} to="/signup">
              Sign up
            </Button>
          </Group>
        </ScrollArea>
      </Drawer>
    </Box>
  );
}