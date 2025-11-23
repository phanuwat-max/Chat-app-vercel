// frontend/__tests__/LoginScreen.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import LoginScreen from '../components/LoginScreen';
import axios from 'axios';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('LoginScreen Component', () => {
    const mockOnLoginSuccess = jest.fn();
    const API_BASE_URL = 'http://localhost:3001';

    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('renders login form by default', () => {
        render(<LoginScreen API_BASE_URL={API_BASE_URL} onLoginSuccess={mockOnLoginSuccess} />);

        expect(screen.getByPlaceholderText('Username')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Password')).toBeInTheDocument();
        expect(screen.getByText('ENTER ZONE')).toBeInTheDocument();
    });

    test('switches to register mode when clicking toggle button', () => {
        render(<LoginScreen API_BASE_URL={API_BASE_URL} onLoginSuccess={mockOnLoginSuccess} />);

        const toggleButton = screen.getByText(/New here\? Create Account/i);
        fireEvent.click(toggleButton);

        expect(screen.getByPlaceholderText('Confirm Password')).toBeInTheDocument();
        expect(screen.getByText('CREATE ACCOUNT')).toBeInTheDocument();
    });

    test('shows error when passwords do not match in register mode', async () => {
        render(<LoginScreen API_BASE_URL={API_BASE_URL} onLoginSuccess={mockOnLoginSuccess} />);

        // Switch to register mode
        const toggleButton = screen.getByText(/New here\? Create Account/i);
        fireEvent.click(toggleButton);

        // Fill in form with mismatched passwords
        const usernameInput = screen.getByPlaceholderText('Username');
        const passwordInput = screen.getByPlaceholderText(/^Password$/);
        const confirmPasswordInput = screen.getByPlaceholderText('Confirm Password');
        const submitButton = screen.getByText('CREATE ACCOUNT');

        fireEvent.change(usernameInput, { target: { value: 'testuser' } });
        fireEvent.change(passwordInput, { target: { value: 'password123' } });
        fireEvent.change(confirmPasswordInput, { target: { value: 'password456' } });
        fireEvent.click(submitButton);

        await waitFor(() => {
            expect(screen.getByText('Passwords do not match.')).toBeInTheDocument();
        });
    });

    test('calls API and onLoginSuccess when login is successful', async () => {
        mockedAxios.post.mockResolvedValueOnce({
            status: 200,
            data: { userId: 'user1', userName: 'TestUser' }
        });

        render(<LoginScreen API_BASE_URL={API_BASE_URL} onLoginSuccess={mockOnLoginSuccess} />);

        const usernameInput = screen.getByPlaceholderText('Username');
        const passwordInput = screen.getByPlaceholderText('Password');
        const submitButton = screen.getByText('ENTER ZONE');

        fireEvent.change(usernameInput, { target: { value: 'TestUser' } });
        fireEvent.change(passwordInput, { target: { value: 'password123' } });
        fireEvent.click(submitButton);

        await waitFor(() => {
            expect(mockedAxios.post).toHaveBeenCalledWith(
                `${API_BASE_URL}/login`,
                { name: 'TestUser', password: 'password123' }
            );
            expect(mockOnLoginSuccess).toHaveBeenCalledWith('user1', 'TestUser');
        });
    });

    test('shows error message when login fails', async () => {
        mockedAxios.post.mockRejectedValueOnce({
            response: { data: { error: 'Invalid password.' } }
        });

        render(<LoginScreen API_BASE_URL={API_BASE_URL} onLoginSuccess={mockOnLoginSuccess} />);

        const usernameInput = screen.getByPlaceholderText('Username');
        const passwordInput = screen.getByPlaceholderText('Password');
        const submitButton = screen.getByText('ENTER ZONE');

        fireEvent.change(usernameInput, { target: { value: 'TestUser' } });
        fireEvent.change(passwordInput, { target: { value: 'wrongpassword' } });
        fireEvent.click(submitButton);

        await waitFor(() => {
            expect(screen.getByText('Invalid password.')).toBeInTheDocument();
        });
    });

    test('calls register API when in register mode', async () => {
        mockedAxios.post.mockResolvedValueOnce({
            status: 201,
            data: { userId: 'user2', userName: 'NewUser' }
        });

        render(<LoginScreen API_BASE_URL={API_BASE_URL} onLoginSuccess={mockOnLoginSuccess} />);

        // Switch to register mode
        const toggleButton = screen.getByText(/New here\? Create Account/i);
        fireEvent.click(toggleButton);

        const usernameInput = screen.getByPlaceholderText('Username');
        const passwordInput = screen.getByPlaceholderText(/^Password$/);
        const confirmPasswordInput = screen.getByPlaceholderText('Confirm Password');
        const submitButton = screen.getByText('CREATE ACCOUNT');

        fireEvent.change(usernameInput, { target: { value: 'NewUser' } });
        fireEvent.change(passwordInput, { target: { value: 'password123' } });
        fireEvent.change(confirmPasswordInput, { target: { value: 'password123' } });
        fireEvent.click(submitButton);

        await waitFor(() => {
            expect(mockedAxios.post).toHaveBeenCalledWith(
                `${API_BASE_URL}/register`,
                { name: 'NewUser', password: 'password123' }
            );
            expect(mockOnLoginSuccess).toHaveBeenCalledWith('user2', 'NewUser');
        });
    });

    test('disables submit button while loading', async () => {
        mockedAxios.post.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 1000)));

        render(<LoginScreen API_BASE_URL={API_BASE_URL} onLoginSuccess={mockOnLoginSuccess} />);

        const usernameInput = screen.getByPlaceholderText('Username');
        const passwordInput = screen.getByPlaceholderText('Password');
        const submitButton = screen.getByText('ENTER ZONE');

        fireEvent.change(usernameInput, { target: { value: 'TestUser' } });
        fireEvent.change(passwordInput, { target: { value: 'password123' } });
        fireEvent.click(submitButton);

        expect(submitButton).toBeDisabled();
        expect(screen.getByText('LOADING...')).toBeInTheDocument();
    });

    test('clears form when switching between login and register modes', () => {
        render(<LoginScreen API_BASE_URL={API_BASE_URL} onLoginSuccess={mockOnLoginSuccess} />);

        const usernameInput = screen.getByPlaceholderText('Username') as HTMLInputElement;
        const passwordInput = screen.getByPlaceholderText('Password') as HTMLInputElement;

        // Fill in login form
        fireEvent.change(usernameInput, { target: { value: 'TestUser' } });
        fireEvent.change(passwordInput, { target: { value: 'password123' } });

        expect(usernameInput.value).toBe('TestUser');
        expect(passwordInput.value).toBe('password123');

        // Switch to register mode
        const toggleButton = screen.getByText(/New here\? Create Account/i);
        fireEvent.click(toggleButton);

        // Form should be cleared
        expect(usernameInput.value).toBe('');
        expect(passwordInput.value).toBe('');
    });
});
