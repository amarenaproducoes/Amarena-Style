import React from 'react';

export function PrivacyPolicy() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-20 w-full">
      <header className="mb-12 text-center">
        <h1 className="font-serif text-3xl text-zinc-900 mb-4 uppercase tracking-widest">Política de Privacidade</h1>
        <p className="text-zinc-400 text-[10px] uppercase tracking-[0.2em]">Conformidade com a LGPD (Lei 13.709/2018)</p>
      </header>

      <div className="prose prose-zinc max-w-none text-zinc-600 space-y-8 text-sm leading-relaxed">
        <section>
          <h2 className="text-zinc-900 font-bold uppercase tracking-wider text-xs mb-3 border-b border-zinc-100 pb-2">1. Compromisso com a Transparência</h2>
          <p>Na Amarena Style, a segurança e a privacidade dos seus dados são prioridades. Esta política descreve como coletamos, armazenamos e tratamos suas informações pessoais de acordo com a Lei Geral de Proteção de Dados (LGPD).</p>
        </section>

        <section>
          <h2 className="text-zinc-900 font-bold uppercase tracking-wider text-xs mb-3 border-b border-zinc-100 pb-2">2. Coleta de Informações</h2>
          <p>A Amarena Style informa que, neste momento, <strong>não realiza a coleta ou armazenamento de dados pessoais sensíveis</strong> (como CPF, RG ou endereço residencial) diretamente em sua base de dados através deste site.</p>
          <ul className="list-disc pl-5 mt-4 space-y-2">
            <li><strong>Navegação:</strong> Coletamos apenas dados técnicos anônimos (cookies e endereço IP) para garantir a estabilidade do site e melhorar sua experiência de navegação.</li>
            <li><strong>Interações:</strong> O contato é realizado externamente via WhatsApp. Ao clicar nos links de compra, você é redirecionado para o aplicativo, onde a Amarena Style não captura automaticamente seu número antes do início da conversa por sua iniciativa.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-zinc-900 font-bold uppercase tracking-wider text-xs mb-3 border-b border-zinc-100 pb-2">3. Processamento de Pagamentos e Compras</h2>
          <p>O site funciona como um <strong>catálogo interativo</strong>. Não possuímos gateways de pagamento ativos ou captura de dados de cartão de crédito/débito. Toda e qualquer transação financeira e troca de informações para entrega é realizada de forma externa e privada através de nossos canais oficiais de atendimento (WhatsApp).</p>
        </section>

        <section>
          <h2 className="text-zinc-900 font-bold uppercase tracking-wider text-xs mb-3 border-b border-zinc-100 pb-2">4. Compartilhamento de Dados</h2>
          <p>Não compartilhamos dados com terceiros, uma vez que não há transações processadas neste site. Caso você estabeleça contato via WhatsApp, seus dados de conversa estarão sujeitos à política de privacidade da plataforma WhatsApp (Meta Inc.).</p>
        </section>

        <section>
          <h2 className="text-zinc-900 font-bold uppercase tracking-wider text-xs mb-3 border-b border-zinc-100 pb-2">5. Segurança</h2>
          <p>Utilizamos protocolos de segurança modernos (SSL) e criptografia para garantir que seus dados não sejam interceptados. O armazenamento é feito em servidores seguros com controle rigoroso de acesso.</p>
        </section>

        <section>
          <h2 className="text-zinc-900 font-bold uppercase tracking-wider text-xs mb-3 border-b border-zinc-100 pb-2">6. Contato</h2>
          <p>Para dúvidas sobre seus dados ou para exercer seus direitos, entre em contato através de nosso WhatsApp de suporte disponível no rodapé do site.</p>
        </section>

        <footer className="pt-12 border-t border-zinc-50">
          <p className="text-[10px] text-zinc-400 italic">Esta política foi atualizada em: {new Date().toLocaleDateString('pt-BR')}</p>
        </footer>
      </div>
    </div>
  );
}
