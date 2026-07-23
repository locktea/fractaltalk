import type { ReactElement, ReactNode } from 'react';

// Minimal local stub used in development when the external
// `@rocket.chat/web-ui-registration` package cannot be resolved reliably
// by the Meteor client bundler.

export type LoginRoutes = string;

const RegistrationRoute = ({ children }: { children?: ReactNode; defaultRoute?: LoginRoutes }): ReactElement => {
	if (children) {
		return <>{children}</>;
	}

	return (
		<div
			style={{
				display: 'flex',
				alignItems: 'center',
				justifyContent: 'center',
				height: '100vh',
				fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
				background: '#f4f5f6',
			}}
		>
			<div
				style={{
					padding: 24,
					borderRadius: 8,
					background: '#ffffff',
					boxShadow: '0 0 0 1px rgba(0,0,0,0.04), 0 10px 40px rgba(0,0,0,0.08)',
					maxWidth: 360,
					textAlign: 'center',
				}}
			>
				<h1 style={{ margin: '0 0 8px', fontSize: 20 }}>Rocket.Chat (local dev)</h1>
				<p style={{ margin: '0 0 12px', fontSize: 14, color: '#555' }}>
					Registration UI is stubbed in this workspace.
				</p>
				<p style={{ margin: 0, fontSize: 13, color: '#777' }}>
					If this is a fresh instance, open <code>/setup-wizard</code> to create an admin user.
				</p>
			</div>
		</div>
	);
};

export const CMSPage = ({ page }: { page: string }): ReactElement => (
	<div style={{ padding: 16 }}>
		<h1>{page}</h1>
		<p>Content is not available in this local dev stub.</p>
	</div>
);

export const ResetPasswordPage = (): ReactElement => (
	<div style={{ padding: 16 }}>
		<h1>Reset password</h1>
		<p>This is a simplified local reset-password stub.</p>
	</div>
);

const RegistrationPageRouter = RegistrationRoute;

export default RegistrationPageRouter;

