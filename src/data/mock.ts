import { Product } from '../store/useCartStore';

export const MOCK_PRODUCTS: Product[] = [
  {
    id: '1',
    name: 'Bolsa Transversal Matelassê',
    description: 'Bolsa estruturada em couro sintético com acabamento matelassê e alça em corrente dourada. O detalhe perfeito para elevar qualquer look.',
    price: 259.90,
    imageUrl: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?q=80&w=800&auto=format&fit=crop',
    category: 'Acessórios',
    options: ['Preto', 'Nude', 'Vinho']
  },
  {
    id: '2',
    name: 'Colar Gota Elegance',
    description: 'Colar delicado com pingente em formato de gota banhado a ouro 18k. Design minimalista perfeito para o dia a dia.',
    price: 129.90,
    imageUrl: 'https://images.unsplash.com/photo-1599643477874-5c866f466b89?q=80&w=800&auto=format&fit=crop',
    category: 'Acessórios'
  },
  {
    id: '3',
    name: 'Essência de Amarena 50ml',
    description: 'Perfume feminino com notas de cereja negra (amarena), amêndoa e uma base suave de baunilha.',
    price: 349.90,
    imageUrl: 'https://images.unsplash.com/photo-1594035910387-fea47794261f?q=80&w=800&auto=format&fit=crop',
    category: 'Beleza'
  },
  {
    id: '4',
    name: 'Blazer Linho Oversized',
    description: 'Blazer de alfaiataria em linho com corte amplo. Leve e sofisticado para meia estação.',
    price: 459.90,
    imageUrl: 'https://images.unsplash.com/photo-1591561954557-26941169b49e?q=80&w=800&auto=format&fit=crop',
    category: 'Roupas',
    options: ['P', 'M', 'G']
  },
  {
    id: '5',
    name: 'Trio Anéis Minimalistas',
    description: 'Conjunto de três anéis finos para usar juntos ou separados. Banhados a ouro.',
    price: 89.90,
    imageUrl: 'https://images.unsplash.com/photo-1605100804763-247f66150ce8?q=80&w=800&auto=format&fit=crop',
    category: 'Acessórios'
  },
  {
    id: '6',
    name: 'Body Splash Amora & Cassis',
    description: 'Refrescante e frutal, perfeito para manter a pele perfumada ao longo do dia.',
    price: 79.90,
    imageUrl: 'https://images.unsplash.com/photo-1616949755610-8c9bac08f927?q=80&w=800&auto=format&fit=crop',
    category: 'Cuidado Corporal'
  }
];

export const MOCK_DEPARTMENTS = [
  'Novidades',
  'Acessórios',
  'Roupas',
  'Beleza',
  'Cuidado Corporal',
  'Outlet'
];
