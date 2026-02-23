import { LogIn } from "lucide-react";
import { promptLogin } from "../lib/googleApi";

export function Login() {
	return (
		<div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-6 px-4 py-12">
			<div className="w-full max-w-sm bg-white rounded-2xl shadow-xl p-8 text-center space-y-8 animate-in fade-in zoom-in duration-500">
				<div className="space-y-2">
					<div className="mx-auto w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mb-6">
						<LogIn className="w-8 h-8 text-primary-600" />
					</div>
					<h1 className="text-3xl font-bold text-slate-900 tracking-tight">
						Store Catalog
					</h1>
					<p className="text-slate-500 text-sm">
						Login with Google to manage your store products.
					</p>
				</div>

				<button
					type="button"
					onClick={promptLogin}
					className="w-full flex items-center justify-center gap-3 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-medium py-3 px-4 rounded-xl transition-all active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
				>
					<img
						src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
						alt="Google logo"
						className="w-5 h-5"
					/>
					Login with Google
				</button>
			</div>
		</div>
	);
}
