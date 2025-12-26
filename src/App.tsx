import { Component } from 'solid-js';
import { Router, Route, Navigate } from '@solidjs/router';
import { AuthProvider } from './contexts/AuthContext';
import { ProfileProvider } from './contexts/ProfileContext';
import { TimerProvider } from './contexts/TimerContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { TimerPopup } from './components/TimerPopup';
import { LoginPage } from './pages/LoginPage';
import { SignUpPage } from './pages/SignUpPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { ResetPasswordPage } from './pages/ResetPasswordPage';
import { DashboardPage } from './pages/DashboardPage';
import { ClientsPage } from './pages/ClientsPage';
import { ClientFormPage } from './pages/ClientFormPage';
import { ClientDetailPage } from './pages/ClientDetailPage';
import { ProjectsPage } from './pages/ProjectsPage';
import { ProjectFormPage } from './pages/ProjectFormPage';
import { ProjectDetailPage } from './pages/ProjectDetailPage';
import { TaskFormPage } from './pages/TaskFormPage';
import { TimesheetPage } from './pages/TimesheetPage';
import { FinancePage } from './pages/FinancePage';
import { FinanceFormPage } from './pages/FinanceFormPage';
import { ProfilePage } from './pages/ProfilePage';
import { TemplatesPage } from './pages/TemplatesPage';
import { TemplateFormPage } from './pages/TemplateFormPage';
import { BrandStrategyPage } from './pages/BrandStrategyPage';
import { BrandColorsPage } from './pages/BrandColorsPage';
import { BrandTypographyPage } from './pages/BrandTypographyPage';
import { BrandVoicePage } from './pages/BrandVoicePage';
import { BrandAssetsPage } from './pages/BrandAssetsPage';
import { BrandGuidelinesPage } from './pages/BrandGuidelinesPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { ReportsTimesheetPage } from './pages/ReportsTimesheetPage';
import { ReportsFinancePage } from './pages/ReportsFinancePage';
import { GlobalKanbanPage } from './pages/GlobalKanbanPage';

const ProtectedLayout: Component<{ children: any }> = (props) => (
    <ProtectedRoute>
        <ProfileProvider>
            <TimerProvider>
                {props.children}
                <TimerPopup />
            </TimerProvider>
        </ProfileProvider>
    </ProtectedRoute>
);

