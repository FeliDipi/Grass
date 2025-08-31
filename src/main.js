import { jsx as _jsx } from "react/jsx-runtime";
import { createRoot } from 'react-dom/client';
import App from './App';
const rootEl = document.getElementById('root');
if (!rootEl)
    throw new Error('Root element #root not found');
createRoot(rootEl).render(_jsx(App, {}));
