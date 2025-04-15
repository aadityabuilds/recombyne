import { jsx as _jsx } from "react/jsx-runtime";
import './TextShimmer.css';
const TextShimmer = ({ text = "Thinking..." }) => {
    return (_jsx("div", { className: "text-shimmer", children: _jsx("div", { className: "shimmer-text", children: text }) }));
};
export default TextShimmer;
