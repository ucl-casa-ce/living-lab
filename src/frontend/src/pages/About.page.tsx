import { useSettings } from '@/context/SettingsContext';
import { Container, Title, Text, Space, Divider, Paper, Stack, Image } from '@mantine/core';

export function AboutPage() {
    const { settings } = useSettings();

    return (
        <Container size="md" py="xl">
            <Title order={2} mb="xl">
                Living Lab
            </Title>
            <Image
                src="/imgs/qeop-hero7.jpg"
                alt="Queen Elizabeth Olympic Park"
                radius="md"
                h={400}
                fit="cover"
                mb="xl"
                style={{
                    objectPosition: 'center 30%',
                    boxShadow: '0 4px 32px rgba(0,0,0,0.18)',
                }}
            />
            {settings?.about
                ? (
                    <div dangerouslySetInnerHTML={{ __html: settings.about }} />
                )
                : (
                    <>
                        <Paper withBorder shadow="sm" p="lg" radius="md">
                            <Stack >
                                <Text size="lg" fw={500}>
                                    A Roadmap for a Smarter, Greener, Inclusive Future
                                </Text>
                                <Text>
                                    Living Lab is an ambitious digital ecosystem initiative based at the Queen Elizabeth Olympic Park (QEOP). Built on the legacy of the 2012 Olympic and Paralympic Games, it aims to transform the park into a living laboratory for data-driven innovation, sustainability, and inclusive urban development.
                                </Text>
                                <Text>
                                    At its core, LLDC fosters a new model for real-time, spatially aware digital infrastructure—one that empowers policy-makers, startups, academic researchers, and local communities alike. Through the integration of live data, digital twins, and collaborative tools, it offers a template for a more informed, responsive, and equitable governance system.
                                </Text>
                            </Stack>
                        </Paper>

                        <Divider my="xl" label="Strategic Themes" labelPosition="center" />

                        <Stack>
                            <Paper withBorder p="md" radius="md">
                                <Title order={2}>1. Digital Integration</Title>
                                <Text mt="sm">
                                    The platform unites diverse data sources from QEOP—including IoT sensor data, GIS assets, and operational building metrics—into a cohesive interface. It facilitates testing and development of smart solutions by startups and SMEs, while also providing decision-grade insights for public sector procurement.
                                </Text>
                                <Text mt="sm">
                                    Through real-time data fusion and 3D modeling, LLDC enables a seamless onboarding experience for innovators and fosters transparent lifecycle tracking of technological solutions, from prototype to deployment.
                                </Text>
                            </Paper>

                            <Paper withBorder p="md" radius="md">
                                <Title order={2}>2. Inclusivity</Title>
                                <Text mt="sm">
                                    LLDC places community participation at the heart of its mission. By facilitating co-design processes and digital literacy programs, it ensures the voices of East London's diverse communities shape the evolution of the park’s innovation environment.
                                </Text>
                                <Text mt="sm">
                                    From local ambassadors to accessible interfaces and transparent governance structures, inclusivity is embedded across the platform—cultivating trust, ownership, and civic empowerment.
                                </Text>
                            </Paper>

                            <Paper withBorder p="md" radius="md">
                                <Title order={2}>3. Environment</Title>
                                <Text mt="sm">
                                    LLDC is a platform for sustainable action. It leverages environmental data in real-time—on energy, biodiversity, water, and climate—to guide conservation, circular economy models, and resilient urban design.
                                </Text>
                                <Text mt="sm">
                                    Collaborations with energy innovators, implementation of nature-based solutions, and public engagement in ecological stewardship all converge to create tangible environmental and socioeconomic value.
                                </Text>
                            </Paper>
                        </Stack>

                        <Divider my="xl" label="Platform Capabilities & Impact" labelPosition="center" />

                        <Paper withBorder p="md" radius="md">
                            <Text>
                                Living Lab supports a variety of users, from city authorities to citizen scientists. Key platform functions include:
                            </Text>
                            <ul>
                                <li><Text>Data visualization and real-time analytics</Text></li>
                                <li><Text>Stakeholder-specific dashboards and tools</Text></li>
                                <li><Text>Public data contribution and storytelling via the "Wisdom" interface</Text></li>
                                <li><Text>Policy impact assessments and innovation tracking</Text></li>
                            </ul>
                            <Text mt="sm">
                                Through carefully curated architecture and governance models, LLDC balances technical excellence with social and environmental responsibility.
                            </Text>
                        </Paper>

                        <Divider my="xl" label="Looking Ahead" labelPosition="center" />

                        <Paper withBorder p="md" radius="md">
                            <Text>
                                By 2030, Living Lab aims to be a replicable, open-source data model for smart, inclusive, and sustainable urban spaces across the UK. Beyond that, it envisions a global network of Living Lab hubs—co-creating a resilient digital future that values people, planet, and progress.
                            </Text>
                            <Text mt="sm" c="dimmed">
                                © 2025 Living Lab | Powered by the Connected Environments Lab, UCL, Arup, and community partners
                            </Text>
                        </Paper>
                    </>
                )
            }
        </Container>
    );
}
