import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }
    static getDerivedStateFromError(error) {
        // Update state so the next render will show the fallback UI
        return { hasError: true, error };
    }
    componentDidCatch(error, errorInfo) {
        // Log the error to console or an error reporting service
        console.error("Error caught by boundary:", error, errorInfo);
        this.setState({ errorInfo });
    }
    render() {
        if (this.state.hasError) {
            return (_jsxs("div", { className: "error-container", children: [_jsx("h2", { children: "Something went wrong" }), _jsxs("details", { children: [_jsx("summary", { children: "See error details" }), _jsx("p", { children: this.state.error && this.state.error.toString() }), _jsx("p", { children: this.state.errorInfo && this.state.errorInfo.componentStack })] }), _jsx("button", { onClick: () => window.location.reload(), style: {
                            marginTop: 20,
                            padding: '8px 16px',
                            backgroundColor: '#0F518A',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer'
                        }, children: "Reload Page" })] }));
        }
        return this.props.children;
    }
}
export default ErrorBoundary;
