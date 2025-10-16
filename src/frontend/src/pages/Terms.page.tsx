import { useSettings } from '@/context/SettingsContext';
import { Container, Text, Title, Space, List } from '@mantine/core';

export function TermsPage() {
    const { settings } = useSettings();

    return (
        <Container mb="xl" size="md" style={{ marginTop: '50px' }}>
            <Title order={2} mb="md">Terms of Use</Title>
            {settings?.terms_and_conditions
                ? (
                    <div dangerouslySetInnerHTML={{ __html: settings.terms_and_conditions }} />
                )
                : (
                    <>
                        <Title order={3} mt="md" mb="xs">Introduction</Title>
                        <Text>
                            Welcome to the Living Lab Platform. By accessing and using data sets available on this platform, you agree to comply with these Terms of Use. These terms outline the rules for using both open data sets under standard licenses and closed data sets subject to specific agreements.
                        </Text>

                        <Title order={3} mt="md" mb="xs">Categories of Data</Title>
                        <Text>Living Lab provides access to data under two primary categories:</Text>
                        <List withPadding>
                            <List.Item>
                                <Text fw={500}>Open Data Sets:</Text> These data sets are made available under standard open licenses such as MIT, Creative Commons (CC), or Open Government Licence (OGL).
                            </List.Item>
                            <List.Item>
                                <Text fw={500}>Closed Data Sets:</Text> These data sets require specific agreements for access and use. They may be subject to restrictions based on the data provider’s requirements and intended use cases.
                            </List.Item>
                        </List>

                        <Title order={3} mt="md" mb="xs">Use of Open Data Sets</Title>
                        <Text>Users accessing open data sets agree to:</Text>
                        <List withPadding>
                            <List.Item>Adhere to the terms of the associated open license, ensuring proper attribution where required.</List.Item>
                            <List.Item>Not use the data in a way that misrepresents the source or its accuracy.</List.Item>
                            <List.Item>Not impose any additional restrictions on the redistribution of the data in its original form.</List.Item>
                        </List>

                        <Title order={3} mt="md" mb="xs">Use of Closed Data Sets</Title>
                        <Text>Users accessing closed data sets must:</Text>
                        <List withPadding>
                            <List.Item>Enter into a specific agreement with Living Lab or the data provider outlining permissible use cases.</List.Item>
                            <List.Item>Use the data strictly for the agreed purposes and not share it with unauthorized parties.</List.Item>
                            <List.Item>Comply with any confidentiality, security, or ethical requirements imposed by the data provider.</List.Item>
                        </List>

                        <Title order={3} mt="md" mb="xs">Data Integrity and Responsibility</Title>
                        <List withPadding>
                            <List.Item>Living Lab does not guarantee the accuracy, completeness, or reliability of any data set.</List.Item>
                            <List.Item>Users are responsible for verifying data suitability for their intended application.</List.Item>
                            <List.Item>Users must not manipulate or alter data in a misleading manner.</List.Item>
                        </List>

                        <Title order={3} mt="md" mb="xs">Compliance and Enforcement</Title>
                        <List withPadding>
                            <List.Item>Any misuse of data may result in suspension or termination of access.</List.Item>
                            <List.Item>Living Lab reserves the right to audit data usage to ensure compliance with these terms.</List.Item>
                            <List.Item>Users must comply with all applicable laws and regulations regarding data usage and privacy.</List.Item>
                        </List>

                        <Title order={3} mt="md" mb="xs">Liability</Title>
                        <List withPadding>
                            <List.Item>Living Lab and its data providers disclaim all liability for any direct, indirect, incidental, or consequential damages arising from the use of data sets.</List.Item>
                            <List.Item>Users assume full responsibility for any outcomes resulting from the use of the data.</List.Item>
                            <List.Item>Living Lab is not responsible for any third-party claims or losses incurred due to reliance on the data.</List.Item>
                        </List>

                        <Title order={3} mt="md" mb="xs">Modifications to Terms</Title>
                        <Text>
                            Living Lab reserves the right to update these terms at any time. Continued use of the platform signifies acceptance of any modifications.
                        </Text>
                    </>
                )
            }
        </Container>
    );
}
