import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

export const formatPrice = (price: string): string => {
	return Number(price).toLocaleString("en-NG");
};