const App: Component = () => {
    return (
        <AuthProvider>
            <Router>
                <Route path="/" component={() => <Navigate href="/dashboard" />} />
                <Route path="/login" component={LoginPage} />
                <Route path="/signup" component={SignUpPage} />
                <Route path="/forgot-password" component={ForgotPasswordPage} />
                <Route path="/reset-password" component={ResetPasswordPage} />
                <Route
                    path="/dashboard"
                    component={() => (
                        <ProtectedLayout>
                            <DashboardPage />
                        </ProtectedLayout>
                    )}
                />
                <Route
                    path="/kanban"
                    component={() => (
                        <ProtectedLayout>
                            <GlobalKanbanPage />
                        </ProtectedLayout>
                    )}
                />
                <Route
                    path="/analytics"
                    component={() => (
                        <ProtectedLayout>
                            <AnalyticsPage />
                        </ProtectedLayout>
                    )}
                />
                <Route
                    path="/reports/timesheet"
                    component={() => (
                        <ProtectedLayout>
                            <ReportsTimesheetPage />
                        </ProtectedLayout>
                    )}
                />
                <Route
                    path="/reports/finance"
                    component={() => (
                        <ProtectedLayout>
                            <ReportsFinancePage />
                        </ProtectedLayout>
                    )}
                />
                {/* Clients Routes */}
                <Route
                    path="/clients"
                    component={() => (
                        <ProtectedLayout>
                            <ClientsPage />
                        </ProtectedLayout>
                    )}
                />
                <Route
                    path="/clients/new"
                    component={() => (
                        <ProtectedLayout>
                            <ClientFormPage />
                        </ProtectedLayout>
                    )}
                />
                <Route
                    path="/clients/:id"
                    component={() => (
                        <ProtectedLayout>
                            <ClientDetailPage />
                        </ProtectedLayout>
                    )}
                />
                <Route
                    path="/clients/:id/edit"
                    component={() => (
                        <ProtectedLayout>
                            <ClientFormPage />
                        </ProtectedLayout>
                    )}
                />
                {/* Projects Routes */}
                <Route
                    path="/projects"
                    component={() => (
                        <ProtectedLayout>
                            <ProjectsPage />
                        </ProtectedLayout>
                    )}
                />
                <Route
                    path="/projects/new"
                    component={() => (
                        <ProtectedLayout>
                            <ProjectFormPage />
                        </ProtectedLayout>
                    )}
                />
                <Route
                    path="/projects/:id"
                    component={() => (
                        <ProtectedLayout>
                            <ProjectDetailPage />
                        </ProtectedLayout>
                    )}
                />
                <Route
                    path="/projects/:id/edit"
                    component={() => (
                        <ProtectedLayout>
                            <ProjectFormPage />
                        </ProtectedLayout>
                    )}
                />
                <Route
                    path="/projects/:id/strategy"
                    component={() => (
                        <ProtectedLayout>
                            <BrandStrategyPage />
                        </ProtectedLayout>
                    )}
                />
                <Route
                    path="/projects/:id/colors"
                    component={() => (
                        <ProtectedLayout>
                            <BrandColorsPage />
                        </ProtectedLayout>
                    )}
                />
                <Route
                    path="/projects/:id/fonts"
                    component={() => (
                        <ProtectedLayout>
                            <BrandTypographyPage />
                        </ProtectedLayout>
                    )}
                />
                <Route
                    path="/projects/:id/voice"
                    component={() => (
                        <ProtectedLayout>
                            <BrandVoicePage />
                        </ProtectedLayout>
                    )}
                />
                <Route
                    path="/projects/:id/assets"
                    component={() => (
                        <ProtectedLayout>
                            <BrandAssetsPage />
                        </ProtectedLayout>
                    )}
                />
                <Route
                    path="/projects/:id/guidelines"
                    component={() => (
                        <ProtectedLayout>
                            <BrandGuidelinesPage />
                        </ProtectedLayout>
                    )}
                />
                {/* Tasks Routes */}
                <Route
                    path="/projects/:projectId/tasks/new"
                    component={() => (
                        <ProtectedLayout>
                            <TaskFormPage />
                        </ProtectedLayout>
                    )}
                />
                <Route
                    path="/projects/:projectId/tasks/:taskId/edit"
                    component={() => (
                        <ProtectedLayout>
                            <TaskFormPage />
                        </ProtectedLayout>
                    )}
                />
                {/* Templates */}
                <Route
                    path="/templates"
                    component={() => (
                        <ProtectedLayout>
                            <TemplatesPage />
                        </ProtectedLayout>
                    )}
                />
                <Route
                    path="/templates/new"
                    component={() => (
                        <ProtectedLayout>
                            <TemplateFormPage />
                        </ProtectedLayout>
                    )}
                />
                <Route
                    path="/templates/:id/edit"
                    component={() => (
                        <ProtectedLayout>
                            <TemplateFormPage />
                        </ProtectedLayout>
                    )}
                />
                {/* Timesheet */}
                <Route
                    path="/timesheet"
                    component={() => (
                        <ProtectedLayout>
                            <TimesheetPage />
                        </ProtectedLayout>
                    )}
                />
                {/* Finance */}
                <Route
                    path="/finance"
                    component={() => (
                        <ProtectedLayout>
                            <FinancePage />
                        </ProtectedLayout>
                    )}
                />
                <Route
                    path="/finance/new"
                    component={() => (
                        <ProtectedLayout>
                            <FinanceFormPage />
                        </ProtectedLayout>
                    )}
                />
                <Route
                    path="/finance/:id/edit"
                    component={() => (
                        <ProtectedLayout>
                            <FinanceFormPage />
                        </ProtectedLayout>
                    )}
                />
                {/* Profile */}
                <Route
                    path="/profile"
                    component={() => (
                        <ProtectedLayout>
                            <ProfilePage />
                        </ProtectedLayout>
                    )}
                />
                <Route path="*" component={() => <Navigate href="/dashboard" />} />
            </Router>
        </AuthProvider>
    );
};

export default App;
