import { X } from "lucide-react";
import { useEffect, useState } from "react";
import type { Product } from "../lib/googleApi";

interface ProductModalProps {
	isOpen: boolean;
	onClose: () => void;
	onSubmit: (productData: Partial<Product>) => Promise<void>;
	initialData?: Product | null;
}

export function ProductModal({
	isOpen,
	onClose,
	onSubmit,
	initialData,
}: ProductModalProps) {
	const [formData, setFormData] = useState<Partial<Product>>({});
	const [isSubmitting, setIsSubmitting] = useState(false);

	useEffect(() => {
		if (isOpen) {
			if (initialData) {
				setFormData(initialData);
			} else {
				setFormData({
					name: "",
					category: "",
					purchasePrice: 0,
					sellingPrice: 0,
					stock: 0,
				});
			}
		}
	}, [isOpen, initialData]);

	if (!isOpen) return null;

	const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const { name, value } = e.target;
		setFormData((prev) => ({
			...prev,
			[name]:
				name === "purchasePrice" || name === "sellingPrice" || name === "stock"
					? Number(value)
					: value,
		}));
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setIsSubmitting(true);
		await onSubmit(formData);
		setIsSubmitting(false);
		onClose();
	};

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6 sm:px-6">
			{/* Backdrop */}
			{/* biome-ignore lint/a11y/useSemanticElements: Backdrop needs to be a div */}
			<div
				className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
				onClick={onClose}
				onKeyDown={(e) => {
					if (e.key === "Escape") onClose();
				}}
				tabIndex={0}
				role="button"
				aria-label="Close modal background"
			/>

			{/* Modal Panel */}
			<div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl relative z-10 overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
				<div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 bg-slate-50/50">
					<h2 className="text-xl font-bold text-slate-800">
						{initialData ? "Edit Product" : "Add New Product"}
					</h2>
					<button
						type="button"
						onClick={onClose}
						className="text-slate-400 hover:text-slate-600 p-2 rounded-full hover:bg-slate-200 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-300"
						aria-label="Close"
					>
						<X className="w-5 h-5" />
					</button>
				</div>

				<div className="overflow-y-auto px-6 py-6">
					<form id="product-form" onSubmit={handleSubmit} className="space-y-5">
						<div>
							<label
								htmlFor="name"
								className="block text-sm font-medium text-slate-700 mb-1.5"
							>
								Product Name *
							</label>
							<input
								type="text"
								id="name"
								name="name"
								required
								value={formData.name || ""}
								onChange={handleChange}
								className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all font-medium"
								placeholder="e.g. Ground Coffee 100g"
							/>
						</div>

						<div>
							<label
								htmlFor="category"
								className="block text-sm font-medium text-slate-700 mb-1.5"
							>
								Category
							</label>
							<input
								type="text"
								id="category"
								name="category"
								value={formData.category || ""}
								onChange={handleChange}
								className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all"
								placeholder="e.g. Beverages"
							/>
						</div>

						<div className="grid grid-cols-2 gap-4">
							<div>
								<label
									htmlFor="purchasePrice"
									className="block text-sm font-medium text-slate-700 mb-1.5"
								>
									Purchase Price
								</label>
								<div className="relative">
									<span className="absolute left-4 top-2.5 text-slate-500">
										$
									</span>
									<input
										type="number"
										id="purchasePrice"
										name="purchasePrice"
										min="0"
										value={formData.purchasePrice || ""}
										onChange={handleChange}
										className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all"
										placeholder="0"
									/>
								</div>
							</div>
							<div>
								<label
									htmlFor="sellingPrice"
									className="block text-sm font-medium text-slate-700 mb-1.5"
								>
									Selling Price *
								</label>
								<div className="relative">
									<span className="absolute left-4 top-2.5 text-slate-500 font-medium">
										$
									</span>
									<input
										type="number"
										id="sellingPrice"
										name="sellingPrice"
										required
										min="0"
										value={formData.sellingPrice || ""}
										onChange={handleChange}
										className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all font-semibold"
										placeholder="0"
									/>
								</div>
							</div>
						</div>

						<div>
							<label
								htmlFor="stock"
								className="block text-sm font-medium text-slate-700 mb-1.5"
							>
								Initial Stock
							</label>
							<input
								type="number"
								id="stock"
								name="stock"
								min="0"
								value={formData.stock || ""}
								onChange={handleChange}
								className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all"
								placeholder="0"
							/>
						</div>
					</form>
				</div>

				<div className="p-4 border-t border-slate-100 bg-slate-50 mt-auto flex justify-end gap-3">
					<button
						type="button"
						onClick={onClose}
						className="px-5 py-2.5 rounded-xl font-medium text-slate-600 bg-white border border-slate-200 hover:bg-slate-100 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-300"
					>
						Cancel
					</button>
					<button
						form="product-form"
						type="submit"
						disabled={isSubmitting}
						className="px-6 py-2.5 rounded-xl font-semibold text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center min-w-[120px]"
					>
						{isSubmitting ? (
							<div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
						) : (
							"Save"
						)}
					</button>
				</div>
			</div>
		</div>
	);
}
