'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function HelpPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    subject: '',
    message: '',
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error' | ''>('');

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.subject.trim() || !formData.message.trim()) {
      setMessage('Por favor, preencha todos os campos.');
      setMessageType('error');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const response = await fetch('/api/help', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subject: formData.subject,
          message: formData.message,
        }),
      });

      if (response.ok) {
        setMessage('Mensagem enviada com sucesso! Em breve entraremos em contato.');
        setMessageType('success');
        setFormData({ subject: '', message: '' });
      } else {
        setMessage('Erro ao enviar mensagem. Tente novamente.');
        setMessageType('error');
      }
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      setMessage('Erro ao enviar mensagem. Tente novamente.');
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative p-4 md:p-8" style={{
      backgroundImage: 'url(/images/bg-adventure.png)',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundAttachment: 'fixed',
    }}>
      <div className="absolute inset-0 bg-gradient-to-br from-gray-900/85 via-gray-800/85 to-gray-900/90"></div>
      <div className="relative max-w-2xl mx-auto">
        {/* Cabeçalho */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Ajuda & Suporte</h1>
          <p className="text-gray-400">
            Envie-nos suas dúvidas, sugestões ou reportes de problemas
          </p>
        </div>

        {/* Cards de Informação */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
            <div className="text-2xl mb-2">❓</div>
            <h3 className="text-white font-semibold mb-1">Dúvidas</h3>
            <p className="text-gray-400 text-sm">
              Tem dúvidas sobre como usar o sistema?
            </p>
          </div>
          <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
            <div className="text-2xl mb-2">💡</div>
            <h3 className="text-white font-semibold mb-1">Sugestões</h3>
            <p className="text-gray-400 text-sm">
              Quer sugerir novas funcionalidades?
            </p>
          </div>
          <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
            <div className="text-2xl mb-2">🐛</div>
            <h3 className="text-white font-semibold mb-1">Bugs</h3>
            <p className="text-gray-400 text-sm">
              Encontrou um problema? Nos avise!
            </p>
          </div>
        </div>

        {/* Formulário */}
        <div className="bg-gray-800 rounded-lg p-8 shadow-lg border border-gray-700">
          <h2 className="text-2xl font-bold text-white mb-6">Envie uma Mensagem</h2>

          {message && (
            <div
              className={`mb-6 p-4 rounded-lg ${
                messageType === 'success'
                  ? 'bg-green-900/30 border border-green-700 text-green-300'
                  : 'bg-red-900/30 border border-red-700 text-red-300'
              }`}
            >
              {message}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Assunto */}
            <div>
              <label htmlFor="subject" className="block text-white font-semibold mb-2">
                Assunto *
              </label>
              <input
                type="text"
                id="subject"
                name="subject"
                value={formData.subject}
                onChange={handleChange}
                placeholder="Digite o assunto da sua mensagem"
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
              />
            </div>

            {/* Mensagem */}
            <div>
              <label htmlFor="message" className="block text-white font-semibold mb-2">
                Mensagem *
              </label>
              <textarea
                id="message"
                name="message"
                value={formData.message}
                onChange={handleChange}
                placeholder="Digite sua mensagem aqui..."
                rows={8}
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition resize-none"
              ></textarea>
            </div>

            {/* Botões */}
            <div className="flex gap-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:opacity-50 text-white font-semibold py-3 rounded-lg transition duration-200"
              >
                {loading ? 'Enviando...' : 'Enviar Mensagem'}
              </button>
              <button
                type="button"
                onClick={() => router.back()}
                className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-semibold py-3 rounded-lg transition duration-200"
              >
                Voltar
              </button>
            </div>
          </form>
        </div>

        {/* FAQ */}
        <div className="mt-8">
          <h2 className="text-2xl font-bold text-white mb-4">Perguntas Frequentes</h2>
          <div className="space-y-4">
            <details className="group">
              <summary className="flex cursor-pointer items-center justify-between rounded-lg bg-gray-800 px-6 py-4 border border-gray-700 text-white font-semibold hover:bg-gray-700/50 transition">
                Como adicionar um novo personagem?
                <span className="transition group-open:rotate-180">▼</span>
              </summary>
              <p className="mt-4 px-6 pb-4 text-gray-300">
                Acesse a página de Personagens e clique no botão "Adicionar Personagem".
                Preencha o nome do seu personagem no Tibia e clique em salvar.
              </p>
            </details>

            <details className="group">
              <summary className="flex cursor-pointer items-center justify-between rounded-lg bg-gray-800 px-6 py-4 border border-gray-700 text-white font-semibold hover:bg-gray-700/50 transition">
                Com que frequência devo registrar meu XP?
                <span className="transition group-open:rotate-180">▼</span>
              </summary>
              <p className="mt-4 px-6 pb-4 text-gray-300">
                Você pode registrar seu XP com a frequência que desejar. Recomendamos
                registrar diariamente para obter estatísticas mais precisas.
              </p>
            </details>

            <details className="group">
              <summary className="flex cursor-pointer items-center justify-between rounded-lg bg-gray-800 px-6 py-4 border border-gray-700 text-white font-semibold hover:bg-gray-700/50 transition">
                Posso exportar meus dados?
                <span className="transition group-open:rotate-180">▼</span>
              </summary>
              <p className="mt-4 px-6 pb-4 text-gray-300">
                Atualmente o sistema está em desenvolvimento. Em breve adicionaremos
                a funcionalidade de exportar dados em diferentes formatos.
              </p>
            </details>

            <details className="group">
              <summary className="flex cursor-pointer items-center justify-between rounded-lg bg-gray-800 px-6 py-4 border border-gray-700 text-white font-semibold hover:bg-gray-700/50 transition">
                Meus dados são privados?
                <span className="transition group-open:rotate-180">▼</span>
              </summary>
              <p className="mt-4 px-6 pb-4 text-gray-300">
                Sim! Seus dados são privados e seguros. Apenas você pode acessá-los
                com sua conta autenticada.
              </p>
            </details>
          </div>
        </div>
      </div>
    </div>
  );
}
