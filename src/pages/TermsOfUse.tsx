import React from 'react';

export function TermsOfUse() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-20 w-full">
      <header className="mb-12 text-center">
        <h1 className="font-serif text-3xl text-zinc-900 mb-4 uppercase tracking-widest">Termos de Uso</h1>
        <p className="text-zinc-400 text-[10px] uppercase tracking-[0.2em]">Condições Gerais de Acesso e Uso</p>
      </header>

      <div className="prose prose-zinc max-w-none text-zinc-600 space-y-8 text-sm leading-relaxed">
        <section>
          <h2 className="text-zinc-900 font-bold uppercase tracking-wider text-xs mb-3 border-b border-zinc-100 pb-2">1. Aceitação dos Termos</h2>
          <p>Ao acessar e navegar por este site, você concorda em cumprir estes Termos de Uso e todas as leis e regulamentos aplicáveis. Se você não concordar com algum destes termos, está proibido de usar ou acessar este site.</p>
        </section>

        <section>
          <h2 className="text-zinc-900 font-bold uppercase tracking-wider text-xs mb-3 border-b border-zinc-100 pb-2">2. Propriedade Intelectual</h2>
          <p>Todo o conteúdo deste site, incluindo logotipos, textos, fotografias de produtos, designs e interfaces, é de propriedade exclusiva da Amarena Style, protegido pelas leis de direitos autorais e propriedade intelectual brasileiras.</p>
        </section>

        <section>
          <h2 className="text-zinc-900 font-bold uppercase tracking-wider text-xs mb-3 border-b border-zinc-100 pb-2">3. Disponibilidade de Produtos</h2>
          <p>As descrições, preços e disponibilidade dos produtos estão sujeitos a alterações sem aviso prévio. A Amarena Style reserva-se o direito de limitar as quantidades de qualquer produto oferecido ou cancelar pedidos que contenham erros óbvios de precificação.</p>
        </section>

        <section>
          <h2 className="text-zinc-900 font-bold uppercase tracking-wider text-xs mb-3 border-b border-zinc-100 pb-2">4. Conduta do Usuário</h2>
          <p>É proibido utilizar o site para qualquer finalidade ilegal, bem como tentar interferir no funcionamento correto do sistema ou coletar dados dos usuários para fins comerciais sem autorização.</p>
        </section>

        <section>
          <h2 className="text-zinc-900 font-bold uppercase tracking-wider text-xs mb-3 border-b border-zinc-100 pb-2">5. Limitação de Responsabilidade</h2>
          <p>A Amarena Style não será responsável por danos de qualquer natureza decorrentes do uso inadequado deste site ou da impossibilidade de uso temporário por falhas técnicas de terceiros.</p>
        </section>

        <footer className="pt-12 border-t border-zinc-50">
          <p className="text-[10px] text-zinc-400 italic">Última revisão: {new Date().toLocaleDateString('pt-BR')}</p>
        </footer>
      </div>
    </div>
  );
}
