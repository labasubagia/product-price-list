import { useEffect, useState } from "react";
import { Dashboard } from "./components/Dashboard";
import { Login } from "./components/Login";
import { initGoogleIdentity, logout } from "./lib/googleApi";

function App() {
	const [isScriptLoaded, setIsScriptLoaded] = useState(false);
	const [isAuthenticated, setIsAuthenticated] = useState(false);

	useEffect(() => {
		// Dynamically load the Google Identity Services script
		const script = document.createElement("script");
		script.src = "https://accounts.google.com/gsi/client";
		script.async = true;
		script.defer = true;
		script.onload = () => setIsScriptLoaded(true);
		document.body.appendChild(script);

		return () => {
			document.body.removeChild(script);
		};
	}, []);

	useEffect(() => {
		if (isScriptLoaded) {
			const clientId =
				import.meta.env.VITE_GOOGLE_CLIENT_ID || "PENDING_CLIENT_ID";
			initGoogleIdentity(clientId, (authStatus) => {
				setIsAuthenticated(authStatus);
			});
		}
	}, [isScriptLoaded]);

	if (!isScriptLoaded) {
		return (
			<div className="min-h-screen flex items-center justify-center bg-slate-50">
				<div className="w-6 h-6 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
			</div>
		);
	}

	const handleLogout = () => {
		logout();
		setIsAuthenticated(false);
	};

	return (
		<>{isAuthenticated ? <Dashboard onLogout={handleLogout} /> : <Login />}</>
	);
}

export default App;
