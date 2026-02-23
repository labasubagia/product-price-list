import { Loader2, LogOut, Plus, Search } from "lucide-react";
import { useEffect, useState } from "react";
import {
	appendSpreadsheetRow,
	fetchProducts,
	initSpreadsheet,
	type Product,
	updateSpreadsheetRow,
} from "../lib/googleApi";
import { ProductCard } from "./ProductCard";
import { ProductModal } from "./ProductModal";

interface DashboardProps {
	onLogout: () => void;
}

export function Dashboard({ onLogout }: DashboardProps) {
	const [searchQuery, setSearchQuery] = useState("");
	const [products, setProducts] = useState<Product[]>([]);
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [editingProduct, setEditingProduct] = useState<Product | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [spreadsheetId, setSpreadsheetId] = useState<string | null>(null);

	useEffect(() => {
		const initializeApp = async () => {
			setIsLoading(true);
			const id = await initSpreadsheet();
			if (id) {
				setSpreadsheetId(id);
				const data = await fetchProducts(id);
				setProducts(data);
			} else {
				alert(
					"Failed to initialize Google Sheet. Please ensure you have access permissions.",
				);
			}
			setIsLoading(false);
		};

		initializeApp();
	}, []);

	const filteredProducts = products.filter((p) =>
		p.name.toLowerCase().includes(searchQuery.toLowerCase()),
	);

	const handleSaveProduct = async (productData: Partial<Product>) => {
		if (!spreadsheetId) return;

		if (editingProduct) {
			// Update existing
			const rowIndex = products.findIndex((p) => p.id === editingProduct.id);
			if (rowIndex !== -1) {
				const rowData = [
					editingProduct.id,
					productData.name || "",
					productData.price || 0,
				];

				const success = await updateSpreadsheetRow(
					spreadsheetId,
					rowIndex,
					rowData,
				);
				if (success) {
					setProducts((prev) =>
						prev.map((p) =>
							p.id === editingProduct.id ? { ...p, ...productData } : p,
						),
					);
				} else {
					alert("Failed to update product.");
				}
			}
		} else {
			// Add new
			const newId = Date.now().toString();
			const rowData = [newId, productData.name || "", productData.price || 0];

			const success = await appendSpreadsheetRow(spreadsheetId, rowData);
			if (success) {
				setProducts((prev) => [
					...prev,
					{ id: newId, ...productData } as Product,
				]);
			} else {
				alert("Failed to add product.");
			}
		}
	};

	const openAddModal = () => {
		setEditingProduct(null);
		setIsModalOpen(true);
	};

	const openEditModal = (product: Product) => {
		setEditingProduct(product);
		setIsModalOpen(true);
	};

	if (isLoading) {
		return (
			<div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 text-slate-500 gap-4">
				<Loader2 className="w-8 h-8 animate-spin text-primary-600" />
				<p className="animate-pulse">Preparing database...</p>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col relative pb-24">
			{/* Sticky Header */}
			<header className="sticky top-0 z-10 bg-white/80 backdrop-blur-md shadow-sm border-b border-slate-200">
				<div className="px-5 pt-8 pb-4">
					<div className="flex justify-between items-center mb-4">
						<h1 className="text-2xl font-bold text-slate-800 tracking-tight">
							Inventory
						</h1>
						<button
							type="button"
							onClick={onLogout}
							className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-red-500/50"
							aria-label="Logout"
						>
							<LogOut className="w-5 h-5" />
						</button>
					</div>
					<div className="relative">
						<div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
							<Search className="h-5 w-5 text-slate-400" />
						</div>
						<input
							type="text"
							placeholder="Search products..."
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							className="block w-full pl-10 pr-4 py-3 bg-slate-100 border-none rounded-2xl text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-primary-500 focus:bg-white transition-all shadow-inner"
						/>
					</div>
				</div>
			</header>

			{/* Product List Area */}
			<main className="flex-1 p-5 space-y-4 max-w-7xl mx-auto w-full">
				{filteredProducts.length === 0 ? (
					<div className="mt-12 text-center text-slate-500 animate-in fade-in duration-500 flex flex-col items-center">
						<div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-4">
							<Search className="w-8 h-8 text-slate-300" />
						</div>
						<p className="text-lg font-medium text-slate-700">
							No products found
						</p>
						<p className="text-sm">
							{searchQuery
								? "Your search did not match any products."
								: "Start adding your products."}
						</p>
					</div>
				) : (
					<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
						{filteredProducts.map((product) => (
							<ProductCard
								key={product.id}
								product={product}
								onEdit={openEditModal}
							/>
						))}
					</div>
				)}
			</main>

			{/* Floating Action Button */}
			<button
				type="button"
				onClick={openAddModal}
				className="fixed bottom-6 right-6 w-14 h-14 bg-primary-600 text-white rounded-full flex justify-center items-center shadow-lg hover:bg-primary-700 hover:shadow-xl hover:-translate-y-1 transition-all active:scale-95 focus:outline-none focus:ring-4 focus:ring-primary-500/50 z-20"
				aria-label="Add Product"
			>
				<Plus className="w-7 h-7" />
			</button>

			<ProductModal
				isOpen={isModalOpen}
				onClose={() => setIsModalOpen(false)}
				onSubmit={handleSaveProduct}
				initialData={editingProduct}
			/>
		</div>
	);
}
