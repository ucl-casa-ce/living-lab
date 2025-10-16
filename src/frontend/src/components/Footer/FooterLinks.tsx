import { IconBrandInstagram, IconBrandTwitter, IconBrandYoutube } from '@tabler/icons-react';
import { ActionIcon, Container, Group, Text, Image } from '@mantine/core';
import { MantineLogo } from '@mantinex/mantine-logo';
import { Link as RouterLink } from 'react-router-dom';
import classes from './FooterLinks.module.css';

const data = [
  {
    title: 'Links',
    links: [
      { label: 'Home', link: '/' },
      { label: 'Data menu', link: '/data-menu' },
      { label: 'Showcases', link: '/showcases' },
      { label: 'About', link: '/about' },
      { label: 'Terms of Service', link: '/terms' },
    ],
  },
  {
    title: 'Open Source',
    links: [
      { label: 'GitHub repository', link: 'https://github.com/syk-yaman/digital-frontiers' },
      { label: 'GitHub discussions', link: 'https://github.com/syk-yaman/digital-frontiers/issues' },
    ],
  },
  {
    title: 'Stay in touch',
    links: [
      { label: 'X', link: 'https://twitter.com/casaucl' },
      { label: 'Instagram', link: 'https://www.instagram.com/uclcelab/' },
      { label: 'LinkedIn', link: 'https://www.linkedin.com/company/centre-for-advanced-spatial-analysis' },
    ],
  },
];

export function FooterLinks() {
  const groups = data.map((group) => {
    const links = group.links.map((link, index) => {
      // Use RouterLink for internal links, <a> for external
      const isExternal = link.link.startsWith('http');
      if (isExternal) {
        return (
          <Text<'a'>
            key={index}
            className={classes.link}
            component="a"
            href={link.link}
            target="_blank"
            rel="noopener noreferrer"
            c="white"
          >
            {link.label}
          </Text>
        );
      } else {
        return (
          <Text
            key={index}
            className={classes.link}
            component={RouterLink}
            to={link.link}
            c="white"
          >
            {link.label}
          </Text>
        );
      }
    });

    return (
      <div className={classes.wrapper} key={group.title}>
        <Text className={classes.title} c="white">{group.title}</Text>
        {links}
      </div>
    );
  });

  return (
    <footer style={{ backgroundColor: '#333333' }} className={classes.footer}>
      <Container className={classes.inner}>
        <div className={classes.logo}>
          <Image
            src="imgs/apple-touch-icon.png"
            alt="Sample"
            style={{
              width: '89px',
            }}
          />

          <Text fw={700} c="#34C6C6" size="lg">Living Lab</Text>

          <Text size="s" c="white" className={classes.description}>
            UCL Living lab, an 10-years evolving data platform
          </Text>
        </div>
        <div className={classes.groups}>{groups}</div>
      </Container>
      <Container className={classes.afterFooter}>
        <Text c="white" size="sm">
          <span style={{ color: '#34C6C6' }}>©</span> {new Date().getFullYear()} Powered by Connected Environments Lab.  All rights reserved.
        </Text>
      </Container>
    </footer>
  );
}