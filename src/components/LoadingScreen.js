import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import './LoadingScreen.css';
const LoadingScreen = ({ onFadeComplete }) => {
    const [isFading, setIsFading] = useState(false);
    useEffect(() => {
        const timer = setTimeout(() => {
            setIsFading(true);
            // Wait for the fade animation to complete before calling onFadeComplete
            setTimeout(onFadeComplete, 500);
        }, 1500);
        return () => clearTimeout(timer);
    }, [onFadeComplete]);
    return (_jsx("div", { className: `loading-screen ${isFading ? 'fade-out' : ''}`, children: _jsxs("div", { className: "loading-content", children: [_jsx("img", { src: "/favicon.png", alt: "Loading...", className: "loading-icon" }), _jsx("h1", { className: "loading-title", children: "Recombyne" }), _jsx("p", { className: "loading-subtitle", children: "Redefining Plasmid Design" })] }) }));
};
export default LoadingScreen;
