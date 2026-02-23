import { Edit2 } from "lucide-react";
import type { Product } from "../lib/googleApi";

interface ProductCardProps {
	product: Product;
	onEdit: (product: Product) => void;
}

export function ProductCard({ product, onEdit }: ProductCardProps) {
	const formatCurrency = (amount: number) => {
		return new Intl.NumberFormat("en-US", {
			style: "currency",
			currency: "USD",
			minimumFractionDigits: 0,
		}).format(amount);
	};

	return (
		<div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 flex flex-col hover:shadow-md transition-shadow group relative overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-300">
			<div className="absolute top-0 left-0 w-1 h-full bg-primary-500 rounded-l-2xl opacity-0 group-hover:opacity-100 transition-opacity" />

			<div className="flex justify-between items-start mb-4">
				<div>
					<h3 className="text-lg font-semibold text-slate-800 leading-tight">
						{product.name}
					</h3>
				</div>
				<button
					type="button"
					onClick={() => onEdit(product)}
					className="text-slate-400 hover:text-primary-600 p-2 rounded-lg hover:bg-primary-50 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500/50"
					aria-label="Edit Product"
				>
					<Edit2 className="w-4 h-4" />
				</button>
			</div>

			<div className="mt-auto pt-4 border-t border-slate-100 flex justify-between items-center">
				<div>
					<p className="text-xs text-slate-500 font-medium mb-0.5">
						Price
					</p>
					<p className="text-base font-bold text-primary-700">
						{formatCurrency(product.price)}
					</p>
				</div>
			</div>
		</div>
	);
}
