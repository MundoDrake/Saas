/* @refresh reload */
import { render } from 'solid-js/web';
import App from './App';
import './styles/index.css';
import './styles/kanban.css';
import './styles/uploads.css';
import './styles/timesheet.css';
import './styles/finance.css';
import './styles/profile.css';
import './styles/templates.css';
import './styles/dashboard.css';
import './styles/brand.css';
import './styles/reports.css';

const root = document.getElementById('root');

if (!root) {
    throw new Error('Root element not found');
}

render(() => <App />, root);
