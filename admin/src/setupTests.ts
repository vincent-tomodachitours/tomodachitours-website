// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
    constructor() { }
    disconnect() { }
    observe() { }
    unobserve() { }
};

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
    constructor() { }
    disconnect() { }
    observe() { }
    unobserve() { }
};

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation(query => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: jest.fn(), // deprecated
        removeListener: jest.fn(), // deprecated
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
    })),
});

// Mock URL.createObjectURL and URL.revokeObjectURL for file download tests
global.URL.createObjectURL = jest.fn(() => 'mocked-url');
global.URL.revokeObjectURL = jest.fn();

// Mock document.createElement for download tests
const originalCreateElement = document.createElement;
document.createElement = jest.fn().mockImplementation((tagName) => {
    if (tagName === 'a') {
        return {
            setAttribute: jest.fn(),
            click: jest.fn(),
            style: {},
            href: '',
            download: ''
        };
    }
    return originalCreateElement.call(document, tagName);
});

// Mock document.body.appendChild and removeChild for download tests
document.body.appendChild = jest.fn();
document.body.removeChild = jest.fn();