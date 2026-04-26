import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(price: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(price);
}

export function formatWhatsAppMessage(cartItems: any[], total: number, address: string = "") {
  let message = "Olá Amarena Style, gostaria de encomendar os seguintes itens:\n\n";
  
  cartItems.forEach(item => {
    message += `- ${item.quantity}x ${item.name} (${formatPrice(item.price)})\n`;
  });
  
  message += `\n*Total: ${formatPrice(total)}*\n`;
  
  if (address) {
    message += `\nEndereço de entrega: ${address}`;
  }
  
  return `https://wa.me/5511999999999?text=${encodeURIComponent(message)}`;
}
