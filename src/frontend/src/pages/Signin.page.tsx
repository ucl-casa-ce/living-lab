import { useState, useContext } from 'react';
import axiosInstance, { plainAxios } from '@/utils/axiosInstance';
import {
    Container,
    Text,
    Center,
    SegmentedControl,
    TextInput,
    PasswordInput,
    Group,
    Select,
    Checkbox,
    Button,
    Space,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { Notifications, notifications } from '@mantine/notifications';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '@/context/AuthContext';

export function SigninPage() {
    const [view, setView] = useState('sign-in'); // Toggle between 'sign-in' and 'sign-up'
    const navigate = useNavigate();
    const authContext = useContext(AuthContext); // Access AuthContext

    const form = useForm({
        initialValues: {
            email: '',
            password: '',
            firstName: '',
            lastName: '',
            company: '',
            confirmPassword: '',
            type: '',
            termsAccepted: false,
        },
        validate: {
            email: (value) => (/^\S+@\S+$/.test(value) ? null : 'Invalid email'),
            password: (value) => (value.length >= 6 ? null : 'Password must be at least 6 characters'),
            confirmPassword: (value, values) =>
                value === values.password ? null : 'Passwords do not match',
            firstName: (value) => (value.length > 0 ? null : 'First name is required'),
            lastName: (value) => (value.length > 0 ? null : 'Last name is required'),
            company: (value) => (value.length > 0 ? null : 'Company/University is required'),
            type: (value) => (value ? null : 'Please select your work type'),
            termsAccepted: (value) =>
                value ? null : 'You must accept the terms and conditions',
        },
    });

    const handleSignIn = () => {
        plainAxios
            .post(`/auth/signin`, {
                email: form.values.email,
                password: form.values.password,
            })
            .then((response) => {
                notifications.show({
                    title: 'Success',
                    message: 'Sign-in successful!',
                    color: 'green',
                });
                console.log('Sign-in response:', response.data);

                const { access_token } = response.data;

                // Save the JWT token to localStorage
                localStorage.setItem('authToken', access_token);

                // Update the AuthContext
                authContext?.login(access_token);

                setTimeout(() => {
                    navigate('/');
                }, 1000); // 1-second delay
            })
            .catch((error) => {
                notifications.show({
                    title: 'Error',
                    message: error.response?.data?.message || 'Sign-in failed. Please check your credentials.',
                    color: 'red',
                });
                console.error('Sign-in error:', error);
            });
    };

    const handleSignUp = () => {
        if (!form.validate().hasErrors) {
            axiosInstance
                .post(`/auth/signup`, {
                    email: form.values.email,
                    password: form.values.password,
                    firstName: form.values.firstName,
                    lastName: form.values.lastName,
                    company: form.values.company,
                    type: form.values.type,
                })
                .then((response) => {
                    notifications.show({
                        title: 'Success',
                        message: 'Sign-up successful! You can now sign in using the email and password provided.',
                        color: 'green',
                    });
                    console.log('Sign-up response:', response.data);
                    setView('sign-in'); // Switch to sign-in view after successful sign-up
                })
                .catch((error) => {
                    notifications.show({
                        title: 'Error',
                        message: error.response?.data?.message || 'Sign-up failed. Please try again.',
                        color: 'red',
                    });
                    console.error('Sign-up error:', error);
                });
        }
    };

    return (
        <Container size={500} style={{ marginTop: '50px' }} mb={'xl'}>
            <Center>
                <Text size="xl">
                    {view === 'sign-in' ? 'Sign In' : 'Sign Up'}
                </Text>
            </Center>

            <Space h="md" />

            <Center>
                <SegmentedControl
                    color="blue"
                    value={view}
                    onChange={setView}
                    data={[
                        { value: 'sign-in', label: 'Sign In' },
                        { value: 'sign-up', label: 'Sign Up' },
                    ]}
                />
            </Center>

            <Space h="md" />

            {view === 'sign-in' ? (
                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        handleSignIn();
                    }}
                >
                    <TextInput
                        label="Email"
                        placeholder="Enter your email"
                        type="email"
                        required
                        {...form.getInputProps('email')}
                        mb="md"
                    />
                    <PasswordInput
                        label="Password"
                        placeholder="Enter your password"
                        required
                        {...form.getInputProps('password')}
                        mb="md"
                    />
                    <Button fullWidth variant="filled" color="blue" mt="lg" type="submit">
                        Sign In
                    </Button>
                </form>
            ) : (
                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        handleSignUp();
                    }}
                >
                    <Group grow>
                        <TextInput
                            label="First Name"
                            placeholder="Enter your first name"
                            required
                            {...form.getInputProps('firstName')}
                        />
                        <TextInput
                            label="Last Name"
                            placeholder="Enter your last name"
                            required
                            {...form.getInputProps('lastName')}
                        />
                    </Group>
                    <Space h="md" />
                    <TextInput
                        label="Company/University"
                        placeholder="Enter your company name"
                        required
                        {...form.getInputProps('company')}
                        mb="md"
                    />
                    <TextInput
                        label="Email"
                        placeholder="Enter your email"
                        type="email"
                        required
                        {...form.getInputProps('email')}
                        mb="md"
                    />
                    <PasswordInput
                        label="Password"
                        placeholder="Enter your password"
                        required
                        {...form.getInputProps('password')}
                        mb="md"
                    />
                    <PasswordInput
                        label="Re-enter Password"
                        placeholder="Re-enter your password"
                        required
                        {...form.getInputProps('confirmPassword')}
                        mb="md"
                    />
                    <Select
                        label="Where do you work?"
                        placeholder="Select an option"
                        data={[
                            { value: 'public_sector', label: 'Public Sector' },
                            { value: 'sme', label: 'SME' },
                            { value: 'large_business', label: 'Large Business' },
                            { value: 'university', label: 'University' },
                            { value: 'citizen_scientist', label: 'Citizen Scientist' },
                            { value: 'none', label: 'None of the above' },
                        ]}
                        required
                        {...form.getInputProps('type')}
                        mb="md"
                    />
                    <Checkbox
                        label="By signing up to the Living Lab Platform,
                         you agree to:"
                        required
                        {...form.getInputProps('termsAccepted', { type: 'checkbox' })}
                        mb="xs"
                    />
                    <Text c="dimmed" size="sm" ml={"xl"}>
                        Comply with the Terms of Use which govern the use of both open data (under standard licenses, reflecting our commitment to open access)
                        and closed data (requiring specific agreements), and outline responsibilities,
                        compliance requirements, liability disclaimers, and Living Lab's right to modify
                        the terms. <Link target={"_blank"} to="/terms" style={{ color: '#1E90FF', textDecoration: 'underline' }}>Read the full terms from here.</Link>
                    </Text>
                    <Button fullWidth variant="filled" color="blue" mt="lg" type="submit">
                        Sign Up
                    </Button>
                </form>
            )}
        </Container>
    );
}
