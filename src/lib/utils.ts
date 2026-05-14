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

export function formatWhatsAppMessage(cartItems: any[], total: number, coupon?: { code: string, discount: number } | null) {
  let message = "Olá Amarena Style, gostaria de encomendar os seguintes itens:\n\n";
  
  cartItems.forEach(item => {
    let itemLine = `- ${item.quantity}x ${item.name}`;
    if (item.referenceCode) {
      itemLine += ` (Ref: ${item.referenceCode})`;
    }
    itemLine += ` (${formatPrice(item.price)})`;
    if (item.selectedOption) {
      itemLine += ` [${item.selectedOption}]`;
    }
    message += `${itemLine}\n`;
  });
  
  if (coupon) {
    message += `\n*Cupom usado: ${coupon.code}*`;
    message += `\n*Desconto: -${formatPrice(coupon.discount)}*`;
  }

  message += `\n*Total Final: ${formatPrice(total)}*\n`;
  
  return `https://wa.me/5511927028287?text=${encodeURIComponent(message)}`;
}
